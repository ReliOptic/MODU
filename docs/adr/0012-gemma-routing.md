# ADR-0012: Gemma 3 Routing — Claude 최소화, Gemma 우선

- Status: **Proposed**
- Date: 2026-04-17
- Related: ADR-0002 (AI Edge Function) · ADR-0011 (Local-First) · CTO Adaptive Engine plan

## Context

ADR-0002 는 모든 AI 호출을 Anthropic Claude (via Edge Function) 로 정의했다. 그러나:

- 부트스트래핑 단계 비용 통제가 최우선 (CEO 메모 + CTO Plan §1.2)
- **Google Gemma 3** (2026-04 출시, Apache-2.0 라이선스, 27B 모델 한국어 양호)
- Gemma 는 self-host 가능 (Cloudflare Workers AI / Replicate / 자체 GPU)
- Claude Sonnet/Opus 는 *quality 가 결정적인 순간*에만 사용
- Local 디바이스에서 Gemma 2B (gguf 4bit) 추론도 일부 가능 (ADR-0011 시너지)

## Decision

**Intent-aware routing**: 같은 ai/{intent} API 안에서 quality 요구도 + 비용 budget 에 따라 모델 선택.

### Routing 매트릭스

| Intent | 1순위 모델 | Fallback | 위치 |
|--------|-----------|----------|------|
| `formation.summarize` (첫 챕터, 임팩트 결정적) | **Claude Sonnet 4.6** | Gemma 3 27B | Edge Function |
| `trigger.analyze` (분석 깊이 필요) | **Claude Sonnet 4.6** | Gemma 3 27B | Edge Function |
| `memo.distill` (반복) | **Gemma 3 27B** | Claude Haiku | Edge Function (self-host) |
| `weekly.distill` (배치, 비-critical) | **Gemma 3 27B** | Claude Haiku | Cron (self-host) |
| `visit.prepare` (단순 list) | **Gemma 3 9B** | Claude Haiku | Edge Function (self-host) |
| `mock chapter generator` (현재 demo) | **Gemma 3 2B local** (선택) | 키워드 사전 fallback | 디바이스 |

### 운영 구조

```
Edge Function (ai/{intent})
  ├─ resolveModel(intent, user_quota, time_of_day) → modelId
  ├─ if modelId === 'claude-*' → call Anthropic API
  ├─ if modelId === 'gemma-*'  → call Cloudflare Workers AI / Replicate / self-host
  └─ unified response shape (앱은 모델 변경 인지 X)

Local (선택, ADR-0011 시너지)
  └─ react-native-llama-rn 또는 mlc-llm 으로 Gemma 2B/3B inference
       memo.distill / mock chapter 같은 lightweight intent 만
```

### 비용 비교 (1k input + 1k output 기준 추정, 2026-04)

| 모델 | per call | 100K MAU monthly cost (intent 5/user/mo) |
|------|---------|------------------------------------------|
| Claude Sonnet 4.6 | $0.018 | $9,000 |
| Claude Haiku 4.5 | $0.002 | $1,000 |
| **Gemma 3 27B (Cloudflare WAI)** | $0.0006 | $300 |
| **Gemma 3 9B (CF WAI)** | $0.0002 | $100 |
| **Gemma 3 2B (local, free)** | $0 | $0 |

→ Mixed routing 으로 100K MAU 비용 ~$11K → ~$1.5K 수준 가능 (8x 절감).

### 마이그레이션 단계

1. **Phase A (지금)**: Claude only, Edge Function 의 모델 config 만 노출
2. **Phase B (1개월)**: Cloudflare Workers AI 계정 연결, Gemma 3 27B 라우팅 추가
3. **Phase C (3개월)**: weekly.distill 부터 Gemma 로 전환 (배치 = 영향 최소)
4. **Phase D (6개월)**: memo.distill / visit.prepare Gemma 전환
5. **Phase E (필요 시)**: 디바이스 local Gemma 2B 도입 (mlc-llm)

### Quality 보증

- A/B test framework: 같은 input 에 Claude / Gemma 응답 동시 생성, 사용자 한 명에게는 한 응답만
- Quality metric: 응답 거절률, narrative re-generate 요청률, 사용자 만족 (옵션)
- Sonnet 만 가능한 것 (예: 깊은 의료 추론) 은 그대로 유지

## Consequences

### 긍정
- 100K MAU 시 AI 비용 8x 절감 → 부트스트래핑 단계 운영 가능
- Apache-2.0 라이선스 → vendor lock-in 없음
- Local Gemma 가능성 → ADR-0011 local-first 와 시너지
- 모델 교체가 Edge Function config 한 줄

### 부정
- Gemma 한국어 의료 도메인 품질 = 검증 필요
- self-host 운영 부담 (Cloudflare Workers AI 사용 시 완화)
- A/B test framework 가 추가 엔지니어링

### 완화
- 검증되기 전까지는 1순위 모델 Claude 유지
- self-host 대신 Cloudflare Workers AI 등 managed 사용

## Rejected Alternatives

| 옵션 | 거절 이유 |
|------|-----------|
| Claude-only | 비용 linear, 부트스트래핑 단계 부적합 |
| Gemma-only | quality-critical intent (formation/trigger) 위험 |
| OpenAI GPT routing | 한국어·의료 도메인 불확실, 비용 차이 작음 |

## References

- ADR-0002 AI Edge Function (intent routing 골격 그대로)
- ADR-0011 Local-First Persistence (Gemma local inference 시너지)
- CTO Adaptive Engine Plan §5.2 (model routing tier — 본 ADR 로 정식화)
