# Revenue & Unit Economics — 관리회계 시선

작성일: 2026-04-17
Status: **Pinned strategy** — pricing·기능 paywall·investor 데크의 단일 모델
연결: ADR-0011 (Local-First, free 가능 비용) · ADR-0012 (Gemma, AI 비용) · CTO Adaptive Engine Plan · W1 Retention Strategy

> **한 줄**: MODU 의 ARPU lever 는 *에셋 수*다. 1챕터 사용자 = free 의무, 2챕터 = Plus 자연 전환, 3+챕터 + 가족 = Family. **에셋이 곧 매출.** 이걸 관리회계의 단위로 박아야 한다.

---

## 1. Pricing Tier (제안)

| Tier | 월 | 에셋 한도 | AI 사용 | 파트너 | 사진/문서 | Tone |
|------|---:|---------:|--------|--------|----------|------|
| **Free** | ₩0 | 1개 (active) | 월 5회 | 1명 | 100MB | "지금 챕터 하나, 충분합니다" |
| **Plus** | ₩5,900 | 무제한 | 무제한 | 5명 | 5GB | "두 번째 챕터가 시작될 때" |
| **Family** | ₩11,900 | 가족 5명 통합 | 무제한 | 가족당 5명 | 25GB | "함께 돌볼 때" |
| **Care Pro** *(B2B 미래)* | ₩29,000/월/seat | 무제한 + 환자 관리 | 무제한 | 환자 100명 | 무제한 | 의료진·간병팀 |

### 1.1 Free→Plus 자연 전환 트리거

> Plus 가 *기능* 이 아니라 *삶의 단계 전환* 이 되어야 한다.

- 트리거 1: 두 번째 에셋 생성 시도 ("어머니 챕터도 함께 시작하시겠어요?")
- 트리거 2: AI 5회 소진 후 6번째 시도 ("이번 주 한 번 더 분석해드릴까요?")
- 트리거 3: 6번째 파트너 초대 시도

각 트리거 = **부드러운 카드** (anti-pattern: 모달 폭격 / 카운트다운 / 빨간 배지).

### 1.2 Family 의 의미

가족 단위 = 모기지 같은 sticky. 한 사람이 결제 → 4명이 자동 묶임 → **이탈 비용이 가족 분의 챕터 라이브러리 손실**.

---

## 2. Cohort 모델 — 사용자 1명의 LTV

### 2.1 가정 (보수적)

| 항목 | 값 | 근거 |
|------|-----|------|
| Free → Plus 전환률 | 8% | 의료 freemium 표준 4-6% × 2 (moat 강도) |
| Plus → Family 전환률 | 12% (Plus 안에서) | 가족 caregiver 비중 |
| Plus 월 churn | 5% | Notion·Bear 류 |
| Family 월 churn | 3% | 가족 락-인 |
| 평균 사용 기간 | Plus 20mo · Family 33mo | 1/churn |
| ARPU (Plus 가입자) | ₩5,900 | 가격 그대로 |
| ARPU (Family 가입자) | ₩11,900 | 가격 그대로 |

### 2.2 LTV 계산 (한 사용자 평생)

```
Free 사용자 LTV       = ₩0 × 평생 + 추천 효과
Plus 가입자 LTV       = ₩5,900 × 20개월 = ₩118,000  (≈ $90)
Family 가입자 LTV     = ₩11,900 × 33개월 = ₩392,700 (≈ $300)
가중 평균 LTV (가입자) = ₩118K × 88% + ₩392K × 12% = ₩151K
```

**가입자 1명의 평생 가치 ≈ ₩151,000.** 100명 가입 = 1,510만원 매출 평생.

### 2.3 100K MAU 시나리오

```
100K MAU
  · 92K Free
  · 7,040 Plus    (8% × 100K × 88% = Plus only)
  · 960 Family    (8% × 100K × 12%)

월 매출 (gross)
  · Plus  7,040 × ₩5,900 = ₩41.5M
  · Family 960 × ₩11,900 = ₩11.4M
  ─────────────────────
  · Total                = ₩52.9M / mo (≈ $40K)

월 비용 (ADR-0012 적용)
  · AI (Gemma routing)        ≈ $1,500
  · Supabase Pro (sync 사용자) ≈ $400
  · R2 사진                   ≈ $200
  · Sentry/PostHog/etc        ≈ $300
  ─────────────────────
  · Total                     ≈ $2,400 (₩3.2M)

월 gross margin = (52.9 - 3.2) / 52.9 = 94%
연 gross profit ≈ ₩600M (≈ $450K)
```

### 2.4 1M MAU 시나리오

| 항목 | 값 |
|------|---:|
| 월 매출 | ₩529M (≈ $400K) |
| 월 비용 (sublinear, ADR-0012) | ₩18M (≈ $14K) |
| Gross margin | 96% |
| 연 gross profit | ≈ $4.8M ARR |

**= 단일 카테고리 (Fertility) 한국 시장만으로 시리즈 A 충분.**

---

## 3. Unit Economics — 한 사용자의 손익

### 3.1 Free 사용자

| 항목 | 값 |
|------|---:|
| 월 비용 (local-first, ADR-0011) | ₩100 (sync 안 켜면 ₩0 가까움) |
| 월 매출 | ₩0 |
| 월 손실 | ₩100 |
| 손실 회수 = Plus 전환 시 | 1개월 |

**Free 사용자는 적자가 아니다 — moat (개인 의료 기억) 누적 + 추천 source.**

### 3.2 Plus 사용자

