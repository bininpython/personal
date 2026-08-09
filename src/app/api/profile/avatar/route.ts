import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { consumeRateLimit } from '@/lib/auth/rate-limit';
import { isAvatarOption } from '@/lib/profile/avatars';
import { createAdminClient } from '@/lib/supabase/admin';
import { parsePrivateAvatar } from '@/lib/profile/private-avatar';

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const BUCKET = 'profile-images-private';
const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const avatarSchema = z.object({ avatar_url: z.string().refine(isAvatarOption, 'Avatar inválido.') }).strict();

function json(body: Record<string, unknown>, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

async function saveAvatar(role: 'trainer' | 'student', actorId: string, avatarUrl: string) {
  const admin = createAdminClient();
  const table = role === 'trainer' ? 'trainers' : 'students';
  const { data: current, error: currentError } = await admin
    .from(table)
    .select('avatar_url')
    .eq('id', actorId)
    .single();
  if (currentError) throw currentError;
  const { error } = await admin.from(table).update({ avatar_url: avatarUrl }).eq('id', actorId);
  if (error) throw error;

  const previous = parsePrivateAvatar(current?.avatar_url);
  if (previous && current.avatar_url !== avatarUrl) {
    await admin.storage.from(previous.bucket).remove([previous.path]);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return json({ error: 'Não autorizado.' }, 401);
    const parsed = avatarSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: 'Escolha um avatar válido.' }, 400);
    await saveAvatar(session.role, session.sub, parsed.data.avatar_url);
    return json({ success: true, avatar_url: parsed.data.avatar_url });
  } catch (error) {
    console.error('[Profile Avatar] Selection error:', error);
    return json({ error: 'Não foi possível salvar o avatar.' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return json({ error: 'Não autorizado.' }, 401);
    const limit = await consumeRateLimit({
      request,
      scope: 'avatar-upload',
      identifier: session.sub,
      maxAttempts: 10,
      windowSeconds: 3600,
      blockSeconds: 1800,
    });
    if (!limit.allowed) return json({ error: 'Muitos envios. Aguarde antes de tentar novamente.' }, 429, { 'Retry-After': String(limit.retryAfter) });

    const formData = await request.formData();
    const file = formData.get('photo');
    if (!(file instanceof File)) return json({ error: 'Selecione uma foto.' }, 400);
    if (!ALLOWED_TYPES.has(file.type)) return json({ error: 'Use uma imagem JPG, PNG ou WebP.' }, 400);
    if (file.size === 0 || file.size > MAX_FILE_SIZE) return json({ error: 'A foto deve ter no máximo 3 MB.' }, 400);

    const admin = createAdminClient();
    const extension = ALLOWED_TYPES.get(file.type)!;
    const path = `${session.role}/${session.sub}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(
      path,
      Buffer.from(await file.arrayBuffer()),
      { contentType: file.type, cacheControl: '3600', upsert: false },
    );
    if (uploadError) throw uploadError;

    try {
      await saveAvatar(session.role, session.sub, `private:${path}`);
    } catch (saveError) {
      await admin.storage.from(BUCKET).remove([path]);
      throw saveError;
    }
    return json({
      success: true,
      avatar_url: `/api/profile/avatar/image?user=${encodeURIComponent(session.sub)}&v=${Date.now()}`,
    }, 201);
  } catch (error) {
    console.error('[Profile Avatar] Upload error:', error);
    return json({ error: 'Não foi possível enviar a foto.' }, 500);
  }
}
