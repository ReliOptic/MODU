import {
  hourToTimeOfDay,
  findProximity,
  findTimeOfDay,
  PROXIMITIES,
  TIMES_OF_DAY,
} from '../../../../src/engine/tpo/time';

describe('hourToTimeOfDay', () => {
  it('hour 0 → night (midnight-to-3 range)', () => {
    expect(hourToTimeOfDay(0)).toBe('night');
  });

  it('hour 3 → night (still in 0-3 range)', () => {
    expect(hourToTimeOfDay(3)).toBe('night');
  });

  it('hour 4 → dawn', () => {
    expect(hourToTimeOfDay(4)).toBe('dawn');
  });

  it('hour 7 → morning (boundary start)', () => {
    expect(hourToTimeOfDay(7)).toBe('morning');
  });

  it('hour 11 → day (boundary start)', () => {
    expect(hourToTimeOfDay(11)).toBe('day');
  });

  it('hour 17 → evening (boundary start)', () => {
    expect(hourToTimeOfDay(17)).toBe('evening');
  });

  it('hour 21 → night (boundary start)', () => {
    expect(hourToTimeOfDay(21)).toBe('night');
  });

  it('hour 23 → night (late night)', () => {
    expect(hourToTimeOfDay(23)).toBe('night');
  });
});

describe('findProximity', () => {
  it('returns correct entry for known id', () => {
    const entry = findProximity('dayof');
    expect(entry.id).toBe('dayof');
    expect(entry.urgency).toBe(1.0);
    expect(entry.hero).toBe('singular');
  });

  it('falls back to first entry for unknown id', () => {
    // Cast to bypass TS — simulates runtime bad data
    const entry = findProximity('unknown' as Parameters<typeof findProximity>[0]);
    expect(entry.id).toBe(PROXIMITIES[0].id);
  });
});

describe('findTimeOfDay', () => {
  it('returns correct entry for known id', () => {
    const entry = findTimeOfDay('evening');
    expect(entry.id).toBe('evening');
    expect(entry.mood).toBe('warm');
  });

  it('falls back to morning for unknown id', () => {
    const entry = findTimeOfDay('unknown' as Parameters<typeof findTimeOfDay>[0]);
    expect(entry.id).toBe('morning');
  });

  it('all 5 TIMES_OF_DAY entries present', () => {
    expect(TIMES_OF_DAY).toHaveLength(5);
    const ids = TIMES_OF_DAY.map((t) => t.id);
    expect(ids).toContain('dawn');
    expect(ids).toContain('morning');
    expect(ids).toContain('day');
    expect(ids).toContain('evening');
    expect(ids).toContain('night');
  });
});
