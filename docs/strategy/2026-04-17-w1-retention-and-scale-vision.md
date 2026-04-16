# W1 Retention · App-Open TPO Reactivity · Care-Economy Scale Vision

작성일: 2026-04-17 (founder voice)
Status: **Pinned strategy** — 데모·제품·메트릭의 단일 정렬축
연결: ADR-0011 (Local-First) · ADR-0012 (Gemma) · Timeflow Plan · CTO Adaptive Engine Plan · Memo II (Semantic Memory)

> **한 줄**: MODU 의 1순위 KPI 는 **W1 retention**. 이를 받치는 두 축은 ① **App-Open TPO 즉시성** (열자마자 1초 안에 적응한 화면) 와 ② **매일 쓰게 만드는 micro-loop**. 그 위에 ③ **Care-Economy Scale Vision** (의미있는 스케일이 모이면 정책·국가비교·의사결정 모델의 source) 이 demo finale 로 들어가야 한다.

---

## 1. KPI 우선순위

| 순위 | 지표 | 목표 (v1 KR) | 측정 시점 |
|------|------|--------------|----------|
| **1** | **W1 retention (D1+D7 active)** | ≥ 35% | 출시 1개월 |
| 2 | DAU/MAU | ≥ 0.40 (의료 카테고리 기준 고) | 3개월 |
| 3 | 첫 챕터 → ChapterMemory append 도달률 | ≥ 70% | 첫 24h |
| 4 | App-open → first meaningful paint | ≤ 1.0s | p95 |
| 5 | 챕터 archive 비율 vs 폐기 비율 | archive ≥ 80% | 6개월 |
| 6 | Plus 전환률 | ≥ 8% (의료 freemium 표준의 2x) | 6개월 |

> **모든 design/code/copy 결정은 W1 retention 에 +/- 효과 명시**. neutral 이면 폐기.

---

## 2. App-Open TPO 즉시성 — 1초의 와우

### 2.1 첫 frame 이 적응한 모습이어야 한다

> "앱을 열면 현재 시간·장소·내 일정 모두를 인지한 화면이 이미 거기에 있다."

**작동 모델 (cold start 1.0s 안)**:
1. **0~200ms** — splash 짧게, **last known TPO** 로 초기 layout pre-render (local persist 에서 즉시)
2. **200~600ms** — 실시간 TPO 재평가 (1분 tick 첫 회), AmbientPalette 보정
3. **600~1000ms** — `<TPOSignature>` chip 잠시 surfacing ("저녁 9시 · 보리 약 30분 후 · 평온")
4. **1000ms+** — TimeRiver 가 NOW marker 중심으로 안정

### 2.2 `<TPOSignature>` 컴포넌트 (신규)

TimeRiver 상단에 1.5초 floating chip:

```
[ 🌙 21:34 · 🩺 보리 약 30분 후 · 🪶 평온 ]
```

- 매 진입 시 잠시 표시 → fade out
- 사용자가 *"앱이 나를 알고 있다"* 인지하는 순간
- `TPOSignature` 가 W1 retention 의 가장 강한 lever

### 2.3 기술 budget

- Local persist 가 hit 인 경우: 첫 paint 200ms 가능
- Persist miss (첫 진입) 인 경우: WelcomeScreen 또는 OrbitOnboarding 으로
- TPO 평가는 **순수 함수** (V2 layout engine, $0 cost) — 1초 budget 안에 넉넉

---

## 3. 매일 쓰게 만드는 micro-loop

### 3.1 의료 앱 retention 의 일반 실패

- 매일 친근한 이유가 없으면 → 약 다 떨어진 후 X
- 게이미피케이션 (스트릭) → 의료 카테고리에서는 anti-pattern (grammar §4.1)
- 알림 폭격 → 1주일 안에 mute

### 3.2 MODU 의 매일 lever 4개

| Lever | UX | 트리거 |
|-------|-----|--------|
| **NextActionPrompt** | floating "21:00 Cetrotide ✓" 한 탭 | 일정 30분 전 + 진입 시 |
| **오늘의 한 줄** | 잠자기 전 30초 free input → ChapterMemory | 매일 21시 push (조용한 톤) |
| **Memory Glance** | 1년 전 오늘 surfacing | 의미 있는 날만 (생일/첫 회차/시술일) |
| **Weekly Distill 도착** | 일요일 새벽 cron → 월요일 진입 시 카드 | 주 1회 |

### 3.3 알림 정책 — 절제

- 일일 push ≤ 1건 (그날 가장 의미 있는 1건만)
- 의료 emergency 외 silent
- 사용자가 알림 1번 OFF 하면 다음 알림은 1주일 후
- 절대 "스트릭 끊어졌어요" / "오늘 안 들렀네요" 류 X

---

## 4. Care-Economy Scale Vision — Demo Finale

### 4.1 왜 이게 demo 에 필요한가

투자자/advisor 가 보는 demo 의 마지막 90초가 *"이게 풍선이 아니라 인프라가 될 수 있다"* 의 증거여야 한다. 작은 챕터 수집기로 보이면 ARR 추산 외 상상력이 닫힌다.

### 4.2 Scale 비전 카드 (3장)

