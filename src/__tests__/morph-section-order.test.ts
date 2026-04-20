// Unit tests for Morph per-proximity section order and shape table.
// Verifies that MORPH_SECTION_ORDER is complete and internally consistent,
// and that MORPH_SHAPES has the expected structural properties per proximity.
import {
  MORPH_SECTION_ORDER,
  MORPH_SHAPES,
  MORPH_TIMELINE_SETS,
} from '../screens/variations/fertility/morphData';
import type { Proximity } from '../screens/variations/fertility/morphTypes';

const PROXIMITIES: ReadonlyArray<Proximity> = ['far', 'week', 'near', 'dayof', 'after'];

describe('MORPH_SECTION_ORDER', () => {
  it('has an entry for every proximity', () => {
    for (const p of PROXIMITIES) {
      expect(MORPH_SECTION_ORDER[p]).toBeDefined();
      expect(MORPH_SECTION_ORDER[p].length).toBeGreaterThan(0);
    }
  });

  it('always begins with metastrip section', () => {
    for (const p of PROXIMITIES) {
      expect(MORPH_SECTION_ORDER[p][0]).toBe('metastrip');
    }
  });

  it('always includes heroblob section', () => {
    for (const p of PROXIMITIES) {
      expect(MORPH_SECTION_ORDER[p]).toContain('heroblob');
    }
  });

  it('far has resources but no timeline', () => {
    const order = MORPH_SECTION_ORDER.far;
    expect(order).toContain('resources');
    expect(order).not.toContain('timeline');
  });

  it('week has both timeline and resources', () => {
    const order = MORPH_SECTION_ORDER.week;
    expect(order).toContain('timeline');
    expect(order).toContain('resources');
  });

  it('near has timeline but no resources', () => {
    const order = MORPH_SECTION_ORDER.near;
    expect(order).toContain('timeline');
    expect(order).not.toContain('resources');
  });

  it('dayof has timeline and no resources', () => {
    const order = MORPH_SECTION_ORDER.dayof;
    expect(order).toContain('timeline');
    expect(order).not.toContain('resources');
  });

  it('after has recovery and resources but no timeline', () => {
    const order = MORPH_SECTION_ORDER.after;
    expect(order).toContain('recovery');
    expect(order).toContain('resources');
    expect(order).not.toContain('timeline');
  });
});

describe('MORPH_SHAPES', () => {
  it('has an entry for every proximity', () => {
    for (const p of PROXIMITIES) {
      expect(MORPH_SHAPES[p]).toBeDefined();
    }
  });

  it('blobSize grows monotonically from far→near then shrinks for dayof→after', () => {
    // far < week < near < dayof (dayof is the peak)
    expect(MORPH_SHAPES.far.blobSize).toBeLessThan(MORPH_SHAPES.week.blobSize);
    expect(MORPH_SHAPES.week.blobSize).toBeLessThan(MORPH_SHAPES.near.blobSize);
    expect(MORPH_SHAPES.near.blobSize).toBeLessThan(MORPH_SHAPES.dayof.blobSize);
    // after is fractured/recovery — smaller than dayof
    expect(MORPH_SHAPES.after.blobSize).toBeLessThan(MORPH_SHAPES.dayof.blobSize);
  });

  it('dayof shows countdown and has podMode singleBig', () => {
    expect(MORPH_SHAPES.dayof.showCountdown).toBe(true);
    expect(MORPH_SHAPES.dayof.podMode).toBe('singleBig');
  });

  it('after shows recovery, does not show countdown, has podMode resting', () => {
    expect(MORPH_SHAPES.after.showRecovery).toBe(true);
    expect(MORPH_SHAPES.after.showCountdown).toBe(false);
    expect(MORPH_SHAPES.after.podMode).toBe('resting');
  });

  it('far has podMode grid4', () => {
    expect(MORPH_SHAPES.far.podMode).toBe('grid4');
  });

  it('week and near have podMode grid2', () => {
    expect(MORPH_SHAPES.week.podMode).toBe('grid2');
    expect(MORPH_SHAPES.near.podMode).toBe('grid2');
  });

  it('heroHeightBonus is largest for dayof (max urgency)', () => {
    for (const p of PROXIMITIES) {
      if (p !== 'dayof') {
        expect(MORPH_SHAPES.dayof.heroHeightBonus).toBeGreaterThanOrEqual(
          MORPH_SHAPES[p].heroHeightBonus,
        );
      }
    }
  });
});

describe('MORPH_TIMELINE_SETS', () => {
  it('has timeline items for week, near, dayof', () => {
    expect(MORPH_TIMELINE_SETS.week?.length).toBeGreaterThan(0);
    expect(MORPH_TIMELINE_SETS.near?.length).toBeGreaterThan(0);
    expect(MORPH_TIMELINE_SETS.dayof?.length).toBeGreaterThan(0);
  });

  it('has no timeline for far and after (absent in map)', () => {
    expect(MORPH_TIMELINE_SETS.far).toBeUndefined();
    expect(MORPH_TIMELINE_SETS.after).toBeUndefined();
  });

  it('dayof timeline items contain a primary event (배아 이식)', () => {
    const items = MORPH_TIMELINE_SETS.dayof ?? [];
    const primary = items.find((item) => item.primary === true);
    expect(primary).toBeDefined();
    expect(primary?.title).toContain('배아 이식');
  });
});
