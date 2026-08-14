begin;

-- Padroniza a conta individual com o mesmo acesso por nome + codigo usado
-- pelas contas de personal e aluno. As credenciais antigas permanecem apenas
-- durante a transicao, para que o proprio usuario possa migrar sem perder a
-- conta ou as fichas existentes.
alter table public.individual_users
    add column if not exists login_name_normalized text,
    add column if not exists access_code_hash text,
    add column if not exists access_code_hint text,
    add column if not exists access_code_changed_at timestamp with time zone,
    add column if not exists credential_version integer not null default 1;

alter table public.individual_users
    alter column email drop not null,
    alter column email_normalized drop not null,
    alter column password_hash drop not null;

create index if not exists individual_users_login_name_idx
    on public.individual_users (login_name_normalized)
    where deleted_at is null;

comment on column public.individual_users.login_name_normalized is
    'Nome normalizado usado apenas para localizar candidatos no login por codigo.';
comment on column public.individual_users.access_code_hash is
    'Hash bcrypt do codigo privado de seis digitos. O codigo em texto puro nunca e armazenado.';
comment on column public.individual_users.access_code_hint is
    'Dica mascarada do codigo de acesso para suporte ao usuario.';
comment on column public.individual_users.credential_version is
    'Versao do formato de credencial individual; 2 representa nome + codigo.';

commit;
