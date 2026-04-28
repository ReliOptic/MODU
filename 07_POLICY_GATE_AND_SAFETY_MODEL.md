# 07. Policy Gate and Safety Model

## 1. Why policy gate is mandatory
In trust-sensitive domains, not every matched state should produce automatic action.

The runtime must answer two questions:
1. What is relevant?
2. What is allowed?

## 2. Risk tiers
Suggested tiering:

### Tier 1 — Low risk
Informational cards, reminders, journey explanation

### Tier 2 — Medium risk
Action suggestions, scheduling prompts, localized benefit guidance

### Tier 3 — High risk
Decision-sensitive guidance, sensitive health prompts, legal/financial consequence paths

### Tier 4 — Prohibited for automation
Diagnosis-like suggestions, emergency logic, restricted medical/legal instructions

## 3. Policy gate actions
The policy layer may:
- allow
- suppress
- downgrade
- replace
- escalate
- require review

## 4. Safe fallback
Fallback must not merely be generic.
It must be safe by domain.

Examples:
- neutral checklist
- “please verify”
- contact professional/help desk
- non-interpretive information

## 5. Abstention rule
When:
- confidence is low
- context is incomplete
- risk tier is high
- policy forbids automatic action

the runtime must abstain.

## 6. Human override
Required surfaces:
- operator can disable a rule
- operator can suppress a component
- operator can change policy threshold
- operator can inspect trace

## 7. Safety risks
1. False confidence
2. Harmful specificity
3. Compliance violation
4. Non-consensual personalization
5. Silent unsafe fallback

## 8. Mitigation
- policy packs
- operator review queue
- explicit suppression trace
- per-tier automation limits
- reviewed learning loop

## 9. Strategic interpretation
In regulated markets, trust comes less from “smartness” and more from bounded behavior.
