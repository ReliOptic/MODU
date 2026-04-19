// v2.1 — 2-axis registry completeness.
// Every RecipeKey × VariationId combination must resolve to a component.
import { VARIATION_REGISTRY, pickVariation } from '../screens/variations';
import { RECIPE_KEYS } from '../theme/recipes';

const MOODS = ['bento', 'cinematic', 'morph'] as const;

describe('VARIATION_REGISTRY (2-axis dispatch)', () => {
  test('every recipe key has all three moods registered', () => {
    for (const key of RECIPE_KEYS) {
      const moodMap = VARIATION_REGISTRY[key];
      expect(moodMap).toBeDefined();
      for (const mood of MOODS) {
        expect(moodMap[mood]).toBeDefined();
        expect(typeof moodMap[mood]).toBe('function');
      }
    }
  });

  test('pickVariation resolves known recipe keys directly', () => {
    for (const key of RECIPE_KEYS) {
      for (const mood of MOODS) {
        const component = pickVariation(key, mood);
        expect(component).toBe(VARIATION_REGISTRY[key][mood]);
      }
    }
  });

  test('pickVariation falls back to custom for unknown asset types', () => {
    const component = pickVariation('travel', 'bento');
    expect(component).toBe(VARIATION_REGISTRY.custom.bento);
  });

  test('pickVariation falls back to custom for empty string', () => {
    const component = pickVariation('', 'morph');
    expect(component).toBe(VARIATION_REGISTRY.custom.morph);
  });
});
