# ADR-0014: English-First Product & Global-Native Localization

- Status: **Proposed**
- Date: 2026-04-17
- Related: ADR-0004 (Vertical-First Launch) [Superseded by ADR-0018] · ADR-0013 (Adaptive-by-Default) · ADR-0011 (Local-First Persistence) · ADR-0005 (Privacy as Moat) · ADR-0018 (Horizontal-First Pivot)

## Context

Korean version quality is already strong. Globalization is no longer a "v3 only" concern — if the English build ships as a translation of a Korean-authored product, it will feel foreign and the Adaptive-by-Default claim (ADR-0013) collapses at the first non-KR user.

Prioritized target countries were narrowed through today's session: **US, Canada, Japan, Germany, France** — cultures that value planning but recoil from complexity. This is MODU's natural product-market fit.

Current risk: docs, lexicon, and UX copy are Korean-authored. Any translation pass will preserve Korean sentence cadence, idiom, and metaphors that don't carry over.

## Decision

**English is the master language of MODU.** Korean is one locale among several.

### Authoring Rules (apply to *new* work; existing KR assets migrate opportunistically)

1. **Code**: all identifiers, comments, log messages, commit messages in English.
2. **Docs** (ADRs, strategy, planning, memos, new Grammar additions): English. An optional Korean summary block (`## 요약 (ko)`) may be appended when the intended reader is KR-only leadership.
3. **User-facing copy**: English master, authored in **ICU MessageFormat**. All other locales (ko, ja, de, fr, fr-CA, en-CA) derive from the English source. No Korean-first strings.
4. **Grammar metaphors**: English is the primary lexicon — `Chapter`, `Memory`, `Library`, `River`, `Companion`, `Light`, `Moments`. Korean 챕터/기억/라이브러리/강/동반자/빛/순간 become locale translations, not originals. Internal-only metaphors (`Agora`, `quiet-weave`) stay English.
5. **Existing Korean docs**: no forced rewrite. Leave in place; reference by link; translate when touched for substantive update.

### Target Locales (Phase 1 & 2)

| Locale | Phase | Compliance | Cultural notes for copy/role semantics |
|--------|-------|-----------|----------------------------------------|
| `en-US` | **P1** | HIPAA-adjacent (PHI handling even without provider status) | planning-heavy, self-tracking normalized, partner ≠ family-at-large |
| `ko-KR` | **P1** | PIPA (`ap-northeast-2` residency) | market already proven; existing app remains the reference quality bar |
| `en-CA` | P2 | PIPEDA | bilingual environment — fallback to `fr-CA` common |
| `fr-CA` | P2 | PIPEDA + Quebec Bill 25 | Quebec cultural distinctness; partner framing differs from fr-FR |
| `ja-JP` | P2 | APPI | aging population → caregiver role strong; 敬語 nuance parallels KR |
| `de-DE` | P2 | GDPR strict | Ordnung — planning culture premium; skepticism toward cloud |
| `fr-FR` | P2 | GDPR + CNIL strict | family structure less nuclear than US; partner incl. long-term unmarried |

Post-P2 consideration: `zh-Hans`, `zh-Hant`, `es-ES`, `pt-BR`, `it-IT`. Phase 3 also adds RTL (`ar`, `he`).

### Localization Axes (per locale, day 1)

- **Strings** — ICU MessageFormat files under `src/i18n/{locale}/`
- **Date/time** — `Intl.DateTimeFormat` + `Intl.RelativeTimeFormat`; no hardcoded "today", "tomorrow morning"
- **Role cultural copy** — `partner` / `caregiver` semantics vary; copy overrides live per-locale
- **Medical terminology** — regional ontology file (`src/medical/{locale}.ts`)
- **Data residency** — `CloudRepository` routing table (`ap-northeast-2` / `us-west-2` / `eu-central-1` / `ca-central-1`)
- **Legal / privacy copy** — tailored per regulator (GDPR, PIPA, APPI, PIPEDA, HIPAA-adjacent)

### Phase 1 Scope (immediate)

Ship `en-US` and `ko-KR` together. Every P0 Moment must render correctly in both locales before we call P0 complete. This forces English-native authoring to become muscle memory rather than aspiration.

## Consequences

### Positive
- Zero translation-feel when the English build ships
- Global-native architecture validates the Adaptive-by-Default claim (ADR-0013) at its weakest assumption
- Compliance readiness baked in — regional backend routing exists from day 1 of `CloudRepository`
- Brand voice (ADR-0005 privacy messaging, Grammar §3 tone) auditable in a single source language

### Negative / Tradeoff
- Author switching cost short-term (KR-first habit must be broken)
- Korean docs drift over time (accepted — rewriting all KR history costs more than it saves)
- Double work during `en → ko` translation pass until ICU pipeline is in place

### Mitigation
- ICU source-of-truth at `src/i18n/en/`; other locales derive via a translation workflow (manual for P1; TMS integration in P2)
- PR template adds: *"Is new user-facing copy English-master in ICU?"* checkbox
- Optional `## 요약 (ko)` block in ADRs where KR leadership readership matters
- `docs/glossary.md` maps EN ↔ KR internal lexicon to prevent drift

## Rejected Alternatives

| Option | Rejected because |
|--------|------------------|
| Keep Korean-first, translate to English in Phase 2 | Guaranteed translation-feel; invalidates global-native claim |
| Bilingual docs from day 1 (write everything twice) | 2× author cost; KR and EN drift anyway without a master |
| English-only docs, no Korean at all | Cuts off KR leadership readers prematurely; optional `## 요약 (ko)` is cheaper |
| Wait for real demand (opportunistic localization) | Demand signal arrives after architecture lock-in; too late |

## References

- ADR-0004 Vertical-First Launch [Superseded by ADR-0018] — GTM is KR-first, this ADR is *architecture* EN-first. No conflict.
- ADR-0013 Adaptive-by-Default — global-native is what makes the category-agnostic claim real
- ADR-0011 Local-First Persistence — `CloudRepository` regional routing derives from this ADR's locale table
- ADR-0005 Privacy as Moat — regional compliance alignment

## 요약 (ko)

MODU 의 저자 언어를 **English-master** 로 전환. 한국판은 여러 locale 중 하나. 기존 한국어 문서는 유지, 신규 문서·코드·카피는 영어 우선. P1 대상: `en-US` + `ko-KR` 동시 출하. P2 확장: US/CA (fr-CA 포함) / JP / DE / FR — 계획을 추구하되 복잡함을 싫어하는 문화권 우선.
