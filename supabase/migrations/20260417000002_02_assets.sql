-- Migration 02: assets table
-- One row per life chapter (fertility, caregiver, pet, study, work, etc.).
-- Matches src/types/asset.ts Asset interface (Syncable base: id, updatedAt, syncedAt).
--
-- title is stored as jsonb to support multi-locale display names
-- (e.g. {"en-US": "IVF Journey", "ko-KR": "나의 IVF 여정"}).
-- category_hint is a free-text LLM-inferred tag; not an enum so the
-- horizontal platform can extend dynamically (ADR-0018).

create table if not exists public.assets (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  -- Type mirrors src/types/asset.ts AssetType. 'custom' covers
  -- LLM-spawned types not yet enumerated.
  type          text        not null default 'custom',
  -- Free-text LLM-inferred category for horizontal platform flexibility.
  category_hint text,
  -- Multi-locale title: {"en-US": "...", "ko-KR": "..."}
  title         jsonb       not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  synced_at     timestamptz,
  archived_at   timestamptz
);

create index if not exists assets_user_id_idx
  on public.assets (user_id);

create index if not exists assets_user_active_idx
  on public.assets (user_id, created_at desc)
  where archived_at is null;

-- updated_at trigger
drop trigger if exists assets_updated_at on public.assets;
create trigger assets_updated_at
  before update on public.assets
  for each row execute function public.handle_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────
-- Deny-by-default. Owner-only access for all operations.
alter table public.assets enable row level security;

drop policy if exists "assets_owner_select" on public.assets;
create policy "assets_owner_select" on public.assets
  for select using (user_id = auth.uid());

drop policy if exists "assets_owner_insert" on public.assets;
create policy "assets_owner_insert" on public.assets
  for insert with check (user_id = auth.uid());

drop policy if exists "assets_owner_update" on public.assets;
create policy "assets_owner_update" on public.assets
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "assets_owner_delete" on public.assets;
create policy "assets_owner_delete" on public.assets
  for delete using (user_id = auth.uid());
