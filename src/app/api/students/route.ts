import { NextResponse } from 'next/server';
import { studentCreateSchema } from '@/lib/validators';
import { hashPassword, normalizeName } from '@/lib/auth/hash';
import { initDemoData, addStudent } from '@/lib/demo-data';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    await initDemoData();

    // Verify session
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

    const id = crypto.randomUUID();
    const codeHash = await hashPassword(data.access_code);

    const newStudent = {
      id,
      trainer_id: trainerId,
      full_name: data.full_name,
      normalized_name: normalizeName(data.full_name),
      nickname: data.nickname || data.full_name.split(' ')[0],
      access_code_hint: '', // Can be a masked version of the code
      avatar_url: '',
      birth_date: data.birth_date || '',
      gender: data.gender || 'other',
      height: data.height || 0,
      current_weight: data.current_weight || 0,
      goal: data.goal || '',
      experience_level: data.experience_level || 'beginner',
      restrictions: data.restrictions || '',
      injuries: data.injuries || '',
      medical_notes: data.medical_notes || '',
      available_days: data.available_days || [],
      start_date: data.start_date || new Date().toISOString().split('T')[0],
      notes: data.notes || '',
      status: 'active' as const,
      failed_login_attempts: 0,
      access_code_changed_at: new Date().toISOString(),
      access_code_hash: codeHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // --- Supabase Path ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const supabase = await createClient();
      
      const mockEmail = `student_${data.access_code.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;
      const ghostPassword = data.access_code; 
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: mockEmail,
        password: ghostPassword,
        options: {
          data: {
            name: data.full_name,
            role: 'student',
          }
        }
      });

      if (!authError && authData.user) {
        await supabase.from('students').insert({
          id: id,
          trainer_id: trainerId,
          name: data.full_name,
          status: 'active',
          goal: data.goal || '',
          level: data.experience_level || 'beginner',
        });
      }
    }
    // -----------------------

    await addStudent(newStudent);

    return NextResponse.json({
      success: true,
      student: { id: newStudent.id, name: newStudent.full_name },
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
    await initDemoData();

    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const trainerId = session.trainer_id;

    // --- Supabase Path ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
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
    }
    // -----------------------

    const { getStudentsByTrainerId } = await import('@/lib/demo-data');
    const demoStudents = getStudentsByTrainerId(trainerId);

    const formattedStudents = demoStudents.map(s => ({
      id: s.id,
      name: s.full_name,
      goal: s.goal || 'Não definido',
      level: s.experience_level === 'beginner' ? 'Iniciante' : s.experience_level === 'intermediate' ? 'Intermediário' : 'Avançado',
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
