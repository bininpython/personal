import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { SupabaseConfigurationError } from '@/lib/supabase/config';
import { normalizeName } from '@/lib/auth/hash';
import { isPrivateAvatar } from '@/lib/profile/private-avatar';

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome').max(100, 'Nome muito longo'),
  nickname: z.string().trim().max(50, 'Apelido muito longo').optional(),
  city: z.string().trim().min(2, 'Informe sua cidade').max(100, 'Cidade muito longa'),
  age: z.number().int().min(18, 'Idade mínima: 18 anos').max(100, 'Informe uma idade válida'),
}).strict();

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') return json({ error: 'Não autorizado.' }, 401);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('trainers')
      .select('id, name, nickname, city, age, avatar_url')
      .eq('id', session.trainer_id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return json({ error: 'Perfil não encontrado.' }, 404);

    const avatarUrl = isPrivateAvatar(data.avatar_url)
      ? `/api/profile/avatar/image?user=${encodeURIComponent(data.id)}`
      : (data.avatar_url || '');

    return json({
      profile: {
        name: data.name,
        nickname: data.nickname || '',
        city: data.city || '',
        age: data.age || 18,
        avatar_url: avatarUrl,
      },
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    }
    console.error('[Trainer Profile] Get error:', error);
    return json({ error: 'Não foi possível carregar o perfil.' }, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') return json({ error: 'Não autorizado.' }, 401);

    const parsed = updateProfileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ error: parsed.error.issues[0]?.message || 'Perfil inválido.' }, 400);
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('trainers')
      .update({
        name: parsed.data.name,
        login_name_normalized: normalizeName(parsed.data.name),
        nickname: parsed.data.nickname || null,
        city: parsed.data.city,
        age: parsed.data.age,
      })
      .eq('id', session.trainer_id);
    if (error) throw error;

    return json({ success: true, ...parsed.data });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    }
    console.error('[Trainer Profile] Patch error:', error);
    return json({ error: 'Não foi possível salvar o perfil.' }, 500);
  }
}
