-- MODU RLS test script
-- Verifies deny-by-default: user_b cannot read user_a's data.
--
-- Run against a local Supabase stack:
--   supabase db reset
--   psql "postgresql://postgres:postgres@localhost:54322/postgres" -f supabase/tests/rls.sql
--
-- Or with the Supabase CLI:
--   supabase test db           (if pgTAP is enabled in config.toml)
--
-- The script uses SET LOCAL ROLE + SET LOCAL "request.jwt.claims" to
-- simulate RLS for two different authenticated users without needing
-- actual JWTs. This is the standard Supabase local RLS testing pattern.
--
-- Expected output: all assertions print "PASS". Any "FAIL" line means
-- a policy is missing or incorrectly scoped.

begin;

-- ─── Test fixtures ────────────────────────────────────────────────────────
-- Insert two test users directly into auth.users (local dev only).
-- In production auth.users is managed by Supabase Auth — never insert manually.

-- User A
insert into auth.users (id, email, created_at, updated_at, raw_user_meta_data)
values (
  '00000000-0000-0000-0000-000000000001',
  'user_a@test.local',
  now(), now(),
  '{"region":"ap-northeast-2","locale":"ko-KR"}'::jsonb
)
on conflict (id) do nothing;

-- User B
insert into auth.users (id, email, created_at, updated_at, raw_user_meta_data)
values (
  '00000000-0000-0000-0000-000000000002',
  'user_b@test.local',
  now(), now(),
  '{"region":"ap-northeast-2","locale":"en-US"}'::jsonb
)
on conflict (id) do nothing;

-- Profiles are created by the trigger, but insert manually to be safe.
insert into public.profiles (id, region, locale)
values ('00000000-0000-0000-0000-000000000001', 'ap-northeast-2', 'ko-KR')
on conflict (id) do nothing;

insert into public.profiles (id, region, locale)
values ('00000000-0000-0000-0000-000000000002', 'ap-northeast-2', 'en-US')
on conflict (id) do nothing;

-- User A's asset
insert into public.assets (id, user_id, type, title)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'fertility',
  '{"en-US":"Test Asset A"}'::jsonb
)
on conflict (id) do nothing;

-- User A's note
insert into public.notes (id, user_id, asset_id, body)
values (
  'bbbbbbbb-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'User A private note'
)
on conflict (id) do nothing;

-- User A's event
insert into public.events (id, user_id, event_id, type, sensitivity, envelope, occurred_at, properties)
values (
  'cccccccc-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'dddddddd-0000-0000-0000-000000000001',
  'session_started',
  'S1',
  'E2',
  now(),
  '{"tz_offset_minutes":540,"cold_start":true}'::jsonb
)
on conflict (id) do nothing;

-- S4 event (must be immutable)
insert into public.events (id, user_id, event_id, type, sensitivity, envelope, occurred_at, properties)
values (
  'eeeeeeee-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'ffffffff-0000-0000-0000-000000000001',
  'consent_decision_recorded',
  'S4',
  'E4',
  now(),
  '{"item":"local_default","decision":"acknowledged","decided_at":"2026-04-17T00:00:00Z"}'::jsonb
)
on conflict (id) do nothing;

-- ─── Helper: set RLS context to a specific user ───────────────────────────
-- Supabase RLS evaluates auth.uid() from the JWT claims injected into the
-- connection. In local tests we fake this via request.jwt.claims.

-- ─── Test 1: user_b cannot read user_a's profile ─────────────────────────
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';

do $$
declare
  cnt int;
begin
  select count(*) into cnt
  from public.profiles
  where id = '00000000-0000-0000-0000-000000000001';

  if cnt = 0 then
    raise notice 'PASS: user_b cannot read user_a profile';
  else
    raise warning 'FAIL: user_b CAN read user_a profile (cnt=%)', cnt;
  end if;
end;
$$;

-- ─── Test 2: user_b cannot read user_a's asset ───────────────────────────
do $$
declare
  cnt int;
begin
  select count(*) into cnt
  from public.assets
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';

  if cnt = 0 then
    raise notice 'PASS: user_b cannot read user_a asset';
  else
    raise warning 'FAIL: user_b CAN read user_a asset (cnt=%)', cnt;
  end if;
end;
$$;

-- ─── Test 3: user_b cannot read user_a's note ────────────────────────────
do $$
declare
  cnt int;
begin
  select count(*) into cnt
  from public.notes
  where user_id = '00000000-0000-0000-0000-000000000001';

  if cnt = 0 then
    raise notice 'PASS: user_b cannot read user_a note';
  else
    raise warning 'FAIL: user_b CAN read user_a note (cnt=%)', cnt;
  end if;
end;
$$;

-- ─── Test 4: user_b cannot read user_a's events ──────────────────────────
do $$
declare
  cnt int;
begin
  select count(*) into cnt
  from public.events
  where user_id = '00000000-0000-0000-0000-000000000001';

  if cnt = 0 then
    raise notice 'PASS: user_b cannot read user_a events';
  else
    raise warning 'FAIL: user_b CAN read user_a events (cnt=%)', cnt;
  end if;
