-- ==========================================
-- FitControl Pro - Supabase SQL Schema
-- ==========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Tabelas Principais

-- Trainers (Personal Trainers)
create table public.trainers (
    id uuid default uuid_generate_v4() primary key,
    auth_user_id uuid references auth.users(id) on delete cascade,
    name text not null,
    code text unique not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Students (Alunos)
create table public.students (
    id uuid default uuid_generate_v4() primary key,
    trainer_id uuid references public.trainers(id) on delete cascade not null,
    name text not null,
    access_code text unique not null,
    mock_email text unique not null, -- Usado para gerenciar Auth sem o aluno precisar digitar e-mail
    status text default 'active' check (status in ('active', 'inactive')),
    goal text,
    level text,
    weight numeric,
    height numeric,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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

-- 2. Row Level Security (RLS)
-- Garante que um personal só veja seus próprios alunos, e um aluno só veja a si mesmo.

alter table public.trainers enable row level security;
alter table public.students enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.exercises enable row level security;
alter table public.physical_assessments enable row level security;

-- Trainers Policy
create policy "Trainers can read their own profile"
on public.trainers for select
to authenticated
using (auth.uid() = auth_user_id);

-- Students Policy
create policy "Trainers can manage their own students"
on public.students for all
to authenticated
using (trainer_id = (select id from public.trainers where auth_user_id = auth.uid()));

create policy "Students can read their own profile"
on public.students for select
to authenticated
-- We assume the student logs in via auth.users and we have a map.
-- Since students have mock emails in auth.users, we can match via email.
using (mock_email = (select email from auth.users where id = auth.uid()));

-- O RLS completo pode ser expandido conforme necessidade. Para facilitar o desenvolvimento inicial, 
-- podemos criar políticas mais brandas para authenticated users.
