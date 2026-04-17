# MODU — PROJECT_SPEC.md
# Version: 0.1.0
# Last updated: 2026-04-17

---

## §0. 문서 목적

이 문서는 MODU 앱의 **실제 구현 스펙**이다.
Claude Code 세션에서 이 문서를 참조하여 코드를 생성한다.
모든 구현은 이 스펙에 기술된 동작을 충족해야 하며,
각 섹션 끝의 `[TEST]` 블록이 검증 기준이 된다.

**기술 스택**: React Native (Expo) + TypeScript
**상태 관리**: Zustand
**백엔드**: Supabase (Auth + DB + Edge Functions)
**AI**: Anthropic Claude API (Sonnet)
**디자인**: 본 문서 §7 디자인 토큰 참조

---

## §1. 핵심 개념

### 1.1 에셋 (Asset)

에셋은 MODU의 핵심 단위다. 하나의 에셋은 **특정 건강·돌봄 상황에 맞춤화된 앱 경험 번들**이다.

```typescript
interface Asset {
  id: string;
  type: AssetType;          // 'fertility' | 'cancer_caregiver' | 'pet_care' | 'chronic' | 'custom'
  displayName: string;       // "시험관 3회차" | "어머니 항암" | "보리 관절 관리" | ...
  palette: PaletteKey;       // 'dawn' | 'mist' | 'blossom' | 'sage' | 'dusk'
  tabs: TabConfig[];         // 하단 탭바 구성 (에셋마다 다름)
  widgets: WidgetConfig[];   // 홈 화면 위젯 목록 + 우선순위 규칙
  layoutRules: LayoutRule[]; // 동적 재배치 규칙
  formationData: FormationData; // AI 인터뷰에서 수집된 사용자 맥락
  status: 'forming' | 'active' | 'archived';
  createdAt: string;
  lastActiveAt: string;
}
```

### 1.2 에셋 전환 (Asset Switching)

사용자는 여러 에셋을 동시에 보유할 수 있다 (예: 난임 + 반려동물).
에셋 간 전환은 **앱의 전체 외관과 구조를 바꾸는 행위**다.

```
전환 시 바뀌는 것:
├─ 배경 그라데이션 (팔레트)
├─ 하단 탭바 (아이콘 + 라벨 + accent 색)
├─ 홈 화면 위젯 구성
├─ 헤더 인사말 + 컨텍스트
└─ 위젯 내부 데이터

전환 시 바뀌지 않는 것:
├─ 전체 레이아웃 프레임 (status bar, safe area)
├─ 글로벌 설정 (알림, 계정)
├─ 다른 에셋의 데이터 (격리됨)
└─ 에셋 전환 UI 자체
```

### 1.3 에셋 전환 UI — 핵심 인터랙션

```
┌─────────────────────────────────────┐
│ [현재 에셋 이름]     ▾  ← 탭하면   │
│                         드롭다운    │
│  ┌───────────────────────────────┐  │
│  │ ● 시험관 3회차    D-1  active │  │
│  │ ○ 보리 관절관리   +12  ──────>│  │
│  │ ○ 어머니 항암     5차  ──────>│  │
│  │ ─────────────────────────     │  │
│  │ ＋ 새 에셋 만들기             │  │
│  └───────────────────────────────┘  │
│                                     │
│  에셋 선택 시:                       │
│  1. 현재 화면이 아래로 슬라이드      │
│  2. 배경색이 새 팔레트로 크로스페이드 │
│  3. 탭바 아이콘이 모프 전환          │
│  4. 새 에셋의 홈 화면이 위로 슬라이드 │
│  5. 전체 전환 시간: 400ms           │
└─────────────────────────────────────┘
```

