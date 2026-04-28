# 03. Context Schema and Time Axis

## 1. Why context is the substrate
The runtime becomes valuable only when context is structured enough to support deterministic
resolution and future operational learning.

## 2. Primary context axes
- Time
- Place
- Occasion/Role

## 3. Time axis is event-relative, not clock-only
The most important insight is that Time is not just timestamp.
It is event-relative progression.

Examples:
- D-7 preparation
- D-3 urgency increase
- D-1 confirmation
- D-day execution
- D+1 recovery
- D+7 follow-up

## 4. Suggested context shape
- time.phase
- time.countdownDays
- time.eventDate
- time.timezone
- place.country
- place.region
- place.city
- place.venueType
- occasion.role
- occasion.stage
- occasion.journey
- locale
- device
- tags
- metadata

## 5. Context quality risks
1. Missing fields
2. Stale fields
3. Conflicting fields
4. Overly free-form metadata
5. Hidden app assumptions

## 6. Mitigation
- typed schema
- field defaults
- validation warnings
- provider confidence flags
- timestamped context capture

## 7. Trust-sensitive addition
For regulated or high-trust domains, add:
- policyFlags
- consentFlags
- riskContext
- sourceConfidence
- operatorReviewRequired

## 8. Design rule
Never let untyped context silently drive a sensitive resolution.
