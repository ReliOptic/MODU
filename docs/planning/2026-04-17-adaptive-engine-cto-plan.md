# Adaptive Layout Engine — Cost · Scale · Refresh Strategy

작성일: 2026-04-17
작성 맥락: CTO 합의용. Timeflow 기획 (`docs/planning/2026-04-17-timeflow-frontend-plan.md`) 의 백엔드/엔진 짝
Status: **Draft for CTO review**
연결: ADR-0001 (Backend) · ADR-0002 (Edge Function) · ADR-0003 (Memory-First) · Timeflow Plan §5 (AI Learning Layer)

> **한 줄**: Adaptive layout 은 *AI 응답 한 번이 UI 재배치 하나*가 아니다. **수백 개의 trigger × 수백만 user × 24h 변화**가 곱해지는 비용 곡선이다. 이걸 sublinear 로 만드는 게 CTO 의 일이다. 이 문서는 그 곡선을 그리고 구간마다의 전략을 박는다.

---

## 1. 비용 구조 — 무엇이 비싸지는가

### 1.1 Adaptive layout 한 번의 cost decomposition

| 단계 | 비용 단위 | 1회 비용 | 빈도 |
|------|----------|---------|------|
| (a) ChapterMemory 누적 (DB write) | ~10 IOPS | ~$0.000001 | 사용자 인터랙션마다 |
| (b) Local layout engine eval (V2) | CPU on device | $0 | 1분 tick + 인터랙션 |
| (c) Server Realtime broadcast | Supabase Realtime msg | ~$0.000003 | partner 동기화 시 |
| (d) AI distill (Claude Sonnet 1k tok) | LLM token | ~$0.003 input + $0.015 output | per intent call |
| (e) Cron job (weekly distill, 모든 user) | Edge Function CPU + LLM | ~$0.02 | weekly per user |
| (f) Embedding (Memory search/RAG, 옵션) | $0.0001 / 1k tok | ~$0.0005 | per memo write |

### 1.2 Per-user / month 비용 모델 (현재 설계대로)

```
1 user · 월 활동 가정:
  - 인터랙션 200건         → DB writes      ≈ $0.0002
  - 1분 tick × 30일 × 12h  → 클라이언트만   ≈ $0
  - AI calls (formation 1, weekly 4, memo 5, visit 2) ≈ $0.10
  - Realtime (partner 1명) ≈ $0.001
  - Storage (사진 50MB · R2 egress)         ≈ $0.005
  ─────────────────────────────────────────
  TOTAL                                     ≈ $0.11 / user / month
```

> 100K MAU = $11K / mo. 1M MAU = $110K / mo.
> Plus 구독 ₩5,900 = ~$4.5 / mo → gross margin ~98%. **단 AI 호출 폭증 시 곡선 변동**.

### 1.3 위험 요인 (이게 터지면 비용이 5-10x)

1. **AI distill 빈도 폭주** — 사용자가 hint 거부 → 새 distill 요청 폭증
2. **Realtime over-broadcast** — partner 1명 → 100명 분산 시 fan-out 비용
3. **Cold start storm** — Edge Function 동시 spike 시 RTT ↑ + 사용자 retry storm
4. **사진 egress** — Supabase Storage 사용 시 R2 대비 3x. R2 사용으로 이미 완화 (ADR-0001)
5. **잘못된 cache key** — context 일부만 변해도 cache miss → AI 재호출

---

## 2. 핵심 원칙 — Adaptive Engine 의 4 계층

```
┌──────────────────────────────────────────┐
│  L1  On-Device Engine                    │  ← 1분 tick, 1 user RAM
│      computeLayout() · 로컬 평가         │     비용 $0, 즉시 반응
├──────────────────────────────────────────┤
│  L2  Edge Cached Hints                   │  ← KV cache (Cloudflare KV / Upstash)
│      profile.context_hints (jsonb)       │     L1 의 input 보강
├──────────────────────────────────────────┤
│  L3  Edge Function (warm)                │  ← AI proxy + intent routing
│      ai/{intent} · cache_control         │     호출 빈도 통제
├──────────────────────────────────────────┤
│  L4  Cron Distill (weekly)               │  ← 배치, 비-사용자 critical path
│      weekly.distill / pattern.refresh    │     계산 결과를 L2 에 push
└──────────────────────────────────────────┘
```

