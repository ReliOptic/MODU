# TPO Funnel Runtime — Risk-Inclusive Documentation Set

This document set expands the runtime architecture with trust-sensitive risk controls,
policy-gated orchestration, safe fallback behavior, and operational observability.

## Document map
1. 01_SPEC_RUNTIME.md
2. 02_RUNTIME_ARCHITECTURE.md
3. 03_CONTEXT_SCHEMA_AND_TIME_AXIS.md
4. 04_EVALUATOR_AND_RESOLUTION.md
5. 05_COMPONENT_REGISTRY_AND_BYO_UI.md
6. 06_ORCHESTRATOR_AND_SLOT_MODEL.md
7. 07_POLICY_GATE_AND_SAFETY_MODEL.md
8. 08_TRACE_OBSERVABILITY_AND_METRICS.md
9. 09_SIMULATOR_TESTING_AND_EVAL.md
10. 10_PACK_MODEL_AND_EXTENSIBILITY.md
11. 11_OPEN_CORE_AND_COMMERCIAL_BOUNDARY.md
12. 12_INTEGRATION_PATTERNS.md
13. 13_RUNTIME_RISKS_BY_FEATURE.md
14. 14_MVP_AND_PHASED_ROADMAP.md

## Head message
TPO Funnel Runtime is not a generic personalization engine. It is an event-relative,
app-native, policy-bounded journey runtime: it narrows user context across event-relative
Time, Place, and Occasion/Role, and orchestrates the next best checkpoint through
app-native preset components under policy-bounded rules.

## Design stance
- Context narrowing first
- Preset retrieval over full UI generation
- Deterministic resolution with bounded AI assist
- BYO-UI for trust preservation
- Runtime layer, not replacement for OS-level agents
- Safe adaptation over maximal adaptation