**[TEST: 에셋 전환]**
```
T-SW-01: 에셋 드롭다운을 탭하면 보유 에셋 목록이 표시된다.
T-SW-02: 다른 에셋을 선택하면 400ms 이내에 전환이 완료된다.
T-SW-03: 전환 중 배경 팔레트가 크로스페이드된다 (현재 → 새 에셋).
T-SW-04: 전환 중 탭바 아이콘과 라벨이 새 에셋의 구성으로 교체된다.
T-SW-05: 전환 중 탭바 accent 색이 새 에셋의 팔레트로 변경된다.
T-SW-06: 전환 후 홈 화면 위젯이 새 에셋의 데이터로 렌더링된다.
T-SW-07: 전환 후 뒤로가면 이전 에셋의 상태가 보존되어 있다.
T-SW-08: 에셋이 1개뿐이면 드롭다운에 전환 옵션 없이 "새 에셋 만들기"만 표시.
T-SW-09: "새 에셋 만들기"를 탭하면 Formation 플로우가 시작된다.
```

---

## §2. 에셋 타입별 구성

### 2.1 Fertility (난임)

```yaml
palette: dawn
tabs:
  - id: home,    icon: house,     label: 홈
  - id: calendar, icon: calendar, label: 달력
  - id: mood,    icon: face.smile, label: 감정
  - id: partner, icon: person.2,  label: 파트너

home_widgets:
  - type: primary_event      # "배아 이식 · 09:00"
  - type: calendar_mini       # 5월 달력 + 컬러 닷
  - type: injection_timeline  # 주사 스케줄 타임라인
  - type: mood_quicklog       # 감정 이모지 4개 선택
  - type: partner_sync        # 파트너 동기화 바

calendar_view_widgets:
  - type: calendar_full       # 월간 풀 캘린더
  - type: calendar_legend     # 범례 (주사/병원/감정)
  - type: event_detail_list   # 선택된 날의 이벤트 상세

unique_data_models:
  - InjectionSchedule: { time, drug, site, remaining_days, status }
  - TransferEvent: { date, clinic, preparation_checklist }
  - CycleCount: number  # 몇 회차인지
```

**[TEST: Fertility 홈]**
```
T-FT-01: 홈 화면 최상단에 다음 시술 Primary 카드가 Dawn 그라데이션으로 표시된다.
T-FT-02: 달력 위젯에 주사(핑크닷), 병원(블루닷), 감정(세이지닷)이 날짜별로 표시된다.
T-FT-03: 오늘 날짜는 Dawn accent 원형으로 하이라이트된다.
T-FT-04: 주사 타임라인에서 완료된 항목은 세이지 닷 + "완료 ✓" 배지.
T-FT-05: 주사 타임라인에서 예정 항목은 블러섬 닷 + "예정" 배지.
T-FT-06: 감정 퀵로그에서 이모지를 탭하면 선택 상태가 전환된다.
T-FT-07: 파트너 동기화 바에 파트너 이름과 "동기화 ON" 상태가 표시된다.
T-FT-08: 달력 탭으로 전환하면 풀 캘린더 + 범례 + 이벤트 상세가 표시된다.
```

### 2.2 Cancer Caregiver (항암 보호자)

```yaml
palette: mist
tabs:
  - id: home,     icon: house,        label: 홈
  - id: checklist, icon: checklist,   label: 체크
  - id: insight,  icon: lightbulb,    label: 인사이트
  - id: share,    icon: person.2,     label: 공유

home_widgets:
  - type: primary_event       # "항암 외래 · 13:30"
  - type: question_checklist  # "꼭 물어볼 것 3가지"
  - type: prev_visit_memo     # 지난 회차 메모 카드
  - type: treatment_timeline  # 치료 히스토리 (4차→5차)
  - type: medication_list     # 환자 약 목록

unique_data_models:
  - QuestionChecklist: { items: [{text, checked}] }
  - VisitMemo: { date, notes, medication_changes }
  - TreatmentHistory: { sessions: [{number, date, status, notes}] }
```

**[TEST: Cancer Caregiver 홈]**
```
T-CC-01: Primary 카드가 Mist 그라데이션으로 표시된다.
T-CC-02: 체크리스트 항목을 탭하면 체크/해제가 토글된다.
T-CC-03: 이미 체크된 항목은 Mist accent 배경 + ✓ 마크.
T-CC-04: 지난 회차 메모에 날짜 배지와 메모 내용이 표시된다.
T-CC-05: 치료 타임라인에 완료/오늘/예정이 시각적으로 구분된다.
T-CC-06: 약 목록에 현재 복용 중인 약 이름이 표시된다.
```

