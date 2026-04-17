# Spec: Moments Library + P0 (tpo-signature · next-step · partner-echo)

- Date: 2026-04-17
- Status: **Draft for review**
- ADR: [0013 — Adaptive-by-Default](../../adr/0013-adaptive-by-default.md)
- Origin: brainstorming session `d4ac6ce1-...` (7 pillars 합의)

## Goal

ADR-0013 의 원칙을 **검증 가능한 첫 코드** 로 떨어뜨린다. 5 slot 중 3 slot 을 실증하는 **P0 Moment 3개** 를 만들고, 그 과정에서 `Moment` core types · composition engine · Quality Contract runtime check 를 함께 확립한다. 이 spec 이 끝나면 *"새 Moment 추가 비용"* 이 *"새 카테고리 추가 비용"* 보다 압도적으로 작아진다 — adaptive-by-default 가 측정 가능해진다.

## Non-Goals

- 100 Moments 전부 구축 (Phase 2~3).
- 기존 widget 전부 wrap (점진적, 신규 PR 부터).
- AI variant 생성 파이프라인 (L4 cron) — 본 spec 은 L1 rule + 정적 variants 만. Cache 통합은 ADR-0010 spec 에서.
- Server 측 인프라 — 모든 P0 는 device-local (ADR-0011 정합).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Screen (e.g. AssetScreen)                                  │
│  ┌──────────────────────────────────────────────┐           │
│  │  <SlotShell>                                 │           │
│  │    <Skin>      composeMoments('skin', ctx)   │  ← 1개    │
│  │    <Glance>    composeMoments('glance', ctx) │  ← 0-1개  │
│  │    <Hero>      composeMoments('hero', ctx)   │  ← 1-2개  │
│  │    <Rows>      composeMoments('row', ctx)    │  ← 3-7개  │
│  │    <Floating>  composeMoments('floating',ctx)│  ← 0-1개  │
│  │  </SlotShell>                                │           │
│  └──────────────────────────────────────────────┘           │
│                       ▲                                      │
│                       │ MomentInstance[]                     │
│   ┌───────────────────┴────────────────────┐                │
│   │  composeMoments(slot, ctx)             │                │
│   │   1. registry.bySlot(slot)             │                │
│   │   2. filter Quality Contract pre-check │                │
│   │   3. score = predicate(ctx)            │                │
│   │   4. top-N + fallback                  │                │
│   │   5. attach variant (L2 hint cache)    │                │
│   │   6. emit 'moment.exposed' event       │                │
│   └────────────────────────────────────────┘                │
│                       ▲                                      │
│   ┌───────────────────┴────────────────────┐                │
│   │  SignalContext (built once per render) │                │
│   │   L0 user declarations  ──┐            │                │
│   │   L1 observed TPO/Role/Ph ─┼─ merged   │                │
│   │   L2 ai hints (cached)   ──┘  L0>L1>L2 │                │
│   └────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. `src/moments/core/types.ts`

```ts
export type Slot = 'skin' | 'glance' | 'hero' | 'row' | 'floating';

export interface SignalContext {
  // L0 — user declarations (always wins)
  user: {
    assetType: AssetType;
    chapterPhase?: 'before' | 'during' | 'after';
    partnerScope?: 'self' | 'partners' | 'doctor';
    quietMode?: boolean;
  };
  // L1 — observed
  tpo: {
    timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    place?: 'home' | 'clinic' | 'work' | 'unknown'; // geofence opt-in
    occasion: 'app-open' | 'post-action' | 'before-event' | 'background';
    hoursSinceLastEvent?: number;
  };
  role: 'self' | 'partner' | 'doctor';
  phase?: 'before' | 'during' | 'after';
  // L2 — AI hints (weekly cached, optional)
  hints?: {
    preferredVariants?: Record<string, string>; // momentId → variantKey
    momentBlocklist?: string[];                 // user-rejected
  };
}

export interface MomentEvent {
  type: 'exposed' | 'tapped' | 'dwell' | 'dismissed' | 'resulting_memory';
  momentId: string;
  variant?: string;
  slot: Slot;
  signalsHash: string;       // hash of context (privacy: not raw signals)
  durationMs?: number;
  outcome?: 'success' | 'cancel' | 'ignore';
}

export interface MomentDefinition<V extends string = string> {
  id: string;
  intent: string;                              // human/AI readable
  slot: Slot;
  predicate: (ctx: SignalContext) => number;   // 0..1
  render: (ctx: SignalContext, variant: V) => React.ReactElement;
  variants: Record<V, { tone?: string; density?: 'compact' | 'normal' | 'spacious'; lang?: string }>;
  defaults: { variant: V; threshold: number }; // fallback ON if score < threshold
  a11y: { label: (ctx: SignalContext) => string; hint?: string };
}

export interface MomentInstance {
  def: MomentDefinition;
  variant: string;
  score: number;
}
```

