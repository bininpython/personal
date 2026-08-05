import { NextResponse } from 'next/server';
import { studentLoginSchema } from '@/lib/validators';
import { normalizeName } from '@/lib/auth/hash';
import {
  buildSyntheticEmail,
  canonicalizeStudentAccessCode,
} from '@/lib/auth/credentials';
import { createClient } from '@/lib/supabase/server';

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
    const supabase = await createClient();
    const submittedCode = access_code.trim();
    const candidatePasswords = submittedCode === canonicalCode
      ? [canonicalCode]
      : [submittedCode, canonicalCode];
    let authenticatedUserId = '';

    for (const password of candidatePasswords) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        authenticatedUserId = data.user.id;
        break;
      }
    }

    if (!authenticatedUserId) {
      return json({ error: GENERIC_LOGIN_ERROR }, 401);
    }

    const { data: student, error: profileError } = await supabase
      .from('students')
      .select('id, trainer_id, name, status')
      .eq('id', authenticatedUserId)
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
      },
    }, 200);
  } catch (error) {
    console.error('[Student Login] Unexpected error:', error);
    return json({ error: 'Erro interno do servidor.' }, 500);
  }
}
