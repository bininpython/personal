-- ==========================================
-- FitControl Pro - Supabase SQL Schema
-- ==========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Tabelas Principais

-- Trainers (Personal Trainers)
create table public.trainers (
    id uuid default uuid_generate_v4() primary key,
    auth_user_id uuid unique not null references auth.users(id) on delete cascade,
    name text not null,
    code text unique not null,
    professional_name text,
    cref text,
    gym_name text,
    city text,
    state text,
    phone text,
    specialties text[] default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Students (Alunos)
create table public.students (
    id uuid primary key references auth.users(id) on delete cascade,
    trainer_id uuid references public.trainers(id) on delete cascade not null,
    name text not null,
    nickname text,
    birth_date date,
    access_code text unique not null check (access_code ~ '^[0-9]{4}$'),
    mock_email text unique not null, -- Usado para gerenciar Auth sem o aluno precisar digitar e-mail
    status text default 'active' check (status in ('active', 'inactive')),
    goal text,
    level text,
    weight numeric,
    height numeric,
    gender text default 'other' check (gender in ('male', 'female', 'other')),
    restrictions text,
    injuries text,
    medical_notes text,
    available_days text[] default '{}',
    start_date date,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reserva permanente dos códigos. Mesmo que um aluno seja removido,
-- seu código nunca volta a ficar disponível.
create table public.student_access_codes (
    code text primary key check (code ~ '^[0-9]{4}$'),
    trainer_id uuid not null,
    student_id uuid unique,
    allocated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function public.enforce_student_access_code_format()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if new.access_code !~ '^[0-9]{4}$' then
        raise exception using
            errcode = '23514',
            message = 'student_access_code_must_have_four_digits';
    end if;

    return new;
end;
$$;

create trigger enforce_student_access_code_format_trigger
before insert or update of access_code on public.students
for each row execute function public.enforce_student_access_code_format();

create or replace function public.enforce_trainer_student_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    student_total integer;
begin
    perform pg_advisory_xact_lock(hashtext(new.trainer_id::text));

    if tg_op = 'UPDATE' then
        select count(*) into student_total
        from public.students
        where trainer_id = new.trainer_id and id <> old.id;
    else
        select count(*) into student_total
        from public.students
        where trainer_id = new.trainer_id;
    end if;

    if student_total >= 10 then
        raise exception using errcode = 'P0001', message = 'student_limit_reached';
    end if;

    return new;
end;
$$;

create trigger enforce_trainer_student_limit_trigger
before insert or update of trainer_id on public.students
for each row execute function public.enforce_trainer_student_limit();

revoke all on function public.enforce_student_access_code_format() from public;
revoke all on function public.enforce_trainer_student_limit() from public;

-- Workout Plans (Fichas de Treino)
create table public.workout_plans (
    id uuid default uuid_generate_v4() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    trainer_id uuid references public.trainers(id) on delete cascade not null,
    name text not null,
    goal text,
    days_per_week integer,
    status text default 'draft' check (status in ('active', 'draft', 'archived')),
    start_date date,
    end_date date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workout Days (Dias de Treino - Ex: Treino A, Treino B)
create table public.workout_days (
    id uuid default uuid_generate_v4() primary key,
    plan_id uuid references public.workout_plans(id) on delete cascade not null,
    name text not null, -- Ex: "Treino A - Peito"
    day_label text, -- Ex: "A"
    order_index integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Exercises Library (Biblioteca de Exercícios)
create table public.exercises (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    target_muscle text,
    video_url text,
    instructions text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workout Exercises (Relação de Exercício e Dia de Treino com as métricas prescritas)
create table public.workout_exercises (
    id uuid default uuid_generate_v4() primary key,
    workout_day_id uuid references public.workout_days(id) on delete cascade not null,
    exercise_id uuid references public.exercises(id) on delete restrict not null,
    sets integer not null default 3,
    reps text not null default '10',
    rest_time integer not null default 60, -- Segundos
    method text,
    order_index integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Physical Assessments (Avaliações Físicas)
create table public.physical_assessments (
    id uuid default uuid_generate_v4() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    assessment_date date not null default CURRENT_DATE,
    weight numeric,
    height numeric,
    body_fat_percentage numeric,
    muscle_mass numeric,
    -- Vitais
    blood_pressure_systolic integer,
    blood_pressure_diastolic integer,
    resting_heart_rate integer,
    -- Perimetria
    chest numeric,
    waist numeric,
    abdomen numeric,
    hips numeric,
    right_arm numeric,
    left_arm numeric,
    right_thigh numeric,
    left_thigh numeric,
    right_calf numeric,
    left_calf numeric,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workout Sessions (Treinos Executados)
create table public.workout_sessions (
    id uuid default uuid_generate_v4() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    workout_day_id uuid references public.workout_days(id) on delete restrict not null,
    workout_plan_id uuid references public.workout_plans(id) on delete restrict not null,
    started_at timestamp with time zone not null,
    completed_at timestamp with time zone,
    duration_seconds integer,
    completion_percentage numeric,
    total_volume numeric,
    status text default 'in_progress' check (status in ('in_progress', 'completed', 'incomplete', 'cancelled')),
    feedback text,
    rating integer,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Exercise Sessions (Exercícios do Treino Executado)
create table public.exercise_sessions (
    id uuid default uuid_generate_v4() primary key,
    workout_session_id uuid references public.workout_sessions(id) on delete cascade not null,
    workout_exercise_id uuid references public.workout_exercises(id) on delete restrict not null,
    exercise_id uuid references public.exercises(id) on delete restrict not null,
    completed boolean default false,
    skipped boolean default false,
    skip_reason text,
    pain_reported boolean default false,
    pain_notes text,
    perceived_difficulty text,
    rpe integer,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set Records (Séries do Exercício Executado)
create table public.set_records (
    id uuid default uuid_generate_v4() primary key,
    exercise_session_id uuid references public.exercise_sessions(id) on delete cascade not null,
    set_number integer not null,
    completed boolean default false,
    planned_repetitions integer,
    performed_repetitions integer,
    planned_load numeric,
    performed_load numeric,
    perceived_difficulty text,
    rpe integer,
    completed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages (Mensagens)
create table public.messages (
    id uuid default uuid_generate_v4() primary key,
    sender_id text not null,
    sender_type text not null,
    recipient_id text not null,
    recipient_type text not null,
    content text not null,
    attachment_url text,
    attachment_type text,
    is_automated boolean default false,
    read_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notifications (Notificações)
create table public.notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id text not null,
    user_type text not null,
    type text not null,
    title text not null,
    message text not null,
    read boolean default false,
    action_url text,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Achievements (Conquistas)
create table public.achievements (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text not null,
    icon text not null,
    criteria_type text not null,
    criteria_value numeric,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Student Achievements
create table public.student_achievements (
    id uuid default uuid_generate_v4() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    achievement_id uuid references public.achievements(id) on delete cascade not null,
    earned_at timestamp with time zone not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Appointments (Agendamentos)
create table public.appointments (
    id uuid default uuid_generate_v4() primary key,
    trainer_id uuid references public.trainers(id) on delete cascade not null,
    student_id uuid references public.students(id) on delete cascade not null,
    appointment_type text not null,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    status text not null,
    notes text,
    is_recurring boolean default false,
    recurrence_rule text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Row Level Security (RLS)
-- Garante que um personal só veja seus próprios alunos, e um aluno só veja a si mesmo.

alter table public.trainers enable row level security;
alter table public.students enable row level security;
alter table public.student_access_codes enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.exercises enable row level security;
alter table public.physical_assessments enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercise_sessions enable row level security;
alter table public.set_records enable row level security;

revoke all on table public.student_access_codes from anon, authenticated;
grant all on table public.student_access_codes to service_role;

-- Trainers Policy
create policy "Trainers can read their own profile"
on public.trainers for select
to authenticated
using (auth.uid() = auth_user_id);

-- Students Policies. Criação e alterações passam somente pela API segura do servidor.
create policy "Trainers can read their own students"
on public.students for select
to authenticated
using (trainer_id = (select id from public.trainers where auth_user_id = (select auth.uid())));

create policy "Students can read their own profile"
on public.students for select
to authenticated
using (id = (select auth.uid()));
