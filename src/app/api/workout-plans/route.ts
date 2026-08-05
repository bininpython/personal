import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { initDemoData } from '@/lib/demo-data';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    await initDemoData();

    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, name, goal, daysPerWeek, exercises } = body;
    // exercises array format: { exerciseId, sets, reps, restTime }

    if (!studentId || !name || !exercises || exercises.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // --- Supabase Path ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const supabase = await createClient();
      
      // 1. Create Workout Plan
      const { data: plan, error: planError } = await supabase
        .from('workout_plans')
        .insert({
          student_id: studentId,
          trainer_id: session.trainer_id,
          name,
          goal: goal || 'Geral',
          days_per_week: daysPerWeek || 3,
          status: 'active',
          start_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();
        
      if (planError) throw planError;
      
      // 2. Create a generic Workout Day for this newly created plan
      const { data: day, error: dayError } = await supabase
        .from('workout_days')
        .insert({
          plan_id: plan.id,
          name: 'Treino A',
          day_label: 'A',
          order_index: 0
        })
        .select()
        .single();

      if (dayError) throw dayError;

      // 3. Insert Workout Exercises
      const workoutExercisesToInsert = exercises.map((ex: any, idx: number) => ({
        workout_day_id: day.id,
        exercise_id: ex.exerciseId,
        sets: ex.sets || 3,
        reps: ex.reps || '10',
        rest_time: ex.restTime || 60,
        order_index: idx
      }));

      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(workoutExercisesToInsert);

      if (exercisesError) throw exercisesError;

      return NextResponse.json({ success: true, plan });
    }
    // -----------------------

    // Demo Data Path
    // Since demo data is in-memory and lost on restart, we simulate success
    // If we wanted to actually save it in the Map, we could write a `createWorkoutPlan` function in demo-data.ts
    // For now, simulating success for the UI
    const { createWorkoutPlan } = await import('@/lib/demo-data');
    if (createWorkoutPlan) {
       createWorkoutPlan({
         student_id: studentId,
         trainer_id: session.trainer_id,
         name,
         goal: goal || 'Geral',
         days_per_week: daysPerWeek || 3,
         exercises
       });
    }

    return NextResponse.json({ success: true, message: 'Plano criado com sucesso (Demo)' });

  } catch (error) {
    console.error('[Create Workout Plan] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
