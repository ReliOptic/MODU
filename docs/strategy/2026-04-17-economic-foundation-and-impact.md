# Economic Foundation & Impact Thesis — MODU as an Appreciating User-Owned Asset

- Date: 2026-04-17
- Status: Strategy (live document). Promote individual sections to ADRs as binding gates emerge.
- Related: ADR-0004 · ADR-0005 · ADR-0011 · ADR-0013 · ADR-0014
- Companion strategy docs: `2026-04-17-w1-retention-and-scale-vision.md` · `2026-04-17-revenue-unit-economics.md` · `2026-04-17-caregiver-agora-and-micro-sessions.md` · `2026-04-17-regulatory-welcome-and-b2g.md`

## Thesis

MODU is not "a health app." It is an **appreciating, user-owned asset** whose value to the user compounds with time, and whose externalized value to society compounds as invisible labor and long medical trajectories become witnessed. Every decision — feature, team KPI, country entry, policy partnership — must either increase the asset's value to the user or increase its externalized social value, **measurably**. "Tenacity and luck" are replaced by **statistical efficiency grounded in cost accounting**.

## The three real-world failures and their societal analogues

Each individual failure that MODU resolves has a societal analogue that a national ministry of health already counts as a political pain. The B2G pitch surface is exactly the right-hand columns of this table.

| Individual failure | Societal issue | Policy lever | Aggregate metric MODU can surface (consent-gated, de-identified, purpose-limited) |
|--------------------|----------------|--------------|------------------------------------------------------------------------------------|
| Medical amnesia | Chronic-disease productivity loss; poor adherence across long trajectories | Primary-care redesign, EHDS-style secondary use of PGHD | Regional adherence curves, phase-transition distributions |
| Caregiver invisibility | Unpaid care labor (~USD 600B in US, ~EUR 400B in EU); caregiver burnout | Caregiver tax credits, paid family leave, respite-care infrastructure | Hours of caregiving per dyad per week; caregiver sleep/mood proxies |
| Clinical-memory gap | Information asymmetry driving overtreatment and re-diagnosis | Digital-health integration into primary care | Re-diagnosis-rate reduction, pre-visit-summary acceptance rate |

Every politician reading the right-hand columns identifies a problem their constituents complain about. That is the B2G first paragraph.

## Contribution margin as the operating language

We adopt **contribution margin (CM)** as the single unit of accounting for every function.

- **User-level CM** = `ARPU(user) − variable cost per user` (AI inference + storage + sync + support).
- **Feature-level CM** = `revenue uplift − variable operating cost` for the feature.
- **Cohort-level CM** = CM of a specific segment (category, country, acquisition channel, partner-linked vs solo).
- **Channel-level CM** = CM net of CAC by acquisition channel.

**Operating rule**: every team owns exactly one primary KPI that is a **causal driver of CM**. No team owns a vanity metric. No KPI exists outside the CM chain. When the causal chain cannot be drawn from the KPI to CM, the KPI is rejected.

## Team KPI alignment matrix (statistical causal chain to CM)

| Team / function | Primary KPI | CM lever | Cadence |
|-----------------|-------------|----------|---------|
| Product (CPO) | W4 retention · phase transitions per chapter | Numerator of `LTV = ∫ ARPU(t)·S(t) dt` | Weekly |
| Engineering (CTO) | Cost per MAU (AI tokens, storage, sync, bandwidth) | Variable cost denominator | Weekly |
| Design (CDO) | Onboarding completion · Moment tap-through · non-SaMD boundary adherence in copy | Activation gate upstream of CM; permanent-constraint preservation | Weekly |
| Growth | CAC payback period · partner-link attach rate per new chapter | CM net of acquisition; network-effect seed | Weekly |
| Data / Research | Retention-model calibration (Brier score) · bandit regret at L4 | Decision quality across every CM lever | Bi-weekly |
| Regulatory / Legal | Zero wasted regulatory cost · DiGA/PECAN cycle-time · non-SaMD review hit rate | Unlocks B2G and reimbursement CM | Monthly |
| Business development | B2G pipeline value · sponsorship dollar commitment · grant application hit rate | Non-consumer CM expansion | Monthly |
| Clinical / medical advisory | Non-SaMD boundary adherence · advisor-satisfaction review | Permanent-constraint enforcement | Quarterly |

