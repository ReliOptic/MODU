# Timeflow Frontend Plan — 위젯에서 시간흐름으로

작성일: 2026-04-17
작성 맥락: 프론트엔드 C-레벨 (CTO / VP Eng / CDO) 합의용 기획서
Status: **Draft for review**
연결: ADR-0003 (Memory-First) · ADR-0002 (AI Edge Function) · CEO 메모 II (Semantic Memory)

> **한 줄**: 현재 홈은 *카드 5-6개의 격자*다. 다음 단계는 *지금을 중심으로 흐르는 시간의 강(Time River)*이다. 시간·장소·상황(TPO)에 따라 같은 데이터가 다른 표정으로 나타나고, 사용자의 모든 입력은 timeline event 로 누적되어 AI 가 이해·학습한다.

---

## 1. 진단 — 왜 위젯 패러다임이 한계인가

### 1.1 현재 (위젯 패러다임)

```
[Primary Event Card]            ← 다음 이벤트 1개
[Calendar Mini]                 ← 정적 달력
[Injection Timeline]            ← 카드 안의 미니 timeline
[Mood Quicklog]                 ← 4 이모지 토글
[Partner Sync]                  ← 단순 상태 표시
```

- **위젯은 정적**: 같은 데이터가 같은 위치에 같은 색으로.
- **시간이 평면적**: "지금"이 강조되지 않음. 어제 / 오늘 / 내일이 동등.
- **TPO 무반응**: 아침이든 밤이든, 집이든 병원이든, 같은 화면.
- **AI 입력 빈약**: 사용자 인터랙션이 timeline event 로 누적되지 않아 학습 컨텍스트 부족.
- **Narrative 부재**: 데이터만 표시 — *"지금 무슨 의미인가"* 가 없음.

### 1.2 최신 고도화 앱들이 가진 것

| 앱 | 핵심 패러다임 | 우리에게 시사 |
|----|-------------|--------------|
| Apple Health (Highlights) | 시간 슬라이스 + AI narrative | "이번 주 평균 수면 7h12m, 지난주 대비 +18min" 같은 자연어 |
| Notion AI Timeline | append-only event + slash-command | event-first 데이터 모델 |
| Things 3 (Today) | 현재성 강조 + 평온함 | "지금"의 시각적 권위 |
| Apple Photos Memory | 과거 같은 날 자동 surfacing | 시간의 복리 surfacing |
| Strava (Last Week) | story format weekly digest | AI distill → narrative |

공통점: **데이터 → 시간 → 의미** 순서. 우리는 아직 데이터에 머물러 있다.

---

## 2. 목표 패러다임 — Timeflow

### 2.1 핵심 명제

1. **NOW 가 화면의 중심**. 위로는 *방금 흘러간 것* (past 30분-12h), 아래로는 *다가오는 것* (next 24h).
2. **모든 카드는 narrative 단위**. 단순 숫자 X. *"○○님, 30분 전 산책 30분 다녀오셨어요. 평소 화요일보다 길었네요."*
3. **TPO 에 따라 같은 데이터가 다른 표정**. 아침엔 따뜻한 톤, 진료일엔 차분한 톤, 회복기엔 부드러운 톤.
4. **모든 인터랙션은 ChapterMemory 로 append**. AI 가 시간 흐름을 학습 가능.
5. **AI 가 사용자 패턴을 매주 distill** → UI 가 다음 주 더 똑똑해짐 (closed loop).

### 2.2 사용자 체험 한 줄

> *"앱을 열면 지금 내 삶이 어디쯤인지 한눈에 보이고, 그 흐름이 나를 따라 흘러간다."*

---

## 3. 핵심 컴포넌트 패턴 — 5개

### 3.1 `<TimeRiver>` (홈 main)

위에서 아래로 흐르는 시간 축.

```
─── 12h 전 ────────────────────────  past glance
  · 아침 Gonal-F 완료 (07:00)
  · 외출 30분 (08:30)
─── now ─────────────────────────── ◉  ← 항상 화면 중앙
  · 다음 주사 25분 후
  · 오늘의 마음 [😌 😮‍💨 😢 🌱]
─── next 24h ────────────────────── upcoming
  · 21:00 저녁 Cetrotide
  · 내일 09:00 배아 이식 (D-1) ← 큰 카드
─── beyond ──────────────────────── horizon
  · 5/12 X-ray 재검사
```

