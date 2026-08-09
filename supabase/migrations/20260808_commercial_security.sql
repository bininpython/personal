begin;

create extension if not exists pgcrypto;

-- A autenticação do aplicativo não depende mais de auth.users nem de e-mails
-- sintéticos. Os campos antigos permanecem temporariamente apenas para migração.
alter table public.trainers
    alter column auth_user_id drop not null,
    add column if not exists login_name_normalized text,
    add column if not exists public_code text,
    add column if not exists access_code_hash text,
    add column if not exists access_code_hint text,
    add column if not exists recovery_code_hash text,
    add column if not exists recovery_code_hint text,
    add column if not exists failed_login_attempts integer not null default 0,
    add column if not exists locked_until timestamp with time zone,
    add column if not exists last_login_at timestamp with time zone,
    add column if not exists credential_version integer not null default 2,
    add column if not exists avatar_url text,
    add column if not exists terms_accepted_at timestamp with time zone,
    add column if not exists terms_version text,
    add column if not exists privacy_policy_version text,
    add column if not exists deleted_at timestamp with time zone;

update public.trainers
set login_name_normalized = lower(trim(regexp_replace(translate(name,
    'ÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑáàãâäéèêëíìîïóòõôöúùûüçñ',
    'AAAAAEEEEIIIIOOOOOUUUUCNaaaaaeeeeiiiiooooouuuucn'), '\s+', ' ', 'g')))
where login_name_normalized is null;

update public.trainers
set public_code = upper(regexp_replace(code, '[^A-Za-z0-9]', '', 'g'))
where public_code is null;

create unique index if not exists trainers_public_code_key
    on public.trainers (public_code) where deleted_at is null;
create index if not exists trainers_login_name_idx
    on public.trainers (login_name_normalized) where deleted_at is null;

alter table public.students
    alter column access_code drop not null,
    alter column mock_email drop not null,
    add column if not exists login_name_normalized text,
    add column if not exists access_code_hash text,
    add column if not exists access_code_hint text,
    add column if not exists failed_login_attempts integer not null default 0,
    add column if not exists locked_until timestamp with time zone,
    add column if not exists last_login_at timestamp with time zone,
    add column if not exists credential_version integer not null default 2,
    add column if not exists avatar_url text,
    add column if not exists privacy_consent_at timestamp with time zone,
    add column if not exists privacy_policy_version text,
    add column if not exists terms_accepted_at timestamp with time zone,
    add column if not exists terms_version text,
    add column if not exists deleted_at timestamp with time zone;

update public.students
set login_name_normalized = lower(trim(regexp_replace(translate(name,
    'ÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑáàãâäéèêëíìîïóòõôöúùûüçñ',
    'AAAAAEEEEIIIIOOOOOUUUUCNaaaaaeeeeiiiiooooouuuucn'), '\s+', ' ', 'g')))
where login_name_normalized is null;

create index if not exists students_login_scope_idx
    on public.students (trainer_id, login_name_normalized)
    where deleted_at is null;

-- Preserva avatares embutidos e transforma referências de fotos antigas em
-- referências privadas. O bucket legado deixa de aceitar leitura pública.
update public.trainers trainer
set avatar_url = case
    when auth_user.raw_user_meta_data->>'avatar_url' like '/avatars/%'
        then auth_user.raw_user_meta_data->>'avatar_url'
    when auth_user.raw_user_meta_data->>'avatar_url' like '%/storage/v1/object/public/profile-images/%'
        then 'private-legacy:' || substring(auth_user.raw_user_meta_data->>'avatar_url' from '.*/profile-images/(.*)$')
    else trainer.avatar_url
end
from auth.users auth_user
where trainer.auth_user_id = auth_user.id
  and trainer.avatar_url is null
  and auth_user.raw_user_meta_data ? 'avatar_url';

update public.students student
set avatar_url = case
    when auth_user.raw_user_meta_data->>'avatar_url' like '/avatars/%'
        then auth_user.raw_user_meta_data->>'avatar_url'
    when auth_user.raw_user_meta_data->>'avatar_url' like '%/storage/v1/object/public/profile-images/%'
        then 'private-legacy:' || substring(auth_user.raw_user_meta_data->>'avatar_url' from '.*/profile-images/(.*)$')
    else student.avatar_url
end
from auth.users auth_user
where student.id = auth_user.id
  and student.avatar_url is null
  and auth_user.raw_user_meta_data ? 'avatar_url';

update storage.buckets set public = false where id = 'profile-images';

drop trigger if exists enforce_student_access_code_format_trigger on public.students;
drop index if exists public.students_access_code_unique_idx;

do $$
declare
    constraint_name text;
begin
    select conname into constraint_name
    from pg_constraint
    where conrelid = 'public.students'::regclass
      and contype = 'f'
      and confrelid = 'auth.users'::regclass
    limit 1;
    if constraint_name is not null then
        execute format('alter table public.students drop constraint %I', constraint_name);
    end if;
