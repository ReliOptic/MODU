-- Migration 04: events table (append-only audit / analytics log)
-- Stores MoguEvent records from src/types/events.ts after the user opts in
-- to cloud sync. Local-first: events are emitted to device storage first
-- (ADR-0011). This table is the cloud sink after post-bonding sync opt-in.
--
-- Sensitivity classes (S1-S4) from docs/data/2026-04-17-phase-1-event-schema.md:
--   S1/S2: 90-day rolling purge (pg_cron job template provided below).
--   S3:    Indefinite (user's memory).
--   S4:    IMMUTABLE — delete/update are blocked by trigger.
--
-- envelope column maps to E1-E4 regulatory envelope.
-- properties stores event-specific payload (EventBase.properties).
--
-- GDPR Art.17 × S4 erasure design:
--   user_id is nullable. On auth.users DELETE the FK is set to NULL
--   (on delete set null) rather than cascade-deleting rows. This preserves
--   S4 audit rows (partner/consent/delegation) for regulatory integrity while
--   removing personal linkage. anonymized_at records the erasure timestamp.
--   S4 rows with user_id=null are retained indefinitely; S1/S2/S3 rows with
--   user_id=null may be swept by the pg_cron purge job (see template below).
--
--   Service-role escape hatch for anonymization:
--   The block_s4_mutation trigger allows UPDATE that sets user_id=null when
--   executed by service_role (the Edge Function erasure worker). This is the
--   only permitted mutation on S4 rows. All other mutations remain blocked.
--   Runbook: call supabase Edge Function "gdpr-erase?user_id=<uuid>" which
--   issues UPDATE events SET user_id=null, anonymized_at=now() WHERE user_id=<uuid>
--   then DELETE auth.users WHERE id=<uuid> via service key.

create table if not exists public.events (
  -- Database surrogate PK (sequential-friendly for range scans).
  id           uuid        primary key default gen_random_uuid(),
  -- Nullable: set to NULL on user erasure (GDPR Art.17). See design note above.
  user_id      uuid        references auth.users(id) on delete set null,
  -- EventBase.id from the client: UUID v4, unique per event instance.
  event_id     uuid        not null unique,
  -- MoguEvent['name'] discriminant.
  type         text        not null,
  -- Sensitivity class: S1 | S2 | S3 | S4.
  sensitivity  text        not null check (sensitivity in ('S1', 'S2', 'S3', 'S4')),
  -- Regulatory envelope: E1 | E2 | E3 | E4.
  envelope     text        not null check (envelope in ('E1', 'E2', 'E3', 'E4')),
  -- ISO-8601 UTC timestamp from the client (EventBase.occurred_at).
  occurred_at  timestamptz not null,
  -- Event-specific payload. Free-text is never stored; hashes substitute
  -- where identity-safe shape is needed (data minimization §6).
  properties   jsonb       not null default '{}'::jsonb,
  -- Timestamp when this row was pushed to the cloud store.
  synced_at    timestamptz not null default now(),
  -- GDPR Art.17: set by the erasure worker when user_id is nullified.
  anonymized_at timestamptz,
  -- Sanity bound: events must not predate the product launch or be far in future.
  constraint events_occurred_at_sane
    check (occurred_at > '2020-01-01' and occurred_at < now() + interval '1 day')
);

-- Composite index for per-user chronological queries (primary access pattern).
create index if not exists events_user_occurred_idx
  on public.events (user_id, occurred_at desc);

-- Index for sensitivity-bucketed queries (purge job, export, quota checks).
create index if not exists events_user_sensitivity_idx
  on public.events (user_id, sensitivity);

-- ─── S4 IMMUTABLE: block DELETE and UPDATE ────────────────────────────────
-- S4 events (partner/consent/delegation audit) must never be deleted or
-- modified. This trigger enforces the constraint at the database layer,
-- independent of RLS or application code.
create or replace function public.block_s4_mutation()
returns trigger
language plpgsql
as $$
begin
  if old.sensitivity = 'S4' then
    -- GDPR Art.17 escape hatch: service_role may nullify user_id (anonymization).
    -- This is the ONLY permitted mutation on S4 rows.
    -- Runbook: Edge Function "gdpr-erase" issues:
    --   UPDATE events SET user_id=null, anonymized_at=now() WHERE user_id=<uuid>
    -- then deletes the auth.users row. No other fields may be changed.
    if tg_op = 'UPDATE'
      and session_user = 'service_role'
      and new.user_id is null
      and new.anonymized_at is not null
      -- Ensure no other fields were touched beyond user_id and anonymized_at.
      and new.id            = old.id
      and new.event_id      = old.event_id
      and new.type          = old.type
      and new.sensitivity   = old.sensitivity
      and new.envelope      = old.envelope
      and new.occurred_at   = old.occurred_at
      and new.properties    = old.properties
      and new.synced_at     = old.synced_at
    then
      -- Allow: GDPR anonymization by service_role.
      return new;
    end if;

    raise exception
      'S4 audit events are immutable and cannot be % (event_id: %)',
      tg_op, old.event_id
      using errcode = 'restrict_violation';
  end if;
  -- Non-S4: allow the operation to proceed normally.
  return old;
end;
$$;

drop trigger if exists events_block_s4_delete on public.events;
create trigger events_block_s4_delete
  before delete on public.events
  for each row execute function public.block_s4_mutation();

drop trigger if exists events_block_s4_update on public.events;
create trigger events_block_s4_update
  before update on public.events
  for each row execute function public.block_s4_mutation();

-- ─── S1/S2 90-day rolling purge (pg_cron template) ────────────────────────
-- Application-level alternative: EventRepository purges locally before push.
-- To enable in Supabase: Dashboard → Database → Extensions → pg_cron ON,
-- then run the INSERT below once (do not include in idempotent migrations).
--
-- select cron.schedule(
--   'purge_s1_s2_events',          -- job name
--   '0 3 * * *',                    -- daily at 03:00 UTC
--   $$
--     delete from public.events
--     where sensitivity in ('S1', 'S2')
--       and occurred_at < now() - interval '90 days';
--   $$
-- );
--
-- To cancel: select cron.unschedule('purge_s1_s2_events');

-- ─── RLS ──────────────────────────────────────────────────────────────────
-- INSERT only from the client (anon / authenticated role).
-- SELECT for the owner. No client-side DELETE or UPDATE.
-- S4 immutability is enforced by trigger above (belt-and-suspenders).
alter table public.events enable row level security;

drop policy if exists "events_owner_select" on public.events;
create policy "events_owner_select" on public.events
  for select using (user_id = auth.uid());

drop policy if exists "events_owner_insert" on public.events;
create policy "events_owner_insert" on public.events
  for insert with check (user_id = auth.uid());

-- No UPDATE or DELETE policies for authenticated users.
-- service_role (Edge Functions) may delete S1/S2 rows via the purge job.

-- ─── Table / column documentation ─────────────────────────────────────────
comment on table public.events is
  'Cloud sink for MoguEvent records (local-first, synced post-bonding). '
  'S4 rows are immutable audit entries (partner/consent/delegation). '
  'GDPR Art.17 erasure: user_id is nullified by the gdpr-erase Edge Function; '
  'anonymized_at records the erasure timestamp. Rows are never hard-deleted.';

comment on column public.events.user_id is
  'FK to auth.users. Nullable — set to NULL by the gdpr-erase Edge Function '
  'on user account deletion (GDPR Art.17 anonymization via on delete set null).';

comment on column public.events.sensitivity is
  'S1/S2: 90-day rolling purge eligible. S3: indefinite. S4: immutable audit record.';

comment on column public.events.anonymized_at is
  'Timestamp set by the gdpr-erase Edge Function when user_id is nullified. '
  'NULL means the row has not been anonymized.';
