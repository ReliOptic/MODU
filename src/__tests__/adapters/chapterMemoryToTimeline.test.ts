import { groupByDay, fromMoodEntries } from '../../adapters/chapterMemoryToTimeline';
import type { TimelineEntry } from '../../adapters/chapterMemoryToTimeline';
import type { MoodEntry } from '../../store/moodJournalStore';

// ---------------------------------------------------------------------------
// groupByDay
// ---------------------------------------------------------------------------

describe('groupByDay', () => {
  it('returns empty array for empty input', () => {
    expect(groupByDay([])).toEqual([]);
  });

  it('groups 3 entries across 2 distinct UTC dates in descending order', () => {
    const entries: readonly TimelineEntry[] = [
      { id: 'a', createdAt: '2026-04-17T08:00:00Z', kind: 'mood', text: 'first' },
      { id: 'b', createdAt: '2026-04-18T09:00:00Z', kind: 'mood', text: 'second' },
      { id: 'c', createdAt: '2026-04-18T11:00:00Z', kind: 'mood', text: 'third' },
    ];

    const result = groupByDay(entries);

    expect(result).toHaveLength(2);
    // Newest day first
    expect(result[0].dateKey).toBe('2026-04-18');
    expect(result[1].dateKey).toBe('2026-04-17');
  });

  it('sorts entries within a day descending by createdAt', () => {
    const entries: readonly TimelineEntry[] = [
      { id: 'early', createdAt: '2026-04-18T08:00:00Z', kind: 'mood', text: 'early' },
      { id: 'late',  createdAt: '2026-04-18T20:00:00Z', kind: 'mood', text: 'late'  },
      { id: 'noon',  createdAt: '2026-04-18T12:00:00Z', kind: 'mood', text: 'noon'  },
    ];

    const result = groupByDay(entries);

    expect(result).toHaveLength(1);
    const ids = result[0].entries.map((e) => e.id);
    expect(ids).toEqual(['late', 'noon', 'early']);
  });

  it('places invalid createdAt entries in dateKey="invalid"', () => {
    const entries: readonly TimelineEntry[] = [
      { id: 'bad', createdAt: 'not-a-date', kind: 'note', text: '' },
      { id: 'ok',  createdAt: '2026-04-18T10:00:00Z', kind: 'note', text: 'valid' },
    ];

    const result = groupByDay(entries);

    const keys = result.map((d) => d.dateKey);
    expect(keys).toContain('invalid');
    // invalid sinks to end
    expect(keys[keys.length - 1]).toBe('invalid');
  });

  it('returns a single-day group when all entries share the same UTC date', () => {
    const entries: readonly TimelineEntry[] = [
      { id: '1', createdAt: '2026-04-18T00:00:00Z', kind: 'mood', text: '' },
      { id: '2', createdAt: '2026-04-18T23:59:59Z', kind: 'mood', text: '' },
    ];

    const result = groupByDay(entries);
    expect(result).toHaveLength(1);
    expect(result[0].dateKey).toBe('2026-04-18');
  });
});

// ---------------------------------------------------------------------------
// fromMoodEntries
// ---------------------------------------------------------------------------

describe('fromMoodEntries', () => {
  it('maps a MoodEntry to a TimelineEntry with kind="mood"', () => {
    const mood: MoodEntry = {
      id: 'a',
      assetId: 'x',
      tone: 'calm',
      text: 'hi',
      createdAt: '2026-04-18T09:00:00Z',
    };

    const result = fromMoodEntries([mood]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'a',
      createdAt: '2026-04-18T09:00:00Z',
      kind: 'mood',
      text: 'hi',
      meta: { tone: 'calm', assetId: 'x' },
    });
  });

  it('returns empty array for empty input', () => {
    expect(fromMoodEntries([])).toEqual([]);
  });

  it('preserves all entries in order', () => {
    const moods: MoodEntry[] = [
      { id: '1', assetId: 'a', tone: 'hopeful',  text: 'one', createdAt: '2026-04-17T10:00:00Z' },
      { id: '2', assetId: 'a', tone: 'tired',    text: 'two', createdAt: '2026-04-18T10:00:00Z' },
    ];

    const result = fromMoodEntries(moods);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });
});
