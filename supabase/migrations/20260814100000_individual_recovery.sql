begin;

alter table public.individual_users
    add column if not exists age smallint;

alter table public.individual_users
    drop constraint if exists individual_users_age_range;

alter table public.individual_users
    add constraint individual_users_age_range
    check (age is null or age between 18 and 100);

commit;
