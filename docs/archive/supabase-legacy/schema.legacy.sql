-- LEGACY: superseded by supabase/migrations/20260417000000_* – 20260417000006_*
-- (Task #18, 2026-04-17). Do NOT apply to any new project.
-- Preserved for historical reference only.
--
-- MODU Postgres schema — Memory-First Data Model (ADR-0003)
-- 적용 순서: schema.sql → policies.sql → seed.sql (선택)
--
-- 핵심 원칙:
--   1) ChapterMemory 가 1순위 시민 (append-only timeline)
--   2) 위젯은 ChapterMemory 의 derived projection
--   3) 모든 row 에 owner_user_id 또는 asset_id (RLS 강제)
--   4) JSONB payload 는 ChapterMemoryKind 에 따라 schema 분기 (앱 layer 검증)

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────
-- 1. Users (Supabase auth.users 확장)
-- ─────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  voice_enabled boolean not null default true,
  biometric_lock boolean not null default true,
  analytics_opt_in boolean not null default false,
  data_residency text not null default 'KR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- 2. Assets (= Chapters)
-- ─────────────────────────────────────────────────────────
create type asset_type as enum ('fertility', 'cancer_caregiver', 'pet_care', 'chronic', 'custom');
create type asset_status as enum ('forming', 'active', 'archived');
create type palette_key as enum ('dawn', 'mist', 'blossom', 'sage', 'dusk');