### 2.3 Pet Care (반려동물)

```yaml
palette: blossom
tabs:
  - id: home,     icon: house,      label: 홈
  - id: calendar, icon: calendar,   label: 달력
  - id: pet,      icon: pawprint,   label: (반려동물 이름)
  - id: settings, icon: gear,       label: 설정

home_widgets:
  - type: pet_profile         # 이름·종·나이·체중·상태뱃지
  - type: primary_medication  # "관절약 · 22:00"
  - type: daily_log_bars      # 산책/식욕/음수 가로 바
  - type: vet_memo            # 수의사 메모 + 다음 검진
  - type: condition_trend     # 7일 컨디션 미니 그래프

unique_data_models:
  - PetProfile: { name, species, breed, age, weight, conditions }
  - DailyLog: { walk_minutes, appetite, water_ml, notes }
  - VetMemo: { date, notes, next_visit }
```

**[TEST: Pet Care 홈]**
```
T-PC-01: 반려동물 프로필에 이모지·이름·종·나이·체중·상태뱃지가 표시된다.
T-PC-02: Primary 카드가 Blossom 그라데이션으로 표시된다.
T-PC-03: 로그 바에 산책/식욕/음수가 가로 막대 + 수치로 표시된다.
T-PC-04: 수의사 메모에 다음 검진일이 배지로 표시된다.
T-PC-05: 컨디션 트렌드에 7일간 미니 바 그래프가 표시된다.
T-PC-06: 탭바 3번째 아이콘 라벨이 반려동물 이름이다 (고정 "보리"가 아님).
```

### 2.4 Chronic (만성질환)

```yaml
palette: sage
tabs:
  - id: home,      icon: house,     label: 홈
  - id: graph,     icon: chart.line, label: 그래프
  - id: dashboard, icon: square.grid, label: 대시보드
  - id: settings,  icon: gear,       label: 설정

home_widgets:
  - type: primary_condition   # "오늘 컨디션 · 보통"
  - type: weekly_bar_graph    # 주간 두통 강도 바 그래프
  - type: monthly_heatmap     # 월간 히트맵
  - type: trigger_analysis    # AI 트리거 분석
  - type: next_visit          # 다음 진료 + 자동 요약
  - type: medication_stock    # 약 재고 + 리필 알림

unique_data_models:
  - ConditionLog: { date, severity: 0-10, duration_hours, notes }
  - TriggerAnalysis: { factors: [{name, correlation}] }
  - MedicationStock: { drug, remaining_days, refill_alert }
```

**[TEST: Chronic 홈]**
```
T-CH-01: Primary 카드가 Sage 그라데이션으로 표시된다.
T-CH-02: 주간 바 그래프에 7일간 높이가 다른 막대가 표시된다.
T-CH-03: 오늘 막대는 Sage accent 색으로 구분된다.
T-CH-04: 히트맵에 날짜별 색 농도(없음/약/중/강)가 표시된다.
T-CH-05: 트리거 분석에 "AI" 배지와 상관관계 텍스트가 표시된다.
T-CH-06: 약 재고에 남은 일수와 리필 알림 상태가 표시된다.
T-CH-07: 평온한 날 (severity=0)에는 Primary 카드가 "보통" + Sage accent.
```

---

## §3. Formation (에셋 형성) 플로우

### 3.1 진입점

```
앱 첫 실행 → Formation 시작 (에셋 0개)
또는
에셋 드롭다운 → "새 에셋 만들기" → Formation 시작
```

### 3.2 대화 구조

Formation은 **프리셋 선택지 + 자유 입력 + 음성 입력**의 3-track 시스템이다.