Each KPI is (1) measurable in number, (2) causally linked to CM via a chain we can write in one sentence, (3) influenceable by the owning team, (4) updated at the stated cadence.

## Statistical foundation (replaces "tenacity and luck")

- **Retention = survival function `S(t)`** with covariates `(chapter_count, partner_linked, phase_transitions, role_distribution)`. Fit via Cox regression. Only monotone drivers justify downstream feature decisions.
- **LTV = `∫ ARPU(t) · S(t) dt`** per cohort. Revenue-unit-economics doc names the ARPU levers; this is the integral.
- **Moment variant selection = Thompson sampling** at the L4 cron layer (ADR-0010). Hand-tuned Moment weights are prohibited past Phase 1 stabilization.
- **Bonding predicate threshold** = the point at which monthly hazard drops below an empirically fit `X%`. The `7d / 5 ChapterMemory / 1 photo / 1 phase-transition` placeholder in ADR-0011 is exactly that — a placeholder.
- **Brier score** and **log loss** govern retention-model updates. A model that does not beat the prior-cohort baseline is not deployed.
- **Replication requirement**: every major KPI change requires a second-cohort replication before it drives a feature decision.
- **Bayesian priors from prior cohorts** carry forward; the model does not restart per feature launch.

## Policy narrative per country (the B2G surface)

Each country's ministry of health has a specific political pain that MODU's aggregate (always consent-gated, always de-identified, always purpose-limited) can ease.

| Country | Political pain | What MODU aggregate surfaces | Likely partner body |
|---------|----------------|------------------------------|---------------------|
| US | Rising chronic-disease cost; caregiver crisis (RAISE Family Caregivers Act follow-through) | Caregiver hours per household; phase-transition patterns by region | CMS Innovation Center · ARPA-H · HHS ASPE |
| Canada | Aging population; bilingual care equity; provincial fragmentation | Provincial access gaps; caregiver burnout indicators | Canada Health Infoway · CIHR |
| Japan | Aging demographic; 介護者不足 (caregiver shortage) | Actual unpaid-care labor hours; caregiver-to-patient ratios | MHLW · AMED · 厚生労働省 long-term care bureau |
| Germany | DiGA reimbursement effectiveness; aging Mittelstand caregivers | DiGA-class adherence signals; caregiver burden distributions | BfArM · G-BA · KBV · Stiftung Zentrum für Qualität in der Pflege |
| France | Mon Espace Santé uptake; caregiver recognition ("proches aidants") | PECAN adherence; caregiver activity patterns in ENS | ANS · HAS · DGOS |
| UK (P3) | Unpaid carers bill enforcement; NHS primary-care pressure | Caregiver burnout indicators; primary-care handoff quality | NHSX · HDR UK · Carers UK partnership |

Each row is one sentence we can put in the first paragraph of a B2G RFP response or institutional-grant cover letter.

## World-making frame — why this matters

- **Per user**: a coherent medical autobiography. The user stops re-learning their own journey at every new provider, at every new phase.
- **Per dyad**: witnessed caregiving. The invisible labor of partners and family becomes visible to them, to clinicians, and to the system that funds them.
- **Per clinician**: higher-signal encounters. Fewer re-diagnoses, better shared decision-making, less wasted 15-minute visit time.
- **Per health system**: lower avoidable utilization; population-level signals that inform system-level decisions instead of being invented in spreadsheets.
- **Per society**: what was previously invisible — unpaid caregiving, long-disease trajectories, the cumulative effects of information asymmetry — becomes visible. Policy can respond only to what it can see.

