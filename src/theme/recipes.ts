// Visual-language v2.1 §9 — per-asset composition recipes (R14 enforcement).
// Each AssetType maps to a distinct dominant layout primitive. Skin-only
// variants (same primitive, different palette) fail R14.
import type { AssetType } from '../types/asset';

export type Primitive =
  | 'timeline-spine'
  | 'phase-rails'
  | 'grid-collage'
  | 'heatmap-canvas'
  | 'horizontal-rail'
  | 'calendar-canvas'
  | 'user-determined';

export type HeroTreatment =
  | 'narrative-gradient'
  | 'photo-bleed'
  | 'map-forward'
  | 'calendar-forward'
  | 'trend-forward'
  | 'collage-playful'
  | 'streak-hero'
  | 'phase-rail-hero'
  | 'user-authored';

export type RowOrientation = 'vertical' | 'horizontal' | 'grid' | 'mixed';

export type Rhythm =
  | 'vertical-dominant'
  | 'horizontal-dominant'
  | 'grid-2d'
  | 'data-rhythm'
  | 'mixed'
  | 'user-determined';

export interface AssetRecipe {
  readonly primitive: Primitive;
  readonly heroTreatment: HeroTreatment;
  readonly rowOrientation: RowOrientation;
  readonly rhythm: Rhythm;
  readonly momentIds: readonly string[];
}

export type RecipeKey = 'fertility' | 'cancer_caregiver' | 'pet_care' | 'chronic' | 'custom';

export const RECIPE_KEYS: readonly RecipeKey[] = [
  'fertility',
  'cancer_caregiver',
  'pet_care',
  'chronic',
  'custom',
];

export const RECIPES: Readonly<Record<RecipeKey, AssetRecipe>> = {
  fertility: {
    primitive: 'timeline-spine',
    heroTreatment: 'narrative-gradient',
    rowOrientation: 'vertical',
    rhythm: 'vertical-dominant',
    momentIds: [
      'primary_event',
      'injection_timeline',
      'mood_quicklog',
      'partner_sync',
      'prev_visit_memo',
      'calendar_mini',
    ],
  },
  cancer_caregiver: {
    primitive: 'phase-rails',
    heroTreatment: 'phase-rail-hero',
    rowOrientation: 'mixed',
    rhythm: 'mixed',
    momentIds: [
      'primary_medication',
      'treatment_timeline',
      'medication_list',
      'event_detail_list',
    ],
  },
  pet_care: {
    primitive: 'grid-collage',
    heroTreatment: 'collage-playful',
    rowOrientation: 'grid',
    rhythm: 'grid-2d',
    momentIds: ['pet_profile', 'daily_log_bars', 'vet_memo'],
  },
  chronic: {
    primitive: 'heatmap-canvas',
    heroTreatment: 'trend-forward',
    rowOrientation: 'horizontal',
    rhythm: 'data-rhythm',
    momentIds: [
      'primary_condition',
      'condition_trend',
      'monthly_heatmap',
      'weekly_bar_graph',
      'medication_stock',
      'next_visit',
    ],
  },
  custom: {
    primitive: 'user-determined',
    heroTreatment: 'user-authored',
    rowOrientation: 'vertical',
    rhythm: 'user-determined',
    momentIds: [],
  },
};

export function isRecipeKey(t: AssetType): t is RecipeKey {
  return (RECIPE_KEYS as readonly string[]).includes(t);
}

export function resolveRecipeKey(t: AssetType): RecipeKey {
  return isRecipeKey(t) ? t : 'custom';
}

export function getRecipe(t: AssetType): AssetRecipe {
  return RECIPES[resolveRecipeKey(t)];
}
