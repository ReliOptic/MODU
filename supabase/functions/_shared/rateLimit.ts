// Rate limiter for MODU Edge Functions
//
// Two-layer approach:
//   L1 — in-memory map (fast, resets on cold-start, per-isolate)
//   L2 — Supabase RPC `increment_rate_limit` (atomic, persistent, survives cold-starts)
//
// For the primary rate limit check we use L1 + L2 together:
//   1. Check L1 first (O(1), no DB round-trip).
//   2. On L1 miss or expired window, call L2 RPC (atomic increment + allowed flag).
//   3. On L1 hit within window, increment L1 only (cheap path).
//
// Fail-closed: on any DB error the current window is saturated in L1 and the
// request is DENIED. This is the safe default — a short outage is preferable
// to an unbounded open door.

import { createClient } from 'npm:@supabase/supabase-js@2';

interface BucketEntry {
  count: number;
  windowStart: number; // epoch ms
}

// In-process memory bucket: `${userId}:${key}` → BucketEntry
const memoryBuckets = new Map<string, BucketEntry>();

const WINDOW_MS = 60_000; // 1 minute

/**
 * Checks and increments rate limit for `userId` under `key`.
 * Returns true if the request is allowed, false if rate limit exceeded.
 *
 * @param supabaseUrl   SUPABASE_URL env var
 * @param serviceKey    SUPABASE_SERVICE_ROLE_KEY env var
 * @param userId        Authenticated user ID
 * @param key           Arbitrary limit key, e.g. 'ai-claude' or 'ai-whisper'
 * @param limitPerMinute Max allowed calls per 60-second window
 */
export async function checkRateLimit(
  supabaseUrl: string,
  serviceKey: string,
  userId: string,
  key: string,
  limitPerMinute: number
): Promise<boolean> {
  const bucketKey = `${userId}:${key}`;
  const now = Date.now();

  // ── L1: memory check ────────────────────────────────────────────
  const mem = memoryBuckets.get(bucketKey);
  if (mem) {
    const elapsed = now - mem.windowStart;
    if (elapsed < WINDOW_MS) {
      if (mem.count >= limitPerMinute) return false; // blocked in-memory
      mem.count += 1;
      return true; // fast path — no DB hit
    } else {
      // Window expired; reset in memory and fall through to L2
      memoryBuckets.delete(bucketKey);
    }
  }

  // ── L2: persistent atomic increment via RPC ──────────────────────
  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Truncate to current 1-minute window boundary (matches Postgres window_start)
  const windowStartMs = now - (now % WINDOW_MS);
  const windowStart = new Date(windowStartMs).toISOString();

  const { data, error } = await client.rpc('increment_rate_limit', {
    p_user_id: userId,
    p_key: key,
    p_window_start: windowStart,
    p_limit: limitPerMinute,
    p_window_ms: WINDOW_MS,
  });

  if (error) {
    // Fail-closed: saturate L1 so subsequent calls in this window are also denied.
    // This avoids hammering the DB and prevents circumvention during an outage.
    console.error('[rateLimit] DB error — failing closed:', error.message);
    memoryBuckets.set(bucketKey, { count: limitPerMinute, windowStart: windowStartMs });
    return false;
  }

  // RPC returns a single row: { count: int, allowed: bool }
  const row = Array.isArray(data) ? data[0] : data;
  const currentCount: number = row?.count ?? limitPerMinute + 1;
  const allowed: boolean = row?.allowed ?? false;

  // Sync L1 with the authoritative DB count
  memoryBuckets.set(bucketKey, { count: currentCount, windowStart: windowStartMs });
  return allowed;
}

/**
 * Device-identity variant of {@link checkRateLimit} — mirrors the same L1+L2
 * logic but keyed by `deviceId` (UUID v4) instead of `userId`.
 * Calls the `increment_device_rate_limit` RPC against the
 * `ai_device_rate_limits` table (no auth.users FK).
 *
 * Same fail-closed semantics: any DB error saturates L1 for the window.
 */
export async function checkDeviceRateLimit(
  supabaseUrl: string,
  serviceKey: string,
  deviceId: string,
  key: string,
  limitPerMinute: number
): Promise<boolean> {
  const bucketKey = `device:${deviceId}:${key}`;
  const now = Date.now();

  // ── L1 ──────────────────────────────────────────────────────────
  const mem = memoryBuckets.get(bucketKey);
  if (mem) {
    const elapsed = now - mem.windowStart;
    if (elapsed < WINDOW_MS) {
      if (mem.count >= limitPerMinute) return false;
      mem.count += 1;
      return true;
    } else {
      memoryBuckets.delete(bucketKey);
    }
  }

  // ── L2 ──────────────────────────────────────────────────────────
  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const windowStartMs = now - (now % WINDOW_MS);
  const windowStart = new Date(windowStartMs).toISOString();

  const { data, error } = await client.rpc('increment_device_rate_limit', {
    p_device_id: deviceId,
    p_key: key,
    p_window_start: windowStart,
    p_limit: limitPerMinute,
    p_window_ms: WINDOW_MS,
  });

  if (error) {
    console.error('[rateLimit/device] DB error — failing closed:', error.message);
    memoryBuckets.set(bucketKey, { count: limitPerMinute, windowStart: windowStartMs });
    return false;
  }

  const row = Array.isArray(data) ? data[0] : data;
  const currentCount: number = row?.count ?? limitPerMinute + 1;
  const allowed: boolean = row?.allowed ?? false;

  memoryBuckets.set(bucketKey, { count: currentCount, windowStart: windowStartMs });
  return allowed;
}
