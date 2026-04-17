-- Migration 03: formation_sessions + formation_answers tables
-- Stores the structured onboarding dialogue that creates an asset.
-- Matches src/types/formation.ts FormationStep / FormationResponse shape.
--
-- formation_sessions: one row per formation run (may be abandoned or completed).
-- formation_answers:  append-only rows per step response within a session.
--
-- consent_version_id on formation_sessions records which consent document
-- version was in force when the user completed formation — satisfies
-- GDPR Art. 7(1) record-keeping requirement (RC6 in progress.md).

create table if not exists public.formation_sessions (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users(id) on delete cascade,
  -- The asset created/updated by this formation run (null until completed).
  asset_id           uuid        references public.assets(id) on delete set null,
  started_at         timestamptz not null default now(),
  completed_at       timestamptz,
  -- Consent document version the user acknowledged at the start of formation.
  consent_version_id text
);

create index if not exists formation_sessions_user_id_idx
  on public.formation_sessions (user_id);

create index if not exists formation_sessions_asset_id_idx
  on public.formation_sessions (asset_id)
  where asset_id is not null;

-- formation_answers: one row per step response.
-- answer is jsonb to accommodate preset / free-text / photo-uri variants
-- (matches FormationResponse in src/types/formation.ts).
create table if not exists public.formation_answers (
  id          uuid        primary key default gen_random_uuid(),
  session_id  uuid        not null references public.formation_sessions(id) on delete cascade,
  -- Step sequence order (0-indexed, matches FormationStep.id sequence).
  step        int         not null,
  question_id text        not null,
  -- {"value": "...", "type": "preset|voice|text|skip|photo", "shortLabel": "..."}
  answer      jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists formation_answers_session_id_idx
  on public.formation_answers (session_id, step);

-- ─── RLS — formation_sessions ─────────────────────────────────────────────
alter table public.formation_sessions enable row level security;

drop policy if exists "formation_sessions_owner_select" on public.formation_sessions;
create policy "formation_sessions_owner_select" on public.formation_sessions
  for select using (user_id = auth.uid());

drop policy if exists "formation_sessions_owner_insert" on public.formation_sessions;
create policy "formation_sessions_owner_insert" on public.formation_sessions
  for insert with check (user_id = auth.uid());

drop policy if exists "formation_sessions_owner_update" on public.formation_sessions;
create policy "formation_sessions_owner_update" on public.formation_sessions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "formation_sessions_owner_delete" on public.formation_sessions;
create policy "formation_sessions_owner_delete" on public.formation_sessions
  for delete using (user_id = auth.uid());

-- ─── RLS — formation_answers ──────────────────────────────────────────────
-- No direct user_id column. Ownership is asserted via the parent session.
alter table public.formation_answers enable row level security;

drop policy if exists "formation_answers_owner_select" on public.formation_answers;
create policy "formation_answers_owner_select" on public.formation_answers
  for select using (
    exists (
      select 1 from public.formation_sessions fs
      where fs.id = formation_answers.session_id
        and fs.user_id = auth.uid()
    )
  );

drop policy if exists "formation_answers_owner_insert" on public.formation_answers;
create policy "formation_answers_owner_insert" on public.formation_answers
  for insert with check (
    exists (
      select 1 from public.formation_sessions fs
      where fs.id = formation_answers.session_id
        and fs.user_id = auth.uid()
    )
  );

drop policy if exists "formation_answers_owner_delete" on public.formation_answers;
create policy "formation_answers_owner_delete" on public.formation_answers
  for delete using (
    exists (
      select 1 from public.formation_sessions fs
      where fs.id = formation_answers.session_id
        and fs.user_id = auth.uid()
    )
  );

-- No UPDATE on answers: formation is append-only (corrections create a new row).
