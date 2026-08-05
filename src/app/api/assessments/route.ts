import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { SupabaseConfigurationError } from '@/lib/supabase/config';
import { physicalAssessmentSchema } from '@/lib/validators';

type RelatedStudent = { name: string; trainer_id: string } | Array<{ name: string; trainer_id: string }> | null;

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function studentFromRelation(relation: RelatedStudent) {
  return Array.isArray(relation) ? relation[0] : relation;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') return json({ error: 'Não autorizado.' }, 401);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('physical_assessments')
      .select(`
        id, student_id, assessment_date, weight, height, body_fat_percentage,
        muscle_mass, created_at, students!inner (name, trainer_id)
      `)
      .eq('students.trainer_id', session.trainer_id)
      .order('assessment_date', { ascending: false });

    if (error) throw error;

    const rows = data ?? [];
    const assessments = rows.map((assessment, index) => {
      const student = studentFromRelation(assessment.students as RelatedStudent);
      const previous = rows.slice(index + 1).find((item) => item.student_id === assessment.student_id);
      const weight = Number(assessment.weight ?? 0);
      const bodyFat = Number(assessment.body_fat_percentage ?? 0);

      return {
        id: assessment.id,
        studentId: assessment.student_id,
        student: student?.name ?? 'Aluno',
        date: new Date(`${assessment.assessment_date}T12:00:00`).toLocaleDateString('pt-BR'),
        type: 'Avaliação física',
        weight,
        weightDiff: previous?.weight == null ? 0 : Number((weight - Number(previous.weight)).toFixed(1)),
        bf: bodyFat,
        bfDiff: previous?.body_fat_percentage == null
          ? 0
          : Number((bodyFat - Number(previous.body_fat_percentage)).toFixed(1)),
      };
    });

    return json({ assessments });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    }
    console.error('[Assessments] Get error:', error);
    return json({ error: 'Não foi possível carregar as avaliações.' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') return json({ error: 'Não autorizado.' }, 401);

    const parsed = physicalAssessmentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ error: 'Revise os dados da avaliação.', details: parsed.error.flatten() }, 400);
    }

    const admin = createAdminClient();
    const { data: student, error: studentError } = await admin
      .from('students')
      .select('id, status')
      .eq('id', parsed.data.student_id)
      .eq('trainer_id', session.trainer_id)
      .maybeSingle();

    if (studentError) throw studentError;
    if (!student || student.status !== 'active') return json({ error: 'Aluno ativo não encontrado.' }, 404);

    const data = parsed.data;
    const { data: assessment, error } = await admin
      .from('physical_assessments')
      .insert({
        student_id: data.student_id,
        assessment_date: data.assessment_date,
        weight: data.weight ?? null,
        height: data.height ?? null,
        body_fat_percentage: data.body_fat_percentage ?? null,
        muscle_mass: data.muscle_mass ?? null,
        blood_pressure_systolic: data.blood_pressure_systolic ?? null,
        blood_pressure_diastolic: data.blood_pressure_diastolic ?? null,
        resting_heart_rate: data.resting_heart_rate ?? null,
        chest: data.chest ?? null,
        waist: data.waist ?? null,
        abdomen: data.abdomen ?? null,
        hips: data.hips ?? null,
        right_arm: data.right_arm ?? null,
        left_arm: data.left_arm ?? null,
        right_thigh: data.right_thigh ?? null,
        left_thigh: data.left_thigh ?? null,
        right_calf: data.right_calf ?? null,
        left_calf: data.left_calf ?? null,
        notes: data.notes || null,
      })
      .select('id')
      .single();

    if (error) throw error;
    return json({ success: true, assessment }, 201);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    }
    console.error('[Assessments] Post error:', error);
    return json({ error: 'Não foi possível salvar a avaliação.' }, 500);
  }
}
