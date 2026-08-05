import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getStudentById, updateStudent } from '@/lib/demo-data';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Se for aluno, só pode ver a si mesmo
  if (session.role === 'student' && session.sub !== params.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const student = await getStudentById(params.id);
  if (!student) {
    return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
  }

  // Se for personal, só pode ver seus alunos
  if (session.role === 'trainer' && student.trainer_id !== session.trainer_id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  return NextResponse.json({ student });
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Aluno pode editar a si mesmo (onboarding). Personal pode editar seus alunos.
  const isStudent = session.role === 'student' && session.sub === params.id;
  const isTrainer = session.role === 'trainer';

  if (!isStudent && !isTrainer) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const student = await getStudentById(params.id);
  if (!student) {
    return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
  }

  if (isTrainer && student.trainer_id !== session.trainer_id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Filtra apenas campos permitidos
    const allowedUpdates = [
      'height', 'current_weight', 'goal', 'experience_level',
      'restrictions', 'injuries', 'medical_notes', 'gender', 'birth_date',
      'full_name', 'nickname', 'available_days'
    ];

    const updates: Record<string, any> = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        if (key === 'height' || key === 'current_weight') {
           updates[key] = Number(body[key]);
        } else {
           updates[key] = body[key];
        }
      }
    }

    updates.updated_at = new Date().toISOString();

    await updateStudent(params.id, updates);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao processar dados' }, { status: 400 });
  }
}
