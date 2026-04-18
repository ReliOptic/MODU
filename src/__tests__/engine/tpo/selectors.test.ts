import { lpick, getTPOCopy, getTPOVisual } from '../../../../src/engine/tpo/selectors';
import type { LocalizedString } from '../../../../src/engine/tpo/types';

describe('lpick', () => {
  it('returns locale value when present', () => {
    const obj: LocalizedString = { ko: '아침', en: 'Morning' };
    expect(lpick(obj, 'ko')).toBe('아침');
    expect(lpick(obj, 'en')).toBe('Morning');
  });

  it('falls back to en when requested locale missing', () => {
    const obj: LocalizedString = { en: 'Morning', de: 'Morgen' };
    expect(lpick(obj, 'ko')).toBe('Morning');
  });

  it('falls back to ko when en also missing', () => {
    const obj: LocalizedString = { ko: '아침', ja: '朝' };
    expect(lpick(obj, 'de')).toBe('아침');
  });

  it('falls back to first value when ko and en both missing', () => {
    const obj: LocalizedString = { ja: '朝' };
    expect(lpick(obj, 'ar')).toBe('朝');
  });

  it('returns empty string for undefined obj', () => {
    expect(lpick(undefined, 'ko')).toBe('');
  });

  it('returns empty string for empty obj', () => {
    expect(lpick({}, 'ko')).toBe('');
  });
});

describe('getTPOCopy', () => {
  it('fertility.self.dayof.morning → heroWord "Now" in ko', () => {
    const result = getTPOCopy({
      assetKey: 'fertility',
      proximity: 'dayof',
      time: 'morning',
      role: 'self',
      locale: 'ko',
    });
    expect(result.heroWord).toBe('Now');
    expect(result.headline).toBe('오늘이에요');
  });

  it('fertility.self.dayof.morning in en', () => {
    const result = getTPOCopy({
      assetKey: 'fertility',
      proximity: 'dayof',
      time: 'morning',
      role: 'self',
      locale: 'en',
    });
    expect(result.heroWord).toBe('Now');
    expect(result.headline).toBe('Today');
  });

  it('defaults role to self and locale to ko', () => {
    const result = getTPOCopy({
      assetKey: 'fertility',
      proximity: 'dayof',
      time: 'morning',
    });
    expect(result.heroWord).toBe('Now');
  });

  it('falls back to hardcoded default when no copy found', () => {
    const result = getTPOCopy({
      assetKey: 'fertility',
      proximity: 'week',  // no week entry in COPY
      time: 'dawn',       // no dawn entry either
      role: 'clinician',  // no clinician entry in fertility
      locale: 'ko',
    });
    // Should not throw; returns some string (fallback cascade)
    expect(typeof result.heroWord).toBe('string');
    expect(typeof result.headline).toBe('string');
    expect(typeof result.whisper).toBe('string');
  });

  it('cancer.guardian.near.evening → heroWord "Gently"', () => {
    const result = getTPOCopy({
      assetKey: 'cancer',
      proximity: 'near',
      time: 'evening',
      role: 'guardian',
      locale: 'en',
    });
    expect(result.heroWord).toBe('Gently');
  });

  it('pet.guardian.dayof.day → heroWord "Paws"', () => {
    const result = getTPOCopy({
      assetKey: 'pet',
      proximity: 'dayof',
      time: 'day',
      role: 'guardian',
      locale: 'en',
    });
    expect(result.heroWord).toBe('Paws');
  });
});

describe('getTPOVisual', () => {
  it('proximity=dayof time=morning → heroScale ≈ 1.2', () => {
    const v = getTPOVisual('dayof', 'morning');
    // dayof urgency=1.0: heroScale = 0.7 + 1.0*0.5 = 1.2
    expect(v.heroScale).toBeCloseTo(1.2);
  });

  it('proximity=dayof time=morning → correct all fields', () => {
    const v = getTPOVisual('dayof', 'morning');
    // urgency=1.0, morning density=1.0, bgTint=1.0
    expect(v.heroScale).toBeCloseTo(1.2);
    expect(v.density).toBeCloseTo(Math.max(0.3, 1.0 * (1.2 - 1.0 * 0.5)));
    expect(v.dim).toBeCloseTo(1.0);
    expect(v.blobSize).toBeCloseTo(1.4);
    expect(v.ritualStrength).toBeCloseTo(1.0);
  });

  it('proximity=far time=night → heroScale ≈ 0.75', () => {
    const v = getTPOVisual('far', 'night');
    // far urgency=0.1: 0.7 + 0.1*0.5 = 0.75
    expect(v.heroScale).toBeCloseTo(0.75);
  });

  it('density never below 0.3 (floor)', () => {
    // Use values that would push density below 0.3 if floor not applied
    const v = getTPOVisual('dayof', 'night');
    // night density=0.4, urgency=1.0: 0.4*(1.2-0.5) = 0.28 → clamped to 0.3
    expect(v.density).toBeGreaterThanOrEqual(0.3);
  });
});
