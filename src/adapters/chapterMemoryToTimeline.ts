// Adapter: ChapterMemory-shaped entries → day-anchored timeline blocks.
// Pure functions, no side effects, no React, no domain store imports.
import type { MoodEntry } from '../store/moodJournalStore';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface TimelineEntry {
  readonly id: string;
  readonly createdAt: string; // ISO 8601
  readonly kind: string;      // 'mood' | 'note' | 'photo' | …
  readonly text: string;      // empty string when none
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface TimelineDay {
  /** YYYY-MM-DD (UTC or local depending on groupByDay mode). */
  readonly dateKey: string;
  /** Entries within this day, sorted descending by createdAt. */
  readonly entries: readonly TimelineEntry[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Extract YYYY-MM-DD in UTC from an ISO string. */
function dateKeyUtc(iso: string): string {
  // Always parse through Date — a slice(0,10) fast path is unsafe for
  // offset strings (e.g., +09:00) whose wall-clock date differs from UTC.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'invalid';
  return d.toISOString().slice(0, 10);
}

/** Extract YYYY-MM-DD in device local time from an ISO string. */
function dateKeyLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'invalid';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function resolveKey(entry: TimelineEntry, mode: 'utc' | 'local'): string {
  const t = new Date(entry.createdAt).getTime();
  if (Number.isNaN(t)) return 'invalid';
  return mode === 'utc' ? dateKeyUtc(entry.createdAt) : dateKeyLocal(entry.createdAt);
}

// ---------------------------------------------------------------------------
// groupByDay
// ---------------------------------------------------------------------------

/**
 * Groups a flat list of entries into day buckets, sorted newest-first.
 * Each bucket's entries are also sorted newest-first.
 *
 * @param entries  Flat timeline entries (any order).
 * @param mode     'utc' (default) groups by UTC date; 'local' by device local date.
 */
export function groupByDay(
  entries: readonly TimelineEntry[],
  mode: 'utc' | 'local' = 'utc',
): readonly TimelineDay[] {
  if (entries.length === 0) return [];

  // Sort all entries descending by createdAt (NaN sorts to end).
  const sorted = [...entries].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return tb - ta;
  });

  // Group into a map preserving insertion (descending) order.
  const map = new Map<string, TimelineEntry[]>();
  for (const entry of sorted) {
    const key = resolveKey(entry, mode);
    const bucket = map.get(key);
    if (bucket === undefined) {
      map.set(key, [entry]);
    } else {
      bucket.push(entry);
    }
  }

  // Convert to readonly TimelineDay[]. 'invalid' sinks to end.
  const days: TimelineDay[] = [];
  for (const [dateKey, dayEntries] of map) {
    days.push({ dateKey, entries: dayEntries });
  }

  // Ensure descending dateKey order (invalid always last).
  days.sort((a, b) => {
    if (a.dateKey === 'invalid') return 1;
    if (b.dateKey === 'invalid') return -1;
    return b.dateKey.localeCompare(a.dateKey);
  });

  return days;
}

// ---------------------------------------------------------------------------
// fromMoodEntries — bridge until ChapterMemory entity exists
// ---------------------------------------------------------------------------

/**
 * Converts MoodEntry[] (current persistence stand-in) to TimelineEntry[].
 * One-to-one mapping; tone and assetId placed in meta.
 */
export function fromMoodEntries(
  entries: readonly MoodEntry[],
): readonly TimelineEntry[] {
  return entries.map((e) => ({
    id: e.id,
    createdAt: e.createdAt,
    kind: 'mood' as const,
    text: e.text,
    meta: { tone: e.tone, assetId: e.assetId },
  }));
}
