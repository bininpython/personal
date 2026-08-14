begin;

-- Adiciona a coluna status na tabela trainers caso não exista
alter table public.trainers
    add column if not exists status text not null default 'active' check (status in ('active', 'inactive', 'pending_payment'));

-- Adiciona coluna de ID de pagamento nas tabelas
alter table public.trainers
    add column if not exists external_payment_id text;

alter table public.individual_users
    add column if not exists external_payment_id text;

-- Atualiza o constraint de status na tabela individual_users para aceitar pending_payment
do $$
declare
    status_constraint text;
begin
    select conname into status_constraint
    from pg_constraint
    where conrelid = 'public.individual_users'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%';

    if status_constraint is not null then
        execute format('alter table public.individual_users drop constraint %I', status_constraint);
    end if;
end
$$;

alter table public.individual_users
    add constraint individual_users_status_check
    check (status in ('active', 'inactive', 'pending_payment'));

commit;
