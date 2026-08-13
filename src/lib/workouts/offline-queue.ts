export interface WorkoutCompletionSetPayload {
  setNumber: number;
  completed: boolean;
  performedRepetitions?: number;
  performedLoad?: number;
  rpe?: number;
}

export interface WorkoutCompletionPayload {
  clientSessionId: string;
  workoutDayId: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  rating?: number;
  feedback?: string;
  exercises: Array<{
    workoutExerciseId: string;
    sets: WorkoutCompletionSetPayload[];
  }>;
}

export interface QueuedWorkoutCompletion {
  planId: string;
  workoutDayId: string;
  queuedAt: string;
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
  payload: WorkoutCompletionPayload;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const QUEUE_VERSION = 1;
const MAX_QUEUED_WORKOUTS = 20;

export function workoutQueueStorageKey(studentId: string) {
  return `dkong-workout-completion-queue:v${QUEUE_VERSION}:${studentId}`;
}

function isQueuedWorkoutCompletion(value: unknown): value is QueuedWorkoutCompletion {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<QueuedWorkoutCompletion>;
  if (
    typeof item.planId !== 'string'
    || typeof item.workoutDayId !== 'string'
    || typeof item.queuedAt !== 'string'
    || typeof item.attempts !== 'number'
    || !item.payload
    || typeof item.payload !== 'object'
  ) return false;

  const payload = item.payload as Partial<WorkoutCompletionPayload>;
  return (
    typeof payload.clientSessionId === 'string'
    && typeof payload.workoutDayId === 'string'
    && payload.workoutDayId === item.workoutDayId
    && typeof payload.startedAt === 'string'
    && typeof payload.completedAt === 'string'
    && typeof payload.durationSeconds === 'number'
    && Array.isArray(payload.exercises)
  );
}

export function decodeWorkoutQueue(serialized: string | null): QueuedWorkoutCompletion[] {
  if (!serialized) return [];
  try {
    const decoded: unknown = JSON.parse(serialized);
    if (!Array.isArray(decoded)) return [];
    return decoded.filter(isQueuedWorkoutCompletion).slice(-MAX_QUEUED_WORKOUTS);
  } catch {
    return [];
  }
}

export function readWorkoutQueue(storage: StorageLike, studentId: string) {
  return decodeWorkoutQueue(storage.getItem(workoutQueueStorageKey(studentId)));
}

export function writeWorkoutQueue(
  storage: StorageLike,
  studentId: string,
  queue: QueuedWorkoutCompletion[],
) {
  storage.setItem(
    workoutQueueStorageKey(studentId),
    JSON.stringify(queue.slice(-MAX_QUEUED_WORKOUTS)),
  );
}

export function enqueueWorkoutCompletion(
  queue: QueuedWorkoutCompletion[],
  item: QueuedWorkoutCompletion,
) {
  const withoutDuplicate = queue.filter(
    (queued) => queued.payload.clientSessionId !== item.payload.clientSessionId,
  );
  return [...withoutDuplicate, item].slice(-MAX_QUEUED_WORKOUTS);
}

export function removeWorkoutCompletion(queue: QueuedWorkoutCompletion[], clientSessionId: string) {
  return queue.filter((item) => item.payload.clientSessionId !== clientSessionId);
}

export function recordWorkoutQueueAttempt(
  queue: QueuedWorkoutCompletion[],
  clientSessionId: string,
  error: string,
  attemptedAt = new Date().toISOString(),
) {
  return queue.map((item) => item.payload.clientSessionId === clientSessionId
    ? {
      ...item,
      attempts: item.attempts + 1,
      lastAttemptAt: attemptedAt,
      lastError: error,
    }
    : item);
}

export function queuedWorkoutDayIds(queue: QueuedWorkoutCompletion[], planId: string) {
  return new Set(queue.filter((item) => item.planId === planId).map((item) => item.workoutDayId));
}

export function completedSetKeysFromQueue(queue: QueuedWorkoutCompletion[], planId: string) {
  return queue.filter((item) => item.planId === planId).flatMap((item) => (
    item.payload.exercises.flatMap((exercise) => exercise.sets.flatMap((set) => (
      set.completed ? [`${exercise.workoutExerciseId}:${set.setNumber - 1}`] : []
    )))
  ));
}
