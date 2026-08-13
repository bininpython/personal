'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CalendarClock,
  CheckCircle2,
  CloudOff,
  CloudUpload,
  Clock3,
  Download,
  Dumbbell,
  Loader2,
  PlayCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  SkipForward,
  Star,
  Target,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import {
  completedSetKeysFromQueue,
  enqueueWorkoutCompletion,
  queuedWorkoutDayIds,
  readWorkoutQueue,
  recordWorkoutQueueAttempt,
  removeWorkoutCompletion,
  writeWorkoutQueue,
  type QueuedWorkoutCompletion,
  type WorkoutCompletionPayload,
} from '@/lib/workouts/offline-queue';

interface StudentExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscle: string;
  instructions: string;
  videoUrl: string | null;
  sets: number;
  reps: string;
  restTime: number;
  method: string;
  lastPerformance: {
    sets: number;
    repetitions: number | null;
    load: number | null;
    rpe: number | null;
    completedAt: string | null;
  } | null;
}

interface WorkoutDay {
  id: string;
  label: string;
  name: string;
  weeklyAllowance: number;
  weeklyCompletions: number;
  completedThisWeek: boolean;
  completedToday: boolean;
  lastCompletedAt: string | null;
  exercises: StudentExercise[];
}

interface WorkoutPlan {
  id: string;
  name: string;
  goal: string;
  daysPerWeek: number;
  startDate: string | null;
  endDate: string | null;
  isExpired: boolean;
  updatedAt: string;
  week: {
    currentDate: string;
    startDate: string;
    endDate: string;
    target: number;
    completed: number;
    isComplete: boolean;
    nextWorkoutDayId: string | null;
  };
  days: WorkoutDay[];
}

interface RestTimerState {
  exerciseId: string;
  exerciseName: string;
  nextSet: number;
  totalSeconds: number;
  remainingSeconds: number;
  endsAt: number;
}

interface SetPerformance {
  repetitions: string;
  load: string;
  rpe: string;
}

interface SavedWorkoutProgress {
  completedSets: string[];
  setDetails: Record<string, SetPerformance>;
  startedAtByDay: Record<string, number>;
  clientSessionByDay: Record<string, string>;
}

interface WorkoutResponse {
  plan?: WorkoutPlan | null;
  error?: string;
}

interface WorkoutCompletionResponse {
  error?: string;
  alreadyCompletedToday?: boolean;
  alreadyCompletedThisWeek?: boolean;
}

class WorkoutSubmissionError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
    this.name = 'WorkoutSubmissionError';
  }
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Peito',
  'upper-back': 'Costas',
  'lower-back': 'Lombar',
  trapezius: 'Trapézio',
  'front-deltoids': 'Ombros',
  'back-deltoids': 'Ombro posterior',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearm: 'Antebraço',
  abs: 'Abdômen',
  obliques: 'Oblíquos',
  neck: 'Pescoço',
  quadriceps: 'Quadríceps',
  hamstring: 'Posterior de coxa',
  adductor: 'Adutores',
  abductors: 'Abdutores',
  gluteal: 'Glúteos',
  calves: 'Panturrilhas',
};

function progressStorageKey(planId: string, weekStart: string, currentDate: string) {
  return `dkong-workout-progress:${planId}:${weekStart}:${currentDate}`;
}

function legacyProgressStorageKey(planId: string, weekStart: string, currentDate: string) {
  return `fitcontrol-workout-progress:${planId}:${weekStart}:${currentDate}`;
}

function currentTimestamp() {
  return Date.now();
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
}

async function submitWorkoutCompletion(payload: WorkoutCompletionPayload) {
  let response: Response;
  try {
    response = await fetch('/api/workout-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new WorkoutSubmissionError('Sem conexão com o servidor.', true);
  }

  const data = await response.json().catch(() => ({})) as WorkoutCompletionResponse;
  if (!response.ok) {
    const retryable = response.status === 401 || response.status === 408 || response.status === 429 || response.status >= 500;
    throw new WorkoutSubmissionError(data.error || 'Não foi possível concluir o treino.', retryable);
  }
  return data;
}

function playRestFinishedSound(audioContext: AudioContext | null) {
  if (!audioContext || audioContext.state === 'closed') return;
  void audioContext.resume().then(() => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(740, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(980, audioContext.currentTime + 0.18);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.32);
  }).catch(() => undefined);
}

function notifyRestFinished(exerciseName: string, audioContext: AudioContext | null) {
  if ('vibrate' in navigator) navigator.vibrate([180, 100, 180]);
  playRestFinishedSound(audioContext);
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
    try {
      new Notification('Descanso finalizado', { body: `${exerciseName}: próxima série liberada.` });
    } catch {
      // Alguns navegadores móveis exigem Service Worker até para notificações locais.
    }
  }
  toast.success(`Descanso finalizado para ${exerciseName}. Próxima série liberada!`);
}

