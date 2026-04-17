# MODU — Claude Code Context

> **세션 재개 시 필독 순서** (Session-start read order):
> 1. 본 파일 `CLAUDE.md` — 영구 가이드라인 (permanent guidance).
> 2. **`progress.md`** — 직전 세션의 마지막 상태 + 바인딩 결정 + 다음 액션. 현재 작업을 이어서 수행하는 기준.
> 3. `../modu-project-spec.md` (PROJECT_SPEC) — 비전 / 멀티에셋 풀 그림.
> 4. 필요 시 `ROADMAP.md`, `docs/adr/`, `docs/reviews/`, 관련 `docs/strategy/` 와 `docs/data/`.
>
> **세션 종료 시**: `progress.md` 를 반드시 최신 상태로 갱신하고 같은 커밋 혹은 직후 커밋에 포함한다 (`docs: progress snapshot YYYY-MM-DD`).
>
> 본 문서는 Claude Code 가 한 세션에서 다음 세션으로 넘길 영구 가이드라인이다. `progress.md` 는 세션-간 상태 전달이다.

## North Star (절대 잊지 말 것)

> **MODU 는 "삶의 챕터별 의료 기억을 쌓아가는 영구 라이브러리"다.
> 5년 사용자는 떠날 수 없다 — 떠나는 순간 본인의 5년 인생 사본을 잃기 때문에.**

모든 기능 결정은 다음 5가지 자문에 통과해야 한다:

1. 이 기능이 사용자의 의료 기억을 더 깊게 누적시키는가?
2. 5년 사용자에게 이 기능이 더 가치 있어지는가?
3. 이 기능이 가족·파트너를 끌어들이는가?
4. 이 기능이 사용자가 떠날 비용을 키우는가?
5. 이 기능이 "잠깐 쓰고 마는" 카테고리(피트니스 챌린지 등) 에 가까운가? → YES면 거절

## v1 출시 스코프 (ADR-0004 — RETIRED 2026-04-17 PM)

> ⚠️ **본 섹션은 retired.** 2026-04-17 /office-hours 세션에서 ADR-0004 폐기 결정. 새로운 v1 source-of-truth = `docs/planning/2026-04-17-horizontal-pivot-asset-spawner-design.md` (horizontal metamorphic platform from v1; fertility = warm-start seed). 본 섹션 텍스트는 Sprint 1 Day 1-2 에서 정식 rewrite 예정 — 그 전까지 아래 내용은 **참고만 하고 결정 source 로 쓰지 말 것**.

- **카테고리**: Fertility (난임) **단독**. cancer/pet/chronic 코드는 살아있되 product 진입점 차단
- **타겟**: 한국. US/EU 는 v3
- **Critical mass goal**: 1K WAU + 14% W4 retention

## 0. 프로젝트 개요

MODU 는 **AI 대화로 형성되는 초개인화 건강·돌봄 동반자 앱**이다. 사용자는 "에셋"이라는 단위로 건강 상황(난임 / 항암 / 반려동물 / 만성질환)을 앱 안에 구축하고, 에셋에 따라 UI 구조·색상·위젯·탭바가 완전히 달라진다.

**Slogan**: *Listen to your life.*

## 1. 기술 스택 (ADR-0001 / 0002 / 0003)

- React Native (Expo SDK 54) + TypeScript strict
- expo-router (file-based routing)
- 상태: Zustand v5 (`useShallow` 권장 — `.filter()` 같은 새 배열 리턴은 무한 렌더 유발)
- 백엔드: **Supabase Pro (Seoul region)** + **Cloudflare R2** (사진)
- AI: **Anthropic Claude API via Supabase Edge Function (Deno)** — key 절대 클라이언트 노출 금지
- 데이터 모델: **Memory-First** (ChapterMemory append-only timeline 이 1순위 entity)
- 디자인: blur (expo-blur) + LinearGradient (expo-linear-gradient) + Pretendard/Fraunces

## 2. 출시 타깃 (출시 시 모든 플랫폼 동시)

iOS · Android · Web (Static export). **EAS Build** 로 한 코드베이스 → 3 플랫폼.
빌드/제출은 `RELEASE.md` 참조.

## 3. 모바일 우선 디자인 (영구 룰)

> **모든 새 화면·컴포넌트는 `width 375~430px` 모바일 viewport 에서 우선 검증한다.**
> 데스크톱 웹에서도 `MobileFrame` 컨테이너로 폰 폭 가운데 정렬되어 보인다.

### 항상 지켜야 할 것

