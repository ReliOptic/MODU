// Fertility bento: seed data + per-proximity structures table.
// Reference: variation-bento.jsx useMemoBlocks() + BentoBlock kinds.
import type { BentoStructure, Proximity } from './bentoTypes';

// ---------------------------------------------------------------------------
// Per-proximity structures table
// Derived from reference JSX useMemoBlocks() occasion switch.
// dayof: hero full takeover (6×5) + partner + mood + clock + body
// near:  hero large (6×4) + clock + partner + injection + calendar + whisper
// week:  calendar planning lead (6×3) + injection + clock + partner + whisper + body
// far:   mood ambient lead (6×2) + body + sleep + calendar (6×3) + whisper + injection
// after: whisper recovery lead (6×3) + body + sleep + hero (6×3) + mood + partner
// ---------------------------------------------------------------------------
export const BENTO_STRUCTURES: Readonly<Record<Proximity, BentoStructure>> = {
  dayof: {
    tiles: [
      { id: 'hero',      span: [6, 5] },
      { id: 'partner',   span: [3, 2] },
      { id: 'mood',      span: [3, 2] },
      { id: 'clock',     span: [3, 2] },
      { id: 'body',      span: [3, 2] },
    ],
  },
  near: {
    tiles: [
      { id: 'hero',      span: [6, 4] },
      { id: 'clock',     span: [3, 2] },
      { id: 'partner',   span: [3, 2] },
      { id: 'injection', span: [6, 3] },
      { id: 'calendar',  span: [4, 3] },
      { id: 'whisper',   span: [6, 2] },
    ],
  },
  week: {
    tiles: [
      { id: 'calendar',  span: [6, 3] },
      { id: 'injection', span: [6, 3] },
      { id: 'clock',     span: [3, 2] },
      { id: 'partner',   span: [3, 2] },
      { id: 'whisper',   span: [6, 2] },
      { id: 'body',      span: [3, 2] },
    ],
  },
  far: {
    tiles: [
      { id: 'mood',      span: [6, 2] },
      { id: 'body',      span: [3, 2] },
      { id: 'sleep',     span: [3, 2] },
      { id: 'calendar',  span: [6, 3] },
      { id: 'whisper',   span: [6, 2] },
      { id: 'injection', span: [6, 3] },
    ],
  },
  after: {
    tiles: [
      { id: 'whisper',   span: [6, 3] },
      { id: 'body',      span: [3, 3] },
      { id: 'sleep',     span: [3, 3] },
      { id: 'hero',      span: [6, 3] },
      { id: 'mood',      span: [3, 2] },
      { id: 'partner',   span: [3, 2] },
    ],
  },
};

// ---------------------------------------------------------------------------
// Static injection bar data (7-day seed, same as reference JSX)
// ---------------------------------------------------------------------------
export const INJECTION_BAR_HEIGHTS: ReadonlyArray<number> = [
  0.4, 0.6, 0.8, 1, 1, 0.7, 0,
];

export const INJECTION_DAY_LABELS: ReadonlyArray<string> = [
  '월', '화', '수', '목', '금', '토', '일',
];

// ---------------------------------------------------------------------------
// Condition bars seed (body tile) — 7-day relative values
// ---------------------------------------------------------------------------
export const CONDITION_BAR_VALUES: ReadonlyArray<number> = [
  0.5, 0.7, 0.6, 0.8, 0.9, 1, 0.85,
];
