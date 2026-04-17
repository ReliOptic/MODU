-- Migration 05: care data tables
-- notes, medications, daily_logs — structured care data per asset.
-- All tables: RLS enabled, owner-only access, updated_at auto-trigger.
-- Matches the data minimisation principle (MODU_GLOBAL_SUPABASE_ARCHITECTURE §6):
-- structured care data is separate from free-text narrative (chapter_memories
-- in schema.legacy.sql / future notes body is plain text stored server-side
-- only when sync is enabled).

-- ─── notes ────────────────────────────────────────────────────────────────
-- Free-text care notes attached to an asset.
-- body is plain text (not JSONB) — no schema enforcement needed.
-- Raw free-text stays here; it is never copied into event properties.
create table if not exists public.notes (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  asset_id    uuid        not null references public.assets(id) on delete cascade,
  body        text        not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists notes_user_asset_idx
  on public.notes (user_id, asset_id, created_at desc);

drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.handle_updated_at();

alter table public.notes enable row level security;

drop policy if exists "notes_owner_select" on public.notes;
create policy "notes_owner_select" on public.notes
  for select using (user_id = auth.uid());

drop policy if exists "notes_owner_insert" on public.notes;
create policy "notes_owner_insert" on public.notes
  for insert with check (user_id = auth.uid());

drop policy if exists "notes_owner_update" on public.notes;
create policy "notes_owner_update" on public.notes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notes_owner_delete" on public.notes;
create policy "notes_owner_delete" on public.notes
  for delete using (user_id = auth.uid());

-- ─── medications ──────────────────────────────────────────────────────────
-- Medication records with dosage and schedule.
-- schedule is JSONB to accommodate flexible repeat patterns
-- (e.g. {"type": "daily", "times": ["08:00","20:00"]} or
--        {"type": "weekly", "days": [1,4], "time": "09:00"}).
create table if not exists public.medications (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  asset_id    uuid        not null references public.assets(id) on delete cascade,
  name        text        not null,
  dosage      text,
  -- {"type": "daily"|"weekly"|"custom", "times": [...], "days": [...]}
  schedule    jsonb       not null default '{}'::jsonb,
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists medications_user_asset_active_idx
  on public.medications (user_id, asset_id)
  where active = true;

drop trigger if exists medications_updated_at on public.medications;
create trigger medications_updated_at
  before update on public.medications
  for each row execute function public.handle_updated_at();

alter table public.medications enable row level security;

drop policy if exists "medications_owner_select" on public.medications;
create policy "medications_owner_select" on public.medications
  for select using (user_id = auth.uid());

drop policy if exists "medications_owner_insert" on public.medications;
create policy "medications_owner_insert" on public.medications
  for insert with check (user_id = auth.uid());

drop policy if exists "medications_owner_update" on public.medications;
create policy "medications_owner_update" on public.medications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "medications_owner_delete" on public.medications;
create policy "medications_owner_delete" on public.medications
  for delete using (user_id = auth.uid());

-- ─── daily_logs ───────────────────────────────────────────────────────────
-- One log per user × asset × calendar day.
-- payload is open JSONB: callers store whatever per-asset daily data is
-- appropriate (mood, symptom scale, activity minutes, etc.).
-- The UNIQUE constraint enforces idempotent upserts from the client.
create table if not exists public.daily_logs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  asset_id    uuid        not null references public.assets(id) on delete cascade,
  -- Calendar date in the user's local timezone (store date, not timestamptz,
  -- to avoid DST boundary confusion for "today's log" queries).
  -- TZ WARNING: first-write-wins semantics; client must normalize logged_at to
  -- the user's declared timezone before insert. Subsequent writes on the same
  -- calendar date in a different timezone will be rejected by the UNIQUE
  -- constraint. tz_offset_minutes records the UTC offset at write time so that
  -- readers can detect if the stored date was computed with a different offset
  -- than the reader's current locale. nullable for rows inserted before this
  -- column was added (migration 05 rev 2).
  logged_at          date        not null,
  tz_offset_minutes  integer,    -- UTC offset in minutes at insert time, e.g. 540 for KST
  payload            jsonb       not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, asset_id, logged_at)
);

create index if not exists daily_logs_user_asset_date_idx
  on public.daily_logs (user_id, asset_id, logged_at desc);

drop trigger if exists daily_logs_updated_at on public.daily_logs;
create trigger daily_logs_updated_at
  before update on public.daily_logs
  for each row execute function public.handle_updated_at();

alter table public.daily_logs enable row level security;

drop policy if exists "daily_logs_owner_select" on public.daily_logs;
create policy "daily_logs_owner_select" on public.daily_logs
  for select using (user_id = auth.uid());

drop policy if exists "daily_logs_owner_insert" on public.daily_logs;
create policy "daily_logs_owner_insert" on public.daily_logs
  for insert with check (user_id = auth.uid());

drop policy if exists "daily_logs_owner_update" on public.daily_logs;
create policy "daily_logs_owner_update" on public.daily_logs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "daily_logs_owner_delete" on public.daily_logs;
create policy "daily_logs_owner_delete" on public.daily_logs
  for delete using (user_id = auth.uid());