**원칙**: 사용자가 화면 하나 보는 동안의 layout 결정은 **L1 만으로 끝나야** 한다. L3/L4 는 백그라운드에서 hint 를 갱신할 뿐, 실시간 critical path 에 들어가지 않는다.

---

## 3. L1 — On-Device Engine 의 budget

### 3.1 현재 (V2 엔진)

- `computeLayout()` ≈ 50µs (위젯 6개 · 룰 10개)
- 1분 tick + 인터랙션마다 evaluate
- React state + LayoutAnimation 으로 reorder

### 3.2 60fps 보장 budget

- React render 1 frame = 16.6ms
- engine 평가 < 1ms (현재 0.05ms — 충분)
- LayoutAnimation 300ms transition (이미 V2)
- **확장 시 주의**: rules 100개 / 위젯 30개 까지는 < 5ms 보장
- 그 이상은 server-side pre-evaluation 으로 분산 (L4)

### 3.3 설계 룰

- L1 은 **순수 함수** (input → output, 부수효과 없음). 테스트 가능, hot-reload 가능.
- 외부 호출 절대 금지 (timer 외에는 fetch 없음)
- 모든 input 은 `LayoutContext` 한 객체로 (직렬화 가능 → cache key 가능)
- 결과는 `WidgetType[]` 배열 (reference 안정성 → React reconciliation 비용 최소)

### 3.4 1분 tick 의 의미

- 30초 → 너무 자주 (배터리 + 계산)
- 5분 → 시간 변화 둔감 ("주사 30분 전" promote 가 늦어짐)
- **1분이 sweet spot**. 다만 화면 hidden 시 stop, foreground resume 시 즉시 1회 evaluate.

---

## 4. L2 — Edge Cache (`context_hints`)

### 4.1 무엇을 cache 하는가

```jsonc
profile.context_hints = {
  "patterns": [...],          // weekly distill 결과
  "narratives": {...},        // StoryCard 한 줄 모음
  "model_version": "claude-sonnet-4-6",
  "computed_at": "...",
  "ttl_hours": 168            // 1주
}
```

### 4.2 어디에 두는가

| 옵션 | 장 | 단 | 권고 |
|------|---|---|------|
| `profiles.context_hints` (Postgres jsonb) | 한 곳 | RLS 통과 비용 (소소) | **MVP** |
| Cloudflare KV | 글로벌 edge cache | 추가 인프라 | 100K MAU 후 |
| Upstash Redis | 빠름, TTL 자동 | 비용 | 1M MAU 후 |

→ MVP 는 Postgres 한 곳. RLS 로 self-only read. 1주 TTL 후 stale 표시.

### 4.3 Cache key 전략

context_hints 의 key 는 **(asset_id, week_of_year, model_version)**. 같은 주에는 같은 결과 → 사용자 인터랙션 폭증해도 새 distill 호출 X.

이벤트 트리거 (긴급 invalidate):
- 새 ChapterMemory milestone (시술 결과, 회차 변경) → on-demand distill 1회
- 사용자가 명시적 "새로 분석" 버튼 (rate limited 1/day)

---

## 5. L3 — Edge Function 호출 통제

### 5.1 빈도 통제 4 layer

```
1. 클라이언트 디바운스
   formation.summarize: 사용자가 step 5개 다 끝낸 후 1회만 호출
   memo.distill: 음성 종료 후 1회

2. Intent-level rate limit (Edge Function 내부)
   formation.summarize: 10/day per user
   weekly.distill:       1/week per user (cron 외 호출 금지)
   trigger.analyze:      4/week per user

3. Idempotency key (request 중복 방지)
   X-Idempotency-Key: hash(intent + context) → 5분 cache

4. Prompt cache (Anthropic)
   system prompt + 공통 instruction → cache_control: ephemeral
   (90% input token cost 절감)
```

### 5.2 Model routing (cost / quality tier)

| Intent | Model | 이유 |
|--------|-------|------|
| `formation.summarize` (첫 챕터) | Claude Sonnet | 처음의 임팩트 |
| `memo.distill` (반복) | Claude Haiku | 빠르고 충분 |
| `weekly.distill` (배치) | Claude Haiku | 비용 우선, 야간 cron |
| `trigger.analyze` (분석) | Claude Sonnet | 깊이 필요 |
| `visit.prepare` (단순) | Claude Haiku | 충분 |

**비용 비교** (1k in / 1k out 기준):
- Sonnet 4.6: ~$0.018
- Haiku 4.5:  ~$0.002 (9x 저렴)

