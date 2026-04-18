// selectVariation — proximity-driven home renderer mapping.
import type { ResolvedTPO } from '../../../adapters';
import type { Proximity, TimeOfDay } from '../../../engine/tpo';
import { selectVariation } from '../selectVariation';

function tpo(overrides: Partial<ResolvedTPO> = {}): ResolvedTPO {
  return {
    proximity: 'far' as Proximity,
    timeOfDay: 'midday' as TimeOfDay,
    role: 'self',
    placeId: 'kr_seoul',
    locale: 'ko',
    assetKey: 'fertility',
    copy: { heroWord: 'x', headline: 'x', whisper: 'x' },
    visual: { heroScale: 1, density: 1, dim: 1, blobSize: 1, ritualStrength: 0 },
    anchorEventId: null,
    ...overrides,
  };
}

describe('selectVariation', () => {
  it('proximity=dayof → cinematic (moment of significance)', () => {
    expect(selectVariation(tpo({ proximity: 'dayof' }))).toBe('cinematic');
  });

  it('proximity=near → bento (preparation density)', () => {
    expect(selectVariation(tpo({ proximity: 'near' }))).toBe('bento');
  });

  it('proximity=week → bento (planning density)', () => {
    expect(selectVariation(tpo({ proximity: 'week' }))).toBe('bento');
  });

  it('proximity=far → morph (ambient mode)', () => {
    expect(selectVariation(tpo({ proximity: 'far' }))).toBe('morph');
  });

  it('proximity=after → morph (recovery mode)', () => {
    expect(selectVariation(tpo({ proximity: 'after' }))).toBe('morph');
  });

  it('is deterministic — same input → same output across calls', () => {
    const t = tpo({ proximity: 'near' });
    expect(selectVariation(t)).toBe(selectVariation(t));
  });

  it('result is a member of the registry union', () => {
    const proximities: readonly Proximity[] = ['far', 'week', 'near', 'dayof', 'after'];
    const allowed: readonly string[] = ['bento', 'cinematic', 'morph'];
    for (const p of proximities) {
      expect(allowed).toContain(selectVariation(tpo({ proximity: p })));
    }
  });

  it('ignores timeOfDay and role for V1 (proximity is the sole axis)', () => {
    const morning = tpo({ proximity: 'dayof', timeOfDay: 'morning', role: 'guardian' });
    const night = tpo({ proximity: 'dayof', timeOfDay: 'night', role: 'self' });
    expect(selectVariation(morning)).toBe(selectVariation(night));
    expect(selectVariation(morning)).toBe('cinematic');
  });
});
