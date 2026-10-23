create table public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) between 0 and 80),
  role text not null default 'USER' check (role in ('USER', 'ADMIN')),
  target_role text not null default '' check (char_length(target_role) <= 100),
  experience_level text not null default '' check (
    experience_level in ('', 'STUDENT', 'ENTRY', 'MID', 'SENIOR')
  ),
  target_companies text[] not null default '{}'
    check (cardinality(target_companies) <= 10),
  daily_goal_minutes integer not null default 30
    check (daily_goal_minutes between 10 and 240),
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_profiles_role_idx on public.user_profiles (role);

alter table public.user_profiles enable row level security;

revoke all on table public.user_profiles from public;
revoke all on table public.user_profiles from anon;
revoke all on table public.user_profiles from authenticated;
grant select on table public.user_profiles to authenticated;
grant insert (
  id,
  full_name,
  target_role,
  experience_level,
  target_companies,
  daily_goal_minutes,
  onboarding_complete
) on public.user_profiles to authenticated;
grant update (
  full_name,
  target_role,
  experience_level,
  target_companies,
  daily_goal_minutes,
  onboarding_complete,
  updated_at
) on public.user_profiles to authenticated;

create policy "Users can read their own profile"
  on public.user_profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can create their own non-admin profile"
  on public.user_profiles
  for insert
  to authenticated
  with check (
    (select auth.uid()) = id
    and role = 'USER'
  );

create policy "Users can update their own profile"
  on public.user_profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);