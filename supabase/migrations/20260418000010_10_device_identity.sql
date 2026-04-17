-- Migration: device-identity path for anon-free AI proxy
-- Rationale (ADR-0011 local-first + ADR-0005 privacy-as-moat):
--   MODU 는 계정 없이 device 단위로 동작. AI Edge Function 이 JWT 를 요구하면
--   익명 로그인을 강제하게 되어 local-first 원칙 위반. 대신 client 가 생성한
--   UUID v4 device_id 를 X-Device-Id 헤더로 보내고, 서버는 device_id 로
--   rate-limit + audit 한다. auth.users FK 없음 → 진짜 PII-free anonymity.
--
-- Changes:
--   1. ai_audit.user_id nullable + device_id 컬럼 + XOR check
--   2. ai_device_rate_limits 신규 테이블 (auth.users FK 없음)
--   3. increment_device_rate_limit RPC (service_role only)
--
-- Rollback: 이 migration 의 all DROP 은 20260418000010_10_device_identity_down.sql
-- 에 별도 스크립트로 보관. Production 에서는 Supabase CLI 로 point-in-time revert.

-- ─────────────────────────────────────────────────────────
-- 1. ai_audit — user_id nullable + device_id column
-- ─────────────────────────────────────────────────────────
alter table public.ai_audit
  alter column user_id drop not null;

alter table public.ai_audit
  add column if not exists device_id uuid;

-- Either user_id OR device_id must be set — never both, never neither.
alter table public.ai_audit
  drop constraint if exists ai_audit_subject_xor;
alter table public.ai_audit
  add constraint ai_audit_subject_xor
  check (
    (user_id is not null and device_id is null)
    or (user_id is null and device_id is not null)
  );

create index if not exists ai_audit_device_id_idx on public.ai_audit(device_id);

comment on column public.ai_audit.device_id is
  'Anonymous device identifier (UUID v4, generated client-side, no auth.users FK). '
  'Exactly one of user_id or device_id is set (enforced by ai_audit_subject_xor).';

-- Users cannot read device-id rows (they have no user_id), which is the desired
-- privacy property — anonymous calls produce anonymous audit rows. Existing
-- "users read own rows" policy naturally excludes them (user_id IS NULL ≠ auth.uid()).

-- ─────────────────────────────────────────────────────────
-- 2. ai_device_rate_limits — separate from user-bound table
-- ─────────────────────────────────────────────────────────
-- 별도 테이블: auth.users FK 없이 device_id primary key.
-- ai_rate_limits 를 수정해서 공용화하는 대안도 있었지만, schema 단순성 +
-- 향후 device → user 마이그레이션 경로 분리를 위해 새 테이블 선택.
create table if not exists public.ai_device_rate_limits (
  device_id    uuid not null,
  key          text not null,
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (device_id, key, window_start)
);

create index if not exists ai_device_rate_limits_idx
  on public.ai_device_rate_limits(device_id, key, window_start desc);

alter table public.ai_device_rate_limits enable row level security;

create policy "ai_device_rate_limits: deny all direct access"
  on public.ai_device_rate_limits
  for all
  using (false)
  with check (false);

comment on table public.ai_device_rate_limits is
  'Sliding-window counters for device-identity AI rate limiting. '
  'service_role only (Edge Function writes via increment_device_rate_limit RPC).';

-- ─────────────────────────────────────────────────────────
-- 3. increment_device_rate_limit RPC
-- ─────────────────────────────────────────────────────────
-- Mirrors public.increment_rate_limit but operates on device_id.
-- SECURITY DEFINER + service_role-only EXECUTE.
create or replace function public.increment_device_rate_limit(
  p_device_id    uuid,
  p_key          text,
  p_window_start timestamptz,
  p_limit        int,
  p_window_ms    int
) returns table(count int, allowed bool)
  language plpgsql
  security definer
as $$
declare
  v_count int;
begin
  insert into public.ai_device_rate_limits (device_id, key, window_start, count)
  values (p_device_id, p_key, p_window_start, 1)
  on conflict (device_id, key, window_start)
  do update set count = public.ai_device_rate_limits.count + 1
  returning public.ai_device_rate_limits.count into v_count;

  return query select v_count, (v_count <= p_limit);
end;
$$;

revoke all on function public.increment_device_rate_limit(uuid, text, timestamptz, int, int)
  from public, anon, authenticated;
grant execute on function public.increment_device_rate_limit(uuid, text, timestamptz, int, int)
  to service_role;

-- ─────────────────────────────────────────────────────────
-- 4. TTL cleanup for device rate limits
-- ─────────────────────────────────────────────────────────
create or replace function public.cleanup_device_rate_limits()
  returns void
  language sql
  security definer
as $$
  delete from public.ai_device_rate_limits
  where window_start < now() - interval '10 minutes';
$$;

revoke all on function public.cleanup_device_rate_limits() from public, anon, authenticated;
grant execute on function public.cleanup_device_rate_limits() to service_role;
