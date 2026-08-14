begin;

-- Inserir Trainer de Demo
insert into public.trainers (id, name, login_name_normalized, code, public_code, status, terms_accepted_at, credential_version)
values (
    '11111111-1111-1111-1111-111111111111',
    'Personal Teste',
    'personal teste',
    'TEST-TRN',
    'TEST-TRN',
    'active',
    now(),
    2
) on conflict (id) do nothing;

-- Inserir Aluno de Demo (ligado ao Trainer Demo)
insert into public.students (id, trainer_id, name, status, terms_accepted_at, privacy_consent_at)
values (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Aluno Teste',
    'active',
    now(),
    now()
) on conflict (id) do nothing;

-- Inserir Individual de Demo
insert into public.individual_users (id, name, login_name_normalized, status, terms_accepted_at, credential_version)
values (
    '22222222-2222-2222-2222-222222222222',
    'Individual Teste',
    'individual teste',
    'active',
    now(),
    2
) on conflict (id) do nothing;

commit;
