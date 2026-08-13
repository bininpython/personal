begin;

create table if not exists public.product_tutorial_progress (
    actor_id uuid not null,
    actor_role text not null check (actor_role in ('trainer', 'student', 'individual')),
    tutorial_version integer not null check (tutorial_version > 0),
    status text not null check (status in ('started', 'dismissed', 'completed')),
    updated_at timestamp with time zone not null default now(),
    primary key (actor_id, actor_role, tutorial_version)
);

comment on table public.product_tutorial_progress is
    'Progresso mínimo do tutorial de produto, sincronizado entre aparelhos sem armazenar conteúdo pessoal.';
comment on column public.product_tutorial_progress.actor_id is
    'Identificador da conta autenticada; a função é indicada por actor_role.';

alter table public.product_tutorial_progress enable row level security;

revoke all on table public.product_tutorial_progress from anon, authenticated;
grant select, insert, update, delete on table public.product_tutorial_progress to service_role;

create index if not exists product_tutorial_progress_updated_idx
    on public.product_tutorial_progress (updated_at desc);

commit;
