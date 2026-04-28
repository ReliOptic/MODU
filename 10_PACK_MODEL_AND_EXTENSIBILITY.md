# 10. Pack Model and Extensibility

## 1. Why packs
Packs make the runtime reusable across domains.

## 2. Pack types
- Context Pack
- Rule Pack
- Policy Pack
- Component Metadata Pack
- Analytics Pack

## 3. Context Pack
Defines extra schema fields and normalization rules.

## 4. Rule Pack
Defines journey-specific logic.

## 5. Policy Pack
Defines what is allowed by market/domain/risk tier.

## 6. Component Metadata Pack
Defines canonical keys, slots, and props expectations.

## 7. Analytics Pack
Defines event mapping and KPI schema.

## 8. Risks
1. Pack incompatibility
2. duplicated semantics
3. hidden vendor lock-in
4. unreviewed sensitive logic

## 9. Mitigation
- compatibility versioning
- pack manifest
- dependency declaration
- policy inheritance rules
- pack validation tool

## 10. Strategic note
The pack model is a major adoption lever.
It lets the runtime scale from niche journey depth to broader market coverage without collapsing into one giant monolith.
