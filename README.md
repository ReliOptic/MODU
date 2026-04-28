# @tpo/runtime

You passed the right context. Something still didn't render. TPO tells you exactly which component was suppressed, which slot was locked, and why — before you open a single log file.

---

## Why this is different

The hardest debugging question in a rule-driven UI isn't "what rendered?" — it's "why didn't this render?" A PM asks why a campaign banner isn't showing. A QA engineer can't reproduce a missing CTA. You add a `console.log`, check the feature flag dashboard, re-read the condition logic, and still can't point to one authoritative answer. The rules ran. The output came back. But the trace only tells you what was selected.

LaunchDarkly, OpenFeature, and XState are all built around the selected path. They return a winner. They don't output a structured record of what was excluded, what was outcompeted, or what the runtime decided it lacked enough context to resolve. That gap is invisible until something goes missing in production.

TPO models the full decision surface: every suppressed component carries a `whyNot` reason code, locked slots are preserved as a named primitive rather than inferred from priority ties, and abstentions — cases where context fell below a confidence threshold — are explicit entries in the trace rather than silent drops. The result is a single output that a developer can diff, a QA engineer can assert against, and a PM or ad-ops team member can read without needing to understand the rule engine internals.

---

## Try it

→ [Open in playground](https://reliqbit.github.io/tpo-funnel-runtime/playground/) *(GitHub Pages — no install required)*

Or locally:
```bash
npm install && npm run build && npm run playground
```
Then open http://localhost:3333/playground/

---

## 5분 퀵스타트 — 도메인별 예제

### 은행앱 — 금융소비자보호법 compliance + 연말 세제혜택 추천

Premier 고객, 만기 7일 전, 연말 세제혜택 시즌. compliance 고정 슬롯(금융소비자보호법 투자위험고지)이 먼저 잠기고, ISA 전환·연금세액공제가 선택되며, DSR 40% 초과 고객에게는 대출 CTA가 억제됩니다.

```typescript
import { evaluate, formatTrace } from '@tpo/runtime';
import { bankingContext, bankingOptions } from '@tpo/runtime/starters/banking';

const result = evaluate(bankingContext, bankingOptions);
console.log(formatTrace(result, bankingContext, { mode: 'governance' }));
```

기대 출력 (governance 모드):

```
TPO Decision Governance Report
======================================================================

COMMITMENTS HONORED  (1)
  risk-disclosure  →  InvestmentRiskGradeNotice  [compliance]

ALGORITHM SELECTED  (4)
  primary_cta  →  ISAAccountConversion
  nudge  →  PensionTaxCredit
  loan_cta  →  PersonalLoanOffer
  contextual  →  WealthManagementInvite

EXCLUDED WITH REASON  (0)

DEFERRED  (0)

ACCOUNTABILITY SUMMARY
  commitments  : 1
  algorithm    : 4
  excluded     : 0  (0 condition, 0 policy)
  deferred     : 0
  risk level   : low

======================================================================
```

> DSR 40% 초과 고객 시나리오에서는 `meta.dsrTier`를 `'over-40pct'`로 바꾸면 `PersonalLoanOffer`가 `EXCLUDED WITH REASON`으로 이동하며 `policy gate: P-DSR-040`이 기록됩니다.

---

### 이커머스 — 장바구니 이탈 + 타임세일

재방문 구매자가 장바구니를 이탈한 상태에서 타임세일이 진행 중. 할인 쿠폰이 primary CTA로 선택되고, 재고 긴박 뱃지와 유사 상품 캐러셀이 함께 노출됩니다. 구매 후 리뷰 프롬프트는 stage 불일치로 억제됩니다.

```typescript
import { evaluate, formatTrace } from '@tpo/runtime';
import { ecommerceContext, ecommerceOptions } from '@tpo/runtime/starters/ecommerce';

const result = evaluate(ecommerceContext, ecommerceOptions);
console.log(formatTrace(result, ecommerceContext, { mode: 'governance' }));
```

기대 출력 (governance 모드):

```
TPO Decision Governance Report
======================================================================

COMMITMENTS HONORED  (1)
  promo-banner  →  FlashSaleBanner  [promotion]

ALGORITHM SELECTED  (3)
  primary_cta  →  CartDiscountCoupon
  contextual  →  SimilarProductCarousel
  urgency  →  StockUrgencyBadge

EXCLUDED WITH REASON  (1)
  WriteReviewPrompt  —  stage eq "post-purchase" — got "cart-abandonment"

DEFERRED  (0)

ACCOUNTABILITY SUMMARY
  commitments  : 1
  algorithm    : 3
  excluded     : 1  (1 condition, 0 policy)
  deferred     : 0
  risk level   : low

======================================================================
```

---

### 핀테크 — 신규 사용자 온보딩 + KYC policy gate

온보딩 완료 직후 신규 사용자. KYC 미인증 상태이므로 투자 배너는 policy(`P-INVEST-KYC`)에 의해 억제됩니다. `confidenceHint`가 threshold 미만인 두 컴포넌트는 DEFERRED로 기록됩니다.

```typescript
import { evaluate, formatTrace } from '@tpo/runtime';
import { fintechContext, fintechOptions } from '@tpo/runtime/starters/fintech';

const result = evaluate(fintechContext, fintechOptions);
console.log(formatTrace(result, fintechContext, { mode: 'governance' }));
```

기대 출력 (governance 모드):

```
TPO Decision Governance Report
======================================================================

COMMITMENTS HONORED  (0)

ALGORITHM SELECTED  (2)
  primary_cta  →  FirstTransferGuide
  contextual  →  SendMoneyPromo

EXCLUDED WITH REASON  (1)
  InvestmentStartBanner  —  policy gate: P-INVEST-KYC

DEFERRED  (2)
  InvestmentStartBanner  —  confidence 0.45 (threshold 0.60)
  EmergencyLoanInfo  —  confidence 0.55 (threshold 0.60)

ACCOUNTABILITY SUMMARY
  commitments  : 0
  algorithm    : 2
  excluded     : 1  (0 condition, 1 policy)
  deferred     : 2
  risk level   : medium

======================================================================
```

> KYC 인증 완료 후 `stage`를 `'kyc-verified'`로 변경하면 policy gate가 해제되고 `InvestmentStartBanner`는 DEFERRED로만 남습니다 (confidenceHint 0.45 < threshold 0.60).

---

## Install

```bash
npm install @tpo/runtime
```

---

## Quick start

```typescript
import { evaluate, formatTrace } from '@tpo/runtime';
import type { TPOContext, EvalOptions, RulePack, LockedSlots, PolicyPack } from '@tpo/runtime';

const context: TPOContext = {
  event: 'KCD Korea 2026',
  stage: 'registered',
  role: 'attendee',
  time: { phase: 'D-3', offsetDays: -3 },
  place: { type: 'conference-venue' },
  locale: 'ko-KR',
  device: 'mobile',
};

const rules: RulePack = {
  version: '1.0.0',
  rules: [
    // --- SELECTED: primary_action ---
    // Two rules match the same component+slot → merged into matchedRules
    { id: 'r-042', componentKey: 'SessionCheckInPrompt', slot: 'primary_action',
      conditions: [{ field: 'time.phase', op: 'eq', value: 'D-3' },
                   { field: 'stage', op: 'eq', value: 'registered' },
                   { field: 'role', op: 'eq', value: 'attendee' }],
      priority: 1, confidenceHint: 0.91 },
    { id: 'r-055', componentKey: 'SessionCheckInPrompt', slot: 'primary_action',
      conditions: [{ field: 'time.phase', op: 'eq', value: 'D-3' },
                   { field: 'stage', op: 'eq', value: 'registered' },
                   { field: 'role', op: 'eq', value: 'attendee' }],
      priority: 1, confidenceHint: 0.91 },

    // --- SELECTED: contextual_cards ---
    { id: 'r-031', componentKey: 'ScheduleAtAGlanceCard', slot: 'contextual_cards',
      conditions: [{ field: 'device', op: 'eq', value: 'mobile' },
                   { field: 'locale', op: 'eq', value: 'ko-KR' }],
      priority: 2, confidenceHint: 0.78 },

    // --- SELECTED: alerts ---
    { id: 'r-067', componentKey: 'VenueDirectionsAlert', slot: 'alerts',
      conditions: [{ field: 'place.type', op: 'eq', value: 'conference-venue' },
                   { field: 'time.phase', op: 'in', value: ['D-3', 'D-2', 'D-1', 'D-day'] }],
      priority: 3, confidenceHint: 0.82 },

    // --- SELECTED: checklist ---
    // Two rules match the same component+slot → merged into matchedRules
    { id: 'r-019', componentKey: 'AttendeePreDayChecklist', slot: 'checklist',
      conditions: [{ field: 'stage', op: 'eq', value: 'registered' },
                   { field: 'time.phase', op: 'in', value: ['D-3', 'D-2', 'D-1'] },
                   { field: 'role', op: 'eq', value: 'attendee' }],
      priority: 4, confidenceHint: 0.88 },
    { id: 'r-024', componentKey: 'AttendeePreDayChecklist', slot: 'checklist',
      conditions: [{ field: 'stage', op: 'eq', value: 'registered' },
                   { field: 'time.phase', op: 'in', value: ['D-3', 'D-2', 'D-1'] },
                   { field: 'role', op: 'eq', value: 'attendee' }],
      priority: 4, confidenceHint: 0.88 },

    // --- SUPPRESSED: condition mismatch ---
    // r-011: requires D-day or D+1; context has D-3 → suppressed
    { id: 'r-011', componentKey: 'NetworkingMatchCard', slot: 'contextual_cards',
      conditions: [{ field: 'time.phase', op: 'in', value: ['D-day', 'D+1'] }],
      priority: 3 },
    // r-088: requires attended or checked-in; context has registered → suppressed
    { id: 'r-088', componentKey: 'AfterPartyInviteCard', slot: 'social',
      conditions: [{ field: 'stage', op: 'in', value: ['attended', 'checked-in'] }],
      priority: 5 },
    // r-003: requires offsetDays <= -7; context has -3 → suppressed
    { id: 'r-003', componentKey: 'HotelBookingPrompt', slot: 'accommodation',
      conditions: [{ field: 'time.offsetDays', op: 'lte', value: -7 }],
      priority: 6 },
    // r-077: conditions match, but policy-p-007 suppresses via policy gate
    { id: 'r-077', componentKey: 'SpeakerFeedbackForm', slot: 'feedback',
      conditions: [{ field: 'role', op: 'eq', value: 'attendee' }],
      priority: 9, confidenceHint: 0.85 },

    // --- ABSTAINED: conditions match but confidenceHint < 0.60 ---
    { id: 'r-044', componentKey: 'LocalDiningRecommendation', slot: 'dining',
      conditions: [{ field: 'place.type', op: 'eq', value: 'conference-venue' }],
      priority: 7, confidenceHint: 0.41 },
    { id: 'r-062', componentKey: 'TransportRouteCard', slot: 'transport',
      conditions: [{ field: 'device', op: 'eq', value: 'mobile' }],
      priority: 8, confidenceHint: 0.54 },
  ],
};

const lockedSlots: LockedSlots = [
  { slot: 'hero', componentKey: 'SponsorBannerKCD2026', reason: 'promotion' },
];

const policy: PolicyPack = [
  {
    id: 'policy-p-007',
    componentKey: 'SpeakerFeedbackForm',
    action: 'suppress',
    condition: { field: 'stage', op: 'not-in', value: ['post-session', 'attended'] },
  },
];

const options: EvalOptions = { rules, lockedSlots, policy, confidenceThreshold: 0.60 };

const result = evaluate(context, options);
// omit FormatOptions for byte-deterministic output; pass { generatedAt, traceId } to stamp headers
console.log(formatTrace(result, context));
```

Output:

```
TPO Funnel Runtime — Decision Trace v1
======================================================================

--- Input context ---

  event           : KCD Korea 2026
  stage           : registered
  role            : attendee
  time.phase      : D-3
  place.type      : conference-venue
  locale          : ko-KR
  device          : mobile

--- LOCKED ---

  slot            : hero
  componentKey    : SponsorBannerKCD2026
  reason          : promotion
  note            : Operator-locked. Policy suppress does NOT apply (l
                    ocked wins).


--- SELECTED ---

  #1  slot            : primary_action
      componentKey    : SessionCheckInPrompt
      specificity     : 1.00
      priority        : 1
      matched_rules   : [r-042, r-055]

  #2  slot            : contextual_cards
      componentKey    : ScheduleAtAGlanceCard
      specificity     : 0.67
      priority        : 2
      matched_rules   : [r-031]

  #3  slot            : alerts
      componentKey    : VenueDirectionsAlert
      specificity     : 0.67
      priority        : 3
      matched_rules   : [r-067]

  #4  slot            : checklist
      componentKey    : AttendeePreDayChecklist
      specificity     : 1.00
      priority        : 4
      matched_rules   : [r-019, r-024]


--- SUPPRESSED ---

  componentKey    : NetworkingMatchCard
  why-not         : time.phase in ["D-day","D+1"] — got "D-3" (rule r-
                    011)

  componentKey    : AfterPartyInviteCard
  why-not         : stage in ["attended","checked-in"] — got "register
                    ed" (rule r-088)

  componentKey    : HotelBookingPrompt
  why-not         : time.offsetDays lte -7 — got -3 (rule r-003)

  componentKey    : SpeakerFeedbackForm
  why-not         : policy gate: suppress (policy-p-007)
  policy_id       : policy-p-007


--- ABSTENTION ---

  componentKey    : LocalDiningRecommendation
  confidence      : 0.41
  threshold       : 0.60
  reason          : confidenceHint 0.41 below threshold 0.6

  componentKey    : TransportRouteCard
  confidence      : 0.54
  threshold       : 0.60
  reason          : confidenceHint 0.54 below threshold 0.6


--- RISK ---

  tier            : medium
  policy_hits     : 1
  abstentions     : 2
  fallbacks       : 0
  locked_wins     : 1
  override_flags  : none

--- META ---

  evaluate_ms     : 0
  rule_count      : 12
  matched_rules   : 6   (r-042, r-055, r-031, r-067, r-019, r-024)
  trace_version   : v1
  deterministic   : true

======================================================================
```

---

## Concepts

**Locked slots** — slots declared in `lockedSlots` are resolved before any rule evaluation. A locked slot cannot be suppressed by policy. The trace records the override explicitly.

**Suppressed + why-not** — every component that failed conditions or was blocked by policy appears in `suppressed` with a human-readable `whyNot` string and an optional `policyId`. Nothing is silently dropped.

**Abstention + fallback** — when a component's matched confidence falls below `confidenceThreshold`, the runtime abstains and records the gap (missing field, insufficient specificity). An optional `fallback` component key is named in the trace entry.

**Risk tier** — `low | medium | high` derived from the count of policy hits, abstentions, and locked overrides in a single evaluation pass. Surfaces in `TPOResult.riskTier` for downstream gating.

---

## API reference

### `evaluate(context, options): TPOResult`

Pure, deterministic function. Same inputs always produce the same result.

| Parameter | Type | Description |
|---|---|---|
| `context` | `TPOContext` | Structured request context (stage, role, time, place, locale, device) |
| `options` | `EvalOptions` | Rules, registry, locked slots, policy, confidence threshold |

### `formatTrace(result, context, opts?): string`

Renders a `TPOResult` as a human-readable string. Two output modes are available via `opts.mode`.

| Parameter | Type | Description |
|---|---|---|
| `result` | `TPOResult` | Output from `evaluate` |
| `context` | `TPOContext` | Same context passed to `evaluate` |
| `opts` | `FormatOptions` (optional) | Mode, `generatedAt`, and `traceId` |

**`mode: 'developer'` (default)** — technical trace with specificity scores, rule IDs, confidence values, and 70-character terminal layout. For engineers debugging rule evaluation.

**`mode: 'governance'`** — organizational vocabulary: COMMITMENTS HONORED, ALGORITHM SELECTED, EXCLUDED WITH REASON, DEFERRED, ACCOUNTABILITY SUMMARY. For PMs, ad-ops, and compliance reviews.

```typescript
// governance mode — same result, audience-appropriate vocabulary
console.log(formatTrace(result, context, { mode: 'governance' }));
```

```
TPO Decision Governance Report
======================================================================

COMMITMENTS HONORED  (1)
  hero  →  SponsorBannerKCD2026  [promotion]

ALGORITHM SELECTED  (4)
  primary_action  →  SessionCheckInPrompt
  contextual_cards  →  ScheduleAtAGlanceCard
  alerts  →  VenueDirectionsAlert
  checklist  →  AttendeePreDayChecklist

EXCLUDED WITH REASON  (4)
  NetworkingMatchCard  —  time.phase in ["D-day","D+1"] — got "D-3"
  AfterPartyInviteCard  —  stage in ["attended","checked-in"] — got "registered"
  HotelBookingPrompt  —  time.offsetDays lte -7 — got -3
  SpeakerFeedbackForm  —  policy gate: policy-p-007

DEFERRED  (2)
  LocalDiningRecommendation  —  confidence 0.41 (threshold 0.60)
  TransportRouteCard  —  confidence 0.54 (threshold 0.60)

ACCOUNTABILITY SUMMARY
  commitments  : 1
  algorithm    : 4
  excluded     : 4  (3 condition, 1 policy)
  deferred     : 2
  risk level   : medium

======================================================================
```

When `opts` is omitted the `Generated` and `Trace ID` header lines are not emitted, guaranteeing byte-identical output for identical inputs.

### Key types

```typescript
interface TPOContext {
  readonly event?: string;
  readonly stage: string;
  readonly role: string;
  readonly time: { readonly phase: string; readonly offsetDays?: number };
  readonly place?: { readonly type: string; readonly city?: string; readonly region?: string };
  readonly locale?: string;
  readonly device?: string;
  readonly meta?: Readonly<Record<string, string>>;
}

interface EvalOptions {
  readonly rules: RulePack;
  readonly registry?: Registry;        // reserved for Phase 1b component lookup
  readonly lockedSlots?: LockedSlots;
  readonly policy?: PolicyPack;
  readonly confidenceThreshold?: number; // default 0.60
  readonly clock?: () => number;        // inject for deterministic timing in tests
}

interface FormatOptions {
  readonly mode?: 'developer' | 'governance';  // default: 'developer'
  readonly generatedAt?: string;               // ISO timestamp — omit for byte-deterministic output
  readonly traceId?: string;                   // caller-assigned trace ID
}

interface TPOResult {
  readonly locked: readonly LockedSlot[];
  readonly selected: readonly SelectedComponent[];
  readonly suppressed: readonly SuppressedComponent[];
  readonly abstentions: readonly AbstainedComponent[];
  readonly riskTier: RiskTier;
  readonly trace: readonly TraceEntry[];
  readonly meta: EvalMeta;
}

type RulePack = { readonly rules: readonly Rule[]; readonly version: string };
```

Full type definitions: [`src/types.ts`](src/types.ts)

---

## License

Apache-2.0