```typescript
interface FormationStep {
  id: string;
  aiMessage: string;                    // AI가 보여주는 질문
  responseType: 'preset' | 'free' | 'both';
  presets?: PresetOption[];             // 프리셋 선택지 (1~4개)
  allowVoice: boolean;                  // 음성 입력 허용 여부
  allowSkip: boolean;                   // 건너뛰기 허용 여부
  nextStep: string | ((response: string) => string); // 다음 스텝 (분기 가능)
}

interface PresetOption {
  id: string;
  label: string;                        // "시험관을 하고 있어요"
  shortLabel?: string;                  // 선택 후 표시될 축약형
  leadsTo: string;                      // 이 선택 시 다음 스텝 ID
}
```

### 3.3 Formation Step 시퀀스 (Fertility 예시)

```yaml
step_01:
  ai: "어떤 일로 MODU를 찾아주셨어요?"
  type: preset
  presets:
    - { id: fertility, label: "시험관을 하고 있어요", leadsTo: step_02_fertility }
    - { id: cancer, label: "항암 치료 중이에요", leadsTo: step_02_cancer }
    - { id: caregiver, label: "가족·반려동물을 돌보고 있어요", leadsTo: step_02_caregiver }
    - { id: other, label: "다른 상황이에요", leadsTo: step_02_free }
  allowVoice: true
  allowSkip: false

step_02_fertility:
  ai: "함께하게 되어 반가워요. 처음이신가요, 아니면 이번이 몇 번째세요?"
  type: preset
  presets:
    - { id: first, label: "처음이에요", leadsTo: step_03_first }
    - { id: second, label: "두 번째예요", leadsTo: step_03_repeat }
    - { id: third_plus, label: "세 번째 이상이에요", leadsTo: step_03_repeat }
  allowVoice: true

step_03_repeat:
  ai: "여러 번이면 많이 지치셨을 것 같아요. 지난번에 가장 힘드셨던 부분은 어떤 거였어요?"
  type: both
  presets:
    - { id: physical, label: "신체적으로 힘들었어요" }
    - { id: emotional, label: "감정적으로 힘들었어요" }
    - { id: lonely, label: "혼자라는 느낌이 힘들었어요" }
    - { id: financial, label: "경제적으로 힘들었어요" }
  allowVoice: true
  allowSkip: true

step_04_partner:
  ai: "옆에서 함께 챙겨주시는 분이 계세요?"
  type: both
  presets:
    - { id: spouse, label: "배우자가 함께해요" }
    - { id: family, label: "가족이 도와줘요" }
    - { id: alone, label: "혼자 하고 있어요" }
  allowVoice: true

step_05_confirm:
  ai: |
    대화로 느껴진 건, ○○님의 경우
    ① 감정적 지원이 우선이고
    ② 파트너와의 공유 구조가 중요하며
    ③ 의학 정보는 간결한 형태를 선호하시는 것 같아요.
    이대로 에셋을 만들어볼까요?
  type: preset
  presets:
    - { id: confirm, label: "좋아요, 만들어주세요" }
    - { id: adjust, label: "조금 다르게 하고 싶어요" }
```

**[TEST: Formation]**
```
T-FM-01: 첫 질문에 4개 프리셋 선택지가 표시된다.
T-FM-02: 프리셋을 탭하면 사용자 메시지로 올라가고 다음 질문이 나타난다.
T-FM-03: 음성 버튼을 탭하면 STT가 시작되고, 인식된 텍스트가 사용자 메시지로 올라간다.
T-FM-04: 자유 텍스트 입력 시 엔터/전송으로 메시지가 올라간다.
T-FM-05: 분기(leadsTo)에 따라 다음 질문이 달라진다.
T-FM-06: 마지막 스텝에서 "좋아요"를 선택하면 에셋이 생성되고 홈 화면으로 전환된다.
T-FM-07: 전체 Formation이 5분(5스텝) 이내에 완료 가능하다.
T-FM-08: Formation 중 "건너뛰기"가 허용된 스텝에서 skip 시 다음 스텝으로 진행된다.
```

---

## §4. 동적 레이아웃 시스템

### 4.1 위젯 우선순위 엔진

홈 화면의 위젯 순서는 **고정이 아니다**. 규칙 엔진이 실시간으로 재계산한다.

