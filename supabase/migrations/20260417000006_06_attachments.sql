-- Migration 06: attachments table (Cloudflare R2 metadata)
-- Prepared for Task #20 (R2 presigned URL flow). Stores object metadata only —
-- the actual bytes live in Cloudflare R2. r2_key is the stable object key
-- used to construct presigned GET/PUT URLs in the Edge Function.
--
-- Data minimisation note (MODU_GLOBAL_SUPABASE_ARCHITECTURE §6):
-- "uploaded files as higher-risk than notes". OCR text and EXIF data are
-- stored only when the product feature explicitly requires them. This table
-- stores the minimum metadata needed to reconstruct the R2 URL and display
-- file info in the UI.

create table if not exists public.attachments (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  asset_id    uuid        not null references public.assets(id) on delete cascade,
  -- Stable Cloudflare R2 object key (e.g. "users/{user_id}/assets/{asset_id}/{uuid}.jpg").
  -- Not null: an attachment row without an R2 key is meaningless.
  r2_key      text        not null,
  mime        text,
  byte_size   bigint,
  created_at  timestamptz not null default now()
);

create index if not exists attachments_user_asset_idx
  on public.attachments (user_id, asset_id, created_at desc);

-- r2_key uniqueness: one physical object per attachment row.
create unique index if not exists attachments_r2_key_unique
  on public.attachments (r2_key);

-- ─── RLS ──────────────────────────────────────────────────────────────────
-- Owner-only. No partner read here — sharing flows go through the
-- chapter_memories visibility model, not raw attachment rows.
alter table public.attachments enable row level security;

drop policy if exists "attachments_owner_select" on public.attachments;
create policy "attachments_owner_select" on public.attachments
  for select using (user_id = auth.uid());

drop policy if exists "attachments_owner_insert" on public.attachments;
create policy "attachments_owner_insert" on public.attachments
  for insert with check (user_id = auth.uid());

drop policy if exists "attachments_owner_delete" on public.attachments;
create policy "attachments_owner_delete" on public.attachments
  for delete using (user_id = auth.uid());

-- No UPDATE policy: r2_key is immutable after upload. Replace = delete + insert.
