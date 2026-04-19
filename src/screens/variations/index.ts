// Variation registry barrel — Phase 2 (visual-language v2.1 §9 R14).
// Two-axis dispatch: AssetType (recipe primitive) × VariationId (mood).
//
// Selection is system-driven via selectVariation(tpo) — TPO funnel returns
// the mood; AssetType selects the primitive. There is no user picker.
import type { VariationComponent, VariationId } from './types';
import type { RecipeKey } from '../../theme/recipes';
import { resolveRecipeKey } from '../../theme/recipes';

import { TimelineSpineBento } from './fertility/TimelineSpineBento';
import { TimelineSpineCinematic } from './fertility/TimelineSpineCinematic';
import { TimelineSpineMorph } from './fertility/TimelineSpineMorph';

import { PhaseRailsBento } from './cancer_caregiver/PhaseRailsBento';
import { PhaseRailsCinematic } from './cancer_caregiver/PhaseRailsCinematic';
import { PhaseRailsMorph } from './cancer_caregiver/PhaseRailsMorph';

import { GridCollageBento } from './pet_care/GridCollageBento';
import { GridCollageCinematic } from './pet_care/GridCollageCinematic';
import { GridCollageMorph } from './pet_care/GridCollageMorph';

import { HeatmapCanvasBento } from './chronic/HeatmapCanvasBento';
import { HeatmapCanvasCinematic } from './chronic/HeatmapCanvasCinematic';
import { HeatmapCanvasMorph } from './chronic/HeatmapCanvasMorph';

import { UserAuthoredBento } from './custom/UserAuthoredBento';
import { UserAuthoredCinematic } from './custom/UserAuthoredCinematic';
import { UserAuthoredMorph } from './custom/UserAuthoredMorph';

export type { VariationProps, VariationId, VariationComponent } from './types';
export { proximityLabel } from './types';
export { selectVariation } from './selectVariation';
export { resolveRecipeKey } from '../../theme/recipes';

export type RecipeMoodMap = Readonly<Record<VariationId, VariationComponent>>;

export const VARIATION_REGISTRY: Readonly<Record<RecipeKey, RecipeMoodMap>> = {
  fertility: {
    bento: TimelineSpineBento,
    cinematic: TimelineSpineCinematic,
    morph: TimelineSpineMorph,
  },
  cancer_caregiver: {
    bento: PhaseRailsBento,
    cinematic: PhaseRailsCinematic,
    morph: PhaseRailsMorph,
  },
  pet_care: {
    bento: GridCollageBento,
    cinematic: GridCollageCinematic,
    morph: GridCollageMorph,
  },
  chronic: {
    bento: HeatmapCanvasBento,
    cinematic: HeatmapCanvasCinematic,
    morph: HeatmapCanvasMorph,
  },
  custom: {
    bento: UserAuthoredBento,
    cinematic: UserAuthoredCinematic,
    morph: UserAuthoredMorph,
  },
};

export function pickVariation(
  assetType: string,
  variationId: VariationId,
): VariationComponent {
  const recipeKey = resolveRecipeKey(assetType);
  return VARIATION_REGISTRY[recipeKey][variationId];
}