```typescript
interface LayoutRule {
  id: string;
  condition: LayoutCondition;
  effect: LayoutEffect;
  priority: number;  // 높을수록 우선 (0-100)
}

interface LayoutCondition {
  type: 'time_proximity' | 'emotion_state' | 'day_type' | 'manual';
  params: Record<string, any>;
}

interface LayoutEffect {
  widgetId: string;
  action: 'promote' | 'demote' | 'expand' | 'collapse' | 'highlight';
}
```

### 4.2 Fertility 레이아웃 규칙 예시

```yaml
rules:
  - id: transfer_d1
    condition: { type: time_proximity, params: { event: transfer, hours_before: 24 } }
    effect: { widgetId: primary_event, action: promote }
    priority: 95

  - id: injection_30min
    condition: { type: time_proximity, params: { event: injection, hours_before: 0.5 } }
    effect: { widgetId: injection_timeline, action: promote }
    priority: 90

  - id: emotion_drop
    condition: { type: emotion_state, params: { trend: declining, window_hours: 24 } }
    effect: { widgetId: partner_sync, action: highlight }
    priority: 85

  - id: quiet_day
    condition: { type: day_type, params: { no_events: true } }
    effect: { widgetId: mood_quicklog, action: promote }
    priority: 50
```

**[TEST: 동적 레이아웃]**
```
T-DL-01: 시술 D-1에 primary_event 위젯이 최상단에 위치한다.
T-DL-02: 주사 30분 전에 injection_timeline이 최상단으로 올라온다.
T-DL-03: 감정 점수 하락 후 24시간 내에 partner_sync 위젯이 하이라이트된다.
T-DL-04: 이벤트 없는 날에 mood_quicklog가 최상단에 위치한다.
T-DL-05: 위젯 순서가 변경될 때 300ms 애니메이션으로 부드럽게 전환된다.
```

---

## §5. 데이터 모델

### 5.1 Supabase 테이블 스키마

```sql
-- 사용자
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  display_name TEXT,
  voice_enabled BOOLEAN DEFAULT true
);

-- 에셋
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,  -- 'fertility' | 'cancer_caregiver' | 'pet_care' | 'chronic' | 'custom'
  display_name TEXT NOT NULL,
  palette TEXT NOT NULL DEFAULT 'dawn',
  tab_config JSONB NOT NULL,
  widget_config JSONB NOT NULL,
  layout_rules JSONB NOT NULL DEFAULT '[]',
  formation_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'forming',  -- 'forming' | 'active' | 'archived'
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now()
);

-- 위젯 데이터 (에셋별)
CREATE TABLE widget_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id),
  widget_type TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 감정 기록
CREATE TABLE mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id),
  emoji TEXT NOT NULL,
  label TEXT NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now()
);

-- 파트너 관계
CREATE TABLE partner_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id),
  partner_user_id UUID REFERENCES users(id),
  role TEXT NOT NULL,  -- 'primary_caregiver' | 'observer'
  sync_enabled BOOLEAN DEFAULT true
);

-- Formation 대화 로그
CREATE TABLE formation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id),
  step_id TEXT NOT NULL,
  ai_message TEXT NOT NULL,
  user_response TEXT,
  response_type TEXT,  -- 'preset' | 'voice' | 'text'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**[TEST: 데이터]**
```
T-DB-01: 에셋 생성 시 assets 테이블에 레코드가 생성된다.
T-DB-02: Formation 각 스텝마다 formation_logs에 기록된다.
T-DB-03: 감정 선택 시 mood_logs에 즉시 기록된다.
T-DB-04: 에셋 아카이브 시 status가 'archived'로 변경되고 데이터는 보존된다.
T-DB-05: 파트너 링크 생성 시 partner_links에 role과 sync 상태가 기록된다.
```

---

## §6. 에셋 전환 애니메이션 스펙

### 6.1 전환 시퀀스 (총 400ms)

```
0ms    — 현재 화면 opacity 1→0, translateY 0→20px (200ms ease-out)
         동시에 배경 그라데이션 크로스페이드 시작
100ms  — 탭바 아이콘 crossfade 시작 (150ms)
200ms  — 현재 화면 unmount
         새 화면 mount (opacity 0, translateY -20px)