- **터치 타깃 ≥ 44x44 pt** (Apple HIG). Pressable 의 hitSlop 이나 padding 으로 확보.
- **본문 폰트 ≥ 13pt**, primary 액션 ≥ 17pt.
- **가로 스크롤 금지**. 콘텐츠는 세로 스택.
- **iOS safe-area / Android edge-to-edge** 모두 고려 — `useSafeAreaInsets()` 또는 `SafeAreaView`.
- **새 컴포넌트 width = `100%`** (또는 flex-grow). 고정 폭 사용 시 모바일 폭 ≤ 430 가정.
- **단일 칼럼**. 데스크톱이라도 multi-column 으로 펼치지 않는다.
- **Web 빌드 검증**: 변경 후 `npx expo export --platform web` 가 통과해야 한다.

### 자주 하는 실수

- `position: 'absolute'` 로 layout 짜다가 모바일 작은 화면에서 겹침 → flex layout 우선.
- 데스크톱에서만 검증한 hover 인터랙션 → 네이티브에서는 hover 없음. Pressable pressed 상태 활용.
- `Modal` 의 `presentationStyle: 'pageSheet'` 는 web 에서 동작 안함 → `Platform.select` 로 분기 필요 (이미 `MainNavigator` 가 처리).
- BottomSheet (`@gorhom/bottom-sheet`) 는 web 제스처 미지원 → `AssetSwitcher` 처럼 Platform.OS 분기로 web fallback.

## 4. Formation 응답 UI 컨벤션

Claude 채팅 UI 스타일을 따른다:

```
질문 메시지 (AIMessage)

1. 옵션 A           ›
2. 옵션 B           ›
3. 옵션 C           ›
4. 옵션 D           ›

기타 · 직접 입력
[입력칸                    ] [전송]

🎙 음성으로 답하기
건너뛰기
```

- **Numbered list (1, 2, 3, 4)** — `PresetOptions` 컴포넌트가 이 디자인 적용.
- **모든 step (confirm / photo 제외)** 에 직접 입력 영역 항상 노출. preset 전용 step 에선 라벨이 "기타 · 직접 입력".
- 음성 / 사진 / 건너뛰기 버튼은 그 아래.

## 5. 핵심 파일 지도

```
src/
├─ theme/                 — palettes, typography, widgets (§7 spec)
├─ types/                 — Asset, FormationStep, LayoutRule, ...
├─ store/                 — assetStore, formationStore (Zustand)
├─ data/
│  ├─ assetTemplates.ts   — 4 type + custom default tabs/widgets
│  ├─ formationSteps/     — _shared, fertility, cancer, petCare, chronic
│  └─ mock/               — assets, widgetData
├─ engine/                — layoutEngine + 4 rule files (§4)
├─ hooks/                 — useAssetTransition (400ms), useWidgetOrder, useImagePicker
├─ components/
│  ├─ ui/                 — Card, PrimaryCard, Separator, Badge, PhotoPicker
│  ├─ formation/          — AIMessage, UserMessage, PresetOptions, FreeTextInput, VoiceInputButton, FormationConfirmation
│  ├─ widgets/            — shared(2) + fertility(5) + cancerCaregiver(4) + petCare(4) + chronic(5)
│  ├─ AssetSwitcher.tsx   — bottom sheet (native) + dropdown modal (web)
│  └─ TabBar.tsx          — 동적 하단 탭바 (Ionicons 매핑)
├─ screens/               — AssetScreen, HomeTab, PlaceholderTab, FormationFlow
└─ navigation/MainNavigator.tsx — root + MobileFrame (web 모바일 컨테이너)
```

## 6. 디자인 원칙 (제품)

1. **빈 화면보다 잘 고른 선택지** — 프리셋 > 자유입력
2. **목소리는 타이핑과 같은 무게** — VoiceInputButton 항상 노출
3. **가장 좋은 돌봄은 조용한 돌봄** — 알림 최소화, 필요한 것이 이미 거기에
4. **iOS 네이티브 퀄리티** — SF Pro 느낌, blur 배경, 0.5px separator
5. **에셋 = 인생의 챕터** — 전환은 ritual, 종료는 archive (영구 보존). 일회성 챌린지 금지

## 7. Privacy as Marketing Moat (ADR-0005)

코드/카피 작성 시 항상 다음 약속을 지킨다:

- 광고 SDK 영구 금지 · 데이터 판매 영구 금지
- 모든 ChapterMemory 에 `visibility` ('self' | 'partners' | 'doctor') — 작성 시점에 명시
- One-tap export (.zip JSON+사진) · One-tap delete (즉시 파기)
- KR 사용자 데이터는 ap-northeast-2 잔류
- App lock (생체) default ON 권유
- 외부 분석 도구 (PostHog) 는 opt-in only
- 마케팅 카피: *"당신의 의료 기록은 당신의 것입니다"*

## 8. v1 카테고리 단속 (ADR-0004 — RETIRED 2026-04-17 PM)