→ 자주 부르는 intent 는 Haiku, 임팩트 순간만 Sonnet. ai/{intent} 매핑은 Edge Function config 로 즉시 변경 (앱 재배포 X).

### 5.3 Cold start 완화

- Edge Function 호출 패턴이 spike 형 (출근 시간, 점심) → warm pool 유지 어려움
- 대신: **predictive warm-up** — 사용자가 NextActionPrompt 또는 voice button 누르는 시점에 background fetch 로 warmup ping
- 진짜 호출 시 cold start 없이 ~200ms

---

## 6. L4 — Cron Distill (배치)

### 6.1 무엇을 미리 계산하는가

매주 일요일 새벽 3시 (사용자별 timezone 적용), 모든 active user 에 대해:

1. `weekly.distill` — 지난 7일 ChapterMemory → narratives + patterns
2. `trigger.refresh` — 만성질환 사용자만, 4주 단위
3. `memory.glance.surface` — 1년/3년 전 같은 주 ChapterMemory pre-fetch + ranking
4. 결과 → `profile.context_hints` UPSERT

### 6.2 배치 비용 모델

100K MAU 기준:
- weekly.distill (Haiku, ~1k tokens) × 100K = ~$200 / week = $800/mo
- Memory.glance.surface (DB query only) = ~$0
- **총 ~$800/mo for context refresh** (per-user $0.008)

### 6.3 배치 인프라

| 옵션 | 비용 | 운영 부담 |
|------|------|----------|
| Supabase pg_cron + Edge Function | $0 (Pro plan 포함) | 낮음 |
| Cloudflare Cron Triggers + Workers | $5/mo | 낮음 |
| AWS Lambda + EventBridge | ~$10/mo | 중 |
| 자체 EC2 cron | ~$30/mo | 높음 |

→ **MVP: Supabase pg_cron** (Pro plan 포함). 100K MAU 까지 충분.

### 6.4 실패 처리

- 배치 실패 시 fallback = stale context_hints 그대로 사용 (사용자는 인지 X)
- 새 사용자 (ChapterMemory < 7개) 는 weekly distill skip → "default narratives" 사용
- 1 user 실패 → 다른 user 영향 없게 isolated job

---

## 7. Realtime — 켜야 할 때 vs 끄는 게 나을 때

### 7.1 비용 비교

| 옵션 | per user / mo | use case |
|------|--------------|----------|
| Supabase Realtime always-on | ~$0.10 | 파트너 sync, 실시간 알림 |
| Polling 30초 | ~$0.005 | 단독 사용자 |
| Push notification only | ~$0.001 | 백그라운드만 |

### 7.2 권고 (계층화)

- **Active partner 가 있는 asset**: Realtime ON (파트너가 추가 / 본인이 추가 한 직후)
- **단독 사용자**: Realtime OFF, foreground resume 시 1회 fetch + push notification 만
- **모두**: 1 day idle 후 자동 disconnect (cost 절감)

### 7.3 fan-out 비용

1 user → 100 partners 같은 비대칭 fan-out 은 의료 카테고리에서 드물지만, doctor 가 다수 환자 모니터링하는 시나리오 (B2B feature) 가능. 이 경우:
- doctor 는 polling tier (Realtime 비용 회피)
- 환자 → doctor 단방향 broadcast 만

---

## 8. 규모의 경제 곡선

### 8.1 사용자별 비용 (월간, USD)

```
사용자 수      |   per user $   |  비고
─────────────────────────────────────────
1K (시드)      |   $0.30       |  비싼 단계, AI distill 비중 큼
10K (early)    |   $0.18       |  prompt cache 효과 시작
100K (PMF)     |   $0.11       |  context_hints 재사용 본격
1M (성장)      |   $0.07       |  L2 KV cache 도입, model routing 최적화
10M (스케일)   |   $0.04       |  자체 Llama fine-tune 일부 도입
```

수익 (Plus 구독 평균 $3 / user / month, 25% 전환 가정 시 ARPU $0.75):
- 100K MAU: $75K 수익 / $11K 비용 = 85% margin
- 1M MAU: $750K / $70K = 91% margin

**=> sublinear cost curve 달성 가능. 단 L2/L4 cache 가 제대로 작동해야 함.**

### 8.2 곡선이 깨지는 시나리오 (red flag)

- AI 호출이 user 수에 linear scale (cache miss 폭증)
- Realtime 항상 ON 으로 두 partner 사용자만 비대칭 비용
- Edge Function cold start 폭증으로 retry storm
- 사진 egress (Supabase Storage 사용 시) 1M MAU 부터 폭주