| 항목 | 값 |
|------|---:|
| 월 매출 | ₩5,900 |
| 월 비용 (sync ON + AI 무제한) | ₩400 |
| 월 contribution margin | ₩5,500 |
| LTV (20개월) | ₩118,000 |
| CAC 가능 cap (LTV/3) | ₩39,000 |

→ 한 Plus 가입 위해 ₩39K 마케팅비 사용 가능. 의료 카테고리에서 충분한 여유.

### 3.3 Family 사용자

| 항목 | 값 |
|------|---:|
| 월 매출 | ₩11,900 |
| 월 비용 (5명 sync + AI 무제한 + 25GB) | ₩900 |
| Contribution margin | ₩11,000 |
| LTV (33개월) | ₩363,000 |
| CAC 가능 cap | ₩121,000 |

**Family 사용자 1명 가치 = Plus 3명. 마케팅 우선 타겟.**

---

## 4. ARPU lever — "에셋 수" 가 곧 매출

### 4.1 기능 paywall 매트릭스 (에셋 수 기준)

| 사용자 상태 | 자연 트리거 | 권유 |
|------------|------------|------|
| 첫 챕터 (Free) | — | 사용 격려 (트리거 X) |
| 두 번째 챕터 시도 | "어머니 항암 챕터를 함께 시작하시겠어요?" | Plus 권유 |
| 세 번째 + 가족 초대 | "가족 모드로 함께 보시겠어요?" | Family 권유 |
| Plus 6개월 + 평균 챕터 4개 | (자동 카드) "가족 모드가 더 어울릴 수도 있어요" | Family 권유 |

### 4.2 챕터 평균값 모델 (예측)

```
Plus 사용자 평균 챕터 수 = 2.4
Family 사용자 평균 챕터 수 = 4.8 (가족 5명 × 평균 1.0)
```

→ **에셋 수가 모이는 사용자 = 자연 Family 후보**. 관리회계에서 가장 valuable cohort.

### 4.3 챕터 archive 가 retention 의 lever

archive 된 챕터는 **이탈 비용**이다.

```
사용자 5년 사용 → 평균 9 archived chapters
이탈 시 = 9개의 인생 사본 손실
경쟁 앱이 이걸 가져가게 할 수 없음
```

→ 챕터 수 × archive 횟수 = **이탈 마찰**. 이게 1순위 moat.

---

## 5. Investor 데크 한 슬라이드 — Asset-Centric Revenue

```
┌──────────────────────────────────────────────────┐
│  ARPU Lever = Number of Chapters                 │
│                                                  │
│  Free                  Plus                Family│
│  1 챕터                무제한 챕터        5인 통합│
│  ₩0                    ₩5,900             ₩11,900│
│  92%                   ~7%                ~1%    │
│                                                  │
│  → 100K MAU = ₩53M MRR (94% margin)              │
│  → 1M MAU   = ₩530M MRR (96% margin)             │
│                                                  │
│  Family LTV = Plus × 3.3                         │
│  Marketing 우선 타겟 = 다중 챕터 가족 caregiver  │
└──────────────────────────────────────────────────┘
```

---

## 6. 수익 측정 dashboard (관리회계용)

CTO 대시보드 (PostHog opt-in 데이터 + Supabase 결제 데이터):

| 지표 | 갱신 | 목표 |
|------|------|------|
| Free user count by chapter count (1/2/3+) | 일 | 1개 ≥ 80%, 2개 ≥ 12%, 3+ ≥ 5% |
| Plus 전환률 (D30 누적) | 주 | 8% |
| Family 전환률 (Plus 안에서) | 월 | 12% |
| Plus 월 churn | 월 | < 6% |
| Family 월 churn | 월 | < 4% |
| ARPU (가입자 평균) | 월 | ₩6,500 |
| Per-MAU AI 비용 (ADR-0012) | 일 | < ₩50 |
| LTV/CAC | 월 | ≥ 3x |
| Payback period | 월 | ≤ 6개월 |

---

## 7. 안티패턴 (수익 모델에서 절대 X)

- **광고 SDK** — 영구 금지 (ADR-0005)
- **데이터 매각** — 익명화도 금지 (브랜드 자살)
- **Free 사용자 기능 잠금 폭격** — Plus 권유는 *카드 한 번*만
- **결제 강요 모달** — 모달 폭격 X, 인라인 부드러운 카드만
- **Subscription 자동갱신 dark pattern** — 1주일 전 알림 + 1탭 해지
- **연간 결제 강요** — 월 결제 default

---

## 8. 결론

- **에셋 수 = ARPU lever**. 단위 매출 = 챕터 수가 모이는 사용자.
- **Family 가 가장 valuable cohort** (Plus × 3.3 LTV). 마케팅 우선 타겟.
- 100K MAU = ₩53M MRR / 94% margin. 1M MAU = ₩530M MRR / 96%. 단일 카테고리·단일 국가로 충분한 시리즈 A 규모.
- Free 사용자도 손실 아님 — moat 누적 + 추천 source + Plus 후보 풀.
- 관리회계 dashboard 의 1순위 = **사용자별 챕터 수 분포 + 전환률 + churn**.

---

## 참조

- ADR-0011 Local-First (Free 사용자 비용 ≈ 0 가능)
- ADR-0012 Gemma Routing (AI 비용 8x 절감 → margin 96%)
- CEO Memo I §3 (Foundation+PBC 구조 — PBC 가 본 매출 receiving)
- W1 Retention Strategy (W1 ↑ → Plus 전환률 ↑)
- grammar §4.1 (수익 모델에서 게이미피케이션·결제 강요 금지)
