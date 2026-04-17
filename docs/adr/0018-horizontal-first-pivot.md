# ADR-0018: Horizontal-First Pivot — MODU as Metamorphic Life-Asset Platform

- Status: **Accepted**
- Date: 2026-04-17
- Supersedes: [ADR-0004 Vertical-First Launch](./0004-vertical-first-launch.md)
- Related: [Design doc — Asset-Spawner-First Horizontal Platform](../planning/2026-04-17-horizontal-pivot-asset-spawner-design.md) · ADR-0011 · ADR-0013 · ADR-0014 · candidate ADR-0015

---

## Context

ADR-0004 positioned MODU as a fertility-only vertical for v1 (KR), with all other asset types (cancer_caregiver, pet_care, chronic) blocked at the product entry point and staged for v2/v3. The rationale was PMF velocity, compliance simplification, and marketing clarity.

The 2026-04-17 /office-hours session (Phase 4.5 founder signals) produced a strategic shift backed by the following reasoning:

1. **AI cost-collapse thesis (P2)**: LLM-driven asset configuration + adaptive UI presets + TPO routing make metamorphic UX startup-affordable for the first time. A single codebase can cover unlimited verticals. This eliminates the primary risk that drove ADR-0004's wedge strategy — per-vertical hand-build cost.

2. **Wedge-then-pivot learning cost (founder verbatim)**: *"VC 입장에서야 wedge 하게 가고 싶겠죠. 빠른 성과 내고 근데 결국에는 다들 피봇하고 스케일업 한다 신규 PMF 찾는다. 시간 낭비에요."* The founder's position: the wedge→pivot→scale learning cost is absorbed at architecture level from day 1, because the platform thesis holds.

3. **Build velocity as the binding constraint (founder verbatim)**: *"결국 이걸 얼마나 빨리 만들어낼거냐 그게 중요한거에요."* The real product is the internal asset-authoring pipeline. App is the demo. If a new asset ships in < 1 hour, the thesis is alive. This metric (`asset_authoring_time_internal`) is the P2 falsification instrument.

4. **Sunk cost efficiency**: 66 existing fertility files become the warm-start seed — a baked example asset. The asset-spawner serves new users' chapters directly from day 1.

5. **Horizontality falsification signal**: 2nd-asset-creation rate ≥ 15% at D7-D14 is the single measurable signal for whether users engage with MODU as a horizontal platform. < 5% → P1 re-examination.

An independent cross-model spec review (cold-read, context-blind) was conducted. Its steelman: *"the wedge is not a vertical — it is the engine itself."* Context accumulation creates non-linear exit cost. The reviewer challenged P4 (compound context moat) with Notion/Evernote/Day One/Roam churn data. Founder defended with AI-native vs prior-era epistemological separation. P4 retained; instrumented for 3-month measured verdict.

This ADR records that decision as binding across sessions.

---

## Decision

**MODU is a horizontal metamorphic life-asset platform from v1.** ADR-0004 is retired.

### Five locked premises (P1-P5)

- **P1 — Positioning**: MODU positions as horizontal metamorphic life-asset platform from v1. Single-vertical product framing is abandoned. Fertility is one warm-start seed among peer asset types (study, work, fitness, petcare, caregiving, hobby, other).
- **P2 — AI thesis**: LLM cost-collapse makes metamorphic UX startup-affordable. Binding constraint = build velocity + meta-context routing quality, NOT architecture risk. Falsification instrument = `asset_authoring_time_internal` < 1 hour.
- **P3 — Demand-before-build refused**: No pre-ship user interviews. Ship → discover. Conscious risk accepted by founder. The Assignment (5-person KakaoTalk network, active-chapter holders) generates the TestFlight invite list, not customer development.
- **P4 — Long-term moat**: Compound user-input + TPO accumulation + metamorphic adaptation → non-linear per-user value growth over time. B2G + two-sided market + contribution margin economics rest on this. Instrumented for measured truth: month-3 memory-retrieval-rate (> 25% → P4 confirmed; < 8% → P4 re-examination).
- **P5 — Operating order preserved, restructured**: "regulation → data mechanism → UX" order unchanged. Restructured as per-asset compliance matrix (E1-E4) applied at asset-creation time rather than at v1/v2/v3 categorical rollout.

