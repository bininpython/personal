import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { studentProfileUpdateSchema } from '@/lib/validators';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { SupabaseConfigurationError } from '@/lib/supabase/config';

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(
  _request: Request,
  context: RouteContext<'/api/students/[id]'>,
) {
  const { id } = await context.params;
  const session = await getSession();

  if (!session) return json({ error: 'Não autorizado.' }, 401);
  if (session.role === 'student' && session.sub !== id) {
    return json({ error: 'Não autorizado.' }, 403);
  }

  const supabase = await createClient();
  const { data: student, error } = await supabase
    .from('students')
    .select(`
      id,
      trainer_id,
      name,
      nickname,
      birth_date,
      status,
      goal,
      level,
      weight,
      height,
      gender,
      restrictions,
      injuries,
      medical_notes,
      available_days,
      start_date,
      notes,
      created_at
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !student) {
    return json({ error: 'Aluno não encontrado.' }, 404);
  }

  if (session.role === 'trainer' && student.trainer_id !== session.trainer_id) {
    return json({ error: 'Não autorizado.' }, 403);
  }

  return json({
    student: {
      id: student.id,
      trainer_id: student.trainer_id,
      full_name: student.name,
      nickname: student.nickname || '',
      avatar_url: '',
      birth_date: student.birth_date || '',
      gender: student.gender || 'other',
      height: student.height || 0,
      current_weight: student.weight || 0,
      goal: student.goal || '',
      experience_level: student.level || 'beginner',
      restrictions: student.restrictions || '',
      injuries: student.injuries || '',
      medical_notes: student.medical_notes || '',
      available_days: student.available_days || [],
      start_date: student.start_date || student.created_at,
      status: student.status,
      notes: session.role === 'trainer' ? student.notes || '' : '',
      created_at: student.created_at,
    },
  }, 200);
}

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/students/[id]'>,
) {
  try {
    const { id } = await context.params;
    const session = await getSession();
    if (!session) return json({ error: 'Não autorizado.' }, 401);

    const isStudent = session.role === 'student' && session.sub === id;
    const isTrainer = session.role === 'trainer';
    if (!isStudent && !isTrainer) {
      return json({ error: 'Não autorizado.' }, 403);
    }

    const result = studentProfileUpdateSchema.safeParse(await request.json());
    if (!result.success) {
      return json({
        error: 'Revise os dados informados.',
        details: result.error.flatten(),
      }, 400);
    }

    const admin = createAdminClient();
    const { data: student, error: fetchError } = await admin
      .from('students')
      .select('id, trainer_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !student) {
      return json({ error: 'Aluno não encontrado.' }, 404);
    }

    if (isTrainer && student.trainer_id !== session.trainer_id) {
      return json({ error: 'Não autorizado.' }, 403);
    }

    const data = result.data;
    const updates: Record<string, string | number> = {};

    if (data.experience_level !== undefined) updates.level = data.experience_level;
    if (data.goal !== undefined) updates.goal = data.goal;
    if (data.height !== undefined) updates.height = data.height;
    if (data.current_weight !== undefined) updates.weight = data.current_weight;
    if (data.weight !== undefined) updates.weight = data.weight;
    if (data.gender !== undefined) updates.gender = data.gender;
    if (data.restrictions !== undefined) updates.restrictions = data.restrictions;

    if (isTrainer) {
      if (data.full_name !== undefined) updates.name = data.full_name;
      if (data.status !== undefined) updates.status = data.status;
      if (data.notes !== undefined) updates.notes = data.notes;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await admin
        .from('students')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error('[Patch Student] Update error:', updateError);
        return json({ error: 'Não foi possível atualizar o aluno.' }, 500);
      }
    }

    return json({ success: true }, 200);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      console.error('[Patch Student] Configuration error:', error.message);
      return json({ error: 'O serviço de cadastro ainda não está configurado.' }, 503);
    }

    console.error('[Patch Student] Unexpected error:', error);
    return json({ error: 'Erro interno do servidor.' }, 500);
  }
}