### 8.3 모니터링 KPI (CTO dashboard)

| 지표 | 목표 | 알람 |
|------|-----|------|
| Cost per MAU | < $0.15 | $0.20 초과 시 |
| AI cache hit rate | > 70% | < 50% 시 |
| Edge Function p95 latency | < 1.5s | > 3s 시 |
| Distill cron success rate | > 99% | < 95% 시 |
| Realtime connection per MAU | < 0.3 | > 0.5 시 |

---

## 9. Refresh 빈도 — 얼마나 자주 UI 가 바뀌는가

| Trigger | Refresh 대상 | 비용 |
|---------|-------------|------|
| 1분 tick (foreground) | L1 only | $0 |
| 사용자 인터랙션 | L1 + L2 read | $0 |
| Realtime push (partner) | L1 + asset reload | ~$0.000003 |
| Foreground resume | L1 + L2 read + (필요 시) on-demand distill | $0 ~ $0.003 |
| Weekly cron | L4 distill → L2 update | ~$0.02 / user / week |
| Major milestone (시술 결과) | on-demand distill 1회 | ~$0.003 |

→ **사용자가 체감하는 "UI 가 변한다" 의 99% 는 L1 evaluate 만으로 발생** (비용 $0).
LLM 호출은 *평균 사용자 주 1회* 수준. 비용·UX 모두 안정.

---

## 10. CTO 가 결정해야 할 것 — 6개

| # | 결정 | 옵션 | 권고 |
|---|------|------|------|
| 1 | L2 cache 위치 | Postgres jsonb / Cloudflare KV / Upstash | **Postgres MVP, 100K+ → KV** |
| 2 | Cron 스케줄러 | pg_cron / CF Triggers / Lambda | **pg_cron MVP** |
| 3 | Model routing (cost vs quality) | All Sonnet / Mixed / All Haiku | **Mixed (위 §5.2 표)** |
| 4 | Realtime 정책 | Always-on / Conditional / Off | **Conditional** (partner asset 만) |
| 5 | Cold start 완화 | Predictive warmup / Reserved capacity ($) / 무대응 | **Predictive warmup** (코드만) |
| 6 | Embedding 도입 시점 | MVP / Series A / 미정 | **Series A** (RAG 필요할 때) |

---

## 11. 실행 — Sprint 분할

### Sprint A (Week 1) · "L1 강화"
- 현 V2 엔진에 `context_hints` input 추가
- LayoutContext 직렬화 → cache key 기반 memoization
- 60fps 검증 (위젯 30개 stress test)

### Sprint B (Week 2) · "L4 cron"
- `pg_cron` job: weekly.distill 모든 active user
- `profile.context_hints` UPSERT
- 실패 시 stale fallback

### Sprint C (Week 3) · "L3 통제"
- Intent-level rate limit (Edge Function 내부)
- Model routing config (Sonnet ↔ Haiku)
- Idempotency key + Anthropic prompt cache

### Sprint D (Week 4) · "관측"
- Cost dashboard (Supabase + Anthropic 사용량 daily)
- Cache hit rate metric
- p95 latency alert

→ **4주 만에 100K MAU 까지 sublinear cost 곡선 보장.**

---

## 12. 결론 — 한 문단

> Adaptive layout engine 의 비용 위협은 *AI 호출 빈도*다. 이걸 4-layer cache (L1 device · L2 hint · L3 edge · L4 cron) 로 분산하면, **사용자 체감 UI 변화의 99% 는 비용 $0 인 L1 만으로 일어나고**, AI 호출은 사용자 주 1회 수준에 머문다. 결과는 per-user $0.11/mo (100K MAU) → $0.04/mo (10M MAU) 의 sublinear 곡선. 이 위에 Plus 구독 ($4.5/mo) 이 얹히면 90% 이상 gross margin. **단, L2/L4 가 작동해야** — 작동하지 않으면 곡선이 linear 로 무너진다. CTO 가 4주 sprint 안에 L2/L4 를 박아야 하는 이유.

---

## 참조

- ADR-0001 Backend (Supabase + R2)
- ADR-0002 AI Edge Function (intent routing 이미 구현)
- ADR-0003 Memory-First (ChapterMemory schema)
- Timeflow Plan §5 (AI Learning Layer 의 closed loop)
- CEO Memo II §5 (Semantic Memory 6 hero features)
