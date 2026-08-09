begin;

-- Avoid the PostgreSQL CURRENT_TIME keyword. The previous PL/pgSQL variable
-- name was parsed as time with time zone inside SQL statements, while the
-- persisted columns require timestamp with time zone.
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

revoke all on function public.consume_auth_rate_limit(text, integer, integer, integer) from public;
grant execute on function public.consume_auth_rate_limit(text, integer, integer, integer) to service_role;

commit;
