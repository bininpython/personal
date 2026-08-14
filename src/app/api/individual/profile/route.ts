import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { normalizeName } from '@/lib/auth/hash';
import { isPrivateAvatar } from '@/lib/profile/private-avatar';
import { createAdminClient } from '@/lib/supabase/admin';
import { individualProfileSchema } from '@/lib/validators';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function publicProfile(row: Record<string, unknown>) {
  const avatar = typeof row.avatar_url === 'string' ? row.avatar_url : '';
  return {
    id: row.id,
    full_name: row.name,
    avatar_url: isPrivateAvatar(avatar)
      ? `/api/profile/avatar/image?user=${encodeURIComponent(String(row.id))}`
      : avatar,
    city: row.city || '',
    birth_date: row.birth_date || '',
    gender: row.gender || 'other',
    height: row.height ? Number(row.height) : undefined,
    weight: row.weight ? Number(row.weight) : undefined,
    goal: row.goal || '',
    level: row.level || 'beginner',
    available_days: row.available_days || [],
    restrictions: row.restrictions || '',
    biography: row.biography || '',
    created_at: row.created_at,
  };
}

const PROFILE_COLUMNS = 'id, name, avatar_url, city, birth_date, gender, height, weight, goal, level, available_days, restrictions, biography, created_at';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'individual') return json({ error: 'Não autorizado.' }, 401);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('individual_users')
      .select(PROFILE_COLUMNS)
      .eq('id', session.sub)
      .single();
    if (error || !data) throw error || new Error('Perfil não encontrado.');
    return json({ profile: publicProfile(data) });
  } catch (error) {
    console.error('[Individual Profile] GET error:', error);
    return json({ error: 'Não foi possível carregar seu perfil.' }, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'individual') return json({ error: 'Não autorizado.' }, 401);
    const parsed = individualProfileSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: 'Revise os dados do perfil.', details: parsed.error.flatten() }, 400);

    const value = parsed.data;
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('individual_users')
      .update({
        name: value.full_name,
        login_name_normalized: normalizeName(value.full_name),
        city: value.city || null,
        birth_date: value.birth_date || null,
        gender: value.gender || null,
        height: value.height ?? null,
        weight: value.weight ?? null,
        goal: value.goal || null,
        level: value.level || null,
        available_days: value.available_days || [],
        restrictions: value.restrictions || null,
        biography: value.biography || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.sub)
      .select(PROFILE_COLUMNS)
      .single();
    if (error || !data) throw error || new Error('Perfil não atualizado.');
    return json({ success: true, profile: publicProfile(data) });
  } catch (error) {
    console.error('[Individual Profile] PATCH error:', error);
    return json({ error: 'Não foi possível salvar seu perfil.' }, 500);
  }
}
