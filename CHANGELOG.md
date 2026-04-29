# Changelog

All notable changes to `@tpo/runtime` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Marketing landing page at `landing/index.html` with governance trace as visual centerpiece
- Comprehensive completion roadmap (`ROADMAP-TO-COMPLETION.md`) defining 4-tier maturity model
- Design commission brief (`docs/DESIGN-COMMISSION-BRIEF.md`) for product design RFP

## [0.1.0] - 2026-04-28

### Added
- `evaluate(context, options): TPOResult` — pure deterministic decision evaluator
- `formatTrace(result, context, opts?): string` — text trace renderer with `developer` and `governance` modes
- `summarizeDecision(result, ctx): DecisionSummary` — PM-facing decision summary view
- `toAuditEvent(result, ctx, timestamp?): AuditEvent` — Ops/compliance structured audit event (`tpo.decision.v1`)
- `expectDecision(result)` — QA chainable assertion helper (`toSelectInSlot`, `toExclude`, `toHaveRiskTier`, `toBeLocked`, `not.toSelect`)
- Domain starters as separate subpath exports:
  - `@tpo/runtime/starters/banking` — premier customer + DSR policy gate
  - `@tpo/runtime/starters/ecommerce` — cart abandonment + flash sale + locked promotion slot
  - `@tpo/runtime/starters/fintech` — onboarding + KYC policy gate + abstention examples
- Risk tier escalation for empty output: `selected.length === 0 && locked.length === 0` → `high`
- `EvalMeta.rulePackVersion` field — every audit event carries the rule pack version that produced the decision
- Runtime input validation:
  - `RulePack.version` is required (string, non-empty)
  - Each rule must have non-empty `id`, `componentKey`, `slot`, and at least one condition
  - `Rule.priority` must be a number
  - `Rule.confidenceHint` must be in `[0, 1]` when present
- ESM + CJS dual format build via `tsup`
- TypeScript declaration files (`.d.ts` + `.d.cts`)
- `sideEffects: false` for tree-shaking
- Node `>=20` engine constraint
- Source maps for both formats
- 51 unit + integration tests across `evaluate`, `trace`, `decision`, and README example

### Changed
- `RulePack.version` field signature: `string | undefined` → `string` (now required at runtime)
- `EvalOptions.clock` default: `() => 0` → `Date.now`
- `formatTrace` accepts `mode: 'developer' | 'governance'` via third argument

### Security
- `vitest` upgraded from `^2.0.0` to `^3.2.4` to address moderate-severity esbuild advisory chain
- `npm audit` reports 0 high/critical vulnerabilities at release
- Dependencies isolated to dev-only (`tsup`, `typescript`, `vitest`)

### Documentation
- 5-minute quickstart with banking, ecommerce, and fintech examples
- Full TypeScript type reference embedded in README
- Governance mode output documented with expected output samples
- 15 specification documents covering runtime, evaluator, policy gate, registry, simulator, and risk model

### Infrastructure
- GitHub Actions CI: typecheck + test on Node 20 and 22
- Publish workflow on `v*` tag push with npm provenance
- GitHub Pages deployment for playground

[Unreleased]: https://github.com/ReliOptic/MODU/tree/tpo/runtime
[0.1.0]: https://github.com/ReliOptic/MODU/tree/tpo/runtime
