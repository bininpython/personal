begin;

create unique index if not exists students_access_code_unique_idx
    on public.students (access_code);

create table if not exists public.student_access_codes (
    code text primary key check (code ~ '^[0-9]{4}$'),
    trainer_id uuid not null,
    student_id uuid unique,
    allocated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.student_access_codes (code, trainer_id, student_id, allocated_at)
select access_code, trainer_id, id, created_at
from public.students
where access_code ~ '^[0-9]{4}$'
on conflict (code) do nothing;

alter table public.student_access_codes enable row level security;
revoke all on table public.student_access_codes from anon, authenticated;
grant all on table public.student_access_codes to service_role;

create or replace function public.enforce_student_access_code_format()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if (
        tg_op = 'INSERT'
        or new.access_code is distinct from old.access_code
    ) and new.access_code !~ '^[0-9]{4}$' then
        raise exception using
            errcode = '23514',
            message = 'student_access_code_must_have_four_digits';
    end if;

    return new;
end;
$$;

drop trigger if exists enforce_student_access_code_format_trigger on public.students;
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
        select count(*)
        into student_total
        from public.students
        where trainer_id = new.trainer_id
          and id <> old.id;
    else
        select count(*)
        into student_total
        from public.students
        where trainer_id = new.trainer_id;
    end if;

    if student_total >= 10 then
        raise exception using
            errcode = 'P0001',
            message = 'student_limit_reached';
    end if;

    return new;
end;
$$;

drop trigger if exists enforce_trainer_student_limit_trigger on public.students;
create trigger enforce_trainer_student_limit_trigger
before insert or update of trainer_id on public.students
for each row execute function public.enforce_trainer_student_limit();

revoke all on function public.enforce_student_access_code_format() from public;
revoke all on function public.enforce_trainer_student_limit() from public;

drop policy if exists "Trainers can manage their own students" on public.students;
drop policy if exists "Trainers can read their own students" on public.students;
create policy "Trainers can read their own students"
on public.students for select
to authenticated
using (
    trainer_id = (
        select id
        from public.trainers
        where auth_user_id = (select auth.uid())
    )
);

drop policy if exists "Trainers can update their own students" on public.students;

commit;
