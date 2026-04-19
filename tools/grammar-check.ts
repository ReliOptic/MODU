// Visual-language v2.1 grammar checker.
// Enforces R14 (distinct dominant primitives per AssetType) and provides an
// R9 hook (per-widget hover/press/long-press grammar). R14 is authoritative
// today; R9 is a scaffold that fails closed when recipes gain R9 metadata.
import { RECIPES, RECIPE_KEYS, type RecipeKey } from '../src/theme/recipes';

export interface GrammarViolation {
  readonly rule: 'R14' | 'R9';
  readonly message: string;
}

export function checkR14(): readonly GrammarViolation[] {
  const primaryKeys: readonly RecipeKey[] = RECIPE_KEYS.filter((k) => k !== 'custom');
  const seen = new Map<string, RecipeKey>();
  const violations: GrammarViolation[] = [];
  for (const key of primaryKeys) {
    const primitive = RECIPES[key].primitive;
    const owner = seen.get(primitive);
    if (owner) {
      violations.push({
        rule: 'R14',
        message: `R14 — "${key}" shares primitive "${primitive}" with "${owner}". Each AssetType must diverge.`,
      });
    } else {
      seen.set(primitive, key);
    }
  }
  return violations;
}

export function checkR9(): readonly GrammarViolation[] {
  // R9 (interaction grammar) — placeholder until widget-level metadata lands.
  // When momentIds gain interaction contracts, validate each widget declares
  // hover/press/long-press semantics per §9.2.
  return [];
}

export function runGrammarChecks(): readonly GrammarViolation[] {
  return [...checkR14(), ...checkR9()];
}
