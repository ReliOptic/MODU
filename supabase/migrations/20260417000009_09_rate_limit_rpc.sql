-- Migration: increment_rate_limit RPC + ai_audit bytes_in + policy hardening
-- Task #19 security fix — atomic rate limit increment, bytes_in audit column,
-- explicit INSERT policy roles, TTL cleanup helper.

-- ─────────────────────────────────────────────────────────
-- 1. Atomic rate-limit increment RPC
-- ─────────────────────────────────────────────────────────
-- Replaces the broken upsert-with-count:1 approach in rateLimit.ts.
-- SECURITY DEFINER ensures the function runs with owner privileges while
-- callers (service_role only) cannot directly touch ai_rate_limits.
create or replace function public.increment_rate_limit(
  p_user_id    uuid,
  p_key        text,
  p_window_start timestamptz,
  p_limit      int,
  p_window_ms  int
) returns table(count int, allowed bool)
  language plpgsql
  security definer
as $$
declare
  v_count int;
begin
  insert into public.ai_rate_limits (user_id, key, window_start, count)
  values (p_user_id, p_key, p_window_start, 1)
  on conflict (user_id, key, window_start)
  do update set count = public.ai_rate_limits.count + 1
  returning public.ai_rate_limits.count into v_count;

  return query select v_count, (v_count <= p_limit);
end;
$$;

-- Lock down access: only service_role may call this function.
revoke all on function public.increment_rate_limit(uuid, text, timestamptz, int, int)
  from public, anon, authenticated;
grant execute on function public.increment_rate_limit(uuid, text, timestamptz, int, int)
  to service_role;

-- ─────────────────────────────────────────────────────────
-- 2. ai_audit.bytes_in column (Whisper audio size)
-- ─────────────────────────────────────────────────────────
alter table public.ai_audit
  add column if not exists bytes_in integer not null default 0;

-- ─────────────────────────────────────────────────────────
-- 3. Harden ai_audit INSERT policy — explicit role list
-- ─────────────────────────────────────────────────────────
-- Drop the old unnamed / loosely-scoped policy and replace with an
-- explicit "to authenticated, anon" so the restriction is unambiguous.
drop policy if exists "ai_audit: deny direct insert by non-service roles" on public.ai_audit;
drop policy if exists "ai_audit_no_client_insert" on public.ai_audit;

create policy "ai_audit_no_client_insert"
  on public.ai_audit
  for insert
  to authenticated, anon
  with check (false);

-- ─────────────────────────────────────────────────────────
-- 4. TTL cleanup helper for ai_rate_limits
-- ─────────────────────────────────────────────────────────
-- Call via pg_cron or a periodic Edge Function invocation.
-- Example pg_cron setup (run in Supabase SQL editor after enabling pg_cron):
--   select cron.schedule('rate-limit-cleanup', '*/10 * * * *',
--     $$ select public.cleanup_rate_limits(); $$);
create or replace function public.cleanup_rate_limits()
  returns void
  language sql
  security definer
as $$
  delete from public.ai_rate_limits
  where window_start < now() - interval '10 minutes';
$$;

revoke all on function public.cleanup_rate_limits() from public, anon, authenticated;
grant execute on function public.cleanup_rate_limits() to service_role;