> ⚠️ **본 섹션은 retired.** ADR-0004 폐기 결정 (2026-04-17 /office-hours). 새 source-of-truth = `docs/planning/2026-04-17-horizontal-pivot-asset-spawner-design.md`. v1 은 horizontal asset-spawner — 단일 fertility vertical 차단 정책 폐기. Sprint 1 Day 1-2 에서 본 섹션 정식 rewrite + dependent files (grammar.md fertility 예시, event schema cycle_*/embryo_*) 정리 예정.

cancer/pet/chronic 코드는 PR 수준에서 살아있어야 하지만, 사용자가 보는 진입점은 차단:

- Formation step_01 의 preset 4개 중 fertility 만 활성. 나머지는 "곧 만나요. 알림 신청"
- mock seed (`EXPO_PUBLIC_SEED_DEMO=1`) 로만 다른 카테고리 시연 가능
- 마케팅·App Store 메타는 fertility 만 언급 ("먼저 IVF 동반자로 시작" 단서)

## 7. 색상 시스템 (에셋별)

| Palette | AssetType | Accent |
|---------|-----------|--------|
| dawn (테라코타) | fertility | `#D4634F` |
| mist (블루) | cancer_caregiver | `#2E547B` |
| blossom (핑크) | pet_care | `#C14B73` |
| sage (그린) | chronic | `#4E7049` |
| dusk (라일락) | custom | `#5E4A85` |

## 8. 환경 / 배포

- 로컬 개발: `npx expo start` → Expo Go 또는 시뮬레이터
- 웹 정적: `npx expo export --platform web --output-dir dist`
- iOS 빌드: `eas build --profile production --platform ios`
- Android 빌드: `eas build --profile production --platform android`
- OTA: `eas update --channel production`
- 환경변수: `.env.example` → `.env` 또는 `eas secret:create`
- Supabase 연동 (Phase 7): 클라이언트는 anon key 만, Anthropic key 는 Edge Function 전용

## 9. Critical rule (§6.1)

> 에셋 전환 = 챕터 전환. 920ms ritual (fade-out 280 + ritual hold 360 + fade-in 280)
> + light haptic (네이티브 only). 절대 "단순 fade" 로 후퇴 금지.

## 10. 외부 review 강제 항목 (CPO 2026-04-17)

- `accessibilityLabel` / `accessibilityHint` 모든 Pressable 에 필수
- 빈 탭 placeholder 외부 빌드에서 제거 (또는 "Coming soon · 알림 신청")
- 다크 모드 토큰 빠짐 → 새 컴포넌트 작성 시 `palette.dark` 변수 분리 가능하게
- Hero 카드 `완료 ✓` 탭 가능해야 함 (현재 표시만)
- 푸시 / Lock-screen 위젯 / 생체인증 = v1 출시 필수 (Phase 2)

## 11. 작업 시 체크리스트

- [ ] `npx tsc --noEmit` 0 errors
- [ ] 모바일 viewport (375~430) 에서 디자인 검증 (web frame 또는 Expo Go)
- [ ] `npx expo export --platform web` 통과
- [ ] 새 native 모듈 추가 시 `npx expo install` 사용 (버전 호환)
- [ ] 권한 추가 시 `app.json` 의 `infoPlist` + `android.permissions` 동시 갱신
- [ ] 새 ChapterMemory schema/지속 데이터 변경 시 ADR-0003 부합 확인
- [ ] 새 기능이 §North Star 5가지 자문 통과하는지 commit message 에 한 줄 명시
- [ ] 변경 commit → push → 사용자 알림

## 12. 참조 문서

