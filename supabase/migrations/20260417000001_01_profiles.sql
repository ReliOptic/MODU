-- Migration 01: profiles table
-- Extends auth.users with region, locale, and consent metadata.
-- Region default: ap-northeast-2 (Seoul). Assign at signup via
--   INSERT INTO profiles (id, region) VALUES (auth.uid(), 'ap-northeast-2')
-- or let the trigger below populate the default.
--
-- IMPORTANT: region must be assigned at signup and treated as stable.
-- A deliberate migration flow is required before changing it (MODU_GLOBAL_SUPABASE_ARCHITECTURE §1).

create table if not exists public.profiles (
  id                uuid        primary key references auth.users(id) on delete cascade,
  -- Data region assigned at signup. Stable unless user initiates migration.
  -- Values mirror Supabase region slugs: ap-northeast-2, eu-central-1, us-east-1, etc.
  region            text        not null default 'ap-northeast-2',
  locale            text        not null default 'en-US',
  -- Tracks which version of the consent/privacy document the user acknowledged.
  -- Populated by the onboarding consent screen (consent_decision_recorded events).
  consent_version_id text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Last successful cloud sync push for this profile row.
  synced_at         timestamptz
);

-- updated_at trigger
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Owner: full read and write on own row only.
drop policy if exists "profiles_owner_select" on public.profiles;
create policy "profiles_owner_select" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_owner_insert" on public.profiles;
create policy "profiles_owner_insert" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- No DELETE policy: profiles are deleted only via CASCADE from auth.users.

-- ─── auth.users → profiles auto-creation trigger ──────────────────────────
-- Fires after every new auth.users row (social sign-in, email/password, etc.).
-- Inserts a profile row with the Seoul region default.
-- Edge Functions that know the user's preferred region should UPDATE the row
-- immediately after signup if a different region is warranted.
--
-- DEPLOYMENT WARNING: This trigger targets auth.users which is owned by the
-- Supabase Auth schema. It MUST be deployed via `supabase db push` (or the
-- Supabase Dashboard SQL editor running as a superuser). Running this migration
-- via direct psql with an unprivileged role will fail with a permission denied
-- error on auth.users. Never apply this file manually with `psql -U postgres`
-- against a production Supabase project — use `supabase db push` exclusively.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, region, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'region', 'ap-northeast-2'),
    coalesce(new.raw_user_meta_data->>'locale', 'en-US')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Table / column documentation ─────────────────────────────────────────
comment on table public.profiles is
  'Per-user settings and consent metadata. One row per auth.users entry, '
  'created automatically by the on_auth_user_created trigger. '
  'Delete cascades from auth.users.';

comment on column public.profiles.region is
  'Supabase data region slug assigned at signup (e.g. ap-northeast-2). '
  'Treat as stable — changing requires a deliberate data-migration flow.';

comment on column public.profiles.consent_version_id is
  'Version identifier of the privacy/terms document the user last acknowledged. '
  'Populated by the consent_decision_recorded event handler.';
