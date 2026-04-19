// Visual-language v2.1 §3.4 — interaction classes.
// Reduce-motion overrides are applied at the call site via
// AccessibilityInfo.isReduceMotionEnabled().

export type MotionClassId = 'micro' | 'macro' | 'macroCarousel' | 'ritual' | 'ambient';

export interface MotionEasing {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface MotionClass {
  readonly id: MotionClassId;
  readonly duration: number;
  readonly easing: MotionEasing;
  readonly description: string;
}

export interface RitualPhases {
  readonly out: number;
  readonly hold: number;
  readonly in: number;
  readonly total: number;
}

export const motion: Readonly<Record<MotionClassId, MotionClass>> = {
  micro: {
    id: 'micro',
    duration: 120,
    easing: { x1: 0.2, y1: 0, x2: 0, y2: 1 },
    description: 'Pressable press, chip toggle, haptic selection',
  },
  macro: {
    id: 'macro',
    duration: 280,
    easing: { x1: 0.32, y1: 0.72, x2: 0, y2: 1 },
    description: 'Sheet open, row expand, card height change',
  },
  macroCarousel: {
    id: 'macroCarousel',
    duration: 600,
    easing: { x1: 0.32, y1: 0.72, x2: 0, y2: 1 },
    description: '§2.A chevron-morph zoom-out/zoom-in',
  },
  ritual: {
    id: 'ritual',
    duration: 920,
    easing: { x1: 0.4, y1: 0, x2: 0, y2: 1 },
    description: 'Chapter switch composite — see ritualPhases for split',
  },
  ambient: {
    id: 'ambient',
    duration: 1800,
    easing: { x1: 0.45, y1: 0, x2: 0.55, y2: 1 },
    description: 'AmbientPalette warmth drift, quiet-weave halo breath',
  },
};

export const ritualPhases: RitualPhases = {
  out: 280,
  hold: 360,
  in: 280,
  total: 920,
};

export function cubicBezierCss(easing: MotionEasing): string {
  return `cubic-bezier(${easing.x1}, ${easing.y1}, ${easing.x2}, ${easing.y2})`;
}

export function getMotion(id: MotionClassId): MotionClass {
  return motion[id];
}
