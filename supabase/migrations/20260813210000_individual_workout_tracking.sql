begin;

create table if not exists public.individual_workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.individual_users(id) on delete cascade,
  workout_day_id uuid not null references public.individual_workout_days(id) on delete cascade,
  workout_plan_id uuid not null references public.individual_workout_plans(id) on delete cascade,
  client_session_id uuid not null,
  workout_date date not null,
  started_at timestamp with time zone not null,
  completed_at timestamp with time zone not null,
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 21600),
  completion_percentage numeric not null default 0 check (completion_percentage between 0 and 100),
  total_volume numeric not null default 0 check (total_volume >= 0),
  status text not null default 'completed' check (status in ('completed', 'incomplete', 'cancelled')),
  rating integer check (rating is null or rating between 1 and 5),
  feedback text check (feedback is null or char_length(feedback) <= 1000),
  created_at timestamp with time zone not null default timezone('utc', now()),
  constraint individual_workout_sessions_client_key unique (user_id, client_session_id),
  constraint individual_workout_sessions_daily_key unique (user_id, workout_plan_id, workout_date)
);

create index if not exists individual_workout_sessions_user_started_idx
  on public.individual_workout_sessions (user_id, started_at desc);

create index if not exists individual_workout_sessions_plan_completed_idx
  on public.individual_workout_sessions (workout_plan_id, completed_at desc)
  where status = 'completed';

create table if not exists public.individual_exercise_sessions (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.individual_workout_sessions(id) on delete cascade,
  workout_exercise_id uuid not null references public.individual_workout_exercises(id) on delete cascade,
  exercise_key text not null,
  completed boolean not null default false,
  skipped boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc', now()),
  constraint individual_exercise_sessions_workout_exercise_key unique (workout_session_id, workout_exercise_id)
);

create index if not exists individual_exercise_sessions_workout_idx
  on public.individual_exercise_sessions (workout_session_id);

create index if not exists individual_exercise_sessions_exercise_key_idx
  on public.individual_exercise_sessions (exercise_key, created_at desc);

create table if not exists public.individual_set_records (
  id uuid primary key default gen_random_uuid(),
  exercise_session_id uuid not null references public.individual_exercise_sessions(id) on delete cascade,
  set_number integer not null check (set_number between 1 and 100),
  completed boolean not null default false,
  planned_repetitions integer check (planned_repetitions is null or planned_repetitions >= 0),
  performed_repetitions integer check (performed_repetitions is null or performed_repetitions >= 0),
  performed_load numeric check (performed_load is null or performed_load >= 0),
  rpe integer check (rpe is null or rpe between 1 and 10),
  completed_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc', now()),
  constraint individual_set_records_session_set_key unique (exercise_session_id, set_number)
);

create index if not exists individual_set_records_exercise_session_idx
  on public.individual_set_records (exercise_session_id, set_number);

alter table public.individual_workout_sessions enable row level security;
alter table public.individual_exercise_sessions enable row level security;
alter table public.individual_set_records enable row level security;

revoke all privileges on table public.individual_workout_sessions from anon, authenticated;
revoke all privileges on table public.individual_exercise_sessions from anon, authenticated;
revoke all privileges on table public.individual_set_records from anon, authenticated;

grant select, insert, update, delete on table public.individual_workout_sessions to service_role;
grant select, insert, update, delete on table public.individual_exercise_sessions to service_role;
grant select, insert, update, delete on table public.individual_set_records to service_role;

commit;
