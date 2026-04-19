// v2.1 R14 — each AssetType must map to a *distinct* dominant primitive.
// 'custom' is the user-determined escape hatch and is excluded from the
// uniqueness check.
import { RECIPES, RECIPE_KEYS } from '../theme/recipes';

describe('recipe divergence (R14)', () => {
  test('every recipe key has a defined recipe', () => {
    for (const key of RECIPE_KEYS) {
      const recipe = RECIPES[key];
      expect(recipe).toBeDefined();
      expect(typeof recipe.primitive).toBe('string');
      expect(recipe.primitive.length).toBeGreaterThan(0);
    }
  });

  test('primary asset types map to unique primitives (custom excluded)', () => {
    const primaryKeys = RECIPE_KEYS.filter((k) => k !== 'custom');
    const primitives = primaryKeys.map((k) => RECIPES[k].primitive);
    const unique = new Set(primitives);
    expect(unique.size).toBe(primaryKeys.length);
  });

  test('fertility uses timeline-spine', () => {
    expect(RECIPES.fertility.primitive).toBe('timeline-spine');
  });

  test('cancer_caregiver uses phase-rails', () => {
    expect(RECIPES.cancer_caregiver.primitive).toBe('phase-rails');
  });

  test('pet_care uses grid-collage', () => {
    expect(RECIPES.pet_care.primitive).toBe('grid-collage');
  });

  test('chronic uses heatmap-canvas', () => {
    expect(RECIPES.chronic.primitive).toBe('heatmap-canvas');
  });

  test('custom uses user-determined', () => {
    expect(RECIPES.custom.primitive).toBe('user-determined');
  });
});
