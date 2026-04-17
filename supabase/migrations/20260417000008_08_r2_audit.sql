-- Migration 08: r2_audit table — Cloudflare R2 presigned URL operation log
-- Task #20 — R2 presigned URL flow audit trail.
--
-- Records metadata about every presign (upload/download) and complete operation.
-- No object content or presigned URLs are stored — only structural metadata.
-- Minimisation note (MODU_GLOBAL_SUPABASE_ARCHITECTURE §6): uploaded files are
-- higher-risk data. This table stores the minimum needed for abuse detection,
-- quota enforcement, and debugging.
--
-- INSERT: service_role only (Edge Function writes via service key).
-- SELECT: authenticated users may read their own rows.

create table if not exists public.r2_audit (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  -- 'upload' | 'download' | 'complete'
  op          text        not null check (op in ('upload', 'download', 'complete')),
  -- Stable R2 object key: u/{user_id}/a/{asset_id}/{YYYYMMDD}/{uuid}.{ext}
  key         text        not null,
  mime        text        not null,
  byte_size   bigint      not null default 0,
  -- Elapsed ms from handler entry to presign/insert completion
  latency_ms  integer     not null default 0,
  created_at  timestamptz not null default now(),
  constraint r2_audit_byte_size_latency_non_negative
    check (byte_size >= 0 and latency_ms >= 0)
);

-- Per-user time-range queries (abuse detection, user-facing history)
create index if not exists r2_audit_user_created_idx
  on public.r2_audit (user_id, created_at desc);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.r2_audit enable row level security;

-- Users can read their own audit rows (traceability, support)
create policy "r2_audit: users read own rows"
  on public.r2_audit
  for select
  using (auth.uid() = user_id);

-- Block direct insert by non-service roles (same pattern as ai_audit).
-- Role is explicitly scoped to authenticated and anon so future role additions
-- do not accidentally gain INSERT access.
create policy "r2_audit_no_client_insert"
  on public.r2_audit
  for insert
  to authenticated, anon
  with check (false);