end;
$$;

-- ─── Test 5: user_b cannot insert a note for user_a ──────────────────────
do $$
begin
  begin
    insert into public.notes (user_id, asset_id, body)
    values (
      '00000000-0000-0000-0000-000000000001',
      'aaaaaaaa-0000-0000-0000-000000000001',
      'malicious note by user_b'
    );
    raise warning 'FAIL: user_b inserted note for user_a';
  exception when others then
    raise notice 'PASS: user_b cannot insert note for user_a (error: %)', sqlerrm;
  end;
end;
$$;

-- ─── Test 5b: user_b cannot UPDATE user_a's note (cross-user UPDATE block) ──
-- user_b is still the active role from test 5.
do $$
begin
  begin
    update public.notes
    set body = 'tampered by user_b'
    where id = 'bbbbbbbb-0000-0000-0000-000000000001';
    -- If RLS is correct the update affects 0 rows (invisible to user_b).
    -- We verify by checking whether user_b can now read the tampered value.
    if found then
      raise warning 'FAIL: user_b UPDATE affected user_a note rows';
    else
      raise notice 'PASS: user_b UPDATE on user_a note affected 0 rows (invisible)';
    end if;
  exception when others then
    raise notice 'PASS: user_b UPDATE on user_a note blocked (error: %)', sqlerrm;
  end;
end;
$$;

-- ─── Test 6: user_a can read own profile ─────────────────────────────────
-- Reset JWT claims before switching to user_a to ensure no stale context.
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';

do $$
declare
  cnt int;
begin
  select count(*) into cnt
  from public.profiles
  where id = '00000000-0000-0000-0000-000000000001';

  if cnt = 1 then
    raise notice 'PASS: user_a can read own profile';
  else
    raise warning 'FAIL: user_a cannot read own profile (cnt=%)', cnt;
  end if;
end;
$$;

-- ─── Test 7: S4 event cannot be deleted even by owner ────────────────────
do $$
begin
  begin
    delete from public.events
    where id = 'eeeeeeee-0000-0000-0000-000000000001';
    raise warning 'FAIL: S4 event was deleted by owner';
  exception when restrict_violation then
    raise notice 'PASS: S4 event delete blocked (restrict_violation)';
  when others then
    raise notice 'PASS: S4 event delete blocked (error: %)', sqlerrm;
  end;
end;
$$;

-- ─── Test 8: S4 event cannot be updated even by owner ────────────────────
do $$
begin
  begin
    update public.events
    set properties = '{"tampered":true}'::jsonb
    where id = 'eeeeeeee-0000-0000-0000-000000000001';
    raise warning 'FAIL: S4 event was updated by owner';
  exception when restrict_violation then
    raise notice 'PASS: S4 event update blocked (restrict_violation)';
  when others then
    raise notice 'PASS: S4 event update blocked (error: %)', sqlerrm;
  end;
end;
$$;

-- ─── Test 9: daily_logs unique constraint ────────────────────────────────
do $$
begin
  insert into public.daily_logs (user_id, asset_id, logged_at, payload)
  values (
    '00000000-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    '2026-04-17',
    '{"mood":4}'::jsonb
  );
  begin
    insert into public.daily_logs (user_id, asset_id, logged_at, payload)
    values (
      '00000000-0000-0000-0000-000000000001',
      'aaaaaaaa-0000-0000-0000-000000000001',
      '2026-04-17',
      '{"mood":5}'::jsonb
    );
    raise warning 'FAIL: duplicate daily_log allowed';
  exception when unique_violation then
    raise notice 'PASS: daily_logs unique constraint enforced';
  end;
end;
$$;

-- ─── Test 10: anon role cannot SELECT protected tables ───────────────────
-- Reset JWT claims, then switch to anon role. anon has no auth.uid() so
-- all per-user RLS policies should return zero rows.
set local "request.jwt.claims" to '{}';
set local role anon;

do $$
declare
  cnt int;
begin
  select count(*) into cnt from public.profiles;
  if cnt = 0 then
    raise notice 'PASS: anon cannot read profiles';
  else
    raise warning 'FAIL: anon can read % profile row(s)', cnt;
  end if;
end;
$$;

do $$
declare
  cnt int;
begin
  select count(*) into cnt from public.notes;
  if cnt = 0 then
    raise notice 'PASS: anon cannot read notes';
  else
    raise warning 'FAIL: anon can read % note row(s)', cnt;
  end if;
end;
$$;

do $$
declare
  cnt int;
begin
  select count(*) into cnt from public.events;
  if cnt = 0 then
    raise notice 'PASS: anon cannot read events';
  else
    raise warning 'FAIL: anon can read % event row(s)', cnt;
  end if;
end;
$$;

do $$
declare
  cnt int;
begin
  select count(*) into cnt from public.ai_audit;
  if cnt = 0 then
    raise notice 'PASS: anon cannot read ai_audit';
  else
    raise warning 'FAIL: anon can read % ai_audit row(s)', cnt;
  end if;
end;
$$;

-- ─── Clean up ─────────────────────────────────────────────────────────────
-- Roll back everything so the test is non-destructive.
rollback;
