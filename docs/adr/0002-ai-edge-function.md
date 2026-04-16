# ADR-0002: AI Edge Function — Anthropic Claude proxy in Supabase Functions

- Status: **Proposed**
- Date: 2026-04-17
- Related: ADR-0001 (Backend Platform)

## Context

MODU 는 사용자 컨텍스트 (Formation 응답, 진료 메모, 감정 로그) 를 누적하면서 LLM 으로 다음을 수행한다:

- `formation.summarize` — Formation 응답 → AssetTemplate 추론 + 위젯/룰 추천
- `trigger.analyze` — 만성질환 데이터 → TriggerFactor[]
- `memo.distill` — 진료 음성 / 사진 → 핵심 요약 + 약 변경 추출
- `visit.prepare` — 다음 진료용 질문 체크리스트 자동 생성
- `weekly.distill` — 1주 단위 사용자 패턴 요약 (다음 LLM 컨텍스트로 cache)

이 호출에는 ANTHROPIC_API_KEY 가 필요한데, 클라이언트 노출은 금지(즉시 도용·과금 폭주). 또한 모델 교체(Sonnet → Opus → Haiku) 시 클라이언트 재배포 없이 가능해야 한다.

## Decision

모든 Anthropic Claude 호출은 **Supabase Edge Function (Deno)** 안에서만 일어난다.
클라이언트는 다음 한 종류 엔드포인트만 안다:

```
POST /functions/v1/ai/{intent}
  Authorization: Bearer <supabase user JWT>
  Body: { context }
  Response: { result, modelVersion, tokensUsed, cacheHit }
```

intent 별 라우팅, prompt 조립, 응답 파싱, rate limit, 캐시는 Edge Function 안에서.

### 기술 디테일

- **Prompt caching**: `cache_control: { type: 'ephemeral' }` 으로 시스템 프롬프트 90% 비용 절감
- **User quota**: `users.ai_calls_this_month` 컬럼 + Edge Function 내 카운터. 초과 시 402.
- **Rate limit per intent**: `formation.summarize` = 10/day, `weekly.distill` = 1/week 등 intent 별 정책
- **Model selection**: `extra.modelMatrix` (app config) 에 intent → model 매핑. 변경 시 OTA 없이 즉시 반영
- **Logging**: 입력/출력은 PII 마스킹 후 `ai_call_logs` 테이블에 저장 (감사 + 개선 데이터)
- **Failure mode**: Anthropic 다운 시 cached fallback 또는 graceful "잠시 후 다시" 카드 노출

## Consequences

### 긍정
- API key 안전 (서버 only)
- 모델/프롬프트 변경에 클라이언트 재배포 불필요
- 사용자별 quota → 비용 예측 가능
- 응답 cache → 동일 입력 비용 0

### 부정
- Edge Function cold-start ≈ 1s — LLM 호출 자체가 1-3s 라 큰 영향 X
- Edge Function 의 Deno 환경 제약 (일부 npm 모듈 불가)
- 무거운 batch 작업 (예: 1만 사용자 weekly distill) → cron worker 별도 필요

## Rejected Alternatives

| 옵션 | 거절 이유 |
|------|-----------|
| 클라이언트 직접 호출 | 키 유출 + 모델 lock-in + quota 불가 |
| Cloudflare Workers AI (Llama 3.3) | 한국어 의료 도메인 품질 불충분 |
| Vertex AI / Bedrock Claude proxy | AWS lock-in, 한국 region/키 관리 복잡 |
| 자체 LLM 호스팅 | 비용·운영 부담 vs 품질 ROI 부적합 |

## References

- CPO Review §3.4 (프라이버시·규제)
- ADR-0003 (Memory-First Data Model — AI input shape)