### 2. `src/moments/core/engine.ts`

```ts
export function composeMoments(slot: Slot, ctx: SignalContext): MomentInstance[] {
  const SLOT_LIMITS: Record<Slot, number> = {
    skin: 1, glance: 1, hero: 2, row: 7, floating: 1,
  };
  const candidates = registry
    .bySlot(slot)
    .filter(d => !ctx.hints?.momentBlocklist?.includes(d.id))
    .map(d => ({ def: d, variant: pickVariant(d, ctx), score: d.predicate(ctx) }))
    .filter(m => m.score >= m.def.defaults.threshold || slot === 'skin'); // skin 은 fallback 보장

  candidates.sort((a, b) => b.score - a.score);
  const limit = SLOT_LIMITS[slot];
  const picked = candidates.slice(0, limit);

  if (picked.length === 0 && slot === 'skin') {
    picked.push(fallbackSkin(ctx));
  }
  picked.forEach(m => emit({ type: 'exposed', momentId: m.def.id, variant: m.variant, slot, signalsHash: hash(ctx) }));
  return picked;
}
```

### 3. `src/moments/core/qualityContract.ts`

```ts
// Dev-only assertions (no-op in prod via __DEV__ guard).
export function assertContract(def: MomentDefinition, instance: MomentInstance, ctx: SignalContext) {
  if (!__DEV__) return;
  console.assert(instance.score >= 0 && instance.score <= 1, `[QC] predicate must return 0..1: ${def.id}`);
  console.assert(def.a11y.label(ctx).length > 0, `[QC] a11y.label required: ${def.id}`);
  console.assert(def.intent.length >= 10, `[QC] intent too short: ${def.id}`);
  // Touch target / contrast checked in render layer via <SlotShell>.
}
```

### 4. `src/moments/core/signalContext.ts`

`useSignalContext()` hook — `assetStore`, `formationStore`, `quietModeStore`, `Date.now()`, `expo-location` (opt-in), `useAppState()` 를 합쳐 `SignalContext` 빌드. Render 당 1회 memoized.

### 5. `src/moments/core/events.ts`

PostHog opt-in 게이트. `EXPO_PUBLIC_ANALYTICS_OPTED_IN === '1'` 일 때만 emit. 그 외엔 dev console only.

### 6. P0 Moment — `tpo-signature` (skin)

| 필드 | 값 |
|------|----|
| **id** | `tpo-signature` |
| **intent** | "App-Open 시 TPO 를 0.4초 안에 사용자가 인식하도록, palette+greeting 으로 즉시성 와우 제공" |
| **slot** | `skin` |
| **predicate** | `ctx.tpo.occasion === 'app-open' ? 1.0 : 0.0` (skin 은 항상 1개 보장 → fallback 도 본 Moment) |
| **variants** | `dawn-soft` · `morning-bright` · `afternoon-steady` · `evening-warm` · `night-quiet` (5개 — `tpo.timeOfDay` 매핑) |
| **render** | `<AmbientPalette tone={variant} />` + 첫 진입 시 350ms greeting overlay (*"새벽이에요"*, *"저녁이에요"*) |
| **a11y label** | `"현재 ${greeting}, ${assetType} 챕터"` |
| **사용처** | `AssetScreen` 최상단 SlotShell 의 skin slot |
| **W1 retention link** | strategy doc §2.2 "App-Open TPO 즉시성" — 정확히 본 Moment 가 그 lever |