end
$$;

create table if not exists public.app_sessions (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid not null,
    role text not null check (role in ('trainer', 'student')),
    trainer_id uuid not null,
    expires_at timestamp with time zone not null,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone not null default timezone('utc', now()),
    last_seen_at timestamp with time zone not null default timezone('utc', now()),
    ip_hash text,
    user_agent text
);
create index if not exists app_sessions_actor_idx
    on public.app_sessions (actor_id, role, expires_at desc);
create index if not exists app_sessions_active_idx
    on public.app_sessions (id, expires_at) where revoked_at is null;

alter table public.app_sessions enable row level security;
revoke all on table public.app_sessions from anon, authenticated;
grant all on table public.app_sessions to service_role;

create table if not exists public.auth_rate_limits (
    key_hash text primary key,
    attempts integer not null default 0,
    window_started_at timestamp with time zone not null default timezone('utc', now()),
    blocked_until timestamp with time zone,
    updated_at timestamp with time zone not null default timezone('utc', now())
);

alter table public.auth_rate_limits enable row level security;
revoke all on table public.auth_rate_limits from anon, authenticated;
grant all on table public.auth_rate_limits to service_role;

create or replace function public.consume_auth_rate_limit(
    p_key_hash text,
    p_max_attempts integer,
    p_window_seconds integer,
    p_block_seconds integer
)
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    current_row public.auth_rate_limits%rowtype;
    v_now timestamp with time zone := now();
begin
    perform pg_advisory_xact_lock(hashtext(p_key_hash));
    select * into current_row from public.auth_rate_limits where key_hash = p_key_hash;

    if current_row.key_hash is null then
        insert into public.auth_rate_limits (key_hash, attempts, window_started_at, updated_at)
        values (p_key_hash, 1, v_now, v_now);
        return query select true, 0;
        return;
    end if;

    if current_row.blocked_until is not null and current_row.blocked_until > v_now then
        return query select false, greatest(1, ceil(extract(epoch from current_row.blocked_until - v_now))::integer);
        return;
    end if;

    if current_row.window_started_at + make_interval(secs => p_window_seconds) <= v_now then
        update public.auth_rate_limits
        set attempts = 1, window_started_at = v_now, blocked_until = null, updated_at = v_now
        where key_hash = p_key_hash;
        return query select true, 0;
        return;
    end if;

    if current_row.attempts + 1 > p_max_attempts then
        update public.auth_rate_limits
        set attempts = attempts + 1,
            blocked_until = v_now + make_interval(secs => p_block_seconds),
            updated_at = v_now
        where key_hash = p_key_hash;
        return query select false, p_block_seconds;
        return;
    end if;

    update public.auth_rate_limits
    set attempts = attempts + 1, blocked_until = null, updated_at = v_now
    where key_hash = p_key_hash;
    return query select true, 0;
end;
$$;

create or replace function public.clear_auth_rate_limit(p_key_hash text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
    delete from public.auth_rate_limits where key_hash = p_key_hash;
$$;

revoke all on function public.consume_auth_rate_limit(text, integer, integer, integer) from public;
revoke all on function public.clear_auth_rate_limit(text) from public;
grant execute on function public.consume_auth_rate_limit(text, integer, integer, integer) to service_role;
grant execute on function public.clear_auth_rate_limit(text) to service_role;

-- O limite comercial considera somente alunos ativos, inclusive em reativações.
create or replace function public.enforce_trainer_student_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    active_total integer;
begin
    if new.status <> 'active' then return new; end if;
    if tg_op = 'UPDATE' and old.status = 'active' and old.trainer_id = new.trainer_id then return new; end if;

    perform pg_advisory_xact_lock(hashtext(new.trainer_id::text));
    if tg_op = 'UPDATE' then
        select count(*) into active_total
        from public.students
        where trainer_id = new.trainer_id
          and status = 'active'
          and deleted_at is null
          and id <> old.id;
    else
        select count(*) into active_total
        from public.students
        where trainer_id = new.trainer_id
          and status = 'active'
          and deleted_at is null;
    end if;

    if active_total >= 10 then
        raise exception using errcode = 'P0001', message = 'student_limit_reached';
    end if;
    return new;
end;
$$;

drop trigger if exists enforce_trainer_student_limit_trigger on public.students;
create trigger enforce_trainer_student_limit_trigger
before insert or update of trainer_id, status on public.students
for each row execute function public.enforce_trainer_student_limit();

alter table public.workout_sessions
    add column if not exists client_session_id uuid;
create unique index if not exists workout_sessions_client_idempotency_key
    on public.workout_sessions (student_id, client_session_id)
    where client_session_id is not null;

-- Fotos de perfil passam a ser privadas e entregues somente por rota autenticada.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'profile-images-private',
    'profile-images-private',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

commit;
