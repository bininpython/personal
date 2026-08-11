begin;

create extension if not exists pgcrypto;

-- Conta independente para quem monta e gerencia o próprio treino. Ela não é
-- um aluno de personal e, por isso, não participa de mensagens, avaliações,
-- agenda ou qualquer relação profissional/aluno.
create table if not exists public.individual_users (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    email_normalized text not null,
    password_hash text not null,
    avatar_url text,
    city text,
    birth_date date,
    gender text check (gender is null or gender in ('male', 'female', 'other')),
    height numeric check (height is null or (height > 0 and height <= 300)),
    weight numeric check (weight is null or (weight > 0 and weight <= 1000)),
    goal text,
    level text check (level is null or level in ('beginner', 'intermediate', 'advanced')),
    available_days text[] not null default '{}',
    restrictions text,
    biography text,
    status text not null default 'active' check (status in ('active', 'inactive')),
    failed_login_attempts integer not null default 0,
    locked_until timestamp with time zone,
    last_login_at timestamp with time zone,
    terms_accepted_at timestamp with time zone not null,
    terms_version text not null,
    privacy_policy_version text not null,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone not null default timezone('utc', now()),
    updated_at timestamp with time zone not null default timezone('utc', now())
);

create unique index if not exists individual_users_email_key
    on public.individual_users (email_normalized) where deleted_at is null;

create table if not exists public.individual_workout_plans (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.individual_users(id) on delete cascade,
    name text not null,
    goal text,
    days_per_week integer not null default 1 check (days_per_week between 1 and 30),
    status text not null default 'active' check (status in ('active', 'draft', 'archived')),
    start_date date not null default current_date,
    end_date date,
    created_at timestamp with time zone not null default timezone('utc', now()),
    updated_at timestamp with time zone not null default timezone('utc', now()),
    constraint individual_plan_date_order check (end_date is null or end_date >= start_date)
);

create index if not exists individual_workout_plans_user_idx
    on public.individual_workout_plans (user_id, created_at desc);
create unique index if not exists individual_workout_plans_one_active_idx
    on public.individual_workout_plans (user_id) where status = 'active';

create table if not exists public.individual_workout_days (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid not null references public.individual_workout_plans(id) on delete cascade,
    name text not null,
    day_label text not null,
    order_index integer not null default 0,
    created_at timestamp with time zone not null default timezone('utc', now())
);

create index if not exists individual_workout_days_plan_idx
    on public.individual_workout_days (plan_id, order_index);

create table if not exists public.individual_workout_exercises (
    id uuid primary key default gen_random_uuid(),
    workout_day_id uuid not null references public.individual_workout_days(id) on delete cascade,
    exercise_key text not null,
    name text not null,
    primary_muscle text not null,
    equipment text not null,
    instructions text not null,
    video_url text,
    sets integer not null default 3 check (sets between 1 and 20),
    reps text not null default '10',
    rest_time integer not null default 60 check (rest_time between 0 and 900),
    method text,
    order_index integer not null default 0,
    created_at timestamp with time zone not null default timezone('utc', now())
);

create index if not exists individual_workout_exercises_day_idx
    on public.individual_workout_exercises (workout_day_id, order_index);

-- A aplicação acessa estas tabelas exclusivamente pela chave de serviço. Não
-- existem políticas para clientes anônimos, então o RLS bloqueia acesso direto.
alter table public.individual_users enable row level security;
alter table public.individual_workout_plans enable row level security;
alter table public.individual_workout_days enable row level security;
alter table public.individual_workout_exercises enable row level security;

-- Amplia a sessão comercial já existente para o terceiro tipo de conta.
do $$
declare
    role_constraint text;
begin
    select conname into role_constraint
    from pg_constraint
    where conrelid = 'public.app_sessions'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
    limit 1;

    if role_constraint is not null then
        execute format('alter table public.app_sessions drop constraint %I', role_constraint);
    end if;
end
$$;

alter table public.app_sessions
    add constraint app_sessions_role_check
    check (role in ('trainer', 'student', 'individual'));

commit;
