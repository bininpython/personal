begin;

alter table public.trainers
    add column if not exists professional_name text,
    add column if not exists cref text,
    add column if not exists gym_name text,
    add column if not exists city text,
    add column if not exists state text,
    add column if not exists phone text,
    add column if not exists specialties text[] default '{}';

create unique index if not exists trainers_auth_user_id_key
    on public.trainers (auth_user_id);

alter table public.students
    add column if not exists nickname text,
    add column if not exists birth_date date,
    add column if not exists gender text default 'other',
    add column if not exists restrictions text,
    add column if not exists injuries text,
    add column if not exists medical_notes text,
    add column if not exists available_days text[] default '{}',
    add column if not exists start_date date;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'students_auth_user_id_fkey'
          and conrelid = 'public.students'::regclass
    ) then
        alter table public.students
            add constraint students_auth_user_id_fkey
            foreign key (id) references auth.users(id) on delete cascade
            not valid;
    end if;
end
$$;

alter table public.students
    validate constraint students_auth_user_id_fkey;

alter table public.trainers enable row level security;
alter table public.students enable row level security;

drop policy if exists "Trainers can read their own profile" on public.trainers;
create policy "Trainers can read their own profile"
on public.trainers for select
to authenticated
using (auth_user_id = (select auth.uid()));

drop policy if exists "Trainers can manage their own students" on public.students;
create policy "Trainers can manage their own students"
on public.students for all
to authenticated
using (
    trainer_id = (
        select id
        from public.trainers
        where auth_user_id = (select auth.uid())
    )
)
with check (
    trainer_id = (
        select id
        from public.trainers
        where auth_user_id = (select auth.uid())
    )
);

drop policy if exists "Students can read their own profile" on public.students;
create policy "Students can read their own profile"
on public.students for select
to authenticated
using (id = (select auth.uid()));

commit;
