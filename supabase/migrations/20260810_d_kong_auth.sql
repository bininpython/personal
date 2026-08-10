begin;

alter table public.trainers
    add column if not exists nickname text,
    add column if not exists age smallint,
    add column if not exists recovery_password_hash text;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'trainers_age_range'
          and conrelid = 'public.trainers'::regclass
    ) then
        alter table public.trainers
            add constraint trainers_age_range
            check (age is null or age between 18 and 100);
    end if;
end
$$;

comment on column public.trainers.recovery_password_hash is
    'Hash da senha usada somente para recuperar e emitir um novo código numérico.';

commit;
