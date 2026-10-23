create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_profiles
    where id = (select auth.uid()) and role = 'ADMIN'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table public.coding_problems (
  id uuid primary key default gen_random_uuid(),
  title text not null unique check (char_length(title) between 1 and 160),
  description text not null check (char_length(description) between 1 and 12000),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  topics text[] not null default '{}',
  company_tags text[] not null default '{}',
  starter_code jsonb not null default '{}'::jsonb,
  hints text[] not null default '{}',
  solution text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index coding_problems_status_difficulty_idx on public.coding_problems(status, difficulty);
create index coding_problems_topics_idx on public.coding_problems using gin(topics);

create table public.coding_test_cases (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.coding_problems(id) on delete cascade,
  input text not null,
  expected_output text not null,
  is_hidden boolean not null default true,
  created_at timestamptz not null default now()
);
create index coding_test_cases_problem_idx on public.coding_test_cases(problem_id);

create table public.coding_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.coding_problems(id) on delete cascade,
  language text not null check (char_length(language) between 1 and 30),
  source_code text not null check (char_length(source_code) <= 100000),
  status text not null default 'queued' check (status in ('queued', 'running', 'passed', 'failed', 'error')),
  created_at timestamptz not null default now()
);
create index coding_submissions_user_created_idx on public.coding_submissions(user_id, created_at desc);
create index coding_submissions_problem_idx on public.coding_submissions(problem_id);

create table public.submission_case_results (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.coding_submissions(id) on delete cascade,
  case_id uuid references public.coding_test_cases(id) on delete set null,
  passed boolean not null,
  runtime_ms integer check (runtime_ms >= 0),
  memory_kb integer check (memory_kb >= 0),
  output text,
  error text,
  created_at timestamptz not null default now()
);
create index submission_case_results_submission_idx on public.submission_case_results(submission_id);

create table public.hr_questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null check (char_length(prompt) between 1 and 4000),
  category text not null check (char_length(category) between 1 and 80),
  guidance text not null default '',
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hr_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid references public.hr_questions(id) on delete set null,
  question text not null,
  situation text not null default '',
  task text not null default '',
  action text not null default '',
  result text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index hr_answers_user_updated_idx on public.hr_answers(user_id, updated_at desc);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  template text not null default 'ats-clean',
  theme jsonb not null default '{}'::jsonb,
  section_order text[] not null default '{contact,summary,experience,education,skills,projects,certifications,achievements,custom}',
  content jsonb not null default '{}'::jsonb,
  version_label text not null default 'Primary',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index resumes_user_updated_idx on public.resumes(user_id, updated_at desc);

create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  interview_type text not null check (interview_type in ('technical', 'behavioral', 'system-design', 'mixed')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index interview_sessions_user_started_idx on public.interview_sessions(user_id, started_at desc);

create table public.interview_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  role text not null check (role in ('interviewer', 'candidate')),
  content text not null check (char_length(content) <= 20000),
  created_at timestamptz not null default now()
);
create index interview_messages_session_idx on public.interview_messages(session_id, created_at);

create table public.interview_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.interview_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  scores jsonb not null,
  summary text not null,
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  action_plan jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index interview_reports_user_created_idx on public.interview_reports(user_id, created_at desc);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon text not null default 'award',
  created_at timestamptz not null default now()
);

create table public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);
create index user_badges_user_idx on public.user_badges(user_id);

create table public.review_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid references public.questions(id) on delete cascade,
  ease real not null default 2.5 check (ease between 1.3 and 3.0),
  interval_days integer not null default 0 check (interval_days >= 0),
  repetitions integer not null default 0 check (repetitions >= 0),
  due_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);
create index review_cards_due_idx on public.review_cards(user_id, due_at);

create table public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_date date not null unique,
  title text not null,
  description text not null,
  question_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index study_plans_user_dates_idx on public.study_plans(user_id, starts_on);

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  status text not null default 'saved' check (status in ('saved', 'applied', 'assessment', 'interview', 'offer', 'closed')),
  notes text not null default '',
  deadline date,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index job_applications_user_status_idx on public.job_applications(user_id, status, position);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  activity_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_log_user_created_idx on public.activity_log(user_id, created_at desc);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_actor_created_idx on public.audit_log(actor_id, created_at desc);

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  provider text not null,
  model text not null,
  prompt_tokens integer not null default 0 check (prompt_tokens >= 0),
  completion_tokens integer not null default 0 check (completion_tokens >= 0),
  created_at timestamptz not null default now()
);
create index ai_usage_user_created_idx on public.ai_usage(user_id, created_at desc);

alter table public.coding_problems enable row level security;
alter table public.coding_test_cases enable row level security;
alter table public.hr_questions enable row level security;
alter table public.hr_answers enable row level security;
alter table public.coding_submissions enable row level security;
alter table public.submission_case_results enable row level security;
alter table public.resumes enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.interview_messages enable row level security;
alter table public.interview_reports enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.review_cards enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.study_plans enable row level security;
alter table public.job_applications enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_log enable row level security;
alter table public.audit_log enable row level security;
alter table public.ai_usage enable row level security;

create policy "Published coding problems are readable" on public.coding_problems for select to authenticated using (status = 'published' or public.is_admin());
create policy "Admins manage coding problems" on public.coding_problems for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Only admins manage coding test cases" on public.coding_test_cases for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Published HR questions are readable" on public.hr_questions for select to authenticated using (status = 'published' or public.is_admin());
create policy "Admins manage HR questions" on public.hr_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Published challenge data is readable" on public.daily_challenges for select to authenticated using (true);
create policy "Users read badges" on public.badges for select to authenticated using (true);
create policy "Users read own badges" on public.user_badges for select to authenticated using ((select auth.uid()) = user_id);

create policy "Own coding submissions" on public.coding_submissions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own submission results" on public.submission_case_results for select to authenticated using (exists (select 1 from public.coding_submissions s where s.id = submission_id and s.user_id = (select auth.uid())));
create policy "Own HR answers" on public.hr_answers for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own resumes" on public.resumes for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own interview sessions" on public.interview_sessions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own interview messages" on public.interview_messages for all to authenticated using (exists (select 1 from public.interview_sessions s where s.id = session_id and s.user_id = (select auth.uid()))) with check (exists (select 1 from public.interview_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
create policy "Own interview reports" on public.interview_reports for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own review cards" on public.review_cards for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own study plans" on public.study_plans for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own applications" on public.job_applications for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own notifications" on public.notifications for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own activity" on public.activity_log for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own AI usage" on public.ai_usage for select to authenticated using ((select auth.uid()) = user_id);
create policy "Admins read audit log" on public.audit_log for select to authenticated using (public.is_admin());

insert into storage.buckets (id, name, public) values
  ('resume-exports', 'resume-exports', false),
  ('avatars', 'avatars', false)
on conflict (id) do nothing;

create policy "Users access own resume exports" on storage.objects for all to authenticated using (bucket_id = 'resume-exports' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'resume-exports' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users access own avatar" on storage.objects for all to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
