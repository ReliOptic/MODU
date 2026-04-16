# MODU — Claude Code Context

> **이 파일을 항상 먼저 읽어라.** PROJECT_SPEC.md (= ../modu-project-spec.md) 가 단일 진실 소스.
> 본 문서는 Claude Code 가 한 세션에서 다음 세션으로 넘길 영구 가이드라인이다.

## 0. 프로젝트 개요

MODU 는 **AI 대화로 형성되는 초개인화 건강·돌봄 동반자 앱**이다. 사용자는 "에셋"이라는 단위로 건강 상황(난임 / 항암 / 반려동물 / 만성질환)을 앱 안에 구축하고, 에셋에 따라 UI 구조·색상·위젯·탭바가 완전히 달라진다.

**Slogan**: *Listen to your life.*

## 1. 기술 스택

- React Native (Expo SDK 54) + TypeScript strict
- expo-router (file-based routing)
- 상태: Zustand v5 (`useShallow` 권장 — `.filter()` 같은 새 배열 리턴은 무한 렌더 유발)
- 백엔드 (예정): Supabase (Auth + DB + Edge Functions)
- AI (예정): Anthropic Claude API (Sonnet) — Edge Function 통해서만 호출, key 클라이언트 노출 금지
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

> 에셋 전환 시 탭바 · 배경 · 위젯 구조가 모두 바뀐다.
> 전환 애니메이션은 **400ms** 크로스페이드 (`useAssetTransition`).

## 10. 작업 시 체크리스트

- [ ] `npx tsc --noEmit` 0 errors
- [ ] 모바일 viewport (375~430) 에서 디자인 검증 (web frame 또는 Expo Go)
- [ ] `npx expo export --platform web` 통과
- [ ] 새 native 모듈 추가 시 `npx expo install` 사용 (버전 호환)
- [ ] 권한 추가 시 `app.json` 의 `infoPlist` + `android.permissions` 동시 갱신
- [ ] 변경 commit → push → 사용자 알림