- `ROADMAP.md` — Phase 0~5 + 의사결정 블로커 추적
- `docs/adr/0001-backend-platform.md` — Supabase + R2
- `docs/adr/0002-ai-edge-function.md` — Claude proxy
- `docs/adr/0003-memory-first-data-model.md` — ChapterMemory schema
- `docs/adr/0004-vertical-first-launch.md` — Fertility 단독 v1
- `docs/adr/0005-privacy-as-moat.md` — 프라이버시 약속
- `docs/reviews/2026-04-17-cpo-review.md` — CPO 외부 리뷰 원문
- `docs/strategy/2026-04-17-ceo-decision-pack.md` — OSS 거버넌스 + 10년 해자(Semantic Memory) + 법인 구조 (재단+PBC). 정식 ADR-0006~0008 분리 예정
- **`docs/planning/2026-04-17-horizontal-pivot-asset-spawner-design.md`** — **[CURRENT v1 SOURCE OF TRUTH, APPROVED 2026-04-17 PM via /office-hours]** Horizontal pivot. ADR-0004 retired. MODU = horizontal metamorphic life-asset platform from v1 (fertility = warm-start seed only). Asset-Spawner-First (Approach A, ALL-IN production-quality scope). P1-P5 premises locked. 14-day Sprint 1-5 plan. Reviewer Concerns RC1-RC6 acknowledged. **세션 재개 시 progress.md 다음으로 가장 먼저 읽을 것.**
- `docs/planning/2026-04-17-timeflow-frontend-plan.md` — Timeflow paradigm (위젯→시간흐름). TimeRiver/StoryCard/AmbientPalette/MemoryGlance/NextActionPrompt. ADR-0009 예정
- `docs/planning/2026-04-17-adaptive-engine-cto-plan.md` — Adaptive engine 4-layer cache (L1 device/L2 hint/L3 edge/L4 cron). per-user $0.11→$0.04 sublinear. ADR-0010 예정
- **`docs/grammar/modu-product-grammar.md`** — MODU 단일 언어 시스템 (live document). 6 메타포 + Lexicon + Voice&Tone + Anti-Lexicon + Persona Cards. 모든 결정·코드·카피의 single source of truth — **이름·카피·commit scope 만들 때 항상 먼저 확인**
- **`docs/strategy/2026-04-17-w1-retention-and-scale-vision.md`** — W1 retention 이 1순위 KPI. App-Open TPO 즉시성 / 매일 micro-loop / 절제된 알림 / Scale Vision finale. 모든 design/code/copy 결정은 W1 retention 에 +/- 명시.
- **`docs/strategy/2026-04-17-revenue-unit-economics.md`** — 관리회계 시선. 에셋 수 = ARPU lever. Free / Plus ₩5,900 / Family ₩11,900. Family LTV = Plus × 3.3. 100K MAU = ₩53M MRR / 94% margin. 챕터 수 분포·전환률·churn 이 dashboard 1순위.
- **`docs/strategy/2026-04-17-caregiver-agora-and-micro-sessions.md`** — MODU 는 솔로 다이어리 X **돌봄의 아고라**. 채팅 X · presence X · action 이 message. **5-15초 micro-session loop** 가 retention. 7번째 메타포 'Agora' 추가 제안. P0 코드 = TPOSignature + NextActionPrompt + Just Did 카드.
- **`docs/strategy/2026-04-17-regulatory-welcome-and-b2g.md`** — 각 목표국 (US · CA · JP · DE · FR) regulator / grant body / B2G buyer 가 환영하도록 설계. 내부 register vs 외부 register (PHR · PGHD · non-SaMD · patient-delegated caregiver access) 분리. DiGA / PECAN / B2G license / 기관 스폰서십 / OSS 경로. 영구 제약 = non-SaMD posture (ADR-0015 후보).
- **`docs/strategy/2026-04-17-economic-foundation-and-impact.md`** — MODU = appreciating user-owned asset. 3 **user-side realities** (journey outruns recall · caregiving unwitnessed · visit cannot hold 30 days) → 3 사회 이슈 → 정책 레버 → B2G 집계지표. **B2G 전략은 사용자에게 숨김** (hidden surface). Consent 는 onboarding 에서 plain 하게 — local-first / opt-in sync / opt-in aggregate research. 핵심 UX = **orchestrated care** (실제 삶의 패턴이 조율되는 느낌). 운영 순서 = regulation → data mechanism → UX (reverse 금지). **Contribution margin 을 전 팀 KPI 의 단일 회계 언어**. Cox 생존 · LTV 적분 · Thompson sampling · Brier-score · 2-cohort 재현. 예정 ADR: 0015 Non-SaMD · 0016 CM-per-feature gate · 0017 Statistical operating standards.
- **`docs/data/2026-04-17-phase-1-event-schema.md`** — Phase 1 이벤트 스키마 (regulation-first). 9 카테고리 약 35 events. 각 event 에 민감도 (S1-S4) · regulatory envelope (E1-E4 · GDPR Art.9 + Quebec Bill 25 기준) · 통계 모델 (Cox · bonding · Thompson · Brier) 매핑. 온보딩 consent 화면 plain-language 영/국문 copy + 3-아이템 acknowledgment. TypeScript 타입: `src/types/events.ts` (discriminated union + `EVENT_REGISTRY`).
- `docs/adr/0011-local-first-persistence.md` — 디바이스 저장 primary, cloud sync opt-in. zustand persist + AsyncStorage. 비용 곡선 평탄화 + 오프라인.
- `docs/adr/0012-gemma-routing.md` — Claude 최소화, Gemma 3 (Apache-2.0) 우선. 100K MAU AI 비용 8x 절감 예상.
- `docs/demo/iphone-install.md` — Expo Go(5분) / EAS dev / TestFlight 3 경로 + 시연 체크리스트.
