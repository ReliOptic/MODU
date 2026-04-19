// v2.1 §9 — mood × proximity → density modulation per primitive.
// proximity is the TPO axis; mood is the renderer-class axis (bento/cinematic/morph).
// Same proximity in two different moods produces different density shapes,
// but the asset-type primitive (recipe) stays constant.
import type { ResolvedTPO } from '../../../adapters';

export type Mood = 'bento' | 'cinematic' | 'morph';

export interface DensityShape {
  readonly heroMinScale: number;
  readonly heroBonus: number;
  readonly rowSlots: number;
  readonly accentDensity: 'soft' | 'standard' | 'punch';
  readonly breathingMultiplier: number;
}

const PROXIMITY_BASE = {
  far: { rowSlots: 2, heroBonus: 0, accent: 'soft' as const, breath: 1.4 },
  week: { rowSlots: 3, heroBonus: 32, accent: 'standard' as const, breath: 1.1 },
  near: { rowSlots: 4, heroBonus: 64, accent: 'standard' as const, breath: 1.0 },
  dayof: { rowSlots: 5, heroBonus: 120, accent: 'punch' as const, breath: 0.9 },
  after: { rowSlots: 2, heroBonus: -40, accent: 'soft' as const, breath: 1.6 },
};

const MOOD_MOD = {
  bento: { rowMul: 1.2, heroScale: 0.56, heroBonus: 0 },
  cinematic: { rowMul: 0.7, heroScale: 0.66, heroBonus: 60 },
  morph: { rowMul: 0.85, heroScale: 0.6, heroBonus: 20 },
};

export function densityFor(proximity: ResolvedTPO['proximity'], mood: Mood): DensityShape {
  const base = PROXIMITY_BASE[proximity];
  const mod = MOOD_MOD[mood];
  return {
    heroMinScale: mod.heroScale,
    heroBonus: base.heroBonus + mod.heroBonus,
    rowSlots: Math.max(1, Math.round(base.rowSlots * mod.rowMul)),
    accentDensity: base.accent,
    breathingMultiplier: base.breath,
  };
}
