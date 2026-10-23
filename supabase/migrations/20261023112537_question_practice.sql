alter table public.user_profiles
  add column text_size text not null default 'LARGE'
    check (text_size in ('LARGE', 'EXTRA_LARGE', 'HUGE'));

grant update (text_size) on table public.user_profiles to authenticated;

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  category text not null check (category in ('aptitude', 'technical', 'hr')),
  description text not null default '',
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  question_type text not null check (question_type in ('aptitude', 'technical', 'hr')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  prompt text not null check (char_length(prompt) between 1 and 4000),
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  correct_answer text not null,
  explanation text not null default '',
  company_tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index questions_topic_active_idx on public.questions (topic_id, active, difficulty);
create index questions_company_tags_idx on public.questions using gin (company_tags);
create unique index questions_topic_prompt_unique on public.questions (topic_id, prompt);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('practice', 'timed')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  topic_ids uuid[] not null default '{}',
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  company text,
  question_ids uuid[] not null default '{}',
  duration_seconds integer check (duration_seconds between 60 and 14400),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score integer not null default 0 check (score >= 0),
  total_questions integer not null default 0 check (total_questions >= 0),
  created_at timestamptz not null default now()
);

create index attempts_user_active_idx on public.attempts (user_id, status, created_at desc);

create table public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  selected_answer text,
  is_correct boolean,
  flagged boolean not null default false,
  elapsed_seconds integer not null default 0 check (elapsed_seconds >= 0),
  answered_at timestamptz,
  unique (attempt_id, question_id)
);

create table public.bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.bookmarks enable row level security;

revoke all on public.topics, public.questions, public.attempts,
  public.attempt_answers, public.bookmarks from public, anon, authenticated;
grant all on public.topics, public.questions, public.attempts,
  public.attempt_answers, public.bookmarks to service_role;

create policy "Users can read their own attempts"
  on public.attempts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their own attempts"
  on public.attempts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own attempts"
  on public.attempts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can read answers for their own attempts"
  on public.attempt_answers for select to authenticated
  using (exists (
    select 1 from public.attempts a
    where a.id = attempt_id and a.user_id = (select auth.uid())
  ));
create policy "Users can manage answers for their own attempts"
  on public.attempt_answers for all to authenticated
  using (exists (
    select 1 from public.attempts a
    where a.id = attempt_id and a.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.attempts a
    where a.id = attempt_id and a.user_id = (select auth.uid())
  ));

create policy "Users can read their own bookmarks"
  on public.bookmarks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can manage their own bookmarks"
  on public.bookmarks for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);