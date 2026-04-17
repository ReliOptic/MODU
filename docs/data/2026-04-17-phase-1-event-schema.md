# Phase 1 Event Schema — Regulation-First, Orchestrated-Care Powering

- Date: 2026-04-17
- Status: Design (live document). Events enumerated here are the ingestion boundary for the statistical foundation (retention survival, LTV integral, Thompson sampling, bonding predicate, Brier score).
- Related: ADR-0005 Privacy as Moat · ADR-0011 Local-First + Addendum · ADR-0013 Adaptive-by-Default + Addendums · ADR-0014 English-First · ADR-0018 Horizontal-First Pivot · candidate ADR-0015 Non-SaMD
- Companion docs: `docs/strategy/2026-04-17-economic-foundation-and-impact.md` · `docs/strategy/2026-04-17-regulatory-welcome-and-b2g.md` · `docs/grammar/modu-product-grammar.md` §11
- Language: English-master per ADR-0014

## Purpose

Enumerate every event MODU emits in Phase 1, and for each event specify:

1. **Product purpose** upstream (the orchestrated-care UX it serves).
2. **Statistical power** downstream (which model it feeds).
3. **Regulatory envelope** across US · CA · JP · DE · FR (we design to the strictest — GDPR Art. 9 plus Quebec Bill 25 — and the rest receive identical treatment).
4. **Sensitivity class** (how the event is stored, synced, and aggregated).
5. **Consent coverage** in the onboarding disclosure surface.

**Non-negotiable sequencing rule**: this schema is designed **regulation-first**. Every event passes the regulator envelope of every Phase 1/2 target country *before* it is proposed. No event is added because "it would be nice for analytics". Every event must serve the user-facing UX directly and pass every target country's gate.

## Principles

1. **Local-first ingestion.** Events emit to device storage first (AsyncStorage now, expo-sqlite later). No cloud transmission by default (ADR-0011).
2. **Consent gates aggregation.** De-identified aggregate use requires the standalone research-use toggle — off by default, revocable (economic-foundation §"Hidden B2G surface"). PostHog opt-in (ADR-0005) is the transport for user-consented telemetry only.
3. **Purpose-limited.** Every event has a named upstream user-facing purpose. If none, the event does not exist.
4. **Minimum necessary.** Properties carry only what the purpose needs. No kitchen-sink payloads. Raw free-text never enters an event property; hashes (SHA-256) substitute when identity-safe shape is required.
5. **Locale- and timezone-aware.** Every event carries `locale` (BCP-47) and `tz` (IANA) so per-country cohorts are clean from day 1.
6. **Role-aware.** Every event carries the acting `role` (self / partner / caregiver) where applicable (ADR-0013 Addendum A5).
7. **Audit-trailed delegation.** Role changes, consent decisions, and delegated actions are immutable in an append-only local audit log and are never aggregated.
8. **Hidden B2G.** B2G, sponsorship, and Big-Tech aggregate paths never leak into event names, property keys, debug strings, or any user-visible surface.

## Sensitivity classes (S1-S4)

