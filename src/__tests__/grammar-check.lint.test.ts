// Grammar-check lint runner wired to jest so `npm run lint:grammar` uses the
// existing test toolchain. Programmatic logic lives in tools/grammar-check.ts.
import { runGrammarChecks } from '../../tools/grammar-check';

describe('visual-language v2.1 grammar', () => {
  test('no rule violations (R14 + R9)', () => {
    const violations = runGrammarChecks();
    expect(violations).toEqual([]);
  });
});
