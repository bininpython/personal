begin;

-- Personalização de interface: o usuário pode enviar uma imagem própria para
-- substituir o fundo padrão da sua área (mesmo padrão de armazenamento
-- privado já usado pelas fotos de perfil).
alter table public.trainers
    add column if not exists background_url text;

alter table public.students
    add column if not exists background_url text;

alter table public.individual_users
    add column if not exists background_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'background-images-private',
    'background-images-private',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

commit;
