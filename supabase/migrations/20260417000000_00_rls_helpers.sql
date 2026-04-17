-- Migration 00: RLS helper functions + updated_at trigger
-- Run order: first (all subsequent migrations depend on these helpers).
-- Region: ap-northeast-2 (Seoul) — all user data stays in the region
-- assigned at profile creation.
--
-- Deny-by-default posture: RLS is enabled on every user-owned table.
-- No policy = no access. Every table explicitly grants only what is needed.

-- ─── updated_at auto-trigger ───────────────────────────────────────────────
-- Attach to any table that has an updated_at column.
-- Usage: CREATE TRIGGER <table>_updated_at BEFORE UPDATE ON <table>
--        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── uid() convenience wrapper ─────────────────────────────────────────────
-- Thin wrapper so policies read cleanly and the call site is not coupled
-- to the auth schema directly.
create or replace function public.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid();
$$;

-- ─── Deny-by-default template (documentation comment) ─────────────────────
-- Every table that stores user-owned data must:
--   1. ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
--   2. Grant no implicit permissions (deny-by-default is automatic when RLS
--      is enabled and no policy matches).
--   3. Add explicit SELECT / INSERT / UPDATE / DELETE policies scoped to
--      auth.uid() = user_id (or equivalent ownership column).
--
-- The only exceptions are service_role connections (bypasses RLS by design —
-- only Edge Functions and trusted server environments use service_role).
