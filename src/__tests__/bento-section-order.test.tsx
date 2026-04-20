// Section-order tests for TimelineSpineBento (Phase 5B).
// Verifies per-proximity tile order from BENTO_STRUCTURES table.
// Uses pure data assertion (no renderer needed) — BENTO_STRUCTURES is the
// single source of truth for tile ordering, matching reference JSX useMemoBlocks().
import { BENTO_STRUCTURES } from '../screens/variations/fertility/bentoData';

describe('BENTO_STRUCTURES section order by proximity', () => {
  it('dayof: hero leads, partner + mood + clock + body follow', () => {
    const ids = BENTO_STRUCTURES.dayof.tiles.map((t) => t.id);
    expect(ids[0]).toBe('hero');
    expect(ids).toContain('partner');
    expect(ids).toContain('mood');
    expect(ids).toContain('clock');
    expect(ids).toContain('body');
    // dayof has no injection, calendar, whisper, sleep
    expect(ids).not.toContain('injection');
    expect(ids).not.toContain('calendar');
    expect(ids).not.toContain('whisper');
    expect(ids).not.toContain('sleep');
  });

  it('dayof: hero span is [6, 5] (full takeover, R1 compliant)', () => {
    const hero = BENTO_STRUCTURES.dayof.tiles.find((t) => t.id === 'hero');
    expect(hero).toBeDefined();
    expect(hero?.span).toEqual([6, 5]);
  });

  it('near: hero leads (6×4), clock + partner + injection + calendar + whisper', () => {
    const ids = BENTO_STRUCTURES.near.tiles.map((t) => t.id);
    expect(ids[0]).toBe('hero');
    expect(ids).toContain('clock');
    expect(ids).toContain('partner');
    expect(ids).toContain('injection');
    expect(ids).toContain('calendar');
    expect(ids).toContain('whisper');
    expect(ids).not.toContain('sleep');
    expect(ids).not.toContain('body');
    const hero = BENTO_STRUCTURES.near.tiles.find((t) => t.id === 'hero');
    expect(hero?.span[0]).toBe(6);
    expect(hero?.span[1]).toBe(4);
  });

  it('week: calendar leads (planning), injection + clock + partner + whisper + body', () => {
    const ids = BENTO_STRUCTURES.week.tiles.map((t) => t.id);
    expect(ids[0]).toBe('calendar');
    expect(ids).toContain('injection');
    expect(ids).toContain('clock');
    expect(ids).toContain('partner');
    expect(ids).toContain('whisper');
    expect(ids).toContain('body');
    expect(ids).not.toContain('sleep');
    const cal = BENTO_STRUCTURES.week.tiles.find((t) => t.id === 'calendar');
    expect(cal?.span).toEqual([6, 3]);
  });

  it('far: mood leads (ambient), body + sleep + calendar + whisper + injection', () => {
    const ids = BENTO_STRUCTURES.far.tiles.map((t) => t.id);
    expect(ids[0]).toBe('mood');
    expect(ids).toContain('body');
    expect(ids).toContain('sleep');
    expect(ids).toContain('calendar');
    expect(ids).toContain('whisper');
    expect(ids).toContain('injection');
    expect(ids).not.toContain('partner');
    expect(ids).not.toContain('clock');
    const mood = BENTO_STRUCTURES.far.tiles.find((t) => t.id === 'mood');
    expect(mood?.span).toEqual([6, 2]);
  });

  it('after: whisper leads (recovery), body + sleep + hero + mood + partner', () => {
    const ids = BENTO_STRUCTURES.after.tiles.map((t) => t.id);
    expect(ids[0]).toBe('whisper');
    expect(ids).toContain('body');
    expect(ids).toContain('sleep');
    expect(ids).toContain('hero');
    expect(ids).toContain('mood');
    expect(ids).toContain('partner');
    expect(ids).not.toContain('injection');
    expect(ids).not.toContain('calendar');
    expect(ids).not.toContain('clock');
    const whisper = BENTO_STRUCTURES.after.tiles.find((t) => t.id === 'whisper');
    expect(whisper?.span).toEqual([6, 3]);
  });

  it('all structures cover all 5 proximities', () => {
    const proximities = ['dayof', 'near', 'week', 'far', 'after'] as const;
    for (const p of proximities) {
      expect(BENTO_STRUCTURES[p]).toBeDefined();
      expect(BENTO_STRUCTURES[p].tiles.length).toBeGreaterThan(0);
    }
  });

  it('all tile colSpans are valid (2 | 3 | 4 | 6)', () => {
    const validCols = new Set([2, 3, 4, 6]);
    for (const [prox, struct] of Object.entries(BENTO_STRUCTURES)) {
      for (const tile of struct.tiles) {
        expect(validCols.has(tile.span[0])).toBe(true);
        // Row spans 1-5
        expect(tile.span[1]).toBeGreaterThanOrEqual(1);
        expect(tile.span[1]).toBeLessThanOrEqual(5);
      }
      // Each proximity should have full-width (colSpan=6) tiles for the lead block
      const hasFullWidth = struct.tiles.some((t) => t.span[0] === 6);
      expect(hasFullWidth).toBe(true);
      void prox; // used in loop key
    }
  });
});