200ms  — 새 화면 opacity 0→1, translateY -20px→0 (200ms ease-out)
400ms  — 전환 완료
```

### 6.2 React Native 구현 가이드

```typescript
// useAssetTransition.ts
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';

const TRANSITION_DURATION = 400;
const HALF = TRANSITION_DURATION / 2;

export function useAssetTransition() {
  const progress = useSharedValue(0);
  const currentAssetId = useSharedValue<string | null>(null);

  const switchTo = (newAssetId: string) => {
    // Phase 1: fade out current
    progress.value = withTiming(1, {
      duration: HALF,
      easing: Easing.out(Easing.cubic),
    });

    // Phase 2: swap and fade in (after HALF ms)
    setTimeout(() => {
      currentAssetId.value = newAssetId;
      progress.value = 0;
      progress.value = withTiming(0, {
        duration: HALF,
        easing: Easing.out(Easing.cubic),
      });
    }, HALF);
  };

  return { progress, currentAssetId, switchTo };
}
```

### 6.3 에셋 드롭다운 UI

```typescript
// AssetSwitcher 컴포넌트
// 헤더 왼쪽에 위치. 현재 에셋 이름 + ▾ 아이콘.
// 탭 시 bottom sheet (react-native-bottom-sheet)로 에셋 목록 표시.

interface AssetSwitcherProps {
  currentAsset: Asset;
  allAssets: Asset[];
  onSwitch: (assetId: string) => void;
  onCreateNew: () => void;
}

