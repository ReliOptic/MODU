-- Migration: ai_audit + ai_rate_limits tables
-- Task #19 — AI Edge Function audit log + persistent rate limit backing store
--
-- ai_audit: immutable call record — no payload, metadata only.
--   INSERT: service_role only (Edge Function writes via service key).
--   SELECT: authenticated users may read their own rows only.
--
-- ai_rate_limits: sliding-window counters used by rateLimit.ts L2.
--   Managed entirely by Edge Function service-role inserts/upserts.
--   Users have no direct access.

-- ─────────────────────────────────────────────────────────
-- 1. ai_audit
-- ─────────────────────────────────────────────────────────
create table if not exists public.ai_audit (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  model       text not null,
  tokens_in   integer not null default 0,
  tokens_out  integer not null default 0,
  latency_ms  integer not null default 0,
  created_at  timestamptz not null default now(),
  constraint ai_audit_tokens_latency_non_negative
    check (tokens_in >= 0 and tokens_out >= 0 and latency_ms >= 0)
);

-- Index for per-user queries (user reading their own history)
create index if not exists ai_audit_user_id_idx on public.ai_audit(user_id);
-- Index for time-range analytics
create index if not exists ai_audit_created_at_idx on public.ai_audit(created_at desc);

-- RLS
alter table public.ai_audit enable row level security;

-- Users can read only their own rows
create policy "ai_audit: users read own rows"
  on public.ai_audit
  for select
  using (auth.uid() = user_id);

-- service_role bypasses RLS by default in Supabase (no explicit INSERT policy needed
-- for service_role). Explicit policy below guards against anon/authed direct inserts.
-- Role is explicitly scoped to authenticated and anon to prevent future role additions
-- from accidentally gaining INSERT access.
create policy "ai_audit_no_client_insert"
  on public.ai_audit
  for insert
  to authenticated, anon
  with check (false);

-- ─────────────────────────────────────────────────────────
-- 2. ai_rate_limits  (L2 persistent backing store)
-- ─────────────────────────────────────────────────────────
create table if not exists public.ai_rate_limits (
  user_id      uuid not null references auth.users(id) on delete cascade,
  key          text not null,          -- e.g. 'ai-claude', 'ai-whisper'
  window_start timestamptz not null,   -- truncated to 1-minute boundary
  count        integer not null default 0,
  primary key (user_id, key, window_start)
);

create index if not exists ai_rate_limits_user_key_idx
  on public.ai_rate_limits(user_id, key, window_start desc);

-- TTL: rows older than 10 minutes are stale. A cron job or pg_cron can clean them.
-- For now, Edge Function will only upsert current window; old rows are inert.

alter table public.ai_rate_limits enable row level security;

-- No direct client access; service_role only
create policy "ai_rate_limits: deny all direct access"
  on public.ai_rate_limits
  for all
  using (false)
  with check (false);

-- ─── Table / column documentation ─────────────────────────────────────────
comment on table public.ai_audit is
  'Immutable call record for every AI (LLM/STT) invocation. '
  'INSERT: service_role only (Edge Function writes via service key). '
  'SELECT: authenticated users may read their own rows. '
  'tokens_in, tokens_out, latency_ms are guaranteed non-negative by constraint.';

comment on column public.ai_audit.tokens_in is
  'Prompt token count. Non-negative (enforced by ai_audit_tokens_latency_non_negative).';

comment on column public.ai_audit.tokens_out is
  'Completion token count. Non-negative (enforced by ai_audit_tokens_latency_non_negative).';

comment on column public.ai_audit.latency_ms is
  'End-to-end latency in milliseconds. Non-negative (enforced by ai_audit_tokens_latency_non_negative).';

comment on table public.ai_rate_limits is
  'Sliding-window counters for AI rate limiting (L2 persistent backing store). '
  'Managed entirely by Edge Function service-role upserts. No client access.';
