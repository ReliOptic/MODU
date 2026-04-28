# 12. Integration Patterns

## 1. Greenfield apps
Best architectural fit.

Advantages:
- native slot model
- registry-first UI
- clean traces
- event taxonomy from day one

## 2. Legacy apps
Commercially attractive but technically harder.

Approaches:
- start with one page/flow
- wrap existing slots
- introduce registry aliasing
- add trace without full redesign

## 3. Integration modes
- client-side
- server-side
- hybrid

## 4. Best default
Hybrid:
- local runtime for responsiveness
- remote policy/control for governance

## 5. Risks
1. component fragmentation
2. legacy navigation mismatch
3. partial rollout confusion
4. hidden performance cost

## 6. Mitigation
- one-flow pilot
- progressive adoption
- registry adapter layer
- rollout flags
- clear ownership model

## 7. Strategic interpretation
Best-fit is greenfield.
Best wedge may be legacy augmentation.
These are not the same thing and must be documented separately.
