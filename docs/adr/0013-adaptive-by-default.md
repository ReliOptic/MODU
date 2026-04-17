# ADR-0013: Adaptive-by-Default — MODU's 7th Commitment

- Status: **Proposed**
- Date: 2026-04-17
- Supersedes-relation: 보완 — ADR-0004 (vertical-first launch) 와 양립. ADR-0004 는 *go-to-market* 결정, 본 ADR 은 *아키텍처* 결정.
- Related: ADR-0003 (Memory-First) · ADR-0005 (Privacy as Moat) · ADR-0009 예정 (Timeflow) · ADR-0010 예정 (Adaptive Engine) · ADR-0012 (Gemma)
- Origin: 2026-04-17 brainstorming session (`d4ac6ce1-...`) — 7 pillars 합의

## Context

MODU 의 핵심 약속은 *"누구에게나 각자 맞는 UI"* (TPO 기반 hyper-personalization). v1 fertility 단독 출시 (ADR-0004) 는 GTM 결정이지만, **아키텍처가 fertility 에 락인되면 핵심 약속이 무너진다.**

브레인스토밍에서 사용자가 명시 — *"사례 중심으로 가면 직관적이지만 하이퍼 퍼스널라이제이션의 개념이 흐려진다. 사례 중심으로 락인되는 방향으로 개발이 진전된다. 전세계 누구나 각자 니즈에 맞춰지는 앱이 필요하다."*

기존 자산 (Layout Engine V2 · 5 palette · widget 라이브러리 · Adaptive Engine 4-layer cache · Timeflow paradigm) 은 이 원칙을 *지원하지만 강제하진 않는다*. 위젯 단위는 너무 잘게 쪼개져 AI 가 학습·합성하기 어렵고, 카테고리별 분기 (`fertility/`, `cancer/`, `pet/`) 가 코드에 산재하면 새 챕터 타입마다 코드 추가가 강제된다. 이 두 약점을 동시에 푸는 것이 본 ADR 이다.

## Decision

**MODU 의 7번째 commitment 로 "Adaptive-by-Default" 를 박는다.** 시스템은 카테고리에 무지(category-agnostic)해야 하고, **개인화 = 시스템이 임의의 사람에게 적응하는 구조**여야 한다. v1 fertility 는 첫 instance 일 뿐, 시스템 자체가 아니다.

### 원칙 (Principle)

1. **Category-agnostic core.** Engine/UI layer 는 카테고리에 무지. Case-specific 하드코딩은 데이터 (예: fertility 의 약 리스트) 에만 국한.
2. **Signal-driven, not persona-driven.** 새 컴포넌트 설계 시 *"X 사용자를 위한..."* 프레이밍 금지. *"어떤 signals 가 들어오면 어떤 surface 변화가 일어나는가"* 프레이밍.
3. **Layered control.** 사용자 명시 선언이 항상 시스템 추론보다 우선 (L0 > L1 > L2).
4. **Bounded variation.** AI 는 사전 정의된 Library 안에서만 선택·조합·변주. Runtime 에 새 UX 생성 X.

### Signal Axes — (C) 레이어 + (B) 5축

```
L0 — User Declaration  (사용자가 직접 명시)
       ├─ asset_type, chapter_phase, partner_scope
       ├─ "지금은 조용히" toggle, lock-screen 개인화 ON/OFF
       └─ override 가능. 항상 이김.

L1 — Observed TPO + Role + Phase  (디바이스가 관측)
       ├─ T (Time):     wall-time, day-of-week, since-event
       ├─ P (Place):    home/clinic/work (geofence opt-in) / unknown
       ├─ O (Occasion): app-open, post-action, before-event
       ├─ Role:         self / partner / doctor (세션 컨텍스트)
       └─ Phase:        before / during / after (이벤트 기준)

L2 — AI Inference  (Gemma local + Claude edge — ADR-0010/0012)
       ├─ pattern hints: "이 사용자는 화요일 저녁에 mood log ↑"
       ├─ tone/copy variants
       └─ 항상 L0/L1 위에 후순위. 충돌 시 L0 > L1 > L2.
```

### Unit — Moments (7번째 메타포)

기존 6 메타포 (챕터·기억·라이브러리·강·동반자·빛) 에 **"순간 (Moments)"** 을 추가한다. Grammar §2.1 lexicon 에 편입.

**Moment** = AI 가 선택·조합·학습 가능한 *의미 단위*. 위젯보다 크고, 화면(StoryCard) 보다 작다. *Generative UI library* 의 atom.