```
[1만 명] 한국 만성 편두통 환자의 1만 챕터.
         AI 가 "주중 카페인이 트리거" 라는 패턴을 통계로 검증.
         식약처에 의료기기 SW 자문 의뢰 — 일반 SW 인정 받음.

[100만 명] 시험관·항암·돌봄 챕터 100만 개.
           "한국 50대 여성 시험관 평균 4.3회차" 같은
           이전 어떤 곳에도 존재하지 않던 데이터셋.
           정책·제약·보험 영역의 표준 소스로 채택.

[1억 명] (글로벌 5년) 의료 결정의 컨텍스트가 모인
         첫 글로벌 라이브러리. 개인 AI 비서가
         사용자 동의 하에 "내 챕터" 를 참조하는
         universal source.
```

### 4.3 Demo 구현 (DemoFinaleCard 컴포넌트)

DemoControlPanel 하단 또는 별도 floating card 에 *"Scale Vision 보기"* 탭 → 3장 카드 슬라이드:

- 카드 1: 챕터 한 개의 의미 (개인)
- 카드 2: 1만 챕터의 의미 (커뮤니티)
- 카드 3: 1억 챕터의 의미 (인프라)

각 카드 = 짧은 motion + 한 줄 메시지. 5초씩 = 15초 finale.

### 4.4 윤리 가드 (slide 안에 명시)

- "익명·집계로만, 사용자 명시 동의 시"
- "원천 데이터는 절대 매각 X"
- "참여는 opt-in, 언제든 철회"

→ Scale 비전이 데이터 수익화로 보이지 않게. CEO Memo II §7 안티패턴 준수.

---

## 5. W1 Retention 직접 lever — 코드 우선순위

| 우선 | 작업 | 효과 가설 |
|------|------|----------|
| P0 | TPOSignature chip 구현 | 첫 진입 와우 → D1 retention +5pp |
| P0 | NextActionPrompt floating | 매일 1탭 행동 → D7 +8pp |
| P0 | OrbitOnboarding (다음 패치) | 첫 챕터 도달률 +20pp |
| P1 | "오늘의 한 줄" 21시 push (절제 톤) | D7 +3pp |
| P1 | Weekly distill 월요일 카드 | W2 retention +5pp |
| P2 | Memory Glance 의미 있는 날만 | W4 retention +3pp |
| P2 | Scale Vision finale demo card | 투자자 close +20% |

---

## 6. Demo 시연 흐름 재정의 (5분 시나리오)

```
0:00-0:30  WelcomeScreen (5팔레트 mesh + slogan)
0:30-1:30  OrbitOnboarding — 키워드 60+ 표류 → 사용자 1-3개 탭 → 챕터 birth ritual
1:30-2:00  TPOSignature chip (첫 진입 와우)
2:00-3:30  TPO Live — auto-cycle 로 6개 시나리오 자동 advance,
           위젯이 라이브 재배치 (사용자는 가만히 봐도 됨)
3:30-4:00  NextActionPrompt 한 탭 → 즉시 ChapterMemory append → "오늘 잘했어요" 미세 피드백
4:00-4:45  Scale Vision 3 cards (1만 / 100만 / 1억)
4:45-5:00  Q&A 자유 (시연자가 자유 입력 → 즉석 챕터 birth, 폼 완전 자유 강조)
```

핵심: **시나리오 list 클릭이 아니라 흐름이 자동으로 가**. 시연자는 1-2번만 탭하면 된다.

---

## 7. 정책·연구 데이터 source 포지셔닝 (장기)

장기적으로 MODU 의 데이터셋이 가질 수 있는 위상:

- **국가 보건정책 입력**: "30대 시험관 평균 회차" "항암 보호자 평균 burnout 시점" 등을 정부 통계청·국민건강보험공단에 제공 (anonymized + opt-in)
- **국가간 비교**: KR 대 JP 대 EU 시험관 패턴 비교 → WHO 또는 학술지
- **의사결정 모델 source**: AI 시대 의료 결정 보조 시스템의 *맥락 입력* (CEO Memo II §4)
- **Care economy 인프라**: 보험·돌봄·복지 정책의 데이터 layer

이게 MODU 의 10년 진짜 자산. demo 의 Scale Vision 카드가 이 비전을 90초로 압축.

---

## 8. 측정 framework

W1 retention 측정 인프라 (Phase 0 우선 작업):

```
PostHog (opt-in)
  ├─ events: app_open, chapter_created, memory_appended,
  │          tpo_signature_shown, next_action_tapped, archive
  └─ funnels: D0 install → D1 open → D7 active

ChapterMemory 자체가 retention 측정 source
  └─ "메모리 N건 이상" 사용자 vs 0건 사용자의 D7 차이 추적
```

PostHog 가 OFF 인 사용자는 측정 불가하지만, 그 자체가 신뢰 메시지 = retention lever.

---

## 9. 결론

- **W1 retention 이 single-most KPI**.
- 그것을 받치는 lever 3개: **App-Open TPO 즉시성 / 매일 micro-loop / 의미 있는 알림 절제**.
- demo 는 finale 까지 *"이게 글로벌 인프라가 될 수 있다"* 의 비전을 90초로 박을 것.
- 코드 우선순위: **TPOSignature → NextActionPrompt → OrbitOnboarding → Scale Vision finale**.

---

## 참조

- ADR-0011 Local-First (TPO last-known cache 가 첫 paint 200ms 보장)
- ADR-0012 Gemma Routing (저비용 weekly distill 이 매일 micro-loop 의 컨텐츠 source)
- Timeflow Plan §3.5 NextActionPrompt
- Memo II §5 6 hero features (decision journal / weekly retro / memoir)
- grammar §3 Voice & Tone (절제 톤은 W1 retention 의 lever)