create table if not exists public.assets (
  id uuid primary key default uuid_generate_v4(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  type asset_type not null,
  display_name text not null,
  palette palette_key not null default 'dawn',
  status asset_status not null default 'forming',
  photo_uri text,
  -- UI config (PROJECT_SPEC §1.1) — 향후 server-driven 가능
  tabs jsonb not null default '[]'::jsonb,
  widgets jsonb not null default '[]'::jsonb,
  layout_rules jsonb not null default '[]'::jsonb,
  -- Formation context
  formation_data jsonb not null default '{"responses":{}}'::jsonb,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists assets_owner_idx on public.assets(owner_user_id);
create index if not exists assets_status_idx on public.assets(status) where status <> 'archived';

-- ─────────────────────────────────────────────────────────
-- 3. ChapterMemory (append-only timeline) — ADR-0003 핵심
-- ─────────────────────────────────────────────────────────
create type memory_kind as enum (
  'visit_memo',        -- 진료 메모 (텍스트/음성)
  'medication_log',    -- 약 복용 / 주사 기록
  'mood_log',          -- 감정 체크인
  'photo',             -- 사진 첨부 (medical photo, pet photo, etc.)
  'pdf_attachment',    -- 진단서/처방전 PDF
  'ai_distill',        -- LLM 요약 (weekly distill, trigger analysis)
  'milestone',         -- 시술 D-1, 항암 N차 완료 등 인생 marker
  'note'               -- 자유 메모
);

create type memory_visibility as enum ('self', 'partners', 'doctor');

create table if not exists public.chapter_memories (
  id uuid primary key default uuid_generate_v4(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  kind memory_kind not null,
  occurred_at timestamptz not null,
  payload jsonb not null,                    -- kind 별 schema 분기
  ai_summary text,                            -- 검색·재생산용 (NULL 가능)
  visibility memory_visibility not null default 'self',
  origin text not null default 'manual',     -- manual | voice | photo_ocr | partner | ai
  -- 정정용 link (immutable 원칙: 수정은 새 row + 이 컬럼으로 이전 row 참조)
  corrects_id uuid references public.chapter_memories(id),
  created_at timestamptz not null default now()
);

create index if not exists memories_asset_time_idx
  on public.chapter_memories(asset_id, occurred_at desc);
create index if not exists memories_kind_idx
  on public.chapter_memories(asset_id, kind);
create index if not exists memories_visibility_idx
  on public.chapter_memories(asset_id, visibility) where visibility <> 'self';

-- ─────────────────────────────────────────────────────────
-- 4. Scheduled Events (실 일정 — 위젯 V2 엔진의 입력)
-- ─────────────────────────────────────────────────────────
create type event_type as enum (
  'transfer', 'injection', 'retrieval',
  'chemo', 'visit',
  'medication', 'vet_visit',
  'consultation'
);

create table if not exists public.scheduled_events (
  id uuid primary key default uuid_generate_v4(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  type event_type not null,
  at timestamptz not null,
  duration_hours numeric(5,2) default 0,
  afterglow_hours numeric(5,2) default 12,
  title text not null,
  subtitle text,
  associated_widgets text[] default '{}',
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create index if not exists events_asset_at_idx on public.scheduled_events(asset_id, at);

-- ─────────────────────────────────────────────────────────
-- 5. Partner Links (다중 사용자 / 권한 행렬)
-- ─────────────────────────────────────────────────────────
create type partner_role as enum ('primary_caregiver', 'observer', 'doctor', 'family');

create table if not exists public.partner_links (
  id uuid primary key default uuid_generate_v4(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  partner_user_id uuid not null references public.profiles(id) on delete cascade,
  role partner_role not null default 'observer',
  -- scope JSON: { canRead: ['mood_log','medication_log'], canWrite: ['note'], canReceiveAlerts: true }
  scope jsonb not null default '{"canRead":[],"canWrite":[],"canReceiveAlerts":false}'::jsonb,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (asset_id, partner_user_id)
);

create index if not exists partner_links_partner_idx on public.partner_links(partner_user_id);

-- ─────────────────────────────────────────────────────────
-- 6. Media Artifacts (R2 storage 메타)
-- ─────────────────────────────────────────────────────────
create table if not exists public.media_artifacts (
  id uuid primary key default uuid_generate_v4(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  memory_id uuid references public.chapter_memories(id) on delete set null,
  r2_key text not null,                  -- Cloudflare R2 object key
  mime text not null,
  size_bytes bigint,
  ocr_text text,                          -- 사진/PDF OCR 결과
  exif jsonb,
  created_at timestamptz not null default now()
);

create index if not exists media_asset_idx on public.media_artifacts(asset_id);

-- ─────────────────────────────────────────────────────────
-- 7. AI Call Logs (감사 + quota + 개선 데이터)
-- ─────────────────────────────────────────────────────────
create table if not exists public.ai_call_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete set null,
  intent text not null,                   -- 'formation.summarize' | 'trigger.analyze' | ...
  model text not null,                    -- 'claude-opus-4-7' 등
  prompt_tokens int,
  completion_tokens int,
  cache_hit boolean not null default false,
  redacted_input jsonb,                   -- PII 마스킹 후
  output_summary text,
  latency_ms int,
  status text not null default 'success', -- success | rate_limited | upstream_error
  created_at timestamptz not null default now()
);

create index if not exists ai_logs_user_time_idx on public.ai_call_logs(user_id, created_at desc);

-- 사용자별 월간 quota 카운터 (materialized view 대신 단순 컬럼)
alter table public.profiles
  add column if not exists ai_calls_this_month int not null default 0,
  add column if not exists ai_quota_reset_at timestamptz not null default date_trunc('month', now()) + interval '1 month';

-- ─────────────────────────────────────────────────────────
-- 8. Vertical Waitlist (ADR-0004 — 비활성 카테고리 신호 수집)
-- ─────────────────────────────────────────────────────────
create table if not exists public.vertical_waitlist (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  vertical asset_type not null,
  email text,                              -- 비로그인 신청 가능
  intent_note text,                        -- "어머니 항암 도와드리고 싶어요" 등
  created_at timestamptz not null default now()
);

create index if not exists waitlist_vertical_idx on public.vertical_waitlist(vertical);

-- ─────────────────────────────────────────────────────────
-- 9. Chapter Archive (ADR-0003 — 영구 보존 snapshot)
-- ─────────────────────────────────────────────────────────
create table if not exists public.chapter_archives (
  id uuid primary key default uuid_generate_v4(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  archived_at timestamptz not null default now(),
  -- snapshot: { asset, memories: [...], events: [...], media: [...] } 전체 freeze
  snapshot jsonb not null,
  byte_size int
);

create index if not exists archives_owner_idx on public.chapter_archives(owner_user_id, archived_at desc);

-- ─────────────────────────────────────────────────────────
-- 10. Updated-at trigger (profiles)
-- ─────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────
-- 11. New auth.users → public.profiles 자동 생성
-- ─────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', null))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