// Bottom sheet 내부:
// - 각 에셋은 palette accent dot + displayName + 상태 배지
// - 현재 활성 에셋은 ● (filled dot), 나머지는 ○ (outline dot)
// - 하단에 "＋ 새 에셋 만들기" 버튼
// - 에셋 long-press 시 아카이브 옵션
```

**[TEST: 에셋 드롭다운]**
```
T-SD-01: 헤더의 에셋 이름을 탭하면 bottom sheet가 올라온다.
T-SD-02: bottom sheet에 모든 active 에셋이 표시된다.
T-SD-03: 각 에셋 옆에 해당 팔레트의 accent 컬러 닷이 표시된다.
T-SD-04: 현재 활성 에셋은 filled dot(●)으로 표시된다.
T-SD-05: 에셋을 탭하면 bottom sheet가 닫히고 §6.1 전환 시퀀스가 실행된다.
T-SD-06: "새 에셋 만들기"를 탭하면 Formation 플로우로 진입한다.
T-SD-07: 에셋을 long-press하면 "아카이브" 옵션이 표시된다.
```

---

## §7. 디자인 토큰

### 7.1 팔레트

```typescript
const palettes = {
  dawn: {
    50: '#FDF7F4', 100: '#FAE8E0', 200: '#F5D0C3',
    300: '#EEB3A0', 500: '#D4634F',
    gradient: 'linear-gradient(135deg, #D4634F 0%, #E89580 55%, #EEB3A0 100%)',
    bgMesh: [
      'radial-gradient(at 20% 0%, rgba(253,231,217,0.6) 0%, transparent 50%)',
      'radial-gradient(at 80% 15%, rgba(250,201,184,0.4) 0%, transparent 50%)',
    ],
  },
  mist: {
    50: '#F0F4F8', 100: '#D6E0EA', 200: '#B1C4D6',
    300: '#819DB8', 500: '#2E547B',
    gradient: 'linear-gradient(135deg, #56789A 0%, #819DB8 55%, #B1C4D6 100%)',
  },
  blossom: {
    50: '#FFF5F7', 100: '#FDE2E8', 200: '#FAC4D1',
    300: '#F29CB5', 500: '#C14B73',
    gradient: 'linear-gradient(135deg, #C14B73 0%, #E06F92 55%, #F29CB5 100%)',
  },
  sage: {
    50: '#F3F6F2', 100: '#DCE6D8', 200: '#B8CBB2',
    300: '#91AE8B', 500: '#4E7049',
    gradient: 'linear-gradient(135deg, #4E7049 0%, #6D8F68 55%, #91AE8B 100%)',
  },
};
```

### 7.2 타이포그래피

```typescript
const typography = {
  // iOS Large Title
  largeTitle: { fontFamily: 'Pretendard-Bold', fontSize: 28, letterSpacing: -1.1 },
  // iOS Title 1
  title1: { fontFamily: 'Pretendard-Bold', fontSize: 24, letterSpacing: -0.8 },
  // iOS Headline
  headline: { fontFamily: 'Pretendard-Semibold', fontSize: 17, letterSpacing: -0.4 },
  // iOS Body
  body: { fontFamily: 'Pretendard-Regular', fontSize: 17, letterSpacing: -0.4 },
  // iOS Callout
  callout: { fontFamily: 'Pretendard-Regular', fontSize: 16, letterSpacing: -0.3 },
  // iOS Subhead
  subhead: { fontFamily: 'Pretendard-Regular', fontSize: 15, letterSpacing: -0.2 },
  // iOS Footnote
  footnote: { fontFamily: 'Pretendard-Regular', fontSize: 13, letterSpacing: -0.1 },
  // iOS Caption 1
  caption1: { fontFamily: 'Pretendard-Regular', fontSize: 12, letterSpacing: 0 },
  // iOS Caption 2
  caption2: { fontFamily: 'Pretendard-Regular', fontSize: 11, letterSpacing: 0.1 },

  // Display (Fraunces) — 감성 헤더용
  displayLarge: { fontFamily: 'Fraunces-LightItalic', fontSize: 22, letterSpacing: -0.5 },
  displayAccent: { fontFamily: 'Fraunces-LightItalic', fontSize: 16, letterSpacing: -0.3 },
};
```

### 7.3 위젯 스타일 규칙

```typescript
const widgetStyles = {
  card: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    backdropFilter: 'blur(20px)',
    borderRadius: 14,
    // iOS 표준 카드 라운딩
  },
  primaryCard: {
    // 에셋 팔레트의 gradient 사용
    borderRadius: 14,
  },
  separator: {
    color: 'rgba(60,60,67,0.12)',
    height: 0.5,
    // StyleSheet.hairlineWidth 사용
  },
  tabBar: {
    height: 84,  // iOS 표준 (safe area 포함)
    backgroundColor: 'rgba(249,249,249,0.88)',
    backdropFilter: 'blur(20px)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(60,60,67,0.12)',
  },
};
```

---

## §8. 컴포넌트 트리

```
App
├── AuthGate
├── AssetProvider (Zustand)
│   ├── AssetSwitcher (헤더 드롭다운)
│   └── AssetScreen
│       ├── HomeTab
│       │   ├── WidgetList (동적 순서)
│       │   │   ├── PrimaryEventCard
│       │   │   ├── CalendarMiniWidget
│       │   │   ├── InjectionTimeline
│       │   │   ├── MoodQuickLog
│       │   │   ├── PartnerSyncBar
│       │   │   ├── QuestionChecklist    (Cancer only)
│       │   │   ├── PetProfileCard       (Pet only)
│       │   │   ├── DailyLogBars         (Pet only)
│       │   │   ├── WeeklyBarGraph       (Chronic only)
│       │   │   ├── MonthlyHeatmap       (Chronic only)
│       │   │   └── TriggerAnalysis      (Chronic only)
│       │   └── ...
│       ├── CalendarTab (Fertility, Pet)
│       ├── MoodTab (Fertility)
│       ├── PartnerTab (Fertility)
│       ├── ChecklistTab (Cancer)
│       ├── InsightTab (Cancer)
│       ├── GraphTab (Chronic)
│       ├── DashboardTab (Chronic)
│       └── SettingsTab (Pet, Chronic)
├── FormationFlow
│   ├── FormationChat
│   │   ├── AIMessage
│   │   ├── UserMessage
│   │   ├── PresetOptions
│   │   ├── FreeTextInput
│   │   └── VoiceInputButton
│   └── FormationConfirmation
└── TabBar (동적 — 에셋별 탭 구성)
```

---

## §9. Claude Code 실행 순서

### Phase 1: 프로젝트 초기화 (Day 1)
```bash
npx create-expo-app modu --template tabs
cd modu
npx expo install zustand @supabase/supabase-js react-native-reanimated react-native-gesture-handler @gorhom/bottom-sheet
```

### Phase 2: 디자인 토큰 + 공통 컴포넌트 (Day 1-2)
- `src/theme/palettes.ts` — §7.1
- `src/theme/typography.ts` — §7.2
- `src/theme/widgets.ts` — §7.3
- `src/components/Card.tsx` — 기본 카드
- `src/components/PrimaryCard.tsx` — 액센트 카드
- `src/components/TabBar.tsx` — 동적 탭바

### Phase 3: 에셋 시스템 (Day 2-3)
- `src/store/assetStore.ts` — Zustand 에셋 상태
- `src/components/AssetSwitcher.tsx` — 드롭다운 + bottom sheet
- `src/hooks/useAssetTransition.ts` — 전환 애니메이션
- `src/screens/AssetScreen.tsx` — 에셋별 라우팅

### Phase 4: Formation 플로우 (Day 3-4)
- `src/screens/FormationFlow.tsx`
- `src/components/formation/PresetOptions.tsx`
- `src/components/formation/VoiceInput.tsx`
- `src/data/formationSteps.ts` — 각 에셋 타입별 스텝 정의

### Phase 5: 에셋별 위젯 구현 (Day 4-7)
- Fertility 위젯 5종
- Cancer Caregiver 위젯 5종
- Pet Care 위젯 5종
- Chronic 위젯 6종

### Phase 6: 동적 레이아웃 엔진 (Day 7-8)
- `src/engine/layoutEngine.ts`
- `src/engine/rules/` — 에셋별 규칙 파일

### Phase 7: Supabase 연동 (Day 8-9)
- Auth (이메일 / Apple Sign-In)
- 에셋 CRUD
- 위젯 데이터 sync
- 파트너 링크

### Phase 8: 테스트 + 폴리시 (Day 9-10)
- 모든 [TEST] 블록 검증
- 전환 애니메이션 60fps 확인
- 다크모드 (팔레트 자동 조정)
- 접근성 (VoiceOver 대응)

---

## §10. CLAUDE.md (Claude Code 세션용)

아래 내용을 프로젝트 루트의 `CLAUDE.md`에 저장한다.

```markdown
# MODU — Claude Code Context

