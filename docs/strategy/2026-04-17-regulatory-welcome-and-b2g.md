# Regulatory Welcome & B2G Strategy — Built to Be Welcomed

- Date: 2026-04-17
- Status: Strategy (live document). Promote to ADR-0015 when binding gates emerge.
- Related: ADR-0004 (Vertical-First) · ADR-0005 (Privacy as Moat) · ADR-0011 (Local-First) · ADR-0013 (Adaptive-by-Default) · ADR-0014 (English-First)
- Companion: `docs/strategy/2026-04-17-revenue-unit-economics.md` (consumer model) · `docs/grammar/modu-product-grammar.md` §11 (external register)

## Thesis

A product that is **welcomed** by regulators crosses regulatory thresholds at near-zero wasted cost. Welcome is cheap when designed in; compliance becomes a moat. Friction is expensive when retrofitted; it becomes liability. MODU targets welcome in every Phase 1/2 country and in every institutional funding body that funds digital health infrastructure.

**Corollary**: a business model that compounds on welcome (B2G license, DiGA-style reimbursement, OSS sponsorship) is *only* accessible to a product whose external register matches regulator vocabulary.

## Dual register

The product has one internal language (Grammar §1-10) and one external language (§11 + this doc).

- **Internal**: Chapter / Memory / Library / Moments / quiet-weave / Agora — for team, code, ADRs, commits.
- **External**: Patient-generated health data (PGHD) / Personal health record (PHR) / non-SaMD / patient-delegated caregiver access / shared care coordination — for regulators, grant applications, B2G RFPs, investor docs aimed at institutional LPs.

External register is drawn from vocabulary already in use by ONC, FDA, EMA, BfArM, PMDA, MHLW, CNIL, Canada Health Infoway, NHS, Wellcome, NIH. It is the register those readers are already indexing on.

### Translation table

| MODU internal | External equivalent |
|---------------|---------------------|
| Chapter (Asset) | Longitudinal care episode |
| ChapterMemory | Patient-generated health data (PGHD) entry |
| Library | Patient-owned longitudinal personal health record (PHR) |
| Companion | Non-SaMD patient-facing digital health tool |
| Moments | Adaptive UI surface (non-clinical) |
| Agora | Patient-delegated shared-care coordination |
| quiet-weave | Family-context-aware journal surface |
| Role = partner / caregiver | Patient-delegated caregiver access (revocable, audited) |
| Privacy as Moat | Data minimization by design (GDPR Art. 5(1)(c), HIPAA-aligned) |
| Post-bonding sync invitation | Cross-device provisioning with explicit consent |
| Formation | Patient-reported intake |
| AmbientPalette | Contextual UI theming (non-clinical) |

External-audience documents (grants, DiGA applications, NHS onboarding packs, institutional investor decks) use the right column only.

## Country × regulatory × sponsorship

Phase 1 and 2 target countries, mapped to the right regulatory pathway and the right sponsorship / reimbursement vehicle.

