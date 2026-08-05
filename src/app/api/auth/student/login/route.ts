import { NextResponse } from 'next/server';
import { studentLoginSchema } from '@/lib/validators';
import { normalizeName } from '@/lib/auth/hash';
import {
  buildStudentAuthPassword,
  buildSyntheticEmail,
  canonicalizeStudentAccessCode,
} from '@/lib/auth/credentials';
import { createClient } from '@/lib/supabase/server';
import { storedAvatarUrl } from '@/lib/profile/avatar-metadata';

const GENERIC_LOGIN_ERROR = 'Nome ou código de acesso inválido.';

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request) {
  try {
    const result = studentLoginSchema.safeParse(await request.json());

    if (!result.success) {
      return json({ error: 'Revise o nome e o código informados.' }, 400);
    }

    const { name, access_code } = result.data;
    const canonicalCode = canonicalizeStudentAccessCode(access_code);
    const email = buildSyntheticEmail('student', canonicalCode);
    const password = buildStudentAuthPassword(canonicalCode);
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return json({ error: GENERIC_LOGIN_ERROR }, 401);
    }

    const { data: student, error: profileError } = await supabase
      .from('students')
      .select('id, trainer_id, name, status')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (
      profileError
      || !student
      || student.status !== 'active'
      || normalizeName(student.name) !== normalizeName(name)
    ) {
      await supabase.auth.signOut();
      return json({ error: GENERIC_LOGIN_ERROR }, 401);
    }

    return json({
      success: true,
      user: {
        id: student.id,
        role: 'student',
        name: student.name,
        trainer_id: student.trainer_id,
        avatar_url: storedAvatarUrl(authData.user.user_metadata),
      },
    }, 200);
  } catch (error) {
    console.error('[Student Login] Unexpected error:', error);
    return json({ error: 'Erro interno do servidor.' }, 500);
  }
}