### Per-asset compliance matrix (P5)

Asset creation auto-maps to one of four regulatory envelopes (LLM first-pass, server-side validator sanity-check, user confirmation on mismatch):

| Envelope | Meaning | Consent model | Example assets |
|----------|---------|---------------|----------------|
| **E1** | General lifestyle / productivity data | Standard ToS | Work project, fitness, certification, hobby |
| **E2** | Minor / education data | Parental consent for < 14; simplified for ≥ 14 | Student study, university entrance, youth activity |
| **E3** | Family / relationship data (includes data about other people) | Explicit "third-party data entry" notice; shareable scope explicit | Child care, elder care, wedding preparation |
| **E4** | Health / sensitive (GDPR Art.9-class) | Separate granular opt-in per data class (medication / cycle / symptom / mental); stricter delete + portable export | Fertility (IVF/IUI), oncology caregiving, chronic illness, mental health |

Each asset record carries: `envelope`, `consent_version_id`, `data_classes[]`, `retention_policy_id`, `export_eligibility`.

### Signal axes

The adaptive engine operates on four signal axes, priority-enforced:

- **TPO** — Time / Place / Occasion (L1 observed context)
- **Role** — `self` / `partner` / `caregiver` (same chapter × different role → different Moment set)
- **Phase** — `before` / `during` / `after` within an asset's lifecycle arc
- **Preference** — L2 AI-inferred from accumulated ChapterMemory + interaction patterns

Signal priority: L0 (user declaration) > L1 (observed: TPO · Role · Phase) > L2 (AI inference). Never reversed.

### Recommended approach: Asset-Spawner-First (Approach A, ALL-IN)

- **Approach A (chosen)**: conversational onboarding → LLM spawns asset schema (TPO + widgets + nudge) → fertility baked as one seed, new assets 1st-class from day 1. Multi-asset from v1.
- Approach B (multi-asset showcase + spawner): rejected — 14-20 day build; confounds the spawner A/B with seed polish differential.
- Approach C (pipeline-first, no release): rejected — market signals delayed. Pipeline validation is a natural byproduct of Approach A's first N spawns.

### Reviewer Concerns acknowledged (founder explicit acceptance)

- **RC1**: 14-day ALL-IN sprint mathematically tight. Day 14 = "TestFlight possible" not "100% complete". Mitigation: day-by-day sequencing in design doc; lock-screen widget (RC5) and L2/L4 cache (RC4) are OTA, not Day 14 binary.
- **RC2**: LLM → preset render quality prompt-iteration cost unbudgeted. 30-seed eval harness in Sprint 1 mitigates first-impression risk.
- **RC3**: Vector DB government policy corpus is a standalone data-sourcing project. v1 scope: fertility / study (수능·학자금) / childcare (육아) — ~50-200 records per vertical. Remaining verticals ship with "정보 준비 중" placeholder. P축 T+O remain fully active.
- **RC4**: ADR-0010 4-layer cache from-scratch in 14 days is infeasible. v1 ships L1 (device) + L3 (edge); L2 (hint) + L4 (cron) are OTA. Interface designed 4-layer compatible.
- **RC5**: iOS WidgetKit / Android AppWidget cannot OTA — require store review. v1 binary ships minimal widget (one nudge). Multi-asset rich widget = v1.1 binary.
- **RC6**: STT KR accuracy threshold TBD; `consent_version_id` / `retention_policy_id` schema to Sprint 1 spec; per-asset monthly cost ceiling to Sprint 4 instrumentation; KR legal review split into 2 touches (Day 8-10 envelope draft + Day 11-12 consent UX).

---

## Consequences

### Positive

