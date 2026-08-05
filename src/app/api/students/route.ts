import { NextResponse } from 'next/server';
import { studentCreateSchema } from '@/lib/validators';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const trainerId = session.trainer_id;
    if (!trainerId) {
      return NextResponse.json({ error: 'ID do personal não encontrado' }, { status: 401 });
    }

    const body = await request.json();
    const result = studentCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    
    const supabase = await createClient();
    
    const safeCode = data.access_code.toLowerCase().replace(/[^a-z0-9]/g, '');
    const mockEmail = `student_${safeCode}@example.com`;
    const ghostPassword = data.access_code; 
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: mockEmail,
      password: ghostPassword,
      options: {
        data: {
          name: data.full_name,
          role: 'student',
          trainer_id: trainerId,
        }
      }
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Erro ao criar autenticação do aluno' }, { status: 400 });
    }

    const id = authData.user.id;

    const { error: insertError } = await supabase.from('students').insert({
      id: id,
      trainer_id: trainerId,
      name: data.full_name,
      access_code: data.access_code,
      mock_email: mockEmail,
      status: 'active',
      goal: data.goal || '',
      level: data.experience_level || 'beginner',
    });

    if (insertError) {
      console.error('[Create Student] Insert error:', insertError);
      return NextResponse.json({ error: 'Erro ao cadastrar aluno no banco: ' + insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      student: { id, name: data.full_name, access_code: data.access_code },
    });
  } catch (error) {
    console.error('[Create Student] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const trainerId = session.trainer_id;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform to match the expected format
    const formattedStudents = data.map(s => ({
      id: s.id,
      name: s.name,
      goal: s.goal || 'Não definido',
      level: s.level === 'beginner' ? 'Iniciante' : s.level === 'intermediate' ? 'Intermediário' : 'Avançado',
      lastWorkout: 'Sem dados',
      frequency: '0x/sem',
      completion: 0,
      status: s.status,
      trend: 'stable'
    }));

    return NextResponse.json({ students: formattedStudents });
  } catch (error) {
    console.error('[Get Students] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
