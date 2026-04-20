// Shared types for fertility bento variation.
import type { ResolvedTPO } from '../../../adapters';

export type BentoSectionId =
  | 'hero'
  | 'clock'
  | 'mood'
  | 'injection'
  | 'calendar'
  | 'partner'
  | 'whisper'
  | 'body'
  | 'sleep';

export type Proximity = ResolvedTPO['proximity'];

export interface BentoTileConfig {
  readonly id: BentoSectionId;
  /** [colSpan, rowSpan] — 6-column grid. */
  readonly span: readonly [2 | 3 | 4 | 6, 1 | 2 | 3 | 4 | 5];
}

export interface BentoStructure {
  /** Ordered tile configs for this proximity. */
  readonly tiles: ReadonlyArray<BentoTileConfig>;
}