| Class | Meaning | Local policy | Sync policy (post-bonding, opt-in) | Aggregate policy |
|-------|---------|--------------|------------------------------------|------------------|
| **S1** | Technical / behavioral, non-identifying (session, navigation, performance, error) | 90-day rolling window | Opt-in telemetry via PostHog | Onboarding consent covers |
| **S2** | Behavioral with chapter context (Moment lifecycle) | 90-day rolling | Opt-in telemetry; `signals_hash` only, never raw signals | Research-use toggle required |
| **S3** | Patient-generated health data — memories, care events, phase transitions | Indefinite (user's memory) | Encrypted to user's cloud store only | Research-use toggle required, strictly purpose-limited, de-identified |
| **S4** | Delegation · consent · audit | Immutable append-only local audit log | Encrypted to user's cloud store only | **Never aggregated** |

## Regulatory envelope (E1-E4)

Same envelope across US / CA / JP / DE / FR. We designed to the strictest (GDPR Art. 9 explicit consent for special-category data, Quebec Bill 25).

| Envelope | Meaning | Satisfies |
|----------|---------|-----------|
| **E1** | Device-local only. Never transmitted. | Welcomed by construction. |
| **E2** | Onboarding consent covers transmission (plain-language ToS/privacy paragraph). | HIPAA 45 CFR §164.520 notice · GDPR Art. 13 · PIPEDA Principle 2 · APPI §21 · Quebec Bill 25 §8 |
| **E3** | Requires standalone **research-use toggle** (opt-in, off by default, revocable). | HIPAA §164.508 authorization · GDPR Art. 9(2)(a) explicit consent · APPI §17 sensitive PI consent · PIPEDA Principle 3 · Quebec Bill 25 §12 |
| **E4** | Never aggregated. Audit-only local store. | HIPAA §164.528 accounting of disclosures · GDPR Art. 30 record of processing · all target countries' audit requirements |

## Event catalogue

~35 events across 9 categories. Each row: category / event / sensitivity / envelope / purpose / power.

### 1. Session

| Event | S | E | Purpose (user-facing) | Powers (downstream) |
|-------|---|---|-----------------------|---------------------|
| `session_started` | S1 | E2 | Orchestrated-care time-window trigger (TPO) | Cox covariates (sessions_per_week), bonding predicate (activity_days), Brier score |
| `session_ended` | S1 | E2 | Dwell measurement, error continuity | CM denominator (time-on-device costs) |
| `app_foreground` | S1 | E2 | Fine-grained TPO signal | Moment signal context |
| `app_background` | S1 | E2 | Same, opposite direction | Moment signal context |

### 2. Navigation

| Event | S | E | Purpose | Powers |
|-------|---|---|---------|--------|
| `tab_viewed` | S1 | E2 | Surface attention routing | Activation CM chain |
| `screen_viewed` | S1 | E2 | Screen-level analytics (bandit context) | Bandit ctx |

### 3. Chapter lifecycle

| Event | S | E | Purpose | Powers |
|-------|---|---|---------|--------|
| `chapter_created` | S3 | E3 | Asset birth | retention numerator, LTV, bonding predicate |
| `chapter_switched` | S3 | E3 | Chapter switch ritual signal | activation CM |
| `chapter_archived` | S3 | E3 | Chapter close ritual signal | retention hazard label |
| `chapter_rehydrated` | S3 | E3 | First interaction / session on a chapter | engagement covariate |

### 4. Memory

| Event | S | E | Purpose | Powers |
|-------|---|---|---------|--------|
| `chapter_memory_created` | S3 | E3 | Append-only timeline logs (core UX) | retention covariate (memories_per_week), bonding, Moment reward |
| `chapter_memory_viewed` | S3 | E3 | Reading own memory (compounds) | retention covariate |
| `memory_glance_shown` | S3 | E3 | "One year ago today" surfacing | engagement covariate |

### 5. Care event (ScheduledEvent)

| Event | S | E | Purpose | Powers |
|-------|---|---|---------|--------|
| `event_logged` | S3 | E3 | Injection / visit / chemo logged | care-density covariate |
| `phase_transition_observed` | S3 | E3 | System-observed phase change | retention covariate (phase_transitions), bonding predicate |

> **Horizontal platform note (ADR-0018)**: The events above are asset-agnostic. Future asset-specific event extensions (e.g. `cycle_day_logged`, `cycle_phase_changed`, `embryo_transfer_recorded` for fertility; `study_session_logged`, `mock_exam_recorded` for study; `training_run_logged` for fitness) are **fertility-asset-specific / asset-specific — not v1 categorical defaults**. They belong to the E4 (fertility) or E1-E3 (other assets) envelope of their respective asset type. No asset-specific event may be treated as a platform-wide default or emitted for chapters outside that asset type. When implementing asset-specific events, annotate each with `// fertility-asset-specific (not v1 categorical default)` or the equivalent asset label in the source.

### 6. Moment lifecycle (adaptive observability)

| Event | S | E | Purpose | Powers |
|-------|---|---|---------|--------|
| `moment_exposed` | S2 | E3 | Moment rendered (with `signals_hash`) | Thompson sampling denominator |
| `moment_tapped` | S2 | E3 | Primary action tap | Thompson sampling numerator, latency |
| `moment_dwelled` | S2 | E3 | Dwell above threshold without tap | bandit secondary signal |
| `moment_dismissed` | S2 | E3 | User hid the Moment | bandit negative signal |
| `moment_resulted_memory` | S2 | E3 | `chapter_memory_created` within N seconds of `moment_tapped` | bandit reward (composed event) |

### 7. Partner / caregiver (delegation)

All S4/E4. Immutable local audit.

| Event | Purpose | Powers |
|-------|---------|--------|
| `partner_invited` | Invite flow | audit |
| `partner_linked` | Invite accepted | network covariate (partner_linked=1), audit |
| `partner_revoked` | Access removed | audit, relationship lifecycle |
| `role_changed` | Role modified on an existing link | audit |
| `delegated_action` | Partner/caregiver performed a permitted action | audit only |

`partner_id` is always an opaque link hash. Email / name / any PII never appears in event properties.

### 8. Consent / sync

| Event | S | E | Purpose | Powers |
|-------|---|---|---------|--------|
| `consent_screen_shown` | S1 | E2 | Onboarding consent paragraph shown | onboarding CM, copy A/B |
| `consent_decision_recorded` | S4 | E4 | User acknowledged / declined a disclosure item | audit (never aggregated) |
| `sync_invitation_shown` | S1 | E2 | Post-bonding sync Moment surfaced | bonding predicate tuning |
| `sync_invitation_accepted` | S1 | E2 | Bonding predicate passed + user accepted | bonding tuning |
| `sync_invitation_dismissed` | S1 | E2 | User dismissed the Moment | bonding tuning (false-positive rate) |

The actual sync consent (turning sync on) is recorded as a `consent_decision_recorded` event with `item='sync_future'`, `decision='acknowledged'` — this is the S4/E4 audit record, separate from the S1/E2 product signals above. Same pattern for research-use toggle (`item='aggregate_research'`).

### 9. System

| Event | S | E | Purpose | Powers |
|-------|---|---|---------|--------|
| `error_raised` | S1 | E2 | Caught error surfaced | reliability KPI |
| `performance_mark` | S1 | **E1** | Frame-drop / long-task marker (device-local only) | CTO cost-per-MAU refinement |
| `locale_changed` | S1 | E2 | User changed language | locale cohort integrity |

## TypeScript surface

Types live in `src/types/events.ts`. Every event is a discriminated-union member of `MoguEvent` keyed on `name`. The `EVENT_REGISTRY` constant pins each event's sensitivity and envelope so the schema doc and the runtime agree by construction. The emission helper (future `src/lib/events.ts`) will auto-populate `id`, `occurred_at`, `session_id`, `locale`, `tz`, `device_class`, `sensitivity`, and `regulatory_envelope` — callers only pass event name and payload-specific properties plus optional `asset_id` / `role`.

## Statistical power mapping

| Model | Events consumed |
|-------|-----------------|
| Cox survival (retention) | `session_started`, `chapter_created`, `partner_linked`, `phase_transition_observed`, `chapter_memory_created` |
| LTV integral | Cox output × ARPU(t) (ARPU events from revenue subsystem, out of this schema) |
| Bonding predicate | `session_started` → activity_days; `chapter_memory_created` → memories count + `has_photo` photo count; `phase_transition_observed` → phase_transitions count |
| Thompson sampling (L4 cron, ADR-0010) | `moment_exposed`, `moment_tapped`, `moment_dwelled`, `moment_dismissed`, `moment_resulted_memory` |
| Brier score | `session_started` (actual returns) vs. predicted-return distribution |
| CM feature gate (ADR-0016 candidate) | any event taggable to a feature, aggregated to cohort |

## Consent screen copy (onboarding surface)

Tone: Grammar §3 Voice & Tone (warm, restrained, second person, no exclamation marks). No regulatory jargon. No "data" / "logging" / "analytics" / "collection" / "processing". Avoids Grammar §4.3 (data-distancing) and §4.6 (internal-metaphor UI ban).

### English (master)

> **Before you start.**
>
> MODU keeps what you write on your device. Nothing is sent anywhere by default.
>
> Later, if you want to use MODU on another device or share a chapter with someone who cares for you, you can turn on syncing. We'll ask then, not now.
>
> If you ever want to help improve care for others — completely optional, always de-identified, and you can turn it off at any time — there is a separate switch for that. It is off now.
>
> We will never sell your data. We will never show you ads.

Three in-screen items the user must explicitly acknowledge (emits three `consent_decision_recorded` events):

- **Local default** — "I understand what I write stays on this device unless I turn on syncing."
- **Sync future** — "I understand MODU will ask me later before turning on syncing."
- **Aggregate research (off)** — "I understand the separate research switch is off and I can choose later."

### Korean (ko-KR)

> **시작하기 전에.**
>
> MODU 에 적으신 내용은 이 기기에 보관됩니다. 기본 상태에서는 어디로도 전송되지 않습니다.
>
> 나중에 다른 기기에서 이어서 쓰거나, 곁에 계신 분과 함께 쓰고 싶으실 때 동기화를 켤 수 있어요. 그때 다시 여쭤볼게요.
>
> 혹시 다른 분들의 돌봄이 더 좋아지도록 돕고 싶으시면 — 완전히 선택이고, 항상 비식별 처리되며, 언제든 끄실 수 있어요 — 별도 스위치가 있어요. 지금은 꺼져 있습니다.
>
> 데이터를 팔지 않습니다. 광고를 띄우지 않습니다.

Three in-screen items:

- **기기 보관** — "적은 내용이 이 기기에 남아있다는 것을 이해했어요."
- **나중에 동기화** — "동기화를 켜기 전에 MODU 가 다시 물어본다는 것을 이해했어요."
- **연구 참여는 꺼져 있음** — "연구 참여 스위치가 지금 꺼져 있고, 나중에 선택할 수 있다는 것을 이해했어요."

Other locales (`en-CA`, `fr-CA`, `ja-JP`, `de-DE`, `fr-FR`) derive from the English master per ADR-0014.

## Implementation plan (this change set vs. follow-up)

### This change set

- Schema design doc (this file).
- `src/types/events.ts` — discriminated union + `EVENT_REGISTRY`.
- Commit.

### Follow-up PRs (each its own commit)

1. `src/lib/events.ts` — emission helper with auto-populated base fields, session-id lifecycle, local-first queue.
2. `src/data/repositories/EventRepository.ts` + `LocalEventRepository.ts` — append-only local persistence for S3/S4 events with retention rules.
3. Wire emission into `assetStore.createAsset` / `switchAsset` / `archiveAsset` and `formationStore` completion.
4. Implement the onboarding consent screen in Formation with the three-item acknowledgment → emits `consent_screen_shown` and three `consent_decision_recorded` events.
5. Implement `sync_invitation_shown` / `accepted` / `dismissed` as the row-slot Moment (ADR-0011 Addendum).
6. Export functionality — one-tap export reads the full local event log and bundles with ChapterMemory (satisfies HIPAA §164.524 + GDPR Art. 15 + PIPA §35 + APPI §33 + PIPEDA Principle 9).
7. PostHog opt-in integration — scoped to S1/S2 events only, behind research-use toggle for S3/S4 aggregate analytics.

## References

- ADR-0005 Privacy as Moat · ADR-0011 Local-First + Addendum · ADR-0013 + Addendums A1-A6 · ADR-0014 English-First
- Strategy: `2026-04-17-economic-foundation-and-impact.md` · `2026-04-17-regulatory-welcome-and-b2g.md`
- Grammar: §3 Voice & Tone · §4.3, §4.6 (anti-lexicon) · §11 (external register)
- Regulator references: HIPAA 45 CFR §164.508, §164.520, §164.524, §164.528 · GDPR Art. 9, 13, 15, 30 · PIPEDA Principles 2, 3, 9 · APPI §17, §21, §33 · Quebec Bill 25 §8, §12

## 요약 (ko)

Phase 1 이벤트 스키마 — **regulation-first** 로 설계. 9 카테고리 약 35 events. 각 event 는 (1) 사용자 UX 목적 · (2) 통계 모델 구동 · (3) 5 개 대상국 regulatory envelope (E1-E4) · (4) 민감도 등급 (S1-S4) · (5) 온보딩 consent 커버 여부 명시. 가장 엄격한 GDPR Art. 9 + Quebec Bill 25 기준으로 설계하여 모든 대상국 통과. 통계 foundation (Cox 생존 · LTV 적분 · bonding predicate · Thompson sampling · Brier score) 의 연료 수급은 이 스키마에서 완결. 온보딩 consent 화면 plain-language 영문/국문 copy 포함, 3-아이템 명시 acknowledgment (`consent_decision_recorded`). TypeScript 타입은 `src/types/events.ts`. 실제 emission wiring · 저장소 구현 · PostHog 연동은 별도 follow-up PR 7 개로 분할.