- **PMF signal breadth**: 5+ verticals seeded simultaneously at TestFlight → learn which chapter type generates first traction. Fertility single-channel constraint removed.
- **Architecture coherence**: Platform thesis aligns code, data model, and marketing from day 1. No v2 pivot tax: schema, compliance matrix, and asset-spawner are designed horizontal from the start.
- **Moat accumulation starts immediately**: Every asset a user spawns deepens ChapterMemory context. Multi-asset users compound faster. The 2nd-asset-creation rate (≥15% target) is a leading indicator measurable at Day 14-28.
- **Hidden B2G foundation**: Multi-vertical asset graph (with consent) is a richer institutional dataset than single-vertical. B2G paths remain hidden surface — never user-facing.

### Negative / risks

- **Spawner quality risk**: LLM asset generation quality determines first impression across all verticals simultaneously. 30-seed eval harness + server validator + "rebuild this asset" escape hatch mitigate.
- **Compliance matrix complexity**: E1-E4 must be correctly auto-mapped at spawn time. Mismatch → regulatory exposure. Sprint 1 envelope validator + Day 8-12 KR legal review mitigate.
- **Marketing messaging diffusion**: "삶의 모든 챕터" is harder to acquire on than "IVF 동반자". Mitigated by vertical-warm-seed distribution (5 KakaoTalk/Naver/Daangn channel posts, each in vertical language) — fertility users still see fertility copy; study users see study copy.
- **P3 conscious risk retained**: No pre-ship demand validation. If 2nd-asset-creation < 5% at Day 28, P1 re-examination triggered. Founder acknowledged.

### Binding constraints that survive the pivot

- Non-SaMD posture: no diagnostic claims, no treatment recommendations, no clinical alerting (candidate ADR-0015).
- Operating sequence: regulation → data mechanism → UX. Never reversed.
- Hidden B2G: institutional and aggregate paths never leak into user-facing copy, event names, or debug strings.
- Contribution margin as the single KPI operating language.
- Statistical standards: Cox survival · LTV integral · Thompson sampling · Brier score · 2-cohort replication.

---

## Success criteria (from design doc)

| Window | Signal | Bar |
|--------|--------|-----|
| Day 14-21 (internal testing) | `asset_spawn_time_user` | < 2 min median |
| Day 14-21 | `asset_authoring_time_internal` | < 1 hour (P2 falsifier) |
| Day 14-28 | D7 retention | ≥ 30% |
| Day 14-28 | 2nd-asset-creation rate | ≥ 15% (P1 falsifier; < 5% → P1 re-examine) |
| Day 14-28 | NPS | ≥ 30 (in-app opt-in) |
| Day 14-104 | MAU | 1K |
| Day 14-104 | W4 retention | ≥ 14% |
| Day 14-104 | avg assets per user | ≥ 1.5 |
| Month 3 | memory-retrieval-rate (> 30d-old reads) | > 25% → P4 confirmed; < 8% → P4 re-examine |

---

## Sprint 1 deliverables (Day 1-3)

1. This ADR (0018) + ADR-0004 supersede notice.
2. `CLAUDE.md` §"v1 출시 스코프" + §"v1 카테고리 단속" rewrite to horizontal framing.
3. `docs/grammar/modu-product-grammar.md` + `.ko.md` — fertility-specific examples removed; signal-axes horizontal framing.
4. `docs/data/2026-04-17-phase-1-event-schema.md` — `cycle_*` / `embryo_*` events annotated as fertility-asset-specific.
5. Supabase project setup (Seoul) + R2 bucket + Edge Function scaffold.

---

## References

- [Design doc — Asset-Spawner-First Horizontal Platform](../planning/2026-04-17-horizontal-pivot-asset-spawner-design.md) — approved 2026-04-17, quality 7/10, Reviewer Concerns RC1-RC6 acknowledged.
- [ADR-0004 Vertical-First Launch](./0004-vertical-first-launch.md) — superseded by this ADR.
- ADR-0011 Local-First Persistence · ADR-0013 Adaptive-by-Default · ADR-0014 English-First
- `docs/data/2026-04-17-phase-1-event-schema.md` — E1-E4 envelope definitions (authoritative)
- `docs/strategy/2026-04-17-economic-foundation-and-impact.md` — B2G, hidden surface, contribution margin
- `docs/strategy/2026-04-17-regulatory-welcome-and-b2g.md` — per-country regulatory posture