## What is this?
MODU는 AI 대화로 형성되는 초개인화 건강·돌봄 동반자 앱이다.
사용자는 "에셋"이라는 단위로 자신의 건강 상황(난임, 항암, 반려동물, 만성질환 등)을
앱 안에 구축하고, 에셋에 따라 UI 구조·색상·위젯·탭바가 완전히 달라진다.

## Key files
- `PROJECT_SPEC.md` — 전체 스펙. 모든 구현의 근거. [TEST] 블록이 검증 기준.
- `src/theme/` — 디자인 토큰 (팔레트, 타이포, 위젯 스타일)
- `src/store/assetStore.ts` — 에셋 상태 관리 (Zustand)
- `src/data/formationSteps.ts` — Formation 대화 스텝 정의

## Design principles
1. 빈 화면보다 잘 고른 선택지 — 프리셋 > 자유입력
2. 목소리는 타이핑과 같은 무게
3. 가장 좋은 돌봄은 조용한 돌봄 — 알림 최소화, 필요한 것이 이미 거기에
4. iOS 네이티브 퀄리티 — SF Pro 느낌, blur 배경, 0.5px separator

## Slogan
"Listen to your life."

## Tech stack
React Native (Expo) + TypeScript + Zustand + Supabase + Claude API (Sonnet)

## Color system
에셋마다 팔레트가 다르다:
- Dawn (테라코타) → Fertility
- Mist (블루) → Cancer Caregiver
- Blossom (핑크) → Pet Care
- Sage (그린) → Chronic

## Critical rule
에셋 전환 시 탭바·배경·위젯 구조가 모두 바뀐다.
전환 애니메이션은 400ms, 크로스페이드.
```
