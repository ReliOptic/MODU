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

## R2 MIME 신뢰 경계

- **현재 (v1)**: MIME 타입은 클라이언트가 요청 body에 제출한 값을 신뢰합니다.
  Edge Function은 허용 목록(`MIME_WHITELIST`) 검사만 수행하며, R2 `HeadObject`로
  실제 바이트를 sniff하지 않습니다.
- **근거**: HeadObject 호출은 추가 R2 API 비용 및 레이턴시를 유발하며,
  업로드 URL은 이미 `Content-Type` 헤더를 고정(`PutObjectCommand.ContentType`)하여
  클라이언트가 임의 MIME으로 PUT하는 것을 방지합니다.
- **예정 (v2)**: 서버 사이드 MIME sniff(magic-bytes 검증)를 도입하여
  클라이언트 신뢰를 제거할 예정입니다. 트래킹: TODO v2 mime-server-validation.

## 보안 약속 (ADR-0005)

- ANTHROPIC_API_KEY 는 Supabase Secret 에만. client 노출 X.
- AI 입력은 redact 후 ai_call_logs.redacted_input 에 보관.
- 사용자 데이터 export = `select * from chapter_memories where asset_id in (...)`.
- 사용자 데이터 즉시 파기 = `delete from auth.users where id = ?` → cascade.
