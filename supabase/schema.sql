-- Secure Authentication Framework for Operating Systems
-- Execute this SQL in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  mfa_enabled boolean not null default false,
  mfa_secret text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.auth_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  status text not null,
  ip_address inet,
  details jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now()
);

create table if not exists public.attack_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null,
  description text not null,
  severity text not null,
  blocked boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  jwt_id text not null unique,
  active boolean not null default true,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

create table if not exists public.local_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null unique,
  name text,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_logs_user_action on public.auth_logs(user_id, action);
create index if not exists idx_auth_logs_timestamp on public.auth_logs(timestamp desc);
create index if not exists idx_attack_logs_type_timestamp on public.attack_logs(type, timestamp desc);
create index if not exists idx_sessions_active on public.sessions(active, created_at desc);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

alter table public.profiles enable row level security;
alter table public.auth_logs enable row level security;
alter table public.attack_logs enable row level security;
alter table public.sessions enable row level security;
alter table public.local_credentials enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'admin'
  )
);

drop policy if exists "Users can read own auth logs" on public.auth_logs;
create policy "Users can read own auth logs"
on public.auth_logs
for select
using (auth.uid() = user_id);

drop policy if exists "Admins can read auth logs" on public.auth_logs;
create policy "Admins can read auth logs"
on public.auth_logs
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'admin'
  )
);

drop policy if exists "Users can read own attack logs" on public.attack_logs;
create policy "Users can read own attack logs"
on public.attack_logs
for select
using (auth.uid() = user_id);

drop policy if exists "Admins can read attack logs" on public.attack_logs;
create policy "Admins can read attack logs"
on public.attack_logs
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'admin'
  )
);

drop policy if exists "Users can read own sessions" on public.sessions;
create policy "Users can read own sessions"
on public.sessions
for select
using (auth.uid() = user_id);

drop policy if exists "Admins can read all sessions" on public.sessions;
create policy "Admins can read all sessions"
on public.sessions
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'admin'
  )
);

drop policy if exists "Users can read own fallback credential metadata" on public.local_credentials;
create policy "Users can read own fallback credential metadata"
on public.local_credentials
for select
using (auth.uid() = user_id);

drop policy if exists "Admins can read local credentials metadata" on public.local_credentials;
create policy "Admins can read local credentials metadata"
on public.local_credentials
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'admin'
  )
);

alter table public.auth_logs replica identity full;
alter table public.attack_logs replica identity full;
alter table public.sessions replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.auth_logs;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.attack_logs;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.sessions;
  exception when duplicate_object then
    null;
  end;
end;
$$;
