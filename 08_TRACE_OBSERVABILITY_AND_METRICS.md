# 08. Trace, Observability, and Metrics

## 1. Trace role
Trace answers:
- what matched
- what did not match
- what got suppressed
- why fallback happened
- which policy altered the result

## 2. Minimum trace fields
- context hash or snapshot id
- matched rule ids
- unmatched critical rule ids
- active states
- selected components
- hidden components
- policy decisions
- fallback reason
- risk tier
- confidence metadata

## 3. Metrics families

### 3.1 Runtime quality
- evaluation latency
- fallback rate
- abstention rate
- rule conflict rate
- policy suppression rate

### 3.2 UX effectiveness
- exposure rate
- click-through
- conversion rate
- dismissal rate
- completion rate

### 3.3 Trust-sensitive metrics
- override rate
- complaint-linked mis-resolution rate
- unsafe exposure incident count
- escalation rate
- trust retention proxy

## 4. Risks
1. Instrumentation blind spots
2. Too much data, not enough interpretation
3. Misreading dismissal as failure
4. Privacy overcollection

## 5. Mitigation
- event taxonomy
- privacy minimization
- domain-specific dashboards
- reviewed labeling for learning loops
- distinction between friction and harm

## 6. Head message
Trace is not just a debugging feature.
It is a prerequisite for governance, improvement, and commercial credibility.