- 스크롤이 시간을 따라감 (위로 = 과거, 아래로 = 미래)
- NOW marker 는 sticky (스크롤 상관없이 화면 중앙)
- past 는 작고 단색, future 는 풀컬러
- 24h 너머는 horizon 으로 dim

### 3.2 `<StoryCard>` (이벤트의 의미)

단순 데이터 카드를 대체하는 narrative 단위.

```
이전 (위젯):
  ┌─────────────────────┐
  │ Gonal-F · 07:00 ✓   │
  └─────────────────────┘

이후 (StoryCard):
  ┌─────────────────────┐
  │ 아침 Gonal-F          │
  │ 07:00 · 복부 · 완료   │
  │                       │
  │ 5회차 중 오늘이 가장   │  ← AI distill (cached)
  │ 가벼우셨어요.         │
  └─────────────────────┘
```

- template + LLM-rendered narrative line (weekly cached)
- 사용자가 narrative line tap = "이 통찰 어땠어요?" 미세 피드백 → AI 개선
- 무거운 LLM 호출은 weekly distill 시 미리

### 3.3 `<AmbientPalette>` (TPO 배경)

하루 시간 / 장소 / 날씨 / 사용자 phase 에 따라 배경 톤 변화.

| Time of day | Tone |
|-------------|------|
| 04-09h 새벽·아침 | dawn 50→100 → warm peach |
| 09-17h 낮 | 50→200 base, 약간 채도 ↑ |
| 17-21h 저녁 | dusk overlay 약간 |
| 21-04h 밤 | mist + dim → 눈 안 피로하게 |

| Phase | Tone overlay |
|-------|--------------|
| 항암 직후 36h | desaturate -20% (회복 모드) |
| 시술 D-1 | 약간 채도 ↑ (집중 모드) |
| 평온한 날 | base palette |

배경은 palette 의 same family 안에서만 흐른다 (브랜드 일관성 유지).

### 3.4 `<MemoryGlance>` (시간 복리 surfacing)

```
1년 전 오늘
  ┌─────────────────────┐
  │ 시험관 1회차          │
  │ "오늘 처음 주사 맞았다.│
  │  떨렸지만 잘했다."    │
  └─────────────────────┘
```

- 1년 / 3년 / 같은 회차 N년 전 ChapterMemory 자동 surfacing
- Apple Photos Memory 모델
- *"내 의료 기억이 쌓여간다"* 의 시각적 증거 — moat 강화 UX

### 3.5 `<NextActionPrompt>` (제로 마찰 로깅)

```
화면 하단 floating:
  ┌─────────────────────────┐
  │ 21:00 Cetrotide      ✓ │  ← tap = 즉시 완료 기록
  └─────────────────────────┘
```

- 다음 한 액션을 항상 surface
- TabBar 위에 떠 있음
- tap 하면 즉시 ChapterMemory append (확인 다이얼로그 없음)
- swipe-left = 5분 후 다시 / swipe-right = 건너뛰기 (스누즈/skip 도 event)

---

## 4. TPO Sensors — 어떤 신호를 읽는가

| Sensor | 출처 | 갱신 주기 | 사용처 |
|--------|------|----------|--------|
| Hour of day | `Date.now()` | 1분 tick (이미 V2) | AmbientPalette + greeting tone |
| Day of week | 동일 | 1분 | weekly pattern (월요일 ↔ 일요일) |
| Lunar / 절기 | 한국 음력 lib | 일 1회 | "한식 직전 컨디션 패턴" 등 |
| Phase | `eventPhaseAt()` (이미 V2) | 1분 | AmbientPalette + StoryCard tone |
| Coarse location | `expo-location` (city level) | 1시간 | "집/외부/병원" 추정 |
| Calendar context | iOS EventKit / Android | 30분 | 다음 외부 일정 ↔ 의료 일정 충돌 감지 |
| Mood trend | 최근 7d mood_log | 매 진입 | AmbientPalette desaturation |
| Bio (옵션) | HealthKit/HealthConnect | 동기화 시 | 수면·심박 → 회복 phase 보조 |
| Weather (옵션) | 외부 API or Edge Function | 30분 | "비 오는 날 편두통 패턴" |

