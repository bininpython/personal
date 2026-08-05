import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  EXERCISE_CATALOG,
  getExercisesForMuscle,
  isMuscleRegion,
} from '@/lib/exercises/catalog';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return json({ error: 'Não autorizado.' }, 401);
    }

    const { searchParams } = new URL(request.url);
    const muscle = searchParams.get('muscle');
    const search = searchParams.get('search')?.trim().toLocaleLowerCase('pt-BR') || '';

    if (muscle !== null && !isMuscleRegion(muscle)) {
      return json({ error: 'Grupo muscular inválido.' }, 400);
    }

    const selectedMuscle = muscle !== null && isMuscleRegion(muscle) ? muscle : null;
    const source = selectedMuscle ? getExercisesForMuscle(selectedMuscle) : EXERCISE_CATALOG;
    const exercises = search
      ? source.filter((exercise) => (
        exercise.name.toLocaleLowerCase('pt-BR').includes(search)
        || exercise.equipment.toLocaleLowerCase('pt-BR').includes(search)
      ))
      : source;

    return json({ exercises, total: exercises.length });
  } catch (error) {
    console.error('[Get Exercises] Error:', error);
    return json({ error: 'Erro interno do servidor.' }, 500);
  }
}
