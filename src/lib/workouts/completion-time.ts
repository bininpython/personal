export const MAX_OFFLINE_WORKOUT_AGE_MS = 14 * 24 * 60 * 60 * 1000;

interface WorkoutCompletionTimingInput {
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
}

export type WorkoutCompletionTimingResult =
  | {
    success: true;
    startedAt: Date;
    completedAt: Date;
    durationSeconds: number;
  }
  | {
    success: false;
    error: string;
  };

export function resolveWorkoutCompletionTiming(
  input: WorkoutCompletionTimingInput,
  receivedAt = new Date(),
): WorkoutCompletionTimingResult {
  const startedAt = new Date(input.startedAt);
  const completedAt = input.completedAt ? new Date(input.completedAt) : receivedAt;

  if (!Number.isFinite(startedAt.getTime()) || !Number.isFinite(completedAt.getTime())) {
    return { success: false, error: 'O horário do treino é inválido.' };
  }
  if (completedAt.getTime() > receivedAt.getTime() + 60_000) {
    return { success: false, error: 'O horário de conclusão do treino é inválido.' };
  }
  if (completedAt.getTime() < receivedAt.getTime() - MAX_OFFLINE_WORKOUT_AGE_MS) {
    return { success: false, error: 'Este treino ficou tempo demais sem sincronizar.' };
  }
  if (startedAt.getTime() > completedAt.getTime() + 60_000) {
    return { success: false, error: 'O horário inicial do treino é inválido.' };
  }

  const measuredDuration = Math.max(0, Math.min(
    21_600,
    Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000),
  ));

  return {
    success: true,
    startedAt,
    completedAt,
    durationSeconds: Math.min(input.durationSeconds, measuredDuration + 60),
  };
}
