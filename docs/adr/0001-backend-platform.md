# ADR-0001: Backend Platform — Phase 0 = Supabase + Cloudflare R2

- Status: **Proposed**
- Date: 2026-04-17
- Decider: founder + (pending) external advisor
- Related: ADR-0002 (AI Edge Function), ADR-0003 (Memory-First Data Model)

## Context

MODU 는 의료/돌봄 카테고리로, 한국 데이터 잔류 + 민감정보 동의 + 빠른 MVP 출시(6주) + 부트스트래핑 단계 비용 ($100/mo @ 10K MAU 이내) 모두 만족해야 한다.
Firebase / AWS self-host / Cloudflare D1 / Convex 비교 결과, 다음 4가지가 결정 기준이었다:

1. **Lock-in 회피** — 1M MAU 이후 self-host 또는 다른 IaaS 로 이전 가능해야 함
2. **관계형 데이터 모델** — Asset ↔ ChapterMemory ↔ Event ↔ MediaArtifact ↔ PartnerLink 다대다 그래프
3. **한국 region** — 사용자 RTT < 50ms
4. **민감정보 컴플라이언스** — at-rest 암호화, RLS, 사용자 데이터 export/삭제

## Decision

Phase 0 (~ Series A, ~1M MAU) backend 스택:

```
Supabase (Pro plan, ap-northeast-2 / Seoul)
  ├─ Auth        — Apple / Google / Email magic link
  ├─ Postgres    — RLS-enforced multi-tenant (user_id 기준)
  ├─ Realtime    — 파트너 sync (Asset + ChapterMemory 변경 broadcast)
  └─ Edge Functions (Deno) — Claude API proxy, 사진 업로드 sign URL

Cloudflare R2
  └─ 사진 / PDF / 진단서 storage (egress 무료)

Anthropic Claude API
  └─ Edge Function 안에서만 호출 (key 클라이언트 노출 금지) — 자세한 건 ADR-0002
```

## Consequences

### 긍정
- Postgres = 표준. Phase 1 에서 self-host (Fly.io / Aurora) 마이그레이션 비용 ≤ 4주
- RLS = 1인 개발자가 enterprise-grade row-level multi-tenant 가능
- R2 egress 0원 → 사진 트래픽 비용 약 70% 절감
- Realtime = 파트너 동기화에 별도 인프라 불필요
- 서울 region = 첫 타겟 KR 사용자 RTT < 30ms

### 부정 / 트레이드오프
- Edge Functions cold-start ≈ 1s (warm 시 무시) — AI 응답에는 acceptable, UI critical path 회피
- Supabase Storage 대신 R2 사용 → signed URL 발급 + 직접 업로드 로직 자체 구현 필요
- HIPAA 가 필요해지면 Team plan + Add-on($599/mo) 또는 self-host 시점 앞당김

### Phase 전환 트리거 (= self-host 검토 시점)
- MAU > 500K, **또는** Postgres CPU > 70% 일 sustained 1주, **또는** $5K/mo 도달
- 마이그레이션 = Postgres dump → 새 host restore + Edge Function → Cloudflare Workers 이전

## Rejected Alternatives

| 옵션 | 거절 이유 |
|------|-----------|
| Firebase (Firestore) | NoSQL → 관계형 ChapterMemory 그래프 부적합. 100K MAU 비용 폭증 |
| AWS self-host (EC2+RDS+S3) | DevOps 인력 없는 부트스트래핑 단계에 부적절. 운영 부담 매우 큼 |
| Cloudflare D1 + R2 + Workers | D1 = SQLite 기반, 관계형 쿼리·동시성 제약. 한국 region 약함 |
| Convex | full-stack reactive 매력적이나 매우 강한 lock-in. Postgres 탈출 경로 없음 |
| Supabase Storage (R2 대신) | egress 비용 R2 의 약 3배. 사진 많은 카테고리 부적합 |

## References

- CPO Review 2026-04-17 §3.3 (데이터/계정/권한)
- PROJECT_SPEC.md §5 (DB schema 초안)
