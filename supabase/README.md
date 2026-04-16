# MODU Supabase

Phase 0 backend (ADR-0001).

## 적용 순서

```bash
# 1) Supabase CLI
brew install supabase/tap/supabase
supabase login
supabase link --project-ref <YOUR_REF>

# 2) Schema + RLS
supabase db push                       # schema.sql + policies.sql 자동 감지
# 또는 수동:
psql "$DATABASE_URL" -f supabase/schema.sql
psql "$DATABASE_URL" -f supabase/policies.sql

# 3) Secrets (AI Edge Function 용)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# 4) Edge Function 배포
supabase functions deploy ai

# 5) (선택) 데모 시드
psql "$DATABASE_URL" -f supabase/seed.sql      # TBD
```

## 디렉토리

| 파일 | 설명 |
|------|------|
| `schema.sql` | 모든 테이블 + 인덱스 + 트리거 (ADR-0003 Memory-First) |
| `policies.sql` | RLS multi-tenant. owner / partner-with-scope / waitlist anon insert |
| `functions/ai/index.ts` | Claude API proxy. intent routing, quota, prompt cache, logging |
| `seed.sql` | (TBD) 개발용 시드 |

## RLS 모델 요약

- **assets**: owner read/write. partner accepted 시 read.
- **chapter_memories**: owner full. partner = visibility ≠ 'self' AND scope.canRead 매칭만.
- **scheduled_events / media_artifacts**: has_asset_access (owner or partner).
- **partner_links**: owner write, self-accept.
- **ai_call_logs**: self read. write 는 service_role 만.
- **vertical_waitlist**: 누구나 insert (비로그인 OK), self read.
- **chapter_archives**: owner full only.

## 보안 약속 (ADR-0005)

- ANTHROPIC_API_KEY 는 Supabase Secret 에만. client 노출 X.
- AI 입력은 redact 후 ai_call_logs.redacted_input 에 보관.
- 사용자 데이터 export = `select * from chapter_memories where asset_id in (...)`.
- 사용자 데이터 즉시 파기 = `delete from auth.users where id = ?` → cascade.
