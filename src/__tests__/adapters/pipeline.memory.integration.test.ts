/**
 * Phase 2 integration — Part 2: memory timeline + end-to-end composition.
 * See pipeline.integration.test.ts for resolveTPO + widgetsToBlocks coverage.
 */
import { mockAssets } from '../../data/mock/assets';
import type { Asset } from '../../types/asset';
import { resolveTPO } from '../../adapters/assetToTPO';
import { widgetsToBlocks } from '../../adapters/widgetToBlock';
import {
  fromMoodEntries,
  groupByDay,
} from '../../adapters/chapterMemoryToTimeline';
import type { MoodEntry, MoodTone } from '../../store/moodJournalStore';
import { BASE_STATE, KST_MORNING, fromTemplate } from './pipeline.integration.test';

describe('chapterMemoryToTimeline ↔ mock mood entries', () => {
  const sampleMoodEntries: readonly MoodEntry[] = [
    { id: 'm1', assetId: 'a-fertility', tone: 'hopeful' as MoodTone, text: '오늘은 괜찮았다', createdAt: '2026-04-17T08:00:00.000Z' },
    { id: 'm2', assetId: 'a-fertility', tone: 'tired' as MoodTone, text: '피곤해', createdAt: '2026-04-17T20:00:00.000Z' },
    { id: 'm3', assetId: 'a-fertility', tone: 'calm' as MoodTone, text: '평온하다', createdAt: '2026-04-18T07:30:00.000Z' },
    { id: 'm4', assetId: 'a-fertility', tone: 'grateful' as MoodTone, text: '감사한 하루', createdAt: '2026-04-18T19:00:00.000Z' },
  ];

  it('produces exactly 2 TimelineDay objects (2 distinct UTC dates)', () => {
    const days = groupByDay(fromMoodEntries(sampleMoodEntries));
    expect(days.length).toBe(2);
  });

  it('days are ordered newest-first', () => {
    const days = groupByDay(fromMoodEntries(sampleMoodEntries));
    expect(days[0].dateKey).toBe('2026-04-18');
    expect(days[1].dateKey).toBe('2026-04-17');
  });

  it('entries within each day are ordered newest-first', () => {
    const days = groupByDay(fromMoodEntries(sampleMoodEntries));
    for (const day of days) {
      for (let i = 1; i < day.entries.length; i++) {
        const prev = new Date(day.entries[i - 1].createdAt).getTime();
        const curr = new Date(day.entries[i].createdAt).getTime();
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    }
  });

  it('every entry has kind="mood" and meta.tone preserved', () => {
    const days = groupByDay(fromMoodEntries(sampleMoodEntries));
    for (const day of days) {
      for (const entry of day.entries) {
        expect(entry.kind).toBe('mood');
        expect(typeof (entry.meta as Record<string, unknown>).tone).toBe('string');
      }
    }
  });
});

describe('End-to-end pipeline: Asset → TPO + blocks + timeline', () => {
  const sampleMoodEntries: readonly MoodEntry[] = [
    { id: 'e1', assetId: 'a-fertility', tone: 'hopeful' as MoodTone, text: '검사 결과 기다리는 중', createdAt: '2026-04-18T09:00:00.000Z' },
    { id: 'e2', assetId: 'a-fertility', tone: 'calm' as MoodTone, text: '오늘은 차분해', createdAt: '2026-04-17T18:00:00.000Z' },
  ];

  it('composes TPO + blocks + timeline without exceptions', () => {
    const asset: Asset =
      mockAssets.length > 0
        ? mockAssets[0]
        : fromTemplate('fertility', 'fallback-fertility');

    const tpo = resolveTPO(asset, BASE_STATE, KST_MORNING);
    const blocks = widgetsToBlocks(asset.widgets);
    const timeline = groupByDay(fromMoodEntries(sampleMoodEntries));

    expect(tpo.copy.heroWord.length).toBeGreaterThan(0);
    expect(typeof tpo.timeOfDay).toBe('string');
    expect(typeof tpo.role).toBe('string');

    expect(blocks.length).toBeGreaterThan(0);
    expect(typeof blocks[0].id).toBe('string');
    expect(typeof blocks[0].variant).toBe('string');

    expect(Array.isArray(timeline)).toBe(true);
    expect(timeline.length).toBeGreaterThan(0);
  });
});
