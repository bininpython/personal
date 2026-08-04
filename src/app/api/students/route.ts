import { NextResponse } from 'next/server';
import { studentCreateSchema } from '@/lib/validators';
import { hashPassword, normalizeName } from '@/lib/auth/hash';
import { initDemoData, addStudent } from '@/lib/demo-data';
import { getSession } from '@/lib/auth/session';

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

    addStudent(newStudent);

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
