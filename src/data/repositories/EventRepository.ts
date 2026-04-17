// EventRepository — append-only analytics event storage.
//
// Retention rules (progress.md + Task #12):
//   S1 / S2 — 90-day rolling window; purgeExpired removes items older than 90d.
//   S3      — indefinite; never purged.
//   S4      — immutable audit; purgeExpired is a hard no-op for these records.
//
// LocalEventRepository persists to AsyncStorage following the same patterns
// as LocalAssetRepository (thin, owns serialization only). drainQueue() ties
// this to the emission queue in src/lib/events.ts.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { nowIso } from '../../lib/ids';
import { readQueue, drainQueue } from '../../lib/events';
import { withKeyLock } from '../../lib/asyncStorageMutex';
import type { MoguEvent, Sensitivity } from '../../types/events';
import type { Syncable } from '../../types';

// ---------------------------------------------------------------------------
// Stored record shape
// ---------------------------------------------------------------------------

/**
 * A single persisted event record.
 * Extends Syncable so it participates in the standard sync-ready schema
 * (ADR-0013 Addendum A4): id mirrors event.id, updatedAt = occurred_at,
 * syncedAt = null until a cloud push succeeds.
 */
export interface StoredEvent extends Syncable {
  /** The full analytics event (discriminated union). */
  event: MoguEvent;
  /**
   * ISO-8601 timestamp when this record was written to the repository.
   * Distinct from event.occurred_at (emission time).
   */
  savedAt: string;
}

// ---------------------------------------------------------------------------
// Filter / query shape
// ---------------------------------------------------------------------------

export interface EventFilter {
  sensitivity?: Sensitivity;
  /** ISO-8601 lower bound on event.occurred_at (inclusive). */
  since?: string;
  /** ISO-8601 upper bound on event.occurred_at (inclusive). */
  until?: string;
  /** Match event.asset_id exactly. */
  asset_id?: string;
}

// ---------------------------------------------------------------------------
// Repository interface
// ---------------------------------------------------------------------------

export interface EventRepository {
  /** Append a single event. Idempotent on event.id (duplicate writes are silently ignored). */
  save(event: MoguEvent): Promise<void>;

  /** Return all stored events matching the given filter (all fields optional). */
  list(filter?: EventFilter): Promise<StoredEvent[]>;

  /** Total count of stored events (ignores filter). */
  count(): Promise<number>;

  /**
   * Remove S1 / S2 records whose event.occurred_at is more than 90 days
   * before `now`. S3 and S4 records are never touched.
   */
  purgeExpired(now: Date): Promise<void>;

  /**
   * Read the emission queue (src/lib/events.ts), save each event to the
   * repository, then drain the successfully saved ids from the queue.
   * On any save failure the queue entry is preserved for the next attempt.
   */
  flushQueue(): Promise<void>;
}

// ---------------------------------------------------------------------------
// LocalEventRepository (AsyncStorage)
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'modu.repository.events.v1';

/** Sensitivities subject to 90-day rolling purge. */
const PURGEABLE: Sensitivity[] = ['S1', 'S2'];

/** 90 days in milliseconds. */
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

// Separate lock key for flushQueue to avoid re-entrant deadlock with save's STORAGE_KEY lock.
const FLUSH_LOCK_KEY = 'modu.repository.events.flush.v1';

function parseRecords(raw: string | null): StoredEvent[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredEvent[]) : [];
  } catch {
    // Corrupted storage — drop to empty rather than crashing.
    return [];
  }
}

async function readAll(): Promise<StoredEvent[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return parseRecords(raw);
}

