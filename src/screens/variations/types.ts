// Shared interfaces for variation renderers (Phase 3A — Metamorphic refactor).
// Renderers consume only ResolvedTPO + RendererBlock + TimelineDay shapes;
// they never import from src/types/asset.ts, src/store/, or src/data/.
//
// Variation selection is system-driven via selectVariation(tpo) — there is
// no user-facing picker. The previous VARIATIONS meta + DEFAULT_VARIATION
// were removed alongside the picker; if a debug surface ever needs them
// they should live with that surface, not in the renderer contract.
import type { ComponentType } from 'react';
import type { RendererBlock, ResolvedTPO, TimelineDay } from '../../adapters';
import type { PaletteSwatch } from '../../theme';

export type VariationId = 'bento' | 'cinematic' | 'morph';

export interface VariationProps {
  readonly tpo: ResolvedTPO;
  readonly blocks: readonly RendererBlock[];
  readonly timeline: readonly TimelineDay[];
  readonly palette: PaletteSwatch;
}

export type VariationComponent = ComponentType<VariationProps>;

/** D-day style label per proximity. */
export function proximityLabel(p: ResolvedTPO['proximity']): string {
  switch (p) {
    case 'dayof': return 'D-DAY';
    case 'near':  return 'D-1';
    case 'week':  return 'D-3';
    case 'after': return 'D+1';
    case 'far':   return 'D-7+';
  }
}
