# 05. Component Registry and BYO-UI

## 1. Why BYO-UI matters
The runtime should not force a new UI system.
Commercial apps already have:
- design systems
- accessibility constraints
- localization patterns
- trust signals
- brand tone

BYO-UI is therefore a trust-preserving feature, not just a DX convenience.

## 2. Registry role
Registry maps stable component keys to app-specific implementations.

Examples:
- checklist.prep.basic
- card.local_benefit
- alert.time_sensitive
- cta.partner_support

## 3. Registry contract
A component definition should include:
- key
- version
- slot
- props schema
- optional compatibility metadata

## 4. Why key-based registry is strategic
This creates separation between:
- decision layer
- visual implementation layer

That means one runtime can support many apps.

## 5. Registry risks
1. Key sprawl
2. Inconsistent component semantics
3. Props mismatch
4. Hidden visual assumptions
5. Version drift

## 6. Mitigation
- naming conventions
- props validation
- versioned contracts
- component catalog docs
- slot compatibility tests

## 7. Strategic note
BYO-UI is one of the strongest defenses against the critique that deterministic runtime feels invasive.
If the app uses its own native UI, the user experiences contextual evolution rather than foreign injection.
