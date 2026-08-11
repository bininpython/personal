begin;

alter table public.students
    add column if not exists trainer_privacy_attested_at timestamp with time zone,
    add column if not exists trainer_privacy_attested_by uuid references public.trainers(id) on delete set null,
    add column if not exists trainer_privacy_policy_version text;

comment on column public.students.trainer_privacy_attested_at is
    'Momento em que o personal declarou possuir autorização para cadastrar os dados iniciais.';
comment on column public.students.trainer_privacy_attested_by is
    'Personal que fez a declaração de autorização para o cadastro inicial.';
comment on column public.students.privacy_consent_at is
    'Consentimento dado diretamente pelo aluno durante o primeiro acesso.';
comment on column public.students.terms_accepted_at is
    'Aceite dos Termos dado diretamente pelo aluno durante o primeiro acesso.';

create index if not exists students_pending_direct_consent_idx
    on public.students (trainer_id, created_at)
    where deleted_at is null
      and (privacy_consent_at is null or terms_accepted_at is null);

commit;