```ts
interface Moment {
  id:        string                              // 'recovery-river' | 'partner-echo' | ...
  intent:    string                              // 인간/AI 가 읽을 의미 ("회복기 부드러운 흐름")
  slot:      'skin' | 'glance' | 'hero' | 'row' | 'floating'
  predicate: (ctx: SignalContext) => number      // 0~1 적합도
  render:    (ctx: SignalContext) => ReactNode
  events:    MomentEventSchema                    // exposed/tapped/dwell/dismissed/resulting_memory
  variants:  Record<VariantKey, VariantConfig>    // tone/density/lang
}
```

**Sizing**: 20 core types × 3~5 variants ≈ **100 Moments** (사용자가 말한 "100가지 툴박스" 의 실체).

### Composition — Slot 모델 + Hybrid (Z)

화면은 5개 slot 으로 구성. Slot 마다 등장 횟수 상한 명시:

```
┌────────────────────────────────────────────────────┐
│  Skin      (1)    palette/tone/copy 색조 — 화면 전체  │
├────────────────────────────────────────────────────┤
│  Glance    (0-1)  "1년 전 오늘" 류 복리 기억           │
│  Hero      (1-2)  StoryCard 급 narrative             │
│  Rows      (3-7)  TimeRiver 항목                     │
│  Floating  (0-1)  NextActionPrompt — zero-friction   │
└────────────────────────────────────────────────────┘
```

**Composition pipeline (Hybrid Z)**:

1. **Rule** (L1 device, 0ms 비용): slot 별 `predicate(ctx)` 상위 N 개 후보 추출
2. **AI hint** (L4 cron, weekly): 사용자 prefs/패턴 → variant 추천 cache
3. **Render** (L1): rule 후보 + cached variant → 즉시 화면

이 구조가 ADR-0010 (예정) 의 4-layer cache 와 정확히 정합. 사용자별 추론은 weekly batch 로 캐시 → per-user 비용 sublinear.

### Quality Contract — 7 조항

AI 의 자유는 다음 boundary 안에서만:

1. **Bounded variation** — Moment 라이브러리 외 신규 UX 생성 금지.
2. **Observable** — 모든 노출이 `{signals_hash, moment_id, variant, slot, outcome}` 이벤트로 기록 (PostHog opt-in, ADR-0005).
3. **Predictable** — 같은 signals → 같은 rule 결정. Variant 변주는 weekly cache 에서 파생, 매 진입마다 재생성 X.
4. **Reversible** — 문제 Moment 는 L2 hint flag 로 즉시 전 사용자 OFF (앱 재배포 X).
5. **Auditable / Explainable** — Moment tap & hold 시 *"왜 지금 이게 보이는지"* 한 줄 노출 (XAI).
6. **Fallback** — `predicate < threshold` 이면 canonical default. *"AI 가 모르면 가만히 있는다."*
7. **Accessibility floor** — 모든 render 는 VoiceOver label, 44pt touch, WCAG AA contrast 를 helper 로 강제.

### Folder Structure

```
src/moments/
├─ core/
│   ├─ types.ts            (Moment, SignalContext, MomentEvent)
│   ├─ engine.ts           (composeMoments — slot 별 후보 선정)
│   ├─ signalContext.ts    (L0+L1+L2 결합, 우선순위 enforce)
│   ├─ qualityContract.ts  (7조항 runtime check + dev assertion)
│   └─ events.ts           (PostHog opt-in 게이트)
├─ library/
│   ├─ skin/               (e.g. tpo-signature, recovery-skin)
│   ├─ glance/             (e.g. memory-glance)
│   ├─ hero/               (e.g. partner-echo, story-card)
│   ├─ row/                (e.g. injection-row, mood-row)
│   └─ floating/           (e.g. next-step, just-did)
└─ data/
    └─ category-extensions/
        ├─ fertility.ts    (chapter_type === 'fertility' 일 때만 추가 Moments)
        ├─ cancer.ts       (v2)
        └─ pet.ts          (v2)
```

기존 widget 들 (`MoodQuickLog`, `InjectionTimeline` 등) 은 row-slot Moment 로 흡수 또는 wrap. 대체 X — 사용자 표현대로 *"이용하되 고도화"*.

## Consequences

### 긍정

