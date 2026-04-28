# 06. Orchestrator and Slot Model

## 1. Orchestrator role
After state resolution, the orchestrator determines:
- what to show
- in which slot
- with what priority
- with which action hooks
- under what suppression rules

## 2. Slot model
Suggested slot layers:
- hero
- primary_action
- contextual_cards
- checklist
- alerts
- secondary_tools
- footer_actions

## 3. Why sloting matters
TPO Funnel Runtime is not just about selecting one card.
It is about rearranging app-native priority across the screen.

## 4. Orchestration inputs
- active states
- component definitions
- slot constraints
- policy decisions
- app capabilities
- device/locale constraints

## 5. Orchestration outputs
- ordered components per slot
- hidden components
- action order
- warnings
- slot rationale

## 6. Orchestration risks
1. Overcrowded screens
2. Slot collision
3. Priority oscillation
4. Alert fatigue
5. incoherent user journeys

## 7. Mitigation
- max components per slot
- slot suppression rules
- deterministic priority tie-breakers
- journey continuity checks
- preview simulator snapshots

## 8. Trust-sensitive note
In medical or sensitive journeys, the orchestrator must never push urgency theatrics
or manipulative CTA ordering merely for conversion.