### 7. P0 Moment — `next-step` (floating)

| 필드 | 값 |
|------|----|
| **id** | `next-step` |
| **intent** | "다음 행동을 zero-friction 1탭으로. 안 보일 때 의미. 보일 땐 'message=action'" |
| **slot** | `floating` |
| **predicate** | `score = max(injectionDue, moodOverdue, partnerActionAvailable, ...)`. `< 0.6` 이면 안 띄움 (*AI 가 모르면 가만*) |
| **variants** | `urgent` (red dot) · `gentle` (default) · `compact-quiet-mode` (text-only when `quietMode`) |
| **render** | `<NextActionPrompt action={...} onTap={...} />` — 화면 하단 floating |
| **a11y label** | `"${action.title}, 1탭으로 완료"` |
| **사용처** | `AssetScreen` SlotShell floating slot |
| **Agora link** | `docs/strategy/.../caregiver-agora....md` §8 P0 |

### 8. P0 Moment — `partner-echo` (hero)

| 필드 | 값 |
|------|----|
| **id** | `partner-echo` |
| **intent** | "파트너의 'Just Did' 액션을 채팅 없이 본인 화면에 narrative 로 비춘다. 협업이 chat 없이 일어남을 증명" |
| **slot** | `hero` |
| **predicate** | `partnerJustActed && (now - partnerActedAt) < 6h ? 0.85 : 0.0` |
| **variants** | `gentle` · `celebratory` (예: 첫 동조 액션) · `concise` (compact 모드) |
| **render** | StoryCard variant — *"미나가 어제 약 챙겼어요"* + 부드러운 애니메이션 + 답례 micro-action 버튼 |
| **a11y label** | `"파트너 ${name} 가 ${action} 했어요"` + hint `"답례 보내려면 두 번 탭하세요"` |
| **사용처** | `AssetScreen` SlotShell hero slot |
| **Agora link** | §4.1 "Just Did" 카드 = 본 Moment |

### 9. `<SlotShell>` 컴포넌트

`src/moments/SlotShell.tsx`. Composition 결과를 받아서 slot 별 layout + Quality Contract 런타임 a11y/contrast 강제. 기존 위젯들은 row-slot Moment 로 lazy wrap (별도 PR — 본 spec 은 P0 3개만).

## Data Flow

1. `AssetScreen` 마운트 → `useSignalContext()` → `SignalContext` 빌드 (memoized)
2. `<SlotShell>` 이 5 slot 마다 `composeMoments(slot, ctx)` 호출
3. 각 `MomentInstance` 의 `def.render(ctx, variant)` 가 React tree 렌더
4. 노출 시 `'moment.exposed'` 이벤트 → opt-in 시 PostHog batch
5. 사용자 인터랙션 → `'moment.tapped' | 'moment.dismissed'` → 동일 경로
6. ChapterMemory 생성 결과는 `'moment.resulting_memory'` 로 link (ADR-0003 schema 의 `source_moment_id` 컬럼 — schema 마이그레이션 별도)

## Error Handling

- `predicate` 가 throw → 점수 0, error 로그, 다음 후보로 (UI 영향 X)
- `render` 가 throw → ErrorBoundary 가 slot 에 fallback
- 모든 분기에서 *"AI 가 모르면 가만히 있는다"* (Quality Contract §6)

## Testing

| 종류 | 대상 | 방법 |
|------|------|------|
| Unit | `composeMoments` slot 한도, score 정렬, fallback | jest |
| Unit | 각 P0 Moment 의 predicate truth table | jest |
| Component | `<SlotShell>` 의 a11y label 존재, 44pt touch | @testing-library/react-native |
| Snapshot | 5 timeOfDay × `tpo-signature` variant | jest snapshot |
| Manual | iOS/Android/Web 모바일 viewport (375~430) — `/test-moments` 화면에서 P0 3개 변주 시각 확인 | Expo Go |
| TS | `npx tsc --noEmit` 0 errors | CI |
| Web build | `npx expo export --platform web` 통과 | CI |

## Migration / Compat

