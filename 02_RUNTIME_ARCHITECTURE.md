# 02. Runtime Architecture

## 1. System view
TPO Funnel Runtime has nine architectural blocks.

1. Context Layer
2. Schema/Normalization Layer
3. Evaluator
4. Risk Tier Layer
5. Policy Gate
6. Orchestrator
7. Registry Layer
8. Trace/Observability Layer
9. Integration/Feedback Layer

## 2. Runtime flow
1. Receive context from app/runtime providers
2. Validate and normalize fields
3. Evaluate rules
4. Resolve active states
5. Attach risk metadata
6. Apply policy gate
7. Select and rank components
8. Map to slots and actions
9. Emit trace and metrics
10. Return result to app renderer

## 3. Why this matters
This architecture separates:
- context understanding
- decision logic
- risk control
- rendering responsibility

That separation is what makes the runtime reusable across apps.

## 4. Layer responsibilities

### 4.1 Context Layer
Collects event-relative time, place, role, journey stage, locale, device, and optional app metadata.

### 4.2 Schema Layer
Ensures typed input, sane defaults, missing-field warnings, and field normalization.

### 4.3 Evaluator
Matches rules and computes ranked active states.

### 4.4 Risk Tier Layer
Classifies the selected state/components by operational risk.

### 4.5 Policy Gate
Removes, suppresses, or downgrades unsafe actions/components.

### 4.6 Orchestrator
Builds the ordered runtime output for slots, cards, CTAs, and flows.

### 4.7 Registry Layer
Maps stable keys to app-owned component implementations.

### 4.8 Trace Layer
Explains why the result happened.

### 4.9 Feedback Layer
Captures exposure, dismissal, conversion, fallback, override, escalation, and complaint signals.

## 5. Architectural distinction
The runtime is not a UI framework.
It is a decision-and-orchestration substrate for app-native UI.

## 6. FE engineering vocabulary map

This section maps runtime concepts to vocabulary familiar to frontend UI engineers.
Each mapping names a *pattern class* rather than a single framework artifact, because
TPO primitives are composable and cross-framework.

| TPO concept | FE pattern class | Concrete analogues |
|---|---|---|
| TPOContext | structured evaluation input | typed props object, discriminated union payload |
| Context narrowing | scoped context derivation, predicate-indexed selector projection | Reselect/Jotai/Recoil selector chain, `useMemo` over React Context, RxJS `pipe` operator chain |
| Evaluator | pure deterministic resolver | reducer, predicate tree evaluator, decision-table resolver |
| ActiveState set | derived state, state-machine active nodes | XState parallel/hierarchical states, computed store |
| Risk tiering | confidence threshold + graceful degradation tier | feature flag rollout stage, SLO tier |
| Policy gate | composable middleware chain (policy stack) | Redux middleware, Next.js middleware, axios interceptor chain, OPA/Cedar policy engine |
| Orchestrator | slot composer, layout resolver | Next.js parallel routes, Vue named slots, Radix Slot composition |
| Component Registry | headless component catalog | Radix Primitives, Headless UI, shadcn-style registry |
| BYO-UI | headless primitives, render-prop / slot pattern | Radix Slot, Headless UI render-props, React Aria |
| Preset retrieval | component registry lookup with variant selection | design-token-driven variant resolution, CVA-style variants |
| Slot orchestration | named-slot composition with ordering | parallel routes, slot outlets, portal targets |
| Safe fallback | layered fallback composition (degradation ladder) | Suspense fallback + Error Boundary + default variant + null/empty state + skeleton; React Query `placeholderData → previousData → errorFallback` |
| Event-relative time axis | schedule-aware feature predicate, temporal guard | cron-backed feature flag, time-window rollout, calendar-bound gating |
| Deterministic resolution | pure function rendering, idempotent evaluator | pure reducer, referentially transparent selector |
| Trace emission | render-tree diagnostics, telemetry events | OpenTelemetry spans, React DevTools profiler trace |

### 6.1 Notes on common over-reductions

Three mappings are frequently over-reduced to a single framework device. The correct
framing is the broader pattern class.

- **Context narrowing ≠ route guard only.** A route guard is one entry-time predicate.
  TPO narrowing runs across the entire evaluation pipeline as scoped projection and
  derivation over structured context.
- **Policy gate ≠ authorization guard only.** Authorization is one axis. The gate composes
  heterogeneous predicates: abstention thresholds, risk tiers, rate limits, consent scope,
  domain constraints. The correct analogue is a composable middleware or policy stack.
- **Safe fallback ≠ Error Boundary only.** Error Boundary handles render exceptions. TPO
  fallback is a ladder covering low-confidence abstention, policy denial, missing preset,
  invalid context, and render exception — each with its own default.