**원칙**: TPO 는 **보조 신호**. 사용자 명시 입력이 항상 우선. AI 가 추측해서 잘못된 톤을 깔지 않게 fallback = base palette.

---

## 5. AI Learning Layer — Closed Loop

### 5.1 데이터 흐름

```
사용자 인터랙션
   ↓ (every action = ChapterMemory append)
ChapterMemory timeline
   ↓ (weekly cron, Edge Function)
weekly.distill (Claude Sonnet)
   ↓
profile.context_hints (jsonb)
   ↓ (next render)
useWidgetOrder + StoryCard narrative
   ↓
사용자 인터랙션 ... (loop)
```

### 5.2 `profile.context_hints` 스키마 (예)

```json
{
  "patterns": [
    {
      "name": "evening_fatigue",
      "evidence": "지난 4주 화/목 19-22h 사이 mood_log 평균 -1.2",
      "confidence": 0.78,
      "suggested_widgets_promote": ["mood_quicklog"],
      "suggested_widgets_demote": []
    },
    {
      "name": "post_chemo_isolation",
      "evidence": "항암 다음날 partner_sync 미사용 4/5회",
      "confidence": 0.65,
      "suggested_actions": ["nudge_partner_share"]
    }
  ],
  "narratives": {
    "morning_greeting": "오늘은 항암 다음 날이에요. 천천히 가요.",
    "evening_close": "오늘 한 일이 많았어요. 수면 30분 더 어떨까요?"
  },
  "updated_at": "2026-04-13T03:00:00Z"
}
```

이 hints 가 useWidgetOrder 의 추가 input 이 되어 layoutEngine.ts 가 사용. **사용자가 더 오래 쓸수록 더 똑똑해짐 — 이게 moat.**

### 5.3 Privacy 관점

- context_hints 는 user-owned (export 시 포함)
- "왜 이런 추천?" 탭 가능 → evidence 표시 (XAI)
- 사용자가 hint 거절 → `dismissed_hints` 에 저장하고 향후 안 보임

---

## 6. React Native 구현 전략 — C-레벨 합의용

### 6.1 CTO 관점 — 데이터·확장성

| 영역 | 현재 | 추가 작업 | Risk |
|------|------|-----------|------|
| Data model | ChapterMemory 스키마 ADR-0003 작성됨 | content_hints 컬럼 + memory.kind 'narrative_card' 추가 | 낮음 |
| AI pipeline | Edge Function ai/{intent} 구현됨 | weekly.distill cron + context_hints 저장 | 중 |
| 위젯 엔진 | V2 (event_phase + user_context) | + context_hints input 추가 | 낮음 |
| Real-time | 미구현 | Supabase Realtime → memory append broadcast | 중 |

### 6.2 VP Eng 관점 — 구현 가능성·팀 부담

| 컴포넌트 | 새 native 모듈 | 추정 공수 (1 dev) |
|----------|---------------|-------------------|
| TimeRiver | 0 (FlashList + reanimated) | 1주 |
| StoryCard | 0 (template + cached LLM string) | 0.5주 |
| AmbientPalette | 0 (LinearGradient + interpolate) | 0.5주 |
| MemoryGlance | 0 (memory query + Card) | 0.5주 |
| NextActionPrompt | 0 (Pressable + reanimated swipe) | 1주 |
| TPO sensors (location/calendar) | expo-location + expo-calendar | 1주 |
| AI Learning loop | Edge Function cron | 1주 |

**총 5.5주 (1 dev) — 6주 sprint 1회로 v1 진입 가능.**

### 6.3 CDO 관점 — 디자인·브랜드

- 위젯 → narrative 전환 = "차가운 의료 앱" → "동반자" 톤 강화
- AmbientPalette = MODU 의 와우 모먼트 (다른 의료 앱 X)
- StoryCard 의 LLM line = 브랜드 보이스 (warm, restrained, observant) 가이드 필요
- Dark mode 자동 따라옴 (palette dark variant)
- 접근성: VoiceOver 가 timeline 을 시간 순서로 읽도록 accessibilityRole + accessibilityValue 명시

