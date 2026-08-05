import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { initDemoData } from '@/lib/demo-data';

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
        .from('workout_plans')
        .select(`
          *,
          students (name)
        `)
        .eq('trainer_id', trainerId);

      if (error) throw error;

      const formattedPlans = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        student: p.students?.name || 'Aluno Excluído',
        goal: p.goal || 'Geral',
        days: p.days_per_week || 3,
        duration: p.estimated_duration_minutes ? `${p.estimated_duration_minutes} min` : '45 min',
        status: p.status || 'draft',
        startDate: p.start_date || '-',
        endDate: p.end_date || '-',
      }));

      return NextResponse.json({ plans: formattedPlans });
    }
    // -----------------------

    // Demo Data
    const { getWorkoutPlansByTrainerId } = await import('@/lib/demo-data');
    const demoPlans = getWorkoutPlansByTrainerId(trainerId);

    const formattedPlans = demoPlans.map((p: any) => ({
      id: p.id,
      name: p.name,
      student: p.student_name || 'Desconhecido',
      goal: p.goal || 'Geral',
      days: p.days_per_week || 3,
      duration: p.estimated_duration_minutes ? `${p.estimated_duration_minutes} min` : '45 min',
      status: p.status || 'draft',
      startDate: p.start_date || '-',
      endDate: p.end_date || '-',
    }));

    return NextResponse.json({ plans: formattedPlans });
  } catch (error) {
    console.error('[Get Workout Plans] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
