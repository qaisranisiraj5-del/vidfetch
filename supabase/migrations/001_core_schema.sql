-- ============================================================================
-- 001_core_schema.sql — core tables, roles, and Row Level Security
-- ============================================================================
-- Run with: supabase db push   (or paste into the Supabase SQL editor)
--
-- Security model:
--  * The service-role key bypasses RLS and is used server-side ONLY after
--    requireAdmin() verifies the caller's role.
--  * Regular users act through the anon key + RLS: they can only touch
--    their own rows, and can NEVER promote themselves to admin.
-- ============================================================================

-- Profiles: one row per auth user. Role is admin-controlled only.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Download jobs: only url_hash is stored, never the raw submitted URL.
create table if not exists public.download_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  platform text not null,
  url_hash text not null,
  status text not null check (status in ('pending', 'success', 'failed')),
  quality text,
  format text,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists download_jobs_created_at_idx on public.download_jobs (created_at desc);
create index if not exists download_jobs_platform_idx on public.download_jobs (platform);

-- Activity log: admin-visible audit trail.
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);

-- App settings: non-secret site configuration (secrets stay in env vars).
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Integration status: public-safe configured/healthy flags (no secrets).
create table if not exists public.integration_status (
  platform text primary key,
  configured boolean not null default false,
  healthy boolean not null default false,
  message text,
  last_checked_at timestamptz
);

-- ----------------------------------------------------------------------------
-- Helper: server-side admin check. SECURITY DEFINER so it can read profiles
-- regardless of the caller's RLS context; it only inspects the JWT subject.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = (auth.jwt() ->> 'sub')::uuid
      and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.download_jobs enable row level security;
alter table public.activity_log enable row level security;
alter table public.app_settings enable row level security;
alter table public.integration_status enable row level security;

-- profiles ---------------------------------------------------------------
-- Users can read their own profile; admins can read all.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- Users may insert ONLY their own row and ONLY with role = 'user'.
-- This makes public self-promotion to admin impossible.
drop policy if exists "profiles_insert_self_user_only" on public.profiles;
create policy "profiles_insert_self_user_only"
  on public.profiles for insert
  with check (auth.uid() = id and role = 'user');

-- Users may update their own non-role fields; role can never be changed
-- through this policy (admins use the service role, which bypasses RLS).
drop policy if exists "profiles_update_own_no_role_change" on public.profiles;
create policy "profiles_update_own_no_role_change"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = 'user');

-- Admins manage profiles via service role (bypasses RLS); no delete policy
-- for regular users.

-- download_jobs ----------------------------------------------------------
-- Users read only their own jobs; admins read all.
drop policy if exists "download_jobs_select_own_or_admin" on public.download_jobs;
create policy "download_jobs_select_own_or_admin"
  on public.download_jobs for select
  using (user_id = auth.uid() or public.is_admin());

-- Anyone (incl. anonymous visitors) may log a job row, but only with
-- user_id NULL or their own id — never someone else's.
drop policy if exists "download_jobs_insert_safe" on public.download_jobs;
create policy "download_jobs_insert_safe"
  on public.download_jobs for insert
  with check (user_id is null or user_id = auth.uid());

-- activity_log -----------------------------------------------------------
-- Admins only (regular users get zero rows).
drop policy if exists "activity_log_select_admin" on public.activity_log;
create policy "activity_log_select_admin"
  on public.activity_log for select
  using (public.is_admin());

-- app_settings -----------------------------------------------------------
-- Public read (values are non-secret by design); admin-only write.
drop policy if exists "app_settings_select_all" on public.app_settings;
create policy "app_settings_select_all"
  on public.app_settings for select
  using (true);

drop policy if exists "app_settings_write_admin" on public.app_settings;
create policy "app_settings_write_admin"
  on public.app_settings for insert
  with check (public.is_admin());

drop policy if exists "app_settings_update_admin" on public.app_settings;
create policy "app_settings_update_admin"
  on public.app_settings for update
  using (public.is_admin())
  with check (public.is_admin());

-- integration_status -----------------------------------------------------
-- Public read (configured/healthy/message contain no secrets); admin-only write.
drop policy if exists "integration_status_select_all" on public.integration_status;
create policy "integration_status_select_all"
  on public.integration_status for select
  using (true);

drop policy if exists "integration_status_write_admin" on public.integration_status;
create policy "integration_status_write_admin"
  on public.integration_status for insert
  with check (public.is_admin());

drop policy if exists "integration_status_update_admin" on public.integration_status;
create policy "integration_status_update_admin"
  on public.integration_status for update
  using (public.is_admin())
  with check (public.is_admin());
