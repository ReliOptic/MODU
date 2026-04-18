// Variation registry barrel — Phase 3A.
// Renderers are domain-agnostic: they read ResolvedTPO + RendererBlock +
// TimelineDay only (no Asset / store imports inside the variation files).
import type { VariationComponent, VariationId } from './types';
import { BentoVariation } from './BentoVariation';
import { CinematicVariation } from './CinematicVariation';
import { MorphVariation } from './MorphVariation';

export { BentoVariation, CinematicVariation, MorphVariation };
export type { VariationProps, VariationId, VariationComponent, VariationMeta } from './types';
export { VARIATIONS, DEFAULT_VARIATION, proximityLabel } from './types';

export const VARIATION_REGISTRY: Readonly<Record<VariationId, VariationComponent>> = {
  bento: BentoVariation,
  cinematic: CinematicVariation,
  morph: MorphVariation,
};
