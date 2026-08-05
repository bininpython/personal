import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { isAvatarOption } from '@/lib/profile/avatars';
import { createAdminClient } from '@/lib/supabase/admin';
import { SupabaseConfigurationError } from '@/lib/supabase/config';

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const BUCKET = 'profile-images';
const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

const avatarSchema = z.object({ avatar_url: z.string().refine(isAvatarOption, 'Avatar inválido.') }).strict();

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function saveAvatar(userId: string, avatarUrl: string) {
  const admin = createAdminClient();
  const { data, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !data.user) throw userError || new Error('Usuário não encontrado.');

  const { error } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...data.user.user_metadata,
      avatar_url: avatarUrl,
    },
  });
  if (error) throw error;
  return avatarUrl;
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return json({ error: 'Não autorizado.' }, 401);

    const parsed = avatarSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: 'Escolha um avatar válido.' }, 400);

    const avatarUrl = await saveAvatar(session.sub, parsed.data.avatar_url);
    return json({ success: true, avatar_url: avatarUrl });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    console.error('[Profile Avatar] Selection error:', error);
    return json({ error: 'Não foi possível salvar o avatar.' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return json({ error: 'Não autorizado.' }, 401);

    const formData = await request.formData();
    const file = formData.get('photo');
    if (!(file instanceof File)) return json({ error: 'Selecione uma foto.' }, 400);
    if (!ALLOWED_TYPES.has(file.type)) return json({ error: 'Use uma imagem JPG, PNG ou WebP.' }, 400);
    if (file.size === 0 || file.size > MAX_FILE_SIZE) return json({ error: 'A foto deve ter no máximo 3 MB.' }, 400);

    const admin = createAdminClient();
    const { error: bucketError } = await admin.storage.getBucket(BUCKET);
    if (bucketError) {
      const { error: createError } = await admin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: [...ALLOWED_TYPES.keys()],
      });
      if (createError && !createError.message.toLowerCase().includes('already exists')) throw createError;
    }

    const extension = ALLOWED_TYPES.get(file.type)!;
    const path = `${session.role}/${session.sub}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(
      path,
      Buffer.from(await file.arrayBuffer()),
      { contentType: file.type, cacheControl: '31536000', upsert: false },
    );
    if (uploadError) throw uploadError;

    const { data: publicData } = admin.storage.from(BUCKET).getPublicUrl(path);
    const avatarUrl = await saveAvatar(session.sub, publicData.publicUrl);
    return json({ success: true, avatar_url: avatarUrl }, 201);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    console.error('[Profile Avatar] Upload error:', error);
    return json({ error: 'Não foi possível enviar a foto.' }, 500);
  }
}