export default function StudentWorkoutPage() {
  const { user } = useAuth();
  const studentId = user?.id ?? '';
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedDayId, setSelectedDayId] = useState('');
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());
  const [setDetails, setSetDetails] = useState<Record<string, SetPerformance>>({});
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [completingWorkout, setCompletingWorkout] = useState(false);
  const [recordedDays, setRecordedDays] = useState<Set<string>>(new Set());
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null);
  const [restAnnouncement, setRestAnnouncement] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [queuedWorkoutCount, setQueuedWorkoutCount] = useState(0);
  const [pendingDays, setPendingDays] = useState<Set<string>>(new Set());
  const [syncingQueuedWorkouts, setSyncingQueuedWorkouts] = useState(false);
  const [queueError, setQueueError] = useState('');
  const currentPlanCycleId = useRef('');
  const workoutStartedAtByDay = useRef<Record<string, number>>({});
  const clientSessionByDay = useRef<Record<string, string>>({});
  const queueSyncInProgress = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);

  const loadPlan = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch('/api/workout-plans', { cache: 'no-store' });
      const data = await response.json() as WorkoutResponse;
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar sua ficha.');

      const nextPlan = data.plan ?? null;
      if (nextPlan) {
        const queuedWorkouts = studentId ? readWorkoutQueue(window.localStorage, studentId) : [];
        const queuedDays = queuedWorkoutDayIds(queuedWorkouts, nextPlan.id);
        const queuedCompletedSets = completedSetKeysFromQueue(queuedWorkouts, nextPlan.id);
        setQueuedWorkoutCount(queuedWorkouts.length);
        setPendingDays(queuedDays);
        const nextCycleId = `${nextPlan.id}:${nextPlan.week.startDate}:${nextPlan.week.currentDate}`;
        const recorded = new Set(
          nextPlan.days.filter((day) => day.completedThisWeek || day.completedToday).map((day) => day.id),
        );
        const serverCompletedSets = nextPlan.days.flatMap((day) => (
          day.completedThisWeek || day.completedToday
            ? day.exercises.flatMap((exercise) => (
              Array.from({ length: exercise.sets }, (_, setIndex) => `${exercise.id}:${setIndex}`)
            ))
            : []
        ));
        setRecordedDays(recorded);

        if (currentPlanCycleId.current !== nextCycleId) {
          currentPlanCycleId.current = nextCycleId;
          const requestedDayId = new URLSearchParams(window.location.search).get('day');
          const initialDayId =
            requestedDayId && nextPlan.days.some((day) => day.id === requestedDayId)
              ? requestedDayId
              : (nextPlan.week.nextWorkoutDayId ?? nextPlan.days[0]?.id ?? '');
          setSelectedDayId(initialDayId);
          try {
            const key = progressStorageKey(nextPlan.id, nextPlan.week.startDate, nextPlan.week.currentDate);
            const legacyKey = legacyProgressStorageKey(nextPlan.id, nextPlan.week.startDate, nextPlan.week.currentDate);
            const saved = window.localStorage.getItem(key) ?? window.localStorage.getItem(legacyKey);
            if (saved && !window.localStorage.getItem(key)) window.localStorage.setItem(key, saved);
            const decoded = saved ? JSON.parse(saved) as SavedWorkoutProgress | string[] : [];
            const savedSets = Array.isArray(decoded) ? decoded : decoded.completedSets;
            if (!Array.isArray(decoded)) {
              setSetDetails(decoded.setDetails || {});
              workoutStartedAtByDay.current = decoded.startedAtByDay || {};
              clientSessionByDay.current = decoded.clientSessionByDay || {};
            }
            setCompletedSets(new Set([...savedSets, ...serverCompletedSets, ...queuedCompletedSets]));
          } catch {
            setCompletedSets(new Set([...serverCompletedSets, ...queuedCompletedSets]));
          }
          if (initialDayId && !workoutStartedAtByDay.current[initialDayId]) {
            workoutStartedAtByDay.current[initialDayId] = currentTimestamp();
            clientSessionByDay.current[initialDayId] = crypto.randomUUID();
          }
        } else {
          setCompletedSets((current) => new Set([...current, ...serverCompletedSets, ...queuedCompletedSets]));
          setSelectedDayId((current) => (
            nextPlan.days.some((day) => day.id === current)
              ? current
              : (nextPlan.week.nextWorkoutDayId ?? nextPlan.days[0]?.id ?? '')
          ));
        }
      } else if (!nextPlan) {
        const queuedWorkouts = studentId ? readWorkoutQueue(window.localStorage, studentId) : [];
        currentPlanCycleId.current = '';
        setSelectedDayId('');
        setCompletedSets(new Set());
        setSetDetails({});
        setRecordedDays(new Set());
        setQueuedWorkoutCount(queuedWorkouts.length);
        setPendingDays(new Set(queuedWorkouts.map((item) => item.workoutDayId)));
      }
      setPlan(nextPlan);
      setError('');
      setLastSync(new Date());
    } catch (loadError) {
      console.error('[Student Workout] Load error:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar sua ficha.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId]);

  const flushQueuedWorkouts = useCallback(async (showConfirmation = true) => {
    if (!studentId || queueSyncInProgress.current) return;
    let queue = readWorkoutQueue(window.localStorage, studentId);
    setQueuedWorkoutCount(queue.length);
    setPendingDays(new Set(queue.map((item) => item.workoutDayId)));
    if (queue.length === 0 || !navigator.onLine) return;

    queueSyncInProgress.current = true;
    setSyncingQueuedWorkouts(true);
    setQueueError('');
    let synced = 0;

    try {
      for (const item of [...queue]) {
        try {
          await submitWorkoutCompletion(item.payload);
          queue = removeWorkoutCompletion(queue, item.payload.clientSessionId);
          setRecordedDays((current) => new Set(current).add(item.workoutDayId));
          synced += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Não foi possível sincronizar o treino.';
          queue = recordWorkoutQueueAttempt(queue, item.payload.clientSessionId, message);
          setQueueError(message);
          break;
        }
      }

      writeWorkoutQueue(window.localStorage, studentId, queue);
      setQueuedWorkoutCount(queue.length);
      setPendingDays(new Set(queue.map((item) => item.workoutDayId)));
      if (synced > 0 && showConfirmation) {
        toast.success(synced === 1 ? 'Treino sincronizado com sucesso!' : `${synced} treinos sincronizados com sucesso!`);
      }
    } finally {
      queueSyncInProgress.current = false;
      setSyncingQueuedWorkouts(false);
    }
  }, [studentId]);

  useEffect(() => {
    const syncAndLoad = async (silent: boolean, showConfirmation: boolean) => {
      await flushQueuedWorkouts(showConfirmation);
      await loadPlan(silent);
    };
    const initialLoad = window.setTimeout(() => {
      setIsOnline(navigator.onLine);
      void syncAndLoad(false, false);
    }, 0);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void syncAndLoad(true, false);
    };
    const handleOnline = () => {
      setIsOnline(true);
      void syncAndLoad(true, true);
    };
    const handleOffline = () => setIsOnline(false);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.clearTimeout(initialLoad);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushQueuedWorkouts, loadPlan]);

  useEffect(() => {
    if (!plan) return;
    window.localStorage.setItem(
      progressStorageKey(plan.id, plan.week.startDate, plan.week.currentDate),
      JSON.stringify({
        completedSets: [...completedSets],
        setDetails,
        startedAtByDay: workoutStartedAtByDay.current,
        clientSessionByDay: clientSessionByDay.current,
      } satisfies SavedWorkoutProgress),
    );
  }, [completedSets, setDetails, plan]);

  useEffect(() => () => {
    if (audioContext.current && audioContext.current.state !== 'closed') {
      void audioContext.current.close();
    }
  }, []);

  const restTimerActive = restTimer !== null;
  useEffect(() => {
    if (!restTimerActive) return;
    const interval = window.setInterval(() => {
      setRestTimer((current) => current ? {
        ...current,
        remainingSeconds: Math.max(0, Math.ceil((current.endsAt - Date.now()) / 1000)),
      } : null);
    }, 250);
    return () => window.clearInterval(interval);
  }, [restTimerActive]);

  useEffect(() => {
    if (!restTimer || restTimer.remainingSeconds > 0) return;
    const exerciseName = restTimer.exerciseName;
    const timeout = window.setTimeout(() => {
      setRestTimer(null);
      setRestAnnouncement(`Descanso finalizado para ${exerciseName}. Próxima série liberada.`);
      notifyRestFinished(exerciseName, audioContext.current);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [restTimer]);

  useEffect(() => {
    if (!restTimerActive || !('wakeLock' in navigator)) return;
    type WakeLockSentinel = {
      released: boolean;
      release: () => Promise<void>;
      addEventListener: (type: 'release', listener: () => void) => void;
    };
    let disposed = false;
    let lock: WakeLockSentinel | null = null;
    const requestLock = async () => {
      if (disposed || lock || document.visibilityState !== 'visible') return;
      try {
        const sentinel = await (navigator as Navigator & {
          wakeLock: { request: (type: 'screen') => Promise<WakeLockSentinel> };
        }).wakeLock.request('screen');
        if (disposed) {
          await sentinel.release();
          return;
        }
        lock = sentinel;
        sentinel.addEventListener('release', () => {
          lock = null;
        });
      } catch {
        // O cronômetro continua usando o horário final mesmo sem Wake Lock.
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void requestLock();
    };
    void requestLock();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (lock) void lock.release();
    };
  }, [restTimerActive]);

  const activeDay = plan?.days.find((day) => day.id === selectedDayId) ?? plan?.days[0] ?? null;
  const suggestedDay = plan?.days.find((day) => day.id === plan.week.nextWorkoutDayId) ?? null;
  const totalSets = activeDay?.exercises.reduce((total, exercise) => total + exercise.sets, 0) ?? 0;
  const completedInDay = useMemo(() => {
    if (!activeDay) return 0;
    return activeDay.exercises.reduce((total, exercise) => {
      let exerciseCompleted = 0;
      for (let index = 0; index < exercise.sets; index += 1) {
        if (completedSets.has(`${exercise.id}:${index}`)) exerciseCompleted += 1;
      }
      return total + exerciseCompleted;
    }, 0);
  }, [activeDay, completedSets]);
  const progress = totalSets > 0 ? Math.round((completedInDay / totalSets) * 100) : 0;
  const activeDayPending = Boolean(activeDay && pendingDays.has(activeDay.id));
  const activeDayCompleted = Boolean(activeDay && (recordedDays.has(activeDay.id) || activeDayPending));

  function selectWorkoutDay(dayId: string) {
    setSelectedDayId(dayId);
    if (!workoutStartedAtByDay.current[dayId]) {
      workoutStartedAtByDay.current[dayId] = currentTimestamp();
      clientSessionByDay.current[dayId] = crypto.randomUUID();
    }
    setRating(0);
    setFeedback('');
  }

  function toggleSet(exerciseId: string, setIndex: number) {
    if (activeDayCompleted) return;
    const key = `${exerciseId}:${setIndex}`;
    const wasChecked = completedSets.has(key);
    if (!wasChecked) {
      const AudioContextConstructor = window.AudioContext
        || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!audioContext.current && AudioContextConstructor) {
        audioContext.current = new AudioContextConstructor();
      }
      if (audioContext.current?.state === 'suspended') void audioContext.current.resume();
      const exercise = activeDay?.exercises.find((item) => item.id === exerciseId);
      setSetDetails((current) => ({
        ...current,
        [key]: current[key] || {
          repetitions: exercise?.lastPerformance?.repetitions !== null && exercise?.lastPerformance?.repetitions !== undefined
            ? String(exercise.lastPerformance.repetitions)
            : exercise && /^\d+$/.test(exercise.reps) ? exercise.reps : '',
          load: exercise?.lastPerformance?.load !== null && exercise?.lastPerformance?.load !== undefined ? String(exercise.lastPerformance.load) : '',
          rpe: exercise?.lastPerformance?.rpe !== null && exercise?.lastPerformance?.rpe !== undefined ? String(exercise.lastPerformance.rpe) : '',
        },
      }));
    }
    setCompletedSets((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

    if (!wasChecked) {
      const exercise = activeDay?.exercises.find((item) => item.id === exerciseId);
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') void Notification.requestPermission();
      if (exercise && setIndex < exercise.sets - 1 && exercise.restTime > 0) {
        setRestTimer({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          nextSet: setIndex + 2,
          totalSeconds: exercise.restTime,
          remainingSeconds: exercise.restTime,
          endsAt: currentTimestamp() + exercise.restTime * 1000,
        });
      }
    }
  }

  function updateSetDetail(key: string, field: keyof SetPerformance, value: string) {
    const sanitized = field === 'load'
      ? value.replace(',', '.').replace(/[^0-9.]/g, '')
      : value.replace(/\D/g, '');
    setSetDetails((current) => ({
      ...current,
      [key]: {
        repetitions: current[key]?.repetitions || '',
        load: current[key]?.load || '',
        rpe: current[key]?.rpe || '',
        [field]: sanitized,
      },
    }));
  }

  function resetDay() {
    if (!activeDay || activeDayCompleted) return;
    const exerciseIds = new Set(activeDay.exercises.map((exercise) => exercise.id));
    setCompletedSets((current) => new Set(
      [...current].filter((key) => !exerciseIds.has(key.split(':')[0])),
    ));
    setSetDetails((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => !exerciseIds.has(key.split(':')[0])),
    ));
    if (restTimer && exerciseIds.has(restTimer.exerciseId)) setRestTimer(null);
  }

  function addRestTime() {
    setRestTimer((current) => current ? {
      ...current,
      totalSeconds: current.totalSeconds + 15,
      remainingSeconds: current.remainingSeconds + 15,
      endsAt: current.endsAt + 15_000,
    } : null);
  }

  async function completeWorkout() {
    if (!activeDay || !plan || progress < 100) return;
    setCompletingWorkout(true);
    const completedAt = currentTimestamp();
    const startedAt = workoutStartedAtByDay.current[activeDay.id] ?? completedAt;
    const clientSessionId = clientSessionByDay.current[activeDay.id] || crypto.randomUUID();
    clientSessionByDay.current[activeDay.id] = clientSessionId;
    const payload: WorkoutCompletionPayload = {
      workoutDayId: activeDay.id,
      clientSessionId,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      durationSeconds: Math.min(21_600, Math.max(0, Math.round((completedAt - startedAt) / 1000))),
      exercises: activeDay.exercises.map((exercise) => ({
        workoutExerciseId: exercise.id,
        sets: Array.from({ length: exercise.sets }, (_, setIndex) => {
          const key = `${exercise.id}:${setIndex}`;
          const details = setDetails[key];
          const hasRepetitions = details?.repetitions !== undefined && details.repetitions !== '';
          const hasLoad = details?.load !== undefined && details.load !== '';
          const hasRpe = details?.rpe !== undefined && details.rpe !== '';
          return {
            setNumber: setIndex + 1,
            completed: completedSets.has(key),
            ...(hasRepetitions ? { performedRepetitions: Math.floor(Number(details.repetitions)) } : {}),
            ...(hasLoad ? { performedLoad: Number(details.load) } : {}),
            ...(hasRpe ? { rpe: Math.min(10, Math.max(1, Math.floor(Number(details.rpe)))) } : {}),
          };
        }),
      })),
      ...(rating > 0 ? { rating } : {}),
      ...(feedback.trim() ? { feedback: feedback.trim() } : {}),
    };

    const closeCompletedWorkout = () => {
      delete workoutStartedAtByDay.current[activeDay.id];
      delete clientSessionByDay.current[activeDay.id];
      setRestTimer(null);
    };

    try {
      if (!navigator.onLine) throw new WorkoutSubmissionError('Sem conexão com o servidor.', true);
      const data = await submitWorkoutCompletion(payload);
      setRecordedDays((current) => new Set(current).add(activeDay.id));
      closeCompletedWorkout();
      if (data.alreadyCompletedToday) toast.info('Este treino já foi registrado hoje.');
      else if (data.alreadyCompletedThisWeek) toast.info('Este treino já atingiu a meta desta semana.');
      else toast.success('Treino concluído e salvo no histórico!');
      await loadPlan(true);
    } catch (completeError) {
      const retryable = completeError instanceof WorkoutSubmissionError && completeError.retryable;
      if (!retryable || !studentId) {
        toast.error(completeError instanceof Error ? completeError.message : 'Não foi possível concluir o treino.');
        return;
      }

      try {
        const queuedItem: QueuedWorkoutCompletion = {
          planId: plan.id,
          workoutDayId: activeDay.id,
          queuedAt: payload.completedAt,
          attempts: 0,
          payload,
        };
        const queue = enqueueWorkoutCompletion(
          readWorkoutQueue(window.localStorage, studentId),
          queuedItem,
        );
        writeWorkoutQueue(window.localStorage, studentId, queue);
        setQueuedWorkoutCount(queue.length);
        setPendingDays(new Set(queue.map((item) => item.workoutDayId)));
        setQueueError('');
        setIsOnline(navigator.onLine);
        closeCompletedWorkout();
        toast.info('Treino salvo no aparelho. O envio será automático quando a conexão voltar.');
      } catch {
        toast.error('Não foi possível guardar o treino neste aparelho. Não feche esta tela e tente novamente.');
      }
    } finally {
      setCompletingWorkout(false);
    }
  }

  async function syncPendingWorkoutsNow() {
    await flushQueuedWorkouts(true);
    await loadPlan(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-6 animate-spin" /> Carregando sua ficha...
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
        <Dumbbell className="mb-4 size-12 text-muted-foreground/40" />
        <h1 className="text-xl font-bold">Não foi possível abrir sua ficha</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-5" onClick={() => void loadPlan()}>
          <RefreshCw className="mr-2 size-4" /> Tentar novamente
        </Button>
      </div>
    );
  }

  if (!plan || plan.days.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 rounded-full bg-muted p-5">
          <Dumbbell className="size-10 text-muted-foreground/50" />
        </div>
        <h1 className="text-xl font-bold">Sua ficha ainda não foi publicada</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Assim que o personal publicar seu treino, ele aparecerá automaticamente nesta tela.
        </p>
        <Button variant="outline" className="mt-5" onClick={() => void loadPlan(true)} disabled={refreshing}>
          <RefreshCw className={`mr-2 size-4 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar agora
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12 animate-fade-in">
      <p className="sr-only" aria-live="assertive">{restAnnouncement}</p>
      <div className="dk-hero-panel p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="dk-kicker text-[#c9ff32]">
              {isOnline ? 'Ficha sincronizada com seu personal' : 'Modo academia sem conexão'}
            </div>
            <h1 className="dk-display mt-5 text-3xl sm:text-4xl">{plan.name}</h1>
            <p className="mt-2 text-sm text-white/70">{plan.goal}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              nativeButton={false}
              variant="secondary"
              size="sm"
              render={<a href={`/api/workout-plans/${plan.id}/pdf`} download />}
              className="border border-white/15 bg-white/10 text-white hover:bg-white/20"
            >
              <Download className="mr-2 size-3.5" /> Baixar PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void loadPlan(true)}
              disabled={refreshing}
              className="border border-white/15 bg-white/10 text-white hover:bg-white/20"
            >
              <RefreshCw className={`mr-2 size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-4">
            <Target className="mb-1 size-4 text-[#c9ff32]" />
            <p className="text-lg font-bold">{plan.daysPerWeek}x</p>
            <p className="text-[11px] text-white/65">por semana</p>
          </div>
          <div className="rounded-2xl bg-[#c9ff32] p-4 text-black">
            <Dumbbell className="mb-1 size-4" />
            <p className="text-lg font-bold">{plan.days.length}</p>
            <p className="text-[11px] text-black/65">treinos diferentes</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-white/12 bg-white/[0.06] p-4 sm:col-span-1">
            <CheckCircle2 className="mb-1 size-4 text-[#c9ff32]" />
            <p className="text-sm font-bold">{plan.week.completed}/{plan.week.target} na semana</p>
            <p className="text-[11px] text-white/65">
              {plan.week.isComplete ? 'Ciclo semanal concluído' : lastSync ? `Atualizado às ${lastSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Sincronização ativa'}
            </p>
          </div>
        </div>
      </div>

      {(!isOnline || queuedWorkoutCount > 0) && (
        <div
          role="status"
          aria-live="polite"
          className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${isOnline ? 'border-warn/30 bg-warn-wash' : 'border-border bg-card'}`}
        >
          <div className="flex items-start gap-3">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${isOnline ? 'bg-warn/15 text-warn' : 'bg-muted text-muted-foreground'}`}>
              {isOnline ? <CloudUpload className="size-5" /> : <CloudOff className="size-5" />}
            </div>
            <div>
              <p className="font-semibold">
                {!isOnline
                  ? 'Você está sem conexão'
                  : syncingQueuedWorkouts
                    ? 'Enviando treino salvo no aparelho'
                    : `${queuedWorkoutCount} treino(s) aguardando envio`}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {!isOnline
                  ? 'Pode continuar treinando. Seu progresso fica neste aparelho e será enviado automaticamente.'
                  : queueError || 'A conexão voltou; você pode sincronizar agora.'}
              </p>
            </div>
          </div>
          {isOnline && queuedWorkoutCount > 0 && (
            <Button type="button" variant="outline" onClick={() => void syncPendingWorkoutsNow()} disabled={syncingQueuedWorkouts}>
              {syncingQueuedWorkouts
                ? <Loader2 className="mr-2 size-4 animate-spin" />
                : <CloudUpload className="mr-2 size-4" />}
              Sincronizar agora
            </Button>
          )}
        </div>
      )}

      {plan.isExpired && (
        <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn-wash p-4 text-sm">
          <CalendarClock className="mt-0.5 size-5 shrink-0 text-warn" />
          <div>
            <p className="font-semibold text-warn">O prazo desta ficha terminou</p>
            <p className="mt-1 text-muted-foreground">
              Ela continua disponível para consulta e execução. Seu personal recebeu um alerta para revisar ou renovar o treino.
            </p>
          </div>
        </div>
      )}

      <Card className={plan.week.isComplete ? 'border-[#9fdb00]/30 bg-[#c9ff32]/10' : ''}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{plan.week.isComplete ? 'Semana concluída!' : 'Seu ciclo desta semana'}</p>
              <p className="text-xs text-muted-foreground">
                {plan.week.isComplete
                  ? 'Os treinos serão liberados novamente na próxima segunda-feira.'
                  : `${plan.week.completed} de ${plan.week.target} treino(s) concluído(s). Continue pelo treino destacado.`}
              </p>
            </div>
            <span className="text-2xl font-black text-[#668f00]">{Math.min(100, Math.round((plan.week.completed / Math.max(1, plan.week.target)) * 100))}%</span>
          </div>
          <Progress value={(plan.week.completed / Math.max(1, plan.week.target)) * 100} className="mt-3" />
        </CardContent>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {plan.days.map((day) => (
          <button
            type="button"
            key={day.id}
            onClick={() => selectWorkoutDay(day.id)}
            className={`relative min-w-[130px] rounded-xl border px-4 py-3 text-left transition-colors ${
              activeDay?.id === day.id
                ? 'border-black bg-black text-[#c9ff32] shadow-sm dark:border-[#c9ff32] dark:bg-[#c9ff32] dark:text-black'
                : day.completedThisWeek
                  ? 'border-ok/40 bg-ok-wash'
                : 'border-border bg-card hover:border-[#9fdb00]'
            }`}
          >
            {pendingDays.has(day.id)
              ? <CloudUpload className={`absolute right-2 top-2 size-4 ${activeDay?.id === day.id ? 'text-white' : 'text-warn'}`} />
              : day.completedThisWeek && <CheckCircle2 className={`absolute right-2 top-2 size-4 ${activeDay?.id === day.id ? 'text-white' : 'text-ok'}`} />}
            <span className="block text-[10px] font-bold uppercase opacity-75">Treino {day.label}</span>
            <span className="mt-0.5 block truncate text-sm font-semibold">{day.name}</span>
            <span className="mt-1 block text-[10px] opacity-70">
              {pendingDays.has(day.id) ? 'Aguardando envio' : `${day.weeklyCompletions}/${day.weeklyAllowance} nesta semana`}
            </span>
          </button>
        ))}
      </div>

      {activeDay && (
        <>
          <Card className="border-border/60">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Progresso de hoje</p>
                  <p className="text-xs text-muted-foreground">
                    {activeDayPending
                      ? 'Treino completo e guardado com segurança neste aparelho'
                      : activeDayCompleted
                        ? activeDay.completedThisWeek
                          ? 'Meta deste treino concluída na semana'
                          : 'Treino concluído hoje; a próxima repetição será em outro dia'
                        : `${completedInDay} de ${totalSets} séries concluídas neste treino`}
                  </p>
                </div>
                <span className="text-2xl font-black text-[#668f00]">{progress}%</span>
              </div>
              <Progress value={progress} className="mt-3" />
              {progress > 0 && !activeDayCompleted && (
                <Button variant="ghost" size="sm" onClick={resetDay} className="mt-2 h-7 px-2 text-xs text-muted-foreground">
                  <RotateCcw className="mr-1.5 size-3" /> Reiniciar marcações
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {activeDay.exercises.map((exercise, exerciseIndex) => {
              const completedCount = Array.from({ length: exercise.sets }).filter((_, setIndex) => (
                completedSets.has(`${exercise.id}:${setIndex}`)
              )).length;
              const isComplete = completedCount === exercise.sets;
              const nextSetIndex = Array.from({ length: exercise.sets }).findIndex((_, setIndex) => (
                !completedSets.has(`${exercise.id}:${setIndex}`)
              ));

              return (
                <Card id={`exercise-${exercise.id}`} key={exercise.id} className={`scroll-mt-24 overflow-hidden border-border/60 ${isComplete ? 'border-ok/40 bg-ok-wash' : ''} ${activeDayCompleted ? 'opacity-80' : ''}`}>
                  <CardHeader className="border-b border-border/40 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isComplete ? 'bg-[#9fdb00] text-black' : 'bg-black text-[#c9ff32] dark:bg-[#c9ff32] dark:text-black'}`}>
                          {isComplete ? <Check className="size-4" /> : exerciseIndex + 1}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base leading-tight">{exercise.name}</CardTitle>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {exercise.muscle && <Badge variant="outline">{MUSCLE_LABELS[exercise.muscle] || exercise.muscle}</Badge>}
                            <Badge variant="secondary">{exercise.sets} × {exercise.reps}</Badge>
                            <Badge variant="secondary"><Clock3 className="mr-1 size-3" /> {exercise.restTime}s</Badge>
                          </div>
                          {exercise.lastPerformance && (
                            <div className="mt-3 rounded-xl border border-[#9fdb00]/25 bg-[#c9ff32]/10 px-3 py-2 text-xs">
                              <span className="font-black text-[#668f00]">Última vez:</span>{' '}
                              <strong>{exercise.lastPerformance.sets}×{exercise.lastPerformance.repetitions ?? '—'}</strong>
                              {exercise.lastPerformance.load !== null && <> com <strong>{exercise.lastPerformance.load} kg</strong></>}
                              {exercise.lastPerformance.rpe !== null && <> · RPE {exercise.lastPerformance.rpe}</>}
                            </div>
                          )}
                        </div>
                      </div>
                      {exercise.videoUrl && (
                        <Button type="button" size="icon" variant="outline" onClick={() => setPlayingVideo(exercise.videoUrl)}>
                          <PlayCircle className="size-4 text-danger" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    {exercise.instructions && (
                      <p className="text-sm leading-relaxed text-muted-foreground">{exercise.instructions}</p>
                    )}
                    {exercise.method && (
                      <div className="rounded-lg border border-warn/25 bg-warn-wash px-3 py-2 text-sm">
                        <span className="font-semibold">Orientação do personal:</span> {exercise.method}
                      </div>
                    )}
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        {activeDayPending
                          ? 'Séries salvas neste aparelho e aguardando envio'
                          : activeDayCompleted
                            ? 'Séries registradas no histórico desta semana'
                          : `Marque ao terminar cada série${exercise.restTime > 0 ? ` — descanso automático de ${exercise.restTime}s` : ''}`}
                      </p>
                      <div className="space-y-2">
                        {Array.from({ length: exercise.sets }).map((_, setIndex) => {
                          const key = `${exercise.id}:${setIndex}`;
                          const checked = completedSets.has(key);
                          const details = setDetails[key] || { repetitions: '', load: '', rpe: '' };
                          return (
                            <div key={setIndex} className="grid grid-cols-[minmax(72px,1fr)_64px_64px_58px] items-end gap-1.5 rounded-xl border border-border/60 p-2 sm:grid-cols-[minmax(110px,1fr)_78px_78px_64px] sm:gap-2">
                              <button
                                type="button"
                                disabled={activeDayCompleted}
                                onClick={() => toggleSet(exercise.id, setIndex)}
                                className={`flex min-h-11 items-center justify-center gap-1 rounded-xl border px-1.5 text-xs font-bold transition-colors sm:gap-2 sm:px-2 sm:text-sm ${checked ? 'border-[#9fdb00] bg-[#9fdb00] text-black' : setIndex === nextSetIndex ? 'border-black bg-black/[0.06] text-black dark:border-[#c9ff32] dark:bg-[#c9ff32]/10 dark:text-[#c9ff32]' : 'border-border bg-background hover:border-[#9fdb00]'}`}
                              >
                                {checked ? <CheckCircle2 className="size-4" /> : <span className="flex size-5 items-center justify-center rounded-full border text-[10px]">{setIndex + 1}</span>}
                                Série {setIndex + 1}
                              </button>
                              <label className="text-[11px] text-muted-foreground">Reps
                                <Input aria-label={`Repetições da série ${setIndex + 1}`} inputMode="numeric" className="mt-1 h-9 px-2" disabled={activeDayCompleted} placeholder={exercise.reps} value={details.repetitions} onChange={(event) => updateSetDetail(key, 'repetitions', event.target.value)} />
                              </label>
                              <label className="text-[11px] text-muted-foreground">Carga
                                <Input aria-label={`Carga da série ${setIndex + 1}`} inputMode="decimal" className="mt-1 h-9 px-2" disabled={activeDayCompleted} placeholder="0" value={details.load} onChange={(event) => updateSetDetail(key, 'load', event.target.value)} />
                              </label>
                              <label className="text-[11px] text-muted-foreground">RPE
                                <Input aria-label={`RPE da série ${setIndex + 1}`} inputMode="numeric" className="mt-1 h-9 px-2" disabled={activeDayCompleted} placeholder="1-10" value={details.rpe} onChange={(event) => updateSetDetail(key, 'rpe', event.target.value)} />
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {progress === 100 && (
            <Card className={activeDayPending ? 'border-warn/30 bg-warn-wash' : 'border-ok/30 bg-ok-wash'}>
              <CardContent className="p-5 text-center">
                {activeDayPending ? <CloudUpload className="mx-auto mb-2 size-9 text-warn" /> : <CheckCircle2 className="mx-auto mb-2 size-9 text-ok" />}
                {activeDayPending ? <>
                  <h2 className="font-bold">Treino salvo neste aparelho</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    As séries, cargas e sua avaliação estão seguras. O histórico será atualizado assim que o envio terminar.
                  </p>
                  {isOnline && (
                    <Button className="mt-4" variant="outline" onClick={() => void syncPendingWorkoutsNow()} disabled={syncingQueuedWorkouts}>
                      {syncingQueuedWorkouts ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CloudUpload className="mr-2 size-4" />}
                      Sincronizar agora
                    </Button>
                  )}
                </> : activeDayCompleted ? <>
                  <h2 className="font-bold">{activeDay.completedThisWeek ? 'Meta deste treino concluída na semana' : 'Treino concluído hoje'}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">O resultado está salvo no histórico e na evolução.</p>
                  {suggestedDay && suggestedDay.id !== activeDay.id && <Button className="mt-4" onClick={() => selectWorkoutDay(suggestedDay.id)}><Dumbbell className="mr-2 size-4" /> Ir para {suggestedDay.name}</Button>}
                  {!suggestedDay && <Badge className="mt-4 bg-ok-wash text-ok">Ciclo semanal completo</Badge>}
                </> : <>
                  <h2 className="font-bold">Todas as séries foram marcadas</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isOnline
                      ? 'Conclua para registrar este treino no histórico e na evolução.'
                      : 'Sem internet? Tudo bem: o treino será guardado neste aparelho.'}
                  </p>
                  <div className="mx-auto mt-4 max-w-sm space-y-3">
                    <div className="flex justify-center gap-1" aria-label="Avaliação do treino">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className="flex size-11 items-center justify-center rounded-full" onClick={() => setRating(value)} aria-label={`${value} estrela(s)`}><Star className={`size-6 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} /></button>)}</div>
                    <Textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} maxLength={1000} rows={2} placeholder="Como foi o treino? Dificuldade, dor ou observação (opcional)" />
                  </div>
                  <Button className="mt-4 bg-black text-white hover:bg-black/80 dark:bg-[#c9ff32] dark:text-black" onClick={() => void completeWorkout()} disabled={completingWorkout}>
                    {completingWorkout && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {isOnline ? 'Concluir e salvar treino' : 'Salvar treino no aparelho'}
                  </Button>
                </>}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {restTimer && (
        <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-[#9fdb00]/40 bg-background/95 p-4 shadow-2xl backdrop-blur lg:bottom-6">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#c9ff32] text-black"><Timer className="size-6" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-[#668f00]">Tempo de descanso</p><p className="truncate font-semibold">{restTimer.exerciseName} · próxima série {restTimer.nextSet}</p></div><strong className="font-mono text-2xl text-[#668f00]">{formatCountdown(restTimer.remainingSeconds)}</strong></div>
              <Progress value={((restTimer.totalSeconds - restTimer.remainingSeconds) / Math.max(1, restTimer.totalSeconds)) * 100} className="mt-2 h-2" />
              <div className="mt-3 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={addRestTime}><Plus className="mr-1 size-3.5" /> 15s</Button><Button type="button" size="sm" variant="ghost" onClick={() => setRestTimer(null)}><SkipForward className="mr-1 size-3.5" /> Pular descanso</Button></div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={Boolean(playingVideo)} onOpenChange={(open) => !open && setPlayingVideo(null)}>
        <DialogContent className="overflow-hidden border-zinc-800 bg-black p-0 sm:max-w-3xl">
          <DialogTitle className="sr-only">Vídeo de execução do exercício</DialogTitle>
          <div className="aspect-video w-full bg-black">
            {playingVideo && <video src={playingVideo} controls autoPlay playsInline className="size-full object-contain" />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
