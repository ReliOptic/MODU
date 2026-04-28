# 09. Simulator, Testing, and Eval

## 1. Why simulator is first-class
Developers will trust the runtime only if they can inspect outcomes before shipping.

## 2. Simulator functions
- edit context
- load rule packs
- inspect active states
- inspect trace
- inspect slot output
- compare snapshots
- export fixtures

## 3. Testing layers
1. schema validation tests
2. evaluator fixture tests
3. policy gate tests
4. orchestration snapshot tests
5. registry contract tests
6. integration tests

## 4. Golden scenarios
For every pack, define canonical scenarios such as:
- D-7 self at home
- D-3 partner at clinic
- D-day transit
- fallback minimal context
- prohibited automation case

## 5. Eval questions
- Did the correct state win?
- Was fallback safe?
- Did policy suppress correctly?
- Is the trace sufficient?
- Is sloting coherent?
- Would a product/operator understand the result?

## 6. Risks
1. brittle snapshots
2. test coverage illusion
3. not testing missing data
4. no review of sensitive cases

## 7. Mitigation
- scenario-based fixtures
- adversarial fixtures
- red-team cases
- operator review cases
- regression snapshots