This is the **public-good argument** for institutional sponsorship, B2G licensing, and the open-source posture articulated in the regulatory-welcome strategy doc. MODU is infrastructure for a more humane health ecosystem — not a consumer app wearing that costume.

## Immediate operationalization

1. Adopt CM as the primary operating language in the next C-level review. Publish the team-KPI matrix in the company handbook with owners named and cadence set.
2. Build the survival model against the simulated cohort from mock data first; iterate once real-cohort data accrues. Record model versions with their Brier scores; never regress silently.
3. Write one B2G one-pager per target country using the policy-narrative table's right columns. External register only (Grammar §11, regulatory-welcome doc).
4. Codify **CM-per-Moment** as the gate for Phase 2 Moment library expansion. No Moment enters the 20-core library unless its projected CM is positive with an explicit causal chain to retention, activation, or non-consumer revenue.
5. Publish a public Non-SaMD Statement in the README (see regulatory-welcome doc). Welcome-by-design cost = zero; retrofit cost = high.

## Candidate ADRs (to author when binding gates emerge)

- **ADR-0015 — Non-SaMD Posture as Permanent Product Constraint** (regulatory-welcome doc).
- **ADR-0016 — Contribution Margin Gate for Feature & Moment Shipment.** Binding: no feature ships to > 5% of MAU without a projected CM chain; no Moment enters the 20-core without CM projection.
- **ADR-0017 — Statistical Operating Standards.** Binding: Cox retention modeling, Thompson sampling for Moment variants, Brier-score floor for model deployment, replication requirement for KPI changes.

## References

- ADR-0004 Vertical-First Launch · ADR-0005 Privacy as Moat · ADR-0011 Local-First · ADR-0013 Adaptive-by-Default · ADR-0014 English-First
- `docs/strategy/2026-04-17-w1-retention-and-scale-vision.md` (retention as north-star metric)
- `docs/strategy/2026-04-17-revenue-unit-economics.md` (consumer ARPU levers)
- `docs/strategy/2026-04-17-caregiver-agora-and-micro-sessions.md` (network-effect seed)
- `docs/strategy/2026-04-17-regulatory-welcome-and-b2g.md` (external register, country paths, business-model surface)
- `docs/grammar/modu-product-grammar.md` §11 (external register quick-ref)

## 요약 (ko)

MODU = 사용자가 소유하며 시간이 갈수록 가치가 증가하는 자산. 모든 결정 (기능 · 팀 KPI · 국가 진입 · 정책 파트너십) 은 사용자 가치 또는 사회적 가치 증가에 **측정 가능하게** 기여해야 함.

**3 개인 실패 → 3 사회 이슈 → 정책 레버 → B2G 집계지표** 매핑 (§두 번째 표). 각국 장관의 정치적 통증 (caregiver 부족 · 만성질환 비용 · DiGA 효과성 등) 을 MODU 집계가 완화 가능 — B2G 내러티브 구성.

**Contribution margin (CM) 을 전 팀 KPI 의 단일 회계 언어로 채택.** 모든 팀 KPI 는 CM 의 인과 고리 안에 있어야 하며, 그 고리를 한 문장으로 쓸 수 있어야 함. vanity metric 금지.

통계 기반 운영 — Cox 생존 모델 · LTV = ∫ ARPU(t)·S(t) dt · Thompson sampling (L4) · Brier-score 기반 모델 배포 · 2-cohort 재현 의무. **의지 + 운** 을 **통계적 효율 + 관리회계** 로 대체.

최종 프레임: MODU 는 소비자 앱이 아니라 **더 인간적인 의료 생태계를 위한 공공 인프라**. 기관 스폰서십 · B2G 라이선스 · OSS 포지션 모두 이 public-good 논거 위에서만 지속 가능.

예정 바인딩 ADR: ADR-0015 Non-SaMD · ADR-0016 CM-per-feature gate · ADR-0017 Statistical operating standards.
