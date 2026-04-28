# 13. Runtime Risks by Feature

## 1. Context schema
Risk:
- bad input drives bad output

Mitigation:
- schema validation
- confidence metadata
- source provenance

## 2. Evaluator
Risk:
- wrong state resolution

Mitigation:
- deterministic rules
- conflict trace
- fallback and abstention

## 3. Registry
Risk:
- mismatched semantic component

Mitigation:
- contract validation
- versioning
- compatibility tests

## 4. Orchestrator
Risk:
- correct components, wrong ordering

Mitigation:
- slot budgets
- priority rules
- journey coherence tests

## 5. Policy gate
Risk:
- unsafe automation

Mitigation:
- tiered policy packs
- reviewed thresholds
- operator override

## 6. AI assist
Risk:
- opaque reranking or hallucinated inference

Mitigation:
- opt-in only
- low-risk usage only
- trace tag for AI-assisted decisions
- never bypass policy gate

## 7. Observability
Risk:
- no learning signal or misread signals

Mitigation:
- event taxonomy
- reviewed learning
- separate trust metrics from engagement metrics

## 8. Open-core model
Risk:
- low adoption or low monetization

Mitigation:
- strong simulator
- excellent examples
- clear commercial boundary

## 9. Domain risk
Risk:
- applying same runtime philosophy to all domains

Mitigation:
- domain-specific policy packs
- explicit non-goals
- risk-tiered automation

## 10. Head conclusion
The runtime becomes valuable not when it personalizes the most,
but when it adapts within clearly governable limits.
