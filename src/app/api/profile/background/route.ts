import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { consumeRateLimit } from '@/lib/auth/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';
import { parsePrivateBackground } from '@/lib/profile/private-background';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const BUCKET = 'background-images-private';
const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

function json(body: Record<string, unknown>, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

function tableFor(role: 'trainer' | 'student' | 'individual') {
  return role === 'trainer' ? 'trainers' : role === 'student' ? 'students' : 'individual_users';
}

async function saveBackground(role: 'trainer' | 'student' | 'individual', actorId: string, backgroundUrl: string | null) {
  const admin = createAdminClient();
  const table = tableFor(role);
  const { data: current, error: currentError } = await admin
    .from(table)
    .select('background_url')
    .eq('id', actorId)
    .single();
  if (currentError) throw currentError;
  const { error } = await admin.from(table).update({ background_url: backgroundUrl }).eq('id', actorId);
  if (error) throw error;

  const previous = parsePrivateBackground(current?.background_url);
  if (previous && current.background_url !== backgroundUrl) {
    await admin.storage.from(previous.bucket).remove([previous.path]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return json({ error: 'Não autorizado.' }, 401);
    const limit = await consumeRateLimit({
      request,
      scope: 'background-upload',
      identifier: session.sub,
      maxAttempts: 10,
      windowSeconds: 3600,
      blockSeconds: 1800,
    });
    if (!limit.allowed) return json({ error: 'Muitos envios. Aguarde antes de tentar novamente.' }, 429, { 'Retry-After': String(limit.retryAfter) });

    const formData = await request.formData();
    const file = formData.get('photo');
    if (!(file instanceof File)) return json({ error: 'Selecione uma imagem.' }, 400);
    if (!ALLOWED_TYPES.has(file.type)) return json({ error: 'Use uma imagem JPG, PNG ou WebP.' }, 400);
    if (file.size === 0 || file.size > MAX_FILE_SIZE) return json({ error: 'A imagem deve ter no máximo 5 MB.' }, 400);

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
      await saveBackground(session.role, session.sub, `private:${path}`);
    } catch (saveError) {
      await admin.storage.from(BUCKET).remove([path]);
      throw saveError;
    }
    return json({
      success: true,
      background_url: `/api/profile/background/image?v=${Date.now()}`,
    }, 201);
  } catch (error) {
    console.error('[Profile Background] Upload error:', error);
    return json({ error: 'Não foi possível enviar a imagem.' }, 500);
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) return json({ error: 'Não autorizado.' }, 401);
    await saveBackground(session.role, session.sub, null);
    return json({ success: true });
  } catch (error) {
    console.error('[Profile Background] Remove error:', error);
    return json({ error: 'Não foi possível remover a imagem.' }, 500);
  }
}
