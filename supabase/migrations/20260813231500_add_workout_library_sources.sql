begin;

alter table public.workout_plans
    add column if not exists library_template_id text;

alter table public.individual_workout_plans
    add column if not exists library_template_id text;

create index if not exists workout_plans_library_template_idx
    on public.workout_plans (library_template_id)
    where library_template_id is not null;

create index if not exists individual_workout_plans_library_template_idx
    on public.individual_workout_plans (library_template_id)
    where library_template_id is not null;

comment on column public.workout_plans.library_template_id is
    'Identificador versionado da ficha de origem na Biblioteca G KONG.';

comment on column public.individual_workout_plans.library_template_id is
    'Identificador versionado da ficha de origem na Biblioteca G KONG.';

commit;