---

## 7. Phasing — 6주 Sprint 분할

### Sprint α (Week 1-2) · "Time-First"
- `TimeRiver` 컴포넌트 + 홈 탭 교체
- `StoryCard` v0 (LLM 없이 정적 narrative template)
- `AmbientPalette` (time-of-day 만)
- ChapterMemory query → TimeRiver 데이터 source

### Sprint β (Week 3-4) · "TPO Aware"
- `expo-location` (coarse) + `expo-calendar` 연동
- AmbientPalette 에 phase / location overlay
- `NextActionPrompt` floating bar

### Sprint γ (Week 5-6) · "Memory & Closed Loop"
- `MemoryGlance` (1년 전 오늘)
- Edge Function `weekly.distill` 구현
- `profile.context_hints` 컬럼 + useWidgetOrder 통합
- StoryCard v1 (LLM cached narrative)

### Sprint δ (Week 7-8, 출시 직전) · "Polish"
- 60fps 검증 (FlashList tuning)
- VoiceOver / TalkBack labels
- 다크 모드 token 정비
- 5초 후킹 영상용 motion polish

---

## 8. 핵심 의사결정 포인트 (C-레벨 합의 필요)

| # | 결정 | 옵션 | 권고 |
|---|------|------|------|
| 1 | TimeRiver 가 home 을 완전 교체? 부분? | (a) 완전 교체 (b) toggle 옵션 | **(a) 완전 교체** — 패러다임 흔들면 안 됨 |
| 2 | LLM narrative line 의 cache 주기 | weekly / daily / on-demand | **weekly** (비용+안정) |
| 3 | TPO 위치 정확도 | precise (병원·약국 특정) / coarse (city) | **coarse + 사용자 명시 추가** (privacy) |
| 4 | NextActionPrompt 의 swipe gesture | left=지연, right=skip / 그 반대 | **left=지연, right=skip** (iOS 메일 컨벤션) |
| 5 | MemoryGlance 의 surfacing 빈도 | 매일 / 주 1회 / 의미 있는 날만 | **의미 있는 날만** (시술일·기념일) — overload 방지 |
| 6 | context_hints 사용자 노출 | 항상 / "왜 이런?" 탭 시 | **탭 시** (XAI 가능, 평소엔 보이지 않음) |

---

## 9. 성공 지표 (Sprint α 종료 기준)

- [ ] TimeRiver 60fps 스크롤 (iOS 12 mini 기준)
- [ ] 첫 진입 → "지금이 어디쯤인지" 인지 시간 < 3초 (사용자 테스트)
- [ ] StoryCard narrative 한 줄에 *"오늘 무엇이 의미 있나"* 가 담겨있다 (CDO 검수)
- [ ] ChapterMemory append 가 모든 인터랙션에서 일어남 (테스트 커버리지)
- [ ] tsc --noEmit 0 errors, web export builds

---

## 10. 결론 — 한 문단

> 위젯 패러다임은 *데이터를 보여준다*. Timeflow 패러다임은 *시간 안에 자기 삶을 본다*. 후자는 (a) 사용자에게 더 의미있고 (b) AI 가 학습할 컨텍스트가 풍부하며 (c) 5년 사용자가 떠날 비용이 폭증한다 (= moat). 6주 sprint 한 사이클로 진입 가능하며, 이미 깔린 인프라(ChapterMemory · V2 엔진 · Edge Function · TabBar) 위에 layered.

이 기획이 합의되면 **ADR-0009: Timeflow Paradigm** 으로 정식화하고 Sprint α 착수.

---

## 참조

- ADR-0003 Memory-First Data Model (이미 ChapterMemory 시민화)
- ADR-0002 AI Edge Function (weekly.distill intent 이미 정의)
- CEO 메모 II §2 Semantic Memory Layer (WHY/PATTERN/HANDOFF/NARRATIVE/COMMUNITY)
- CPO Review §3.6 (지속 로깅 습관 KPI)