| Country | Regulatory frame | Sponsorship / reimbursement path | Positioning |
|---------|-----------------|----------------------------------|-------------|
| US | HIPAA-adjacent (non-covered entity unless BAA'd), ONC HTI-1 interoperability, 21st Century Cures Act right of access | NIH Bridge2AI, ARPA-H, CMS Medicare innovation, Mozilla MIECO | Patient-owned longitudinal PHR, no SaMD |
| Canada | PIPEDA, provincial (PHIPA/HIA), Canada Health Infoway alignment | CIHR, Canada Health Infoway co-development, provincial digital health grants | Family health journal with bilingual EN/FR-CA parity |
| Japan | APPI, PMDA SaMD boundary, MHLW guidance | AMED, MHLW digital health pilots, industry consortia (J-OCTA) | Caregiver-first PHR (aging population dividend) |
| Germany | GDPR, **BfArM DiGA pathway**, Social Code Book V (SGB V) §33a | DiGA prescription reimbursement (statutory health insurance) | DiGA-aligned caregiver coordination from day 1 |
| France | GDPR, CNIL, Mon Espace Santé (ENS), **PECAN pathway** | PECAN reimbursement, Bpifrance digital health grants | PHR integrable with ENS via patient consent |
| UK (P3 watch) | UK GDPR, NHS App / Digital Technology Assessment Criteria (DTAC), MHRA | NHSX, Wellcome Data for Science, UKRI / HDR UK | Shared-care coordination within NHS framework |

**Principle**: each country's regulatory path defines a binary gate (welcomed / not welcomed). MODU must pass each gate without modifying the product — only the packaging.

## Design-for-welcome principles

Five constraints that eliminate wasted compliance cost by making MODU welcomed at the architectural level.

1. **Stay non-SaMD.** No diagnostic claims, no treatment recommendations, no clinical alerting, no automated medical decision support. MODU surfaces memory and context; clinicians interpret. This is a **permanent** product constraint — candidate ADR-0015 ("Non-SaMD Posture").
2. **Patient right of access by architecture.** One-tap export (ADR-0005) satisfies HIPAA §164.524 + GDPR Art. 15 + PIPA §35 + APPI §33 + PIPEDA Principle 9 simultaneously. Built once, compliant everywhere.
3. **Caregiver = patient-delegated, revocable.** `Role = partner / caregiver` requires explicit patient consent with an immutable audit trail on every role change. Maps cleanly to CMS caregiver frameworks, NHS carers guidance, MHLW 介護者 support policy.
4. **Data minimization by default.** Local-first (ADR-0011) is the implementation of GDPR Art. 5(1)(c) and EHDS data-minimization expectations. Post-bonding sync opt-in is the consent mechanism.
5. **No ad SDK, no data sale — permanent.** Codified in ADR-0005. Auditable at source (PR template checkbox). Every regulator welcomes a product that cannot monetize against its users.

## Business-model surface

Welcome unlocks five revenue streams beyond the consumer Free/Plus/Family tiers.

| Stream | Audience | Mechanism |
|--------|----------|-----------|
| Consumer (existing) | Individuals | Free / Plus / Family (see revenue-unit-economics doc) |
| DiGA / PECAN reimbursement | Prescribing clinicians in DE / FR | Per-prescription payment by statutory payer; user pays nothing |
| B2G license | National / provincial health systems (NHS, MHLW, CMS, Canada Health Infoway, Mon Espace Santé) | Annual per-covered-life license, typically multi-year |
| Institutional sponsorship | NIH, ARPA-H, Wellcome, AMED, Mozilla, Linux Foundation Public Health, NLNet | Grants to maintain open-source core; non-dilutive |
| Research access (consent-gated) | RWE / PRO / clinical-trial consortia | User opt-in on a per-study basis; revenue share back to user is under consideration |

## Open-source posture (for sponsorship + moat preservation)

Open-source components invite institutional sponsorship and create a credibility signal regulators reward. Keeping user-data components closed preserves the business moat.

- **Open** (Apache-2.0 proposed): Moment engine core · Layout engine · Signal-axes composition · i18n framework · Storage abstractions · Grammar tooling (lint, PR template)
- **Closed**: User-data schemas beyond the Syncable base · Private inference hints (L2) · Cloud sync provisioning · Role-delegation audit service
- **Dual-license considered**: Moment library (core Apache-2.0 + curated extensions under commercial license) — revisit when library reaches ~20 Moments

Grant eligibility mapping: NIH Bridge2AI (open infra for health data) · Wellcome Data for Science (open health data tools) · Mozilla MIECO (internet-public-good infra) · NLNet NGI (EU public-good tech) · Linux Foundation Public Health (open platform).

## Immediate actions (Phase 1 cost ≈ 0, value compounding)

- Publish a **Non-SaMD Statement** in the public README: "MODU is a patient-facing journaling and care-coordination tool. It does not diagnose, treat, or recommend clinical actions."
- Annotate one-tap export as satisfying HIPAA §164.524 + GDPR Art. 15 + PIPA §35 + APPI §33 + PIPEDA Principle 9 in docs/privacy/.
- Start DiGA pre-consultation engagement (`BfArM Leitfaden`) at month 4 of Phase 2 entry planning, not at product-ready.
- Commit to revocable caregiver access with audit trail from the first `Role = partner` commit (not retrofit).
- Adopt Apache-2.0 as the open-source component license when the first OSS component ships.

## Phase 2+ actions

- Draft DiGA application ~6 months before DE launch (12-month review cycle typical).
- Engage PECAN pathway via Haute Autorité de Santé (HAS) parallel to DiGA.
- File for NIH Bridge2AI / Wellcome Data for Science once a peer-reviewable outcome (e.g., Kaplan-Meier retention on a clinical cohort) exists.
- Publish one academic paper per sponsorship cycle — trust currency.

## Candidate ADR

- **ADR-0015 — Non-SaMD Posture as Permanent Product Constraint.** Promote when the first feature-rejection decision is needed. Binding: no feature that creates SaMD classification risk ships. Scope: diagnosis, treatment recommendation, clinical alerting, automated medical decision support.

## References

- ADR-0004 Vertical-First Launch · ADR-0005 Privacy as Moat · ADR-0011 Local-First · ADR-0013 Adaptive-by-Default · ADR-0014 English-First
- `docs/grammar/modu-product-grammar.md` §11 (external register quick-ref)
- `docs/strategy/2026-04-17-revenue-unit-economics.md` (consumer unit economics)
- Regulatory references: ONC HTI-1 · 21st Century Cures Act · HIPAA 45 CFR §164 · GDPR · MDR · EHDS · BfArM DiGA Leitfaden · CNIL · PMDA · MHLW · APPI · PIPEDA · PHIPA · PIPA

## 요약 (ko)

MODU 는 각 목표국 (US · CA · JP · DE · FR) 의 regulator / grant body / B2G buyer 가 **즉시 환영할 수 있게** 설계된다. 환영받으면 규제 통과 비용이 0 에 수렴; retrofit 하면 liability 가 된다. 이를 위해 **내부 register (Chapter·Memory·Library·Moments)** 와 **외부 register (PHR·PGHD·non-SaMD·patient-delegated caregiver access·shared care coordination)** 를 명시 분리. 외부 audience 문서는 전부 외부 register 로만 작성.

핵심 permanent 제약: **non-SaMD posture** (진단 · 치료 추천 · 임상 alerting 금지) — 후보 ADR-0015. Business model 확장: DiGA / PECAN reimbursement (DE/FR), B2G license (NHS·MHLW·CMS·Canada Health Infoway), 기관 스폰서십 (NIH·Wellcome·AMED·Mozilla·LF Public Health), consent-gated research access. OSS 포지션: Moment engine core + infra 는 Apache-2.0 오픈, 사용자 데이터 스키마 이상은 closed — moat 보존 + grant 수여 자격 동시.