- **Category-agnostic 증명**: 새 챕터 타입 추가 시 데이터만 등록 (Moment 코드 X).
- **AI 학습 친화**: `predicate + events` 가 학습 loop 의 연료. variant 는 user-level bandit 으로 개인 최적화.
- **W1 retention 정합**: App-Open TPO 즉시성 (`tpo-signature` skin) 이 1번 lever (W1 retention doc §2.2).
- **Adaptive Engine plan 정합**: ADR-0010 (예정) 4-layer cache 가 본 ADR 의 composition pipeline 그대로 구현.
- **5 메타포 + Agora + Moments = 7** 메타포 체계 완성. Grammar 단단해짐.
- **SQM (Service Quality Management)**: Quality Contract 7 조항이 AI 의 안전한 자유를 보장.

### 부정 / 트레이드오프

- **러닝 커브**: 위젯/화면 사고에서 Moment/Slot 사고로 이전 필요. 신규 컴포넌트 design review 마찰 ↑ (단기).
- **마이그레이션 비용**: 기존 위젯들을 Moment wrapper 로 감싸는 1회성 리팩터.
- **Quality Contract 강제 비용**: 런타임 assertion + dev tool 작성 비용. (단, 한번 짜면 모든 Moment 가 자동 통과).

### 완화책

- 마이그레이션은 점진적 — 신규는 Moment, 기존은 row-slot Moment 로 lazy wrap.
- Quality Contract dev assertion 은 dev build 만, prod 는 fallback 만 동작 (성능 영향 X).
- 신규 컴포넌트 PR 템플릿에 *"왜 이게 widget 이 아니고 Moment 이어야 하는가?"* 체크박스 1줄 추가.

## Rejected Alternatives

| 옵션 | 거절 이유 |
|------|-----------|
| (A) 3축 (TPO 만) | Caregiver Agora (Role 1차 시민) 와 정합 X |
| (D) Signal Graph (전부 동등 weight) | 디버깅 불가, MVP 과잉. SQM 위반 |
| (X) Rule-only composition | AI 학습 친화 (사용자의 (c) 주장) 충족 X |
| (Y) AI-first composition | 비용 linear, 일관성 ↓, 캐싱 어려움 (CTO plan §1.3 와 충돌) |
| Persona/Case 우선 설계 | 카테고리 락인. ADR-0004 의 GTM 결정과 아키텍처를 혼동하는 실수 |

## Grammar 편입

**`docs/grammar/modu-product-grammar.md`** 에 추가 예정 (별도 PR):

- §2 Lexicon: **Moments** (순간) — definition, slot 5종, anatomy
- §3 메타포: 7번째 — 순간 (Moments) — *"챕터의 픽셀 단위 실체. AI 의 연주가 일어나는 곳."*
- §5 Anti-Lexicon: *"위젯 추가하자"* 대신 *"Moment 추가하자"*; *"X 사용자용 화면"* 대신 *"X signal 발화 시 시퀀스"*

## Implementation

본 ADR 은 원칙 선언. 구체 구현은:

- **Spec**: `docs/superpowers/specs/2026-04-17-moments-and-adaptive-by-default-design.md`
- **P0 코드** (Phase 1, 4-6주): `tpo-signature` (skin) · `next-step` (floating) · `partner-echo` (hero) — 5 slot 중 3 slot 실증, Fertility/Agora 양쪽 시연
- **Phase 2** (8-12주): row-slot Moment 마이그레이션, library 50% 구축
- **Phase 3** (글로벌 v3): 100 Moments 달성, category-extensions 로 v2 카테고리 확장

## References

- ADR-0003 Memory-First Data Model (Moment events → ChapterMemory 머지)
- ADR-0004 Vertical-First Launch (GTM 결정 — 본 ADR 과 양립)
- ADR-0005 Privacy as Moat (events opt-in, Quality Contract §5 explainability)
- ADR-0009 Timeflow (예정) — Slot 모델이 Timeflow paradigm 의 surface 표현
- ADR-0010 Adaptive Engine (예정) — 본 ADR 의 composition pipeline 의 cache 구현
- ADR-0012 Gemma Routing — L2 inference 의 cost layer
- `docs/grammar/modu-product-grammar.md` — Moments lexicon 편입
- `docs/strategy/2026-04-17-w1-retention-and-scale-vision.md` — App-Open TPO 즉시성 = `tpo-signature` skin
- `docs/strategy/2026-04-17-caregiver-agora-and-micro-sessions.md` — Role 축 + Just Did = `partner-echo` hero
- 메모리: `feedback_hyperpersonalization_anti_case_lockin.md` (본 ADR 의 motivation 근거)
