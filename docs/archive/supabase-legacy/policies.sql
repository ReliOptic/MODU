-- MODU RLS policies — multi-tenant 안전 (ADR-0001 / ADR-0005)
-- 원칙:
--   1) 모든 테이블 RLS 활성화
--   2) Asset 소유자 = full read/write
--   3) Partner = scope.canRead/canWrite 에 정의된 memory kind 만
--   4) 비활성 사용자(=다른 user) 의 데이터에는 절대 접근 불가

-- helper: 현재 user 가 asset 의 owner 또는 accepted partner 인가?
create or replace function public.has_asset_access(_asset_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.assets a
    where a.id = _asset_id and a.owner_user_id = auth.uid()
  ) or exists (
    select 1 from public.partner_links pl
    where pl.asset_id = _asset_id
      and pl.partner_user_id = auth.uid()
      and pl.accepted_at is not null
  );
$$;

-- helper: owner 인가?
create or replace function public.is_asset_owner(_asset_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.assets a
    where a.id = _asset_id and a.owner_user_id = auth.uid()
  );
$$;

-- ─── profiles ───
alter table public.profiles enable row level security;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ─── assets ───
alter table public.assets enable row level security;

drop policy if exists "assets_owner_or_partner_read" on public.assets;
create policy "assets_owner_or_partner_read" on public.assets
  for select using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.partner_links pl
      where pl.asset_id = id
        and pl.partner_user_id = auth.uid()
        and pl.accepted_at is not null
    )
  );

drop policy if exists "assets_owner_write" on public.assets;
create policy "assets_owner_write" on public.assets
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

-- ─── chapter_memories ───
alter table public.chapter_memories enable row level security;

drop policy if exists "memories_owner_full" on public.chapter_memories;
create policy "memories_owner_full" on public.chapter_memories
  for all using (public.is_asset_owner(asset_id))
  with check (public.is_asset_owner(asset_id));

-- 파트너는 visibility !== 'self' 인 row 중 본인 scope 에 포함된 kind 만 read
drop policy if exists "memories_partner_read" on public.chapter_memories;
create policy "memories_partner_read" on public.chapter_memories
  for select using (
    visibility <> 'self'
    and exists (
      select 1 from public.partner_links pl
      where pl.asset_id = chapter_memories.asset_id
        and pl.partner_user_id = auth.uid()
        and pl.accepted_at is not null
        and (pl.scope->'canRead') ? chapter_memories.kind::text
    )
  );

-- ─── scheduled_events ───
alter table public.scheduled_events enable row level security;

drop policy if exists "events_access_read" on public.scheduled_events;
create policy "events_access_read" on public.scheduled_events
  for select using (public.has_asset_access(asset_id));

drop policy if exists "events_owner_write" on public.scheduled_events;
create policy "events_owner_write" on public.scheduled_events
  for insert with check (public.is_asset_owner(asset_id));
drop policy if exists "events_owner_update" on public.scheduled_events;
create policy "events_owner_update" on public.scheduled_events
  for update using (public.is_asset_owner(asset_id));
drop policy if exists "events_owner_delete" on public.scheduled_events;
create policy "events_owner_delete" on public.scheduled_events
  for delete using (public.is_asset_owner(asset_id));

-- ─── partner_links ───
alter table public.partner_links enable row level security;

drop policy if exists "partner_links_owner_or_self" on public.partner_links;
create policy "partner_links_owner_or_self" on public.partner_links
  for select using (
    public.is_asset_owner(asset_id) or partner_user_id = auth.uid()
  );

drop policy if exists "partner_links_owner_write" on public.partner_links;
create policy "partner_links_owner_write" on public.partner_links
  for insert with check (public.is_asset_owner(asset_id));
drop policy if exists "partner_links_owner_delete" on public.partner_links;
create policy "partner_links_owner_delete" on public.partner_links
  for delete using (public.is_asset_owner(asset_id));

-- 파트너가 본인의 invitation 만 accept 가능
drop policy if exists "partner_links_self_accept" on public.partner_links;
create policy "partner_links_self_accept" on public.partner_links
  for update using (partner_user_id = auth.uid())
  with check (partner_user_id = auth.uid());

-- ─── media_artifacts ───
alter table public.media_artifacts enable row level security;

drop policy if exists "media_access_read" on public.media_artifacts;
create policy "media_access_read" on public.media_artifacts
  for select using (public.has_asset_access(asset_id));

drop policy if exists "media_owner_write" on public.media_artifacts;
create policy "media_owner_write" on public.media_artifacts
  for all using (public.is_asset_owner(asset_id))
  with check (public.is_asset_owner(asset_id));

-- ─── ai_call_logs (사용자 본인 만) ───
alter table public.ai_call_logs enable row level security;

drop policy if exists "ai_logs_self_read" on public.ai_call_logs;
create policy "ai_logs_self_read" on public.ai_call_logs
  for select using (user_id = auth.uid());
-- write 는 service_role 만 (Edge Function 에서)

-- ─── vertical_waitlist (insert 만 누구나, read 는 본인 것만) ───
alter table public.vertical_waitlist enable row level security;

drop policy if exists "waitlist_self_read" on public.vertical_waitlist;
create policy "waitlist_self_read" on public.vertical_waitlist
  for select using (user_id = auth.uid());

drop policy if exists "waitlist_anyone_insert" on public.vertical_waitlist;
create policy "waitlist_anyone_insert" on public.vertical_waitlist
  for insert with check (
    -- 비로그인 인 경우 (anon role) 도 허용
    user_id is null or user_id = auth.uid()
  );

-- ─── chapter_archives (owner 본인만) ───
alter table public.chapter_archives enable row level security;

drop policy if exists "archives_owner_full" on public.chapter_archives;
create policy "archives_owner_full" on public.chapter_archives
  for all using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
