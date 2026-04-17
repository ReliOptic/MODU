# MODU Progress

> **Read on session start** (CLAUDE.md rule). **Update at session end** before the final commit.
> Snapshot of the last session: what landed, what is locked in, what is deferred, what to resume.
> Complements `CLAUDE.md` (permanent guidance) and `ROADMAP.md` (release plan).

---

## Last session — 2026-04-17

### Committed (chronological)

| Commit | Scope |
|--------|-------|
| `07b4ff9` | ADR-0013 / 0011 Addendums — `quiet-weave` rename · Role axis elevation · metaphoric-guide principle · sync-ready schema shape · post-bonding sync timing |
| `07fe6ff` | Grammar — 7th metaphor "Moments" + §4.6 internal-metaphor UI ban |
| `04296df` | ADR-0014 English-first + ADR-0013 A5 / A6 Role axis final decisions |
| `c3fbdf8` | Grammar — English-master rewrite; Korean preserved at `modu-product-grammar.ko.md` |
| `8732c5a` | Repository + sync-ready schema (I1 + I2) — `src/lib/ids.ts`, `Syncable` base, zustand persist v1 → v2 migration, `ChapterRepository` / `LocalAssetRepository` |
| `94d7b25` | Regulatory-welcome + B2G strategy + Grammar §11 external register |
| `d612461` | Economic-foundation + impact thesis — contribution margin as KPI language |
| `a6f4d6c` | Framing corrections — "individual failure" removed; hidden-B2G principle; consent-at-onboarding requirement; orchestrated-care as core UX; Big Tech customer segment |
| `eac50c6` | Phase 1 event schema + TypeScript types — `docs/data/2026-04-17-phase-1-event-schema.md`, `src/types/events.ts` with `EVENT_REGISTRY` |

### Locked-in (binding across sessions)

- **ADR-0013** Adaptive-by-Default. 7 metaphors. Slot model (`skin`/`glance`/`hero`/`row`/`floating`). Quality Contract 7 clauses. Role axis = chapter × account pair. Role enum v1 = `self` | `partner` | `caregiver` (doctor → v2+). Implementation pattern (Q4) = **Hybrid (c)**: one Moment file, `render(ctx)` dispatches role sub-components. P0 Moments = `tpo-signature` (skin) + `next-step` (floating) + `quiet-weave` (hero). P0 quiet-weave partner logic split to P0.5.
- **ADR-0014** English-first authoring. Master for new code, docs, copy. `ko-KR` preserved with `.ko.md` suffix. P1 locales = `en-US` + `ko-KR` co-render. P2 = `en-CA` / `fr-CA` / `ja-JP` / `de-DE` / `fr-FR`.
- **ADR-0011** Local-first. Sync invitation = post-bonding Moment (row slot), not onboarding. Bonding predicate placeholder ≥ 7d + ≥ 5 memories + ≥ 1 photo + ≥ 1 phase transition, to be refit empirically.
- **Candidate ADR-0015** Non-SaMD posture. Permanent product constraint: no diagnostic claims, no treatment recommendations, no clinical alerting.
- **Operating sequence (non-negotiable per country)**: regulatory strategy → data-collection mechanism fit to that regulation → orchestrated-care UX delivered on that mechanism. Never reversed.
- **Hidden B2G** — institutional, sponsorship, Big-Tech aggregate paths are internal strategic surfaces only. Never in user-facing copy. Onboarding consent is the only user-facing transparency (local default, future opt-in sync, future opt-in aggregate research).
- **Core UX** = orchestrated care ("실제 삶의 패턴이 조율되는 느낌"). Every feature amplifies this or is rejected.
- **Contribution margin** = single operating language for every team's primary KPI. Vanity metrics rejected.
- **Statistical standards** — Cox survival for retention; LTV = ∫ ARPU(t) · S(t) dt; Thompson sampling for Moment variants at L4; Brier-score deployment gate; 2-cohort replication for KPI changes.

### Deferred (not yet decided)

- **S5** Moment variant logic — tone / density / lang / a11y dimensions; user-vs-cohort bandit level; initial variant count. Decide during P0 implementation.
- **S6** Bonding predicate numeric values — current placeholder is a guess. Refit once ~100-user cohort exists with enough phase transitions to power Cox regression.
- **ADR-0015** Non-SaMD Posture — draft when the first feature-rejection decision is needed.
- **ADR-0016** Contribution-margin-per-feature gate — author when the first feature ships at > 5% MAU scale.
- **ADR-0017** Statistical operating standards — author when the retention model reaches 2-cohort replication baseline.

