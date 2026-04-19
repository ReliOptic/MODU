// Visual-language v2.1 §3.2 + §3.5 — radius and spacing scales.
// v1's uniform `14` radius is retired in Phase 4; do not reintroduce.

export const r = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export type RadiusKey = keyof typeof r;

export const s = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  neg: -12,
} as const;

export type SpacingKey = keyof typeof s;
