'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CalendarClock,
  CheckCircle2,
  Clock3,
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

function notifyRestFinished(exerciseName: string) {
  if ('vibrate' in navigator) navigator.vibrate([180, 100, 180]);
  toast.success(`Descanso finalizado para ${exerciseName}. Próxima série liberada!`);
}

export default function StudentWorkoutPage() {
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
  const currentPlanCycleId = useRef('');
  const workoutStartedAtByDay = useRef<Record<string, number>>({});
  const clientSessionByDay = useRef<Record<string, string>>({});

  const loadPlan = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch('/api/workout-plans', { cache: 'no-store' });
      const data = await response.json() as WorkoutResponse;
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar sua ficha.');

      const nextPlan = data.plan ?? null;
      if (nextPlan) {
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
            const saved = window.localStorage.getItem(progressStorageKey(nextPlan.id, nextPlan.week.startDate, nextPlan.week.currentDate));
            const decoded = saved ? JSON.parse(saved) as SavedWorkoutProgress | string[] : [];
            const savedSets = Array.isArray(decoded) ? decoded : decoded.completedSets;
            if (!Array.isArray(decoded)) {
              setSetDetails(decoded.setDetails || {});
              workoutStartedAtByDay.current = decoded.startedAtByDay || {};
              clientSessionByDay.current = decoded.clientSessionByDay || {};
            }
            setCompletedSets(new Set([...savedSets, ...serverCompletedSets]));
          } catch {
            setCompletedSets(new Set(serverCompletedSets));
          }
          if (initialDayId && !workoutStartedAtByDay.current[initialDayId]) {
            workoutStartedAtByDay.current[initialDayId] = currentTimestamp();
            clientSessionByDay.current[initialDayId] = crypto.randomUUID();
          }
        } else {
          setCompletedSets((current) => new Set([...current, ...serverCompletedSets]));
          setSelectedDayId((current) => (
            nextPlan.days.some((day) => day.id === current)
              ? current
              : (nextPlan.week.nextWorkoutDayId ?? nextPlan.days[0]?.id ?? '')
          ));
        }
      } else if (!nextPlan) {
        currentPlanCycleId.current = '';
        setSelectedDayId('');
        setCompletedSets(new Set());
        setSetDetails({});
        setRecordedDays(new Set());
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
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadPlan(), 0);

    const interval = window.setInterval(() => void loadPlan(true), 10_000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void loadPlan(true);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadPlan]);

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
      notifyRestFinished(exerciseName);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [restTimer]);

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
  const activeDayCompleted = Boolean(activeDay && recordedDays.has(activeDay.id));

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
      const exercise = activeDay?.exercises.find((item) => item.id === exerciseId);
      setSetDetails((current) => ({
        ...current,
        [key]: current[key] || {
          repetitions: exercise && /^\d+$/.test(exercise.reps) ? exercise.reps : '',
          load: '',
          rpe: '',
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
    if (!activeDay || progress < 100) return;
    setCompletingWorkout(true);
    try {
      const completedAt = currentTimestamp();
      const startedAt = workoutStartedAtByDay.current[activeDay.id] ?? completedAt;
      const clientSessionId = clientSessionByDay.current[activeDay.id] || crypto.randomUUID();
      clientSessionByDay.current[activeDay.id] = clientSessionId;
      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutDayId: activeDay.id,
          clientSessionId,
          startedAt: new Date(startedAt).toISOString(),
          durationSeconds: Math.min(21_600, Math.max(0, Math.round((completedAt - startedAt) / 1000))),
          exercises: activeDay.exercises.map((exercise) => ({
            workoutExerciseId: exercise.id,
            sets: Array.from({ length: exercise.sets }, (_, setIndex) => {
              const key = `${exercise.id}:${setIndex}`;
              const details = setDetails[key];
              return {
                setNumber: setIndex + 1,
                completed: completedSets.has(key),
                ...(details?.repetitions !== '' ? { performedRepetitions: Math.floor(Number(details.repetitions)) } : {}),
                ...(details?.load !== '' ? { performedLoad: Number(details.load) } : {}),
                ...(details?.rpe !== '' ? { rpe: Math.min(10, Math.max(1, Math.floor(Number(details.rpe)))) } : {}),
              };
            }),
          })),
          ...(rating > 0 ? { rating } : {}),
          feedback,
        }),
      });
      const data = await response.json() as {
        error?: string;
        alreadyCompletedToday?: boolean;
        alreadyCompletedThisWeek?: boolean;
      };
      if (!response.ok) throw new Error(data.error || 'Não foi possível concluir o treino.');
      setRecordedDays((current) => new Set(current).add(activeDay.id));
      delete workoutStartedAtByDay.current[activeDay.id];
      delete clientSessionByDay.current[activeDay.id];
      setRestTimer(null);
      if (data.alreadyCompletedToday) toast.info('Este treino já foi registrado hoje.');
      else if (data.alreadyCompletedThisWeek) toast.info('Este treino já atingiu a meta desta semana.');
      else toast.success('Treino concluído e salvo no histórico!');
      await loadPlan(true);
    } catch (completeError) {
      toast.error(completeError instanceof Error ? completeError.message : 'Não foi possível concluir o treino.');
    } finally {
      setCompletingWorkout(false);
    }
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
      <div className="dk-hero-panel p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="dk-kicker text-brand-accent">
              Ficha sincronizada com seu personal
            </div>
            <h1 className="dk-display mt-5 text-3xl sm:text-4xl">{plan.name}</h1>
            <p className="mt-2 text-sm text-white/50">{plan.goal}</p>
          </div>
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
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-4">
            <Target className="mb-1 size-4 text-brand-accent" />
            <p className="text-lg font-bold">{plan.daysPerWeek}x</p>
            <p className="text-[11px] text-white/45">por semana</p>
          </div>
          <div className="rounded-2xl bg-brand-accent p-4 text-black">
            <Dumbbell className="mb-1 size-4" />
            <p className="text-lg font-bold">{plan.days.length}</p>
            <p className="text-[11px] text-black/50">treinos diferentes</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-white/12 bg-white/[0.06] p-4 sm:col-span-1">
            <CheckCircle2 className="mb-1 size-4 text-brand-accent" />
            <p className="text-sm font-bold">{plan.week.completed}/{plan.week.target} na semana</p>
            <p className="text-[11px] text-white/45">
              {plan.week.isComplete ? 'Ciclo semanal concluído' : lastSync ? `Atualizado às ${lastSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Sincronização ativa'}
            </p>
          </div>
        </div>
      </div>

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

      <Card className={plan.week.isComplete ? 'border-brand-accent-deep/30 bg-brand-accent/10' : ''}>
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
            <span className="text-2xl font-black text-brand-accent-text">{Math.min(100, Math.round((plan.week.completed / Math.max(1, plan.week.target)) * 100))}%</span>
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
                ? 'border-black bg-black text-brand-accent shadow-sm dark:border-brand-accent dark:bg-brand-accent dark:text-black'
                : day.completedThisWeek
                  ? 'border-ok/40 bg-ok-wash'
                : 'border-border bg-card hover:border-brand-accent-deep'
            }`}
          >
            {day.completedThisWeek && <CheckCircle2 className={`absolute right-2 top-2 size-4 ${activeDay?.id === day.id ? 'text-white' : 'text-ok'}`} />}
            <span className="block text-[10px] font-bold uppercase opacity-75">Treino {day.label}</span>
            <span className="mt-0.5 block truncate text-sm font-semibold">{day.name}</span>
            <span className="mt-1 block text-[10px] opacity-70">{day.weeklyCompletions}/{day.weeklyAllowance} nesta semana</span>
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
                  <p className="text-xs text-muted-foreground">{activeDayCompleted ? activeDay.completedThisWeek ? 'Meta deste treino concluída na semana' : 'Treino concluído hoje; a próxima repetição será em outro dia' : `${completedInDay} de ${totalSets} séries concluídas neste treino`}</p>
                </div>
                <span className="text-2xl font-black text-brand-accent-text">{progress}%</span>
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
                <Card key={exercise.id} className={`overflow-hidden border-border/60 ${isComplete ? 'border-ok/40 bg-ok-wash' : ''} ${activeDayCompleted ? 'opacity-80' : ''}`}>
                  <CardHeader className="border-b border-border/40 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isComplete ? 'bg-brand-accent-deep text-black' : 'bg-black text-brand-accent dark:bg-brand-accent dark:text-black'}`}>
                          {isComplete ? <Check className="size-4" /> : exerciseIndex + 1}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base leading-tight">{exercise.name}</CardTitle>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {exercise.muscle && <Badge variant="outline">{MUSCLE_LABELS[exercise.muscle] || exercise.muscle}</Badge>}
                            <Badge variant="secondary">{exercise.sets} × {exercise.reps}</Badge>
                            <Badge variant="secondary"><Clock3 className="mr-1 size-3" /> {exercise.restTime}s</Badge>
                          </div>
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
                        {activeDayCompleted
                          ? 'Séries registradas no histórico desta semana'
                          : `Marque ao terminar cada série${exercise.restTime > 0 ? ` — descanso automático de ${exercise.restTime}s` : ''}`}
                      </p>
                      <div className="space-y-2">
                        {Array.from({ length: exercise.sets }).map((_, setIndex) => {
                          const key = `${exercise.id}:${setIndex}`;
                          const checked = completedSets.has(key);
                          const details = setDetails[key] || { repetitions: '', load: '', rpe: '' };
                          return (
                            <div key={setIndex} className="grid grid-cols-[minmax(110px,1fr)_78px_78px_64px] items-end gap-2 rounded-lg border border-border/60 p-2">
                              <button
                                type="button"
                                disabled={activeDayCompleted}
                                onClick={() => toggleSet(exercise.id, setIndex)}
                                className={`flex h-10 items-center justify-center gap-2 rounded-md border px-2 text-sm font-medium transition-colors ${checked ? 'border-brand-accent-deep bg-brand-accent-deep text-black' : setIndex === nextSetIndex ? 'border-black bg-black/[0.06] text-black dark:border-brand-accent dark:bg-brand-accent/10 dark:text-brand-accent' : 'border-border bg-background hover:border-brand-accent-deep'}`}
                              >
                                {checked ? <CheckCircle2 className="size-4" /> : <span className="flex size-5 items-center justify-center rounded-full border text-[10px]">{setIndex + 1}</span>}
                                Série {setIndex + 1}
                              </button>
                              <label className="text-[10px] text-muted-foreground">Reps
                                <Input aria-label={`Repetições da série ${setIndex + 1}`} inputMode="numeric" className="mt-1 h-9 px-2" disabled={activeDayCompleted} placeholder={exercise.reps} value={details.repetitions} onChange={(event) => updateSetDetail(key, 'repetitions', event.target.value)} />
                              </label>
                              <label className="text-[10px] text-muted-foreground">Carga kg
                                <Input aria-label={`Carga da série ${setIndex + 1}`} inputMode="decimal" className="mt-1 h-9 px-2" disabled={activeDayCompleted} placeholder="0" value={details.load} onChange={(event) => updateSetDetail(key, 'load', event.target.value)} />
                              </label>
                              <label className="text-[10px] text-muted-foreground">RPE
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
            <Card className="border-ok/30 bg-ok-wash">
              <CardContent className="p-5 text-center">
                <CheckCircle2 className="mx-auto mb-2 size-9 text-ok" />
                {activeDayCompleted ? <>
                  <h2 className="font-bold">{activeDay.completedThisWeek ? 'Meta deste treino concluída na semana' : 'Treino concluído hoje'}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">O resultado está salvo no histórico e na evolução.</p>
                  {suggestedDay && suggestedDay.id !== activeDay.id && <Button className="mt-4" onClick={() => selectWorkoutDay(suggestedDay.id)}><Dumbbell className="mr-2 size-4" /> Ir para {suggestedDay.name}</Button>}
                  {!suggestedDay && <Badge className="mt-4 bg-ok-wash text-ok">Ciclo semanal completo</Badge>}
                </> : <>
                  <h2 className="font-bold">Todas as séries foram marcadas</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Conclua para registrar este treino no histórico e na evolução.</p>
                  <div className="mx-auto mt-4 max-w-sm space-y-3">
                    <div className="flex justify-center gap-1" aria-label="Avaliação do treino">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} estrela(s)`}><Star className={`size-6 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} /></button>)}</div>
                    <Textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} maxLength={1000} rows={2} placeholder="Como foi o treino? Dificuldade, dor ou observação (opcional)" />
                  </div>
                  <Button className="mt-4 bg-black text-white hover:bg-black/80 dark:bg-brand-accent dark:text-black" onClick={() => void completeWorkout()} disabled={completingWorkout}>
                    {completingWorkout && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Concluir e salvar treino
                  </Button>
                </>}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {restTimer && (
        <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-brand-accent-deep/40 bg-background/95 p-4 shadow-2xl backdrop-blur lg:bottom-6">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-accent text-black"><Timer className="size-6" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-brand-accent-text">Tempo de descanso</p><p className="truncate font-semibold">{restTimer.exerciseName} · próxima série {restTimer.nextSet}</p></div><strong className="font-mono text-2xl text-brand-accent-text">{formatCountdown(restTimer.remainingSeconds)}</strong></div>
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
