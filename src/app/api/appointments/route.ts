import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { canAccessStudentFeatures } from '@/lib/auth/session-types';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSaoPauloMonthRange } from '@/lib/time/sao-paulo';

const appointmentSchema = z.object({
  studentId: z.string().uuid(),
  type: z.enum(['training', 'assessment', 'follow_up', 'other']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().trim().max(2000).optional(),
}).strict().refine((value) => new Date(value.endTime) > new Date(value.startTime), {
  message: 'O horário final deve ser posterior ao inicial.',
  path: ['endTime'],
});

const updateAppointmentSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['scheduled', 'completed', 'cancelled']),
}).strict();

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

type RelatedStudent = { name: string } | Array<{ name: string }> | null;

function relatedStudentName(value: RelatedStudent) {
  return (Array.isArray(value) ? value[0] : value)?.name || 'Aluno';
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return json({ error: 'Não autorizado.' }, 401);
    if (!canAccessStudentFeatures(session)) return json({ error: 'Conclua o primeiro acesso para continuar.' }, 403);
    const searchParams = new URL(request.url).searchParams;
    const month = searchParams.get('month');
    const upcoming = searchParams.get('upcoming') === 'true';
    const admin = createAdminClient();
    let query = admin
      .from('appointments')
      .select('id, trainer_id, student_id, appointment_type, start_time, end_time, status, notes, students (name)')
      .order('start_time');

    query = session.role === 'trainer'
      ? query.eq('trainer_id', session.trainer_id)
      : query.eq('student_id', session.sub);

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const range = getSaoPauloMonthRange(month);
      if (range) query = query.gte('start_time', range.startIso).lt('start_time', range.nextStartIso);
    } else if (upcoming) {
      query = query
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString())
        .limit(10);
    }

    const { data, error } = await query;
    if (error) throw error;
    const appointments = (data ?? []).map((item) => ({
      id: item.id,
      studentId: item.student_id,
      studentName: relatedStudentName(item.students as RelatedStudent),
      type: item.appointment_type,
      startTime: item.start_time,
      endTime: item.end_time,
      status: item.status,
      notes: item.notes || '',
    }));
    return json({ appointments });
  } catch (error) {
    console.error('[Appointments] Get error:', error);
    return json({ error: 'Não foi possível carregar a agenda.' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') return json({ error: 'Não autorizado.' }, 401);
    const parsed = appointmentSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: parsed.error.issues[0]?.message || 'Revise o agendamento.' }, 400);

    const admin = createAdminClient();
    const { data: student, error: studentError } = await admin
      .from('students')
      .select('id')
      .eq('id', parsed.data.studentId)
      .eq('trainer_id', session.trainer_id)
      .eq('status', 'active')
      .maybeSingle();
    if (studentError) throw studentError;
    if (!student) return json({ error: 'Aluno ativo não encontrado.' }, 404);

    const { data: conflict, error: conflictError } = await admin
      .from('appointments')
      .select('id')
      .eq('trainer_id', session.trainer_id)
      .eq('status', 'scheduled')
      .lt('start_time', parsed.data.endTime)
      .gt('end_time', parsed.data.startTime)
      .limit(1)
      .maybeSingle();
    if (conflictError) throw conflictError;
    if (conflict) return json({ error: 'Já existe um compromisso nesse horário.' }, 409);

    const { data, error } = await admin
      .from('appointments')
      .insert({
        trainer_id: session.trainer_id,
        student_id: parsed.data.studentId,
        appointment_type: parsed.data.type,
        start_time: parsed.data.startTime,
        end_time: parsed.data.endTime,
        status: 'scheduled',
        notes: parsed.data.notes || null,
        is_recurring: false,
      })
      .select('id')
      .single();
    if (error) throw error;
    return json({ success: true, appointment: data }, 201);
  } catch (error) {
    console.error('[Appointments] Post error:', error);
    return json({ error: 'Não foi possível criar o agendamento.' }, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') return json({ error: 'Não autorizado.' }, 401);
    const parsed = updateAppointmentSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: 'Atualização inválida.' }, 400);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('appointments')
      .update({ status: parsed.data.status })
      .eq('id', parsed.data.id)
      .eq('trainer_id', session.trainer_id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: 'Agendamento não encontrado.' }, 404);
    return json({ success: true });
  } catch (error) {
    console.error('[Appointments] Patch error:', error);
    return json({ error: 'Não foi possível atualizar o agendamento.' }, 500);
  }
}