- 기존 `AssetScreen` 의 위젯 트리 → `<SlotShell>` 로 감싸고 기존 위젯들은 임시로 row-slot 의 단순 Moment wrapper (`row-legacy-injection-timeline` 등) 로 등록. P0 외 Moments 의 `predicate` 는 `chapterPhase === 'during' ? 0.9 : 0.5` 정도로 시작.
- 신규 PR 부터는 *"왜 widget 이 아니고 Moment 인가?"* 체크박스 추가 (PR template).

## Folder & File List

신규:
- `src/moments/core/types.ts`
- `src/moments/core/engine.ts`
- `src/moments/core/signalContext.ts`
- `src/moments/core/qualityContract.ts`
- `src/moments/core/events.ts`
- `src/moments/core/registry.ts` (id → MomentDefinition 등록)
- `src/moments/SlotShell.tsx`
- `src/moments/library/skin/tpoSignature.tsx`
- `src/moments/library/floating/nextStep.tsx`
- `src/moments/library/hero/partnerEcho.tsx`
- `src/moments/__tests__/engine.test.ts`
- `src/moments/__tests__/tpoSignature.test.ts`
- `src/moments/__tests__/nextStep.test.ts`
- `src/moments/__tests__/partnerEcho.test.ts`

수정:
- `src/screens/AssetScreen.tsx` — 최상단을 `<SlotShell>` 로 감싸기 (기존 컨텐츠는 row 영역으로)
- `docs/grammar/modu-product-grammar.md` — Moments lexicon (별도 PR)
- `CLAUDE.md` §5 핵심 파일 지도 + §12 ADR-0013 ref
- `ROADMAP.md` Phase 1 — P0 Moment 항목 추가

영향 없음:
- 기존 위젯 코드 (점진적 lazy wrap)
- Supabase schema (Moment events 는 PostHog opt-in, ChapterMemory 의 `source_moment_id` 는 nullable 컬럼 — 후속 PR)

## Acceptance

이 spec 의 구현이 끝났다고 말할 수 있는 조건:

- [ ] `npx tsc --noEmit` 0 errors
- [ ] `npx expo export --platform web` 통과
- [ ] `AssetScreen` 진입 시 5 slot 모두 보이고 (skin 은 항상, 나머지는 조건부), P0 3개 Moment 가 의도대로 발화
- [ ] `tpo-signature` 5 variants 가 timeOfDay 별 자동 전환
- [ ] `next-step` 의 `< 0.6` 시 hidden, `≥ 0.6` 시 표시
- [ ] `partner-echo` 가 mock partner action 후 6시간 내 hero slot 점유
- [ ] 모든 P0 Moment 가 a11y label, 44pt touch, dark mode token 충족
- [ ] PostHog opt-in OFF 일 때 외부 호출 0회 (네트워크 inspector 확인)
- [ ] 신규 Moment 추가 비용 측정: `recovery-river` 추가 시 코드 LOC < 80 (sample 작성)

## Open Questions (구현 시작 전 정리 필요)

1. ChapterMemory schema 의 `source_moment_id` 컬럼 추가 — Phase 1 에 포함할지, ADR-0003 마이너 개정 별도로 할지?
2. PostHog opt-in UI — 본 spec 범위인가, 별도 onboarding spec 인가?
3. `<SlotShell>` 의 dark mode 토큰 — 본 spec 에서 새 token 정의할지, ROADMAP 의 *"다크 모드 토큰"* 항목과 통합할지?

위 3개는 `Open Questions` 로 남기고, spec review 단계에서 결정.

## References

- ADR-0013 Adaptive-by-Default
- `docs/strategy/2026-04-17-w1-retention-and-scale-vision.md` — `tpo-signature` 의 KPI 근거
- `docs/strategy/2026-04-17-caregiver-agora-and-micro-sessions.md` — `partner-echo` · `next-step` 근거
- `docs/planning/2026-04-17-timeflow-frontend-plan.md` — Slot 모델이 Timeflow surface 표현
- `docs/planning/2026-04-17-adaptive-engine-cto-plan.md` — Composition pipeline 의 cache 구현 근거
- 메모리: `feedback_hyperpersonalization_anti_case_lockin.md`
