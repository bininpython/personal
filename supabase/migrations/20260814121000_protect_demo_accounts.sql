begin;

-- Trigger function para bloquear alterações e exclusões nas contas de teste
create or replace function public.protect_demo_accounts()
returns trigger as $$
declare
    demo_trainer uuid := '11111111-1111-1111-1111-111111111111'::uuid;
    demo_individual uuid := '22222222-2222-2222-2222-222222222222'::uuid;
    demo_student uuid := '33333333-3333-3333-3333-333333333333'::uuid;
begin
    if tg_op = 'DELETE' then
        if old.id in (demo_trainer, demo_individual, demo_student) then
            raise exception 'Operação não permitida: contas de demonstração não podem ser apagadas.';
        end if;
        return old;
    elsif tg_op = 'UPDATE' then
        if new.id in (demo_trainer, demo_individual, demo_student) then
            -- Permite atualizar status ou last_sign_in_at, mas bloqueia mudanças de senha ou código
            if new.access_code_hash is distinct from old.access_code_hash or
               new.recovery_password_hash is distinct from old.recovery_password_hash or
               new.login_name_normalized is distinct from old.login_name_normalized then
                raise exception 'Operação não permitida: credenciais de demonstração não podem ser alteradas.';
            end if;
        end if;
        return new;
    end if;
    return null;
end;
$$ language plpgsql;

-- Aplicar a trigger nas tabelas principais
drop trigger if exists protect_demo_trainers on public.trainers;
create trigger protect_demo_trainers
    before update or delete on public.trainers
    for each row execute function public.protect_demo_accounts();

drop trigger if exists protect_demo_individuals on public.individual_users;
create trigger protect_demo_individuals
    before update or delete on public.individual_users
    for each row execute function public.protect_demo_accounts();

drop trigger if exists protect_demo_students on public.students;
create trigger protect_demo_students
    before update or delete on public.students
    for each row execute function public.protect_demo_accounts();

commit;
