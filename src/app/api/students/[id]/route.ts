import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

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

  const supabase = await createClient();

  const { data: student, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !student) {
    return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
  }

  // Se for personal, só pode ver seus alunos
  if (session.role === 'trainer' && student.trainer_id !== session.trainer_id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Transform output to match expected frontend interface if needed, or return directly
  // Adjusting simple things for compatibility:
  const frontendStudent = {
    ...student,
    full_name: student.name,
    experience_level: student.level,
    // Provide other defaults to not break frontend typing from demo-data
    avatar_url: '',
    birth_date: '',
    gender: 'other',
    height: 0,
    current_weight: 0,
    restrictions: '',
    injuries: '',
    medical_notes: '',
    available_days: [],
    start_date: student.created_at,
    notes: '',
  };

  return NextResponse.json({ student: frontendStudent });
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

  const supabase = await createClient();

  const { data: student, error: fetchError } = await supabase
    .from('students')
    .select('trainer_id')
    .eq('id', params.id)
    .single();

  if (fetchError || !student) {
    return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
  }

  if (isTrainer && student.trainer_id !== session.trainer_id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Filtra apenas campos permitidos
    const allowedUpdates = [
       'goal', 'experience_level', 'status' // These are the only ones present in Supabase table "students" for now. 
       // For a full app, the rest (height, weight, etc) should be in physical_assessments or a student_details table.
       // However, we can map 'experience_level' to 'level', and 'full_name' to 'name'.
    ];

    const dbUpdates: Record<string, any> = {};
    if (body.experience_level !== undefined) dbUpdates.level = body.experience_level;
    if (body.goal !== undefined) dbUpdates.goal = body.goal;
    if (body.full_name !== undefined) dbUpdates.name = body.full_name;
    if (body.status !== undefined) dbUpdates.status = body.status;

    if (Object.keys(dbUpdates).length > 0) {
      await supabase
        .from('students')
        .update(dbUpdates)
        .eq('id', params.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao processar dados' }, { status: 400 });
  }
}
