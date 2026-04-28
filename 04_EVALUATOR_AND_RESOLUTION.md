# 04. Evaluator and Resolution

## 1. Role of evaluator
The evaluator narrows context into ranked active states.

## 2. Resolution stages
1. Rule matching
2. Specificity scoring
3. Priority ranking
4. Conflict resolution
5. Fallback assignment

## 3. Rule-first model
The evaluator should begin with deterministic rule evaluation.
Optional AI assist may be used only for:
- missing-field suggestion
- reranking in ambiguous low-risk cases
- explanation support

## 4. Conflict resolution logic
When multiple states match:
- higher priority wins
- more specific context wins
- policy constraints override
- tied states become ranked candidates

## 5. Fallback requirement
Fallback is mandatory.
Fallback must be:
- explicit
- domain-safe
- traceable
- testable

## 6. Resolution risks
1. False precision
2. Overfitting to narrow rules
3. Fragile priorities
4. Silent fallback abuse
5. Ambiguous low-confidence outcomes

## 7. Mitigation
- matched/unmatched trace
- confidence or quality score
- abstention path
- reviewed rule updates
- fixture-based evaluation tests

## 8. Trust-sensitive rule
If confidence is below threshold and risk tier is medium/high:
- abstain
- downgrade actionability
- surface safe default
- request human review or neutral guidance
