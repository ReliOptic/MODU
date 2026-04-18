-- Migration: device-identity path for Cloudflare R2 attachments + audit
-- Rationale (ADR-0011 local-first + ADR-0005 privacy-as-moat + ADR-0012):
--   MODU has no user accounts in v1. AI Edge Function already uses
--   X-Device-Id (migration 10). This migration extends the same pattern
--   to the R2 attachments + audit path so that photo/audio/PDF uploads
--   work in an account-free app without requiring anonymous auth.
--
-- Changes:
--   1. attachments.user_id nullable + device_id column + XOR check
--      Owner RLS policies extended so authenticated users remain scoped
--      to their own rows; device-id rows are anonymous (invisible to any
--      authenticated user — same privacy property as ai_audit).
--   2. r2_audit.user_id nullable + device_id column + XOR check
--   3. assets.user_id nullable + device_id column + XOR check
--      (attachments + r2_audit must be able to reference device-scoped
--       assets; ownership check in Edge Functions switches to device_id
--       when user_id is null.)
--
-- Rollback: this migration is forward-only. Revert via Supabase
-- point-in-time recovery if required.

-- ─────────────────────────────────────────────────────────
-- 1. assets — add device_id, keep user_id nullable
-- ─────────────────────────────────────────────────────────
alter table public.assets
  alter column user_id drop not null;

alter table public.assets
  add column if not exists device_id uuid;

alter table public.assets
  drop constraint if exists assets_subject_xor;
alter table public.assets
  add constraint assets_subject_xor
  check (
    (user_id is not null and device_id is null)
    or (user_id is null and device_id is not null)
  );

create index if not exists assets_device_id_idx on public.assets(device_id);

comment on column public.assets.device_id is
  'Anonymous device identifier (UUID v4, generated client-side, no auth.users FK). '
  'Exactly one of user_id or device_id is set (enforced by assets_subject_xor).';

-- ─────────────────────────────────────────────────────────
-- 2. attachments — add device_id, keep user_id nullable
-- ─────────────────────────────────────────────────────────
alter table public.attachments
  alter column user_id drop not null;

alter table public.attachments
  add column if not exists device_id uuid;

alter table public.attachments
  drop constraint if exists attachments_subject_xor;
alter table public.attachments
  add constraint attachments_subject_xor
  check (
    (user_id is not null and device_id is null)
    or (user_id is null and device_id is not null)
  );

create index if not exists attachments_device_asset_idx
  on public.attachments (device_id, asset_id, created_at desc);

comment on column public.attachments.device_id is
  'Anonymous device identifier (UUID v4, generated client-side, no auth.users FK). '
  'Exactly one of user_id or device_id is set (enforced by attachments_subject_xor).';

-- Existing owner-only RLS policies use user_id = auth.uid(). A row with
-- user_id IS NULL (device_id only) naturally never matches any authenticated
-- user — that is the desired privacy property. All writes go through
-- service_role in the Edge Function, bypassing RLS.

-- ─────────────────────────────────────────────────────────
-- 3. r2_audit — add device_id, keep user_id nullable
-- ─────────────────────────────────────────────────────────
alter table public.r2_audit
  alter column user_id drop not null;

alter table public.r2_audit
  add column if not exists device_id uuid;

alter table public.r2_audit
  drop constraint if exists r2_audit_subject_xor;
alter table public.r2_audit
  add constraint r2_audit_subject_xor
  check (
    (user_id is not null and device_id is null)
    or (user_id is null and device_id is not null)
  );

create index if not exists r2_audit_device_created_idx
  on public.r2_audit (device_id, created_at desc);

comment on column public.r2_audit.device_id is
  'Anonymous device identifier (UUID v4, generated client-side, no auth.users FK). '
  'Exactly one of user_id or device_id is set (enforced by r2_audit_subject_xor).';

-- Same RLS semantics as attachments: existing "users read own rows" policy
-- naturally excludes device-id rows (user_id IS NULL ≠ auth.uid()).