### Implementation status

- ✅ **I1 + I2** Repository abstraction + sync-ready schema (commit `8732c5a`). `LocalAssetRepository` exists but is **not yet wired into `assetStore`** — zustand persist remains the runtime path. Migration v1 → v2 backfills `updatedAt` / `syncedAt`.
- ✅ **Event schema + TypeScript types** (`eac50c6`). Emission helper **not yet implemented**.
- ⬜ `src/lib/events.ts` emission helper — auto-populates `EventBase`, manages `session_id` lifecycle, local-first queue.
- ⬜ `EventRepository` + `LocalEventRepository` — append-only; S1 / S2 90-day rolling, S3 indefinite, S4 immutable audit.
- ⬜ Emission wiring into `assetStore` (`createAsset` / `switchAsset` / `archiveAsset`) and `formationStore` completion.
- ⬜ Onboarding consent screen in Formation — three-item acknowledgment; plain-language `en-US` + `ko-KR` copy drafted in schema doc.
- ⬜ Sync-invitation Moment (row slot) — ADR-0011 Addendum.
- ⬜ One-tap export — ChapterMemory + event log bundle; satisfies HIPAA §164.524 + GDPR Art. 15 + PIPA §35 + APPI §33 + PIPEDA Principle 9 simultaneously.
- ⬜ PostHog opt-in — S1 / S2 only; S3 / S4 gated by research-use toggle.
- ⬜ **I3** Moment engine core (`src/moments/core/`).
- ⬜ **I4** Moment library folder scaffolding.
- ⬜ **I5 – I7** P0 Moments (`tpo-signature`, `next-step`, `quiet-weave`).
- ⬜ **I8** Sync-invitation Moment implementation (overlaps with the one above).
- ⬜ **I9** Internal-metaphor lint + PR-template gate.

### Pre-existing issues outside session scope

- `src/hooks/useAssetTransition.ts` — tsc errors for `TransitionMode` / `QUICK_HALF`. Unrelated to this session's changes.
- Jest config — expo ESM transform broken; `src/__tests__/assetStore.test.ts` cannot run. Unrelated to this session.

---

## Suggested next actions (priority, when work resumes)

1. **`src/lib/events.ts` emission helper** — 1-2d. Blocks almost everything else.
2. **EventRepository + LocalEventRepository** — 1-2d, mirrors the AssetRepository pattern.
3. **Emission wiring** — 1d, parallel with 4 and 5.
4. **Onboarding consent screen** — 2-3d, parallel with 3 and 5.
5. **Sync-invitation Moment (row)** — 2-3d, parallel with 3 and 4.
6. **One-tap export** — 2-3d, after 1-3 exist.
7. **PostHog opt-in** — 1d, final.

Alternative: start **I3 Moment engine core** first if event-plumbing stubs are acceptable and Moments + emission progress in parallel. Call it on resumption.

---

## Persistent cross-session memory

`/home/codespace/.claude/projects/-workspaces-MODU/memory/MEMORY.md` indexes durable rules:

- Anti-case-lockin (hyper-personalization via signal axes, not personas)
- Metaphoric-guide principle (internal metaphors never in UI)
- English-first authoring
- Regulatory-welcome design posture (internal vs external register; permanent non-SaMD)
- Contribution margin as the single KPI operating language
- Hidden B2G + consent-at-onboarding + orchestrated-care UX

---

## 요약 (ko)

**진행 상황 snapshot** — 직전 세션 (2026-04-17) 은 9 커밋 확정: ADR-0013/0014 Addendums + Role axis 결정 + Grammar 영문 마스터 전환 + Repository 추상화 + 사 전개 스키마 (UUID/updatedAt/syncedAt) + Regulatory-welcome/B2G + Economic foundation + Hidden B2G 보정 + Phase 1 event schema.

**바인딩**: ADR-0013 P0 Moments · ADR-0014 English-master · ADR-0011 Addendum · Operating sequence (regulation → data → UX) · Hidden B2G · Consent at onboarding · Orchestrated care · Contribution margin as KPI language · 통계 standards (Cox · Thompson · Brier · 2-cohort).

**다음**: emission helper → EventRepository → wiring → consent screen → sync-invitation Moment → export → PostHog. 또는 병렬로 I3 Moment engine core.

세션 종료 시 본 파일 업데이트 후 `docs: progress snapshot YYYY-MM-DD` 로 commit.
