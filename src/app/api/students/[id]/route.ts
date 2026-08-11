import { NextResponse } from 'next/server';
import { getSession, revokeActorSessions } from '@/lib/auth/session';
import { studentProfileUpdateSchema } from '@/lib/validators';
import { createAdminClient } from '@/lib/supabase/admin';
import { SupabaseConfigurationError } from '@/lib/supabase/config';
import { normalizeName } from '@/lib/auth/hash';
import { isPrivateAvatar } from '@/lib/profile/private-avatar';

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
  if (session.role !== 'trainer' && session.role !== 'student') {
    return json({ error: 'Não autorizado.' }, 403);
  }
  if (session.role === 'student' && session.sub !== id) {
    return json({ error: 'Não autorizado.' }, 403);
  }

  const admin = createAdminClient();
  const { data: student, error } = await admin
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
      avatar_url,
      privacy_consent_at,
      terms_accepted_at,
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

  const avatarUrl = isPrivateAvatar(student.avatar_url)
    ? `/api/profile/avatar/image?user=${encodeURIComponent(student.id)}`
    : (student.avatar_url || '');

  return json({
    student: {
      id: student.id,
      trainer_id: student.trainer_id,
      full_name: student.name,
      nickname: student.nickname || '',
      avatar_url: avatarUrl,
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
      privacy_consent_at: student.privacy_consent_at,
      terms_accepted_at: student.terms_accepted_at,
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
    if (isStudent && data.privacy_consent === true) {
      updates.privacy_consent_at = new Date().toISOString();
      updates.privacy_policy_version = '2026-08-08';
    }
    if (isStudent && data.terms_accepted === true) {
      updates.terms_accepted_at = new Date().toISOString();
      updates.terms_version = '2026-08-08';
    }

    if (isTrainer) {
      if (data.full_name !== undefined) {
        updates.name = data.full_name;
        updates.login_name_normalized = normalizeName(data.full_name);
      }
      if (data.status !== undefined) updates.status = data.status;
      if (data.notes !== undefined) updates.notes = data.notes;
      if (data.injuries !== undefined) updates.injuries = data.injuries;
      if (data.medical_notes !== undefined) updates.medical_notes = data.medical_notes;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await admin
        .from('students')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error('[Patch Student] Update error:', updateError);
        if (updateError.code === 'P0001' || updateError.message.includes('student_limit_reached')) {
          return json({ error: 'O limite de alunos ativos foi atingido. Arquive outro aluno antes de reativar.' }, 409);
        }
        return json({ error: 'Não foi possível atualizar o aluno.' }, 500);
      }
    }

    if (isTrainer && data.status === 'inactive') {
      await revokeActorSessions(student.id, 'student');
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
