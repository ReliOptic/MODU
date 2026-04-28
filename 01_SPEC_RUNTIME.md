# 01. SPEC — TPO Funnel Runtime

## 1. Overview
TPO Funnel Runtime is not a generic personalization engine. It is an event-relative,
app-native, policy-bounded journey runtime — a TypeScript-based context runtime that
evaluates structured user context and orchestrates the next best checkpoint through
preset UI components, actions, and flows under policy-bounded rules.

It is designed for:
- adaptive applications
- event-relative experiences
- commercial app integration
- trust-sensitive domains
- explainable runtime decisions

## 2. Problem
Most apps have one of three weaknesses:
1. Context logic is hardcoded and scattered in UI code.
2. Dynamic personalization is expensive, opaque, or hard to govern.
3. Existing apps cannot absorb narrow user journeys without heavy rebuilds.

## 3. Goal
Create a runtime layer that:
- standardizes context input
- narrows state deterministically
- retrieves preset components
- rearranges UI slots safely
- emits decision traces
- supports policy-bounded adaptation

## 4. Non-goals
This runtime does not:
- generate full interfaces from scratch
- replace design systems
- replace medical/legal professionals
- own domain-specific source-of-truth systems
- optimize purely for engagement at the expense of safety

## 5. Core runtime contract
Input:
- TPOContext
- RulePack
- PolicyPack
- ComponentRegistry
- Optional AI Assist

Output:
- ActiveState set
- Selected components
- Selected actions
- Hidden/suppressed components
- Warnings
- Trace
- Fallback metadata
- Risk metadata

## 6. Core principles
1. Deterministic by default
2. Explainable by default
3. Policy-constrained
4. BYO-UI compatible
5. Safe fallback mandatory
6. Human override supported
7. Metrics-ready

## 7. Runtime layers
- Context ingestion
- Normalization
- Evaluation
- Risk tiering
- Policy gate
- Orchestration
- Rendering handoff
- Trace emission
- Feedback logging

## 8. Safety requirement
In trust-sensitive domains, the runtime must prefer:
- abstention over low-confidence automation
- safe default over risky personalization
- reviewed learning over blind auto-optimization
