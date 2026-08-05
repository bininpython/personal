import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getStudentProgress } from '@/lib/students/progress';
import { createAdminClient } from '@/lib/supabase/admin';
import { SupabaseConfigurationError } from '@/lib/supabase/config';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const session = await getSession();
    if (!session) return json({ error: 'Não autorizado.' }, 401);
    if (session.role === 'student' && session.sub !== id) return json({ error: 'Não autorizado.' }, 403);

    if (session.role === 'trainer') {
      const admin = createAdminClient();
      const { data: student, error } = await admin.from('students').select('trainer_id').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!student) return json({ error: 'Aluno não encontrado.' }, 404);
      if (student.trainer_id !== session.trainer_id) return json({ error: 'Não autorizado.' }, 403);
    }

    const progress = await getStudentProgress(id);
    if (!progress) return json({ error: 'Aluno não encontrado.' }, 404);
    return json({ progress });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    console.error('[Student Progress] Get error:', error);
    return json({ error: 'Não foi possível carregar a evolução do aluno.' }, 500);
  }
}
