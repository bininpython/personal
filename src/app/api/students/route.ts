import { NextResponse } from 'next/server';
import { studentCreateSchema } from '@/lib/validators';
import { getSession } from '@/lib/auth/session';
import {
  buildSyntheticEmail,
  canonicalizeStudentAccessCode,
  isDuplicateAccountError,
} from '@/lib/auth/credentials';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { SupabaseConfigurationError } from '@/lib/supabase/config';

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return json({ error: 'Não autorizado.' }, 401);
    }

    const result = studentCreateSchema.safeParse(await request.json());
    if (!result.success) {
      return json({
        error: 'Revise os dados do aluno.',
        details: result.error.flatten(),
      }, 400);
    }

    const data = result.data;
    const accessCode = canonicalizeStudentAccessCode(data.access_code);
    const email = buildSyntheticEmail('student', accessCode);
    const admin = createAdminClient();

    const { data: existingStudent } = await admin
      .from('students')
      .select('id')
      .eq('mock_email', email)
      .maybeSingle();

    if (existingStudent) {
      return json({ error: 'Este código já está em uso. Gere um novo código.' }, 409);
    }

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: accessCode,
      email_confirm: true,
      user_metadata: {
        name: data.full_name,
      },
      app_metadata: {
        role: 'student',
      },
    });

    if (authError || !authData.user) {
      if (isDuplicateAccountError(authError)) {
        return json({ error: 'Este código já está em uso. Gere um novo código.' }, 409);
      }
      console.error('[Create Student] Auth error:', authError);
      return json({ error: 'Não foi possível criar o acesso do aluno.' }, 500);
    }

    const studentId = authData.user.id;
    const { error: profileError } = await admin.from('students').insert({
      id: studentId,
      trainer_id: session.trainer_id,
      name: data.full_name,
      nickname: data.nickname || null,
      birth_date: data.birth_date || null,
      access_code: accessCode,
      mock_email: email,
      status: 'active',
      goal: data.goal || null,
      level: data.experience_level || 'beginner',
      weight: data.current_weight ?? null,
      height: data.height ?? null,
      gender: data.gender || 'other',
      restrictions: data.restrictions || null,
      injuries: data.injuries || null,
      medical_notes: data.medical_notes || null,
      available_days: data.available_days || [],
      start_date: data.start_date || null,
      notes: data.notes || null,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(studentId);
      console.error('[Create Student] Profile error:', profileError);
      return json({ error: 'Não foi possível salvar o perfil do aluno.' }, 500);
    }

    return json({
      success: true,
      student: {
        id: studentId,
        name: data.full_name,
        access_code: accessCode,
      },
    }, 201);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      console.error('[Create Student] Configuration error:', error.message);
      return json({ error: 'O serviço de cadastro ainda não está configurado.' }, 503);
    }

    console.error('[Create Student] Unexpected error:', error);
    return json({ error: 'Erro interno do servidor.' }, 500);
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return json({ error: 'Não autorizado.' }, 401);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .select('id, name, goal, level, status, created_at')
      .eq('trainer_id', session.trainer_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const students = data.map((student) => ({
      id: student.id,
      name: student.name,
      goal: student.goal || 'Não definido',
      level: student.level === 'beginner'
        ? 'Iniciante'
        : student.level === 'intermediate'
          ? 'Intermediário'
          : 'Avançado',
      lastWorkout: 'Sem dados',
      frequency: '0x/sem',
      completion: 0,
      status: student.status,
      trend: 'stable',
    }));

    return json({ students }, 200);
  } catch (error) {
    console.error('[Get Students] Unexpected error:', error);
    return json({ error: 'Erro interno do servidor.' }, 500);
  }
}