async function writeAll(records: StoredEvent[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function applyFilter(records: StoredEvent[], filter: EventFilter): StoredEvent[] {
  return records.filter((r) => {
    if (filter.sensitivity !== undefined && r.event.sensitivity !== filter.sensitivity) {
      return false;
    }
    // [HIGH-3] Use numeric timestamp comparison — safe for all ISO-8601 offsets.
    if (filter.since !== undefined && new Date(r.event.occurred_at).getTime() < new Date(filter.since).getTime()) {
      return false;
    }
    if (filter.until !== undefined && new Date(r.event.occurred_at).getTime() > new Date(filter.until).getTime()) {
      return false;
    }
    if (filter.asset_id !== undefined && r.event.asset_id !== filter.asset_id) {
      return false;
    }
    return true;
  });
}

export function createLocalEventRepository(): EventRepository {
  return {
    async save(event: MoguEvent): Promise<void> {
      // [CRITICAL-1] Wrap entire read→check→push→write in STORAGE_KEY lock.
      await withKeyLock(STORAGE_KEY, async () => {
        const all = await readAll();
        // Idempotency: ignore duplicate event.id
        if (all.some((r) => r.id === event.id)) return;

        const record: StoredEvent = {
          // Syncable fields
          id: event.id,
          updatedAt: event.occurred_at,
          syncedAt: null,
          // Payload
          event,
          savedAt: nowIso(),
        };

        if (__DEV__) {
          // [MEDIUM-2] dev-mode assertion: StoredEvent.id must match event.id
          console.assert(record.id === record.event.id, 'StoredEvent.id mismatch with event.id');
        }

        all.push(record);
        await writeAll(all);
      });
    },

    async list(filter?: EventFilter): Promise<StoredEvent[]> {
      const all = await readAll();
      if (!filter) return all;
      return applyFilter(all, filter);
    },

    async count(): Promise<number> {
      const all = await readAll();
      return all.length;
    },

    async purgeExpired(now: Date): Promise<void> {
      const all = await readAll();
      // [HIGH-3] Use numeric timestamp comparison — safe for all ISO-8601 offsets.
      const cutoffMs = now.getTime() - RETENTION_MS;
      const retained = all.filter((r) => {
        const s = r.event.sensitivity;
        // S3 and S4 are never purged
        if (!PURGEABLE.includes(s)) return true;
        // S1 / S2: keep if occurred_at is within the 90-day window
        return new Date(r.event.occurred_at).getTime() >= cutoffMs;
      });
      await writeAll(retained);
    },

    async flushQueue(): Promise<void> {
      // [CRITICAL-2] Serialize concurrent flushQueue calls under FLUSH_LOCK_KEY.
      // save() uses STORAGE_KEY — different key, no deadlock.
      await withKeyLock(FLUSH_LOCK_KEY, async () => {
        const queued = await readQueue();
        if (queued.length === 0) return;

        const savedIds: string[] = [];

        for (const item of queued) {
          try {
            await this.save(item.event);
            savedIds.push(item.event.id);
          } catch (err) {
            // [LOW] S4 events must never be silently dropped.
            if (__DEV__ && item.event.sensitivity === 'S4') {
              console.warn('[EventRepository] S4 event save failed — preserving in queue', err);
            } else if (__DEV__) {
              console.warn('[EventRepository] event save failed — preserving in queue', err);
            }
            // Leave this item in the queue for the next flush attempt.
          }
        }

        if (savedIds.length > 0) {
          await drainQueue(savedIds);
        }
      });
    },
  };
}

// ---------------------------------------------------------------------------
// [MEDIUM-1] Lazy singleton factory — avoids eager construction at import time.
// Task #13 wiring: import { getLocalEventRepository } and call the getter.
// ---------------------------------------------------------------------------

let _instance: EventRepository | null = null;

export function getLocalEventRepository(): EventRepository {
  if (!_instance) {
    _instance = createLocalEventRepository();
  }
  return _instance;
}

/** @deprecated Use getLocalEventRepository() instead. Kept for Task #13 backward compat. */
export const localEventRepository: EventRepository = {
  save: (...args) => getLocalEventRepository().save(...args),
  list: (...args) => getLocalEventRepository().list(...args),
  count: () => getLocalEventRepository().count(),
  purgeExpired: (...args) => getLocalEventRepository().purgeExpired(...args),
  flushQueue: () => getLocalEventRepository().flushQueue(),
};
