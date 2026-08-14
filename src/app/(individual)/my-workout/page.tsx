'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  Dumbbell,
  History,
  Loader2,
  Lock,
  Play,
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
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { TrainingMethodGuidance } from '@/components/workouts/training-method-guidance';
import { useAuth } from '@/hooks/use-auth';
import { isDemoUser } from '@/lib/auth/demo';

interface LastPerformance {
  sets: number;
  repetitions: number | null;
  load: number | null;
  rpe: number | null;
  completedAt: string | null;
}

interface IndividualWorkoutExercise {
  id: string;
  exerciseKey: string;
  name: string;
  primaryMuscleLabel: string;
  equipment: string;
  instructions: string;
  videoUrl: string | null;
  sets: number;
  reps: string;
  restTime: number;
  method: string;
  methodNotes: string;
  lastPerformance: LastPerformance | null;
}

interface IndividualWorkoutDay {
  id: string;
  label: string;
  name: string;
  weeklyAllowance: number;
  weeklyCompletions: number;
  completedThisWeek: boolean;
  completedToday: boolean;
  lastCompletedAt: string | null;
  exercises: IndividualWorkoutExercise[];
}

interface IndividualWorkoutPlan {
  id: string;
  name: string;
  goal: string;
  daysPerWeek: number;
  isExpired: boolean;
  week: {
    currentDate: string;
    startDate: string;
    endDate: string;
    target: number;
    completed: number;
    isComplete: boolean;
    completedToday: boolean;
    nextWorkoutDayId: string | null;
  };
  days: IndividualWorkoutDay[];
}

interface SetPerformance {
  repetitions: string;
  load: string;
  rpe: string;
}

interface RestTimerState {
  exerciseId: string;
  exerciseName: string;
  nextSet: number;
  totalSeconds: number;
  remainingSeconds: number;
  endsAt: number;
}

interface SavedProgress {
  dayId: string;
  completedSets: string[];
  setDetails: Record<string, SetPerformance>;
  startedAt: number;
  clientSessionId: string;
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function progressKey(userId: string, planId: string, date: string) {
  return `dkong-individual-workout:${userId}:${planId}:${date}`;
}

function currentTimestamp() {
  return Date.now();
}

export default function IndividualWorkoutPage() {
  const { user } = useAuth();
  const individualId = user?.id ?? '';
  const [plan, setPlan] = useState<IndividualWorkoutPlan | null>(null);
  const [selectedDayId, setSelectedDayId] = useState('');
  const [runningDayId, setRunningDayId] = useState('');
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());
  const [setDetails, setSetDetails] = useState<Record<string, SetPerformance>>({});
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startedAt = useRef(0);
  const clientSessionId = useRef('');

  const loadPlan = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await fetch('/api/individual/workout', { cache: 'no-store' });
      const data = await response.json() as { plan?: IndividualWorkoutPlan | null; error?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar sua ficha.');
      const nextPlan = data.plan ?? null;
      setPlan(nextPlan);
      if (!nextPlan) {
        setSelectedDayId('');
        setRunningDayId('');
        return;
      }

      const requestedDay = new URLSearchParams(window.location.search).get('day');
      const suggested = nextPlan.week.nextWorkoutDayId ?? nextPlan.days[0]?.id ?? '';
      setSelectedDayId((current) => {
        const currentDay = nextPlan.days.find((day) => day.id === current);
        if (currentDay?.completedToday) return suggested;
        if (currentDay) return current;
        return requestedDay && nextPlan.days.some((day) => day.id === requestedDay) ? requestedDay : suggested;
      });

      if (individualId) {
        try {
          const saved = window.localStorage.getItem(progressKey(individualId, nextPlan.id, nextPlan.week.currentDate));
          if (saved) {
            const decoded = JSON.parse(saved) as SavedProgress;
            if (nextPlan.days.some((day) => day.id === decoded.dayId)) {
              setRunningDayId(decoded.dayId);
              setSelectedDayId(decoded.dayId);
              setCompletedSets(new Set(decoded.completedSets));
              setSetDetails(decoded.setDetails || {});
              startedAt.current = decoded.startedAt;
              clientSessionId.current = decoded.clientSessionId;
            }
          }
        } catch {
          window.localStorage.removeItem(progressKey(individualId, nextPlan.id, nextPlan.week.currentDate));
        }
      }
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar sua ficha.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [individualId]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadPlan(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadPlan]);

  useEffect(() => {
    if (!plan || !individualId || !runningDayId || !startedAt.current || !clientSessionId.current) return;
    window.localStorage.setItem(progressKey(individualId, plan.id, plan.week.currentDate), JSON.stringify({
      dayId: runningDayId,
      completedSets: [...completedSets],
      setDetails,
      startedAt: startedAt.current,
      clientSessionId: clientSessionId.current,
    } satisfies SavedProgress));
  }, [completedSets, individualId, plan, runningDayId, setDetails]);

  const timerActive = restTimer !== null;
  useEffect(() => {
    if (!timerActive) return;
    const interval = window.setInterval(() => {
      setRestTimer((current) => current ? {
        ...current,
        remainingSeconds: Math.max(0, Math.ceil((current.endsAt - Date.now()) / 1000)),
      } : null);
    }, 250);
    return () => window.clearInterval(interval);
  }, [timerActive]);

  useEffect(() => {
    if (!restTimer || restTimer.remainingSeconds > 0) return;
    const exerciseName = restTimer.exerciseName;
    const timeout = window.setTimeout(() => {
      setRestTimer(null);
      if ('vibrate' in navigator) navigator.vibrate([180, 100, 180]);
      toast.success(`Descanso finalizado para ${exerciseName}.`);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [restTimer]);

  const activeDay = plan?.days.find((day) => day.id === selectedDayId) ?? plan?.days[0] ?? null;
  const suggestedDay = plan?.days.find((day) => day.id === plan.week.nextWorkoutDayId) ?? null;
  const weeklySequence = plan
    ? Array.from({ length: plan.week.target }, (_, index) => plan.days[index % plan.days.length]?.label)
      .filter((label): label is string => Boolean(label))
    : [];
  const totalSets = activeDay?.exercises.reduce((total, exercise) => total + exercise.sets, 0) ?? 0;
  const completedCount = useMemo(() => {
    if (!activeDay) return 0;
    return activeDay.exercises.reduce((total, exercise) => (
      total + Array.from({ length: exercise.sets }).filter((_, index) => completedSets.has(`${exercise.id}:${index}`)).length
    ), 0);
  }, [activeDay, completedSets]);
  const progress = totalSets > 0 ? Math.round((completedCount / totalSets) * 100) : 0;
  const lockedUntilTomorrow = Boolean(plan?.week.completedToday && activeDay && !activeDay.completedToday);
  const lockedByRotation = Boolean(
    activeDay
    && plan?.week.nextWorkoutDayId
    && activeDay.id !== plan.week.nextWorkoutDayId,
  );
  const unavailable = Boolean(
    activeDay?.completedToday
    || activeDay?.completedThisWeek
    || lockedUntilTomorrow
    || lockedByRotation,
  );
  const isRunning = Boolean(activeDay && runningDayId === activeDay.id);

  function clearLocalProgress() {
    if (plan && individualId) window.localStorage.removeItem(progressKey(individualId, plan.id, plan.week.currentDate));
    setRunningDayId('');
    setCompletedSets(new Set());
    setSetDetails({});
    startedAt.current = 0;
    clientSessionId.current = '';
    setRestTimer(null);
    setRating(0);
    setFeedback('');
  }

  function selectDay(dayId: string) {
    if (runningDayId && runningDayId !== dayId && completedSets.size > 0) {
      toast.info('Finalize ou reinicie a ficha atual antes de trocar.');
      return;
    }
    setSelectedDayId(dayId);
  }

  function startWorkout() {
    if (!activeDay || unavailable) return;
    setRunningDayId(activeDay.id);
    startedAt.current = currentTimestamp();
    clientSessionId.current = crypto.randomUUID();
    setCompletedSets(new Set());
    setSetDetails({});
    setRating(0);
    setFeedback('');
  }

  function updateSetDetail(key: string, field: keyof SetPerformance, value: string) {
    const sanitized = field === 'load' ? value.replace(',', '.').replace(/[^0-9.]/g, '') : value.replace(/\D/g, '');
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

  function toggleSet(exercise: IndividualWorkoutExercise, setIndex: number) {
    if (!isRunning || unavailable) return;
    const key = `${exercise.id}:${setIndex}`;
    const wasCompleted = completedSets.has(key);
    if (!wasCompleted) {
      setSetDetails((current) => ({
        ...current,
        [key]: current[key] || {
          repetitions: exercise.lastPerformance?.repetitions !== null && exercise.lastPerformance?.repetitions !== undefined
            ? String(exercise.lastPerformance.repetitions)
            : /^\d+$/.test(exercise.reps) ? exercise.reps : '',
          load: exercise.lastPerformance?.load !== null && exercise.lastPerformance?.load !== undefined ? String(exercise.lastPerformance.load) : '',
          rpe: exercise.lastPerformance?.rpe !== null && exercise.lastPerformance?.rpe !== undefined ? String(exercise.lastPerformance.rpe) : '',
        },
      }));
    }
    setCompletedSets((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    if (!wasCompleted && setIndex < exercise.sets - 1 && exercise.restTime > 0) {
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

  async function completeWorkout() {
    if (!plan || !activeDay || !isRunning || progress < 100) return;
    setSubmitting(true);
    try {
      const completedAt = currentTimestamp();
      const response = await fetch('/api/individual/workout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutDayId: activeDay.id,
          clientSessionId: clientSessionId.current,
          startedAt: new Date(startedAt.current).toISOString(),
          completedAt: new Date(completedAt).toISOString(),
          durationSeconds: Math.min(21_600, Math.max(0, Math.round((completedAt - startedAt.current) / 1000))),
          rating: rating || undefined,
          feedback: feedback.trim() || undefined,
          exercises: activeDay.exercises.map((exercise) => ({
            workoutExerciseId: exercise.id,
            sets: Array.from({ length: exercise.sets }, (_, setIndex) => {
              const key = `${exercise.id}:${setIndex}`;
              const details = setDetails[key];
              return {
                setNumber: setIndex + 1,
                completed: completedSets.has(key),
                ...(details?.repetitions ? { performedRepetitions: Math.floor(Number(details.repetitions)) } : {}),
                ...(details?.load ? { performedLoad: Number(details.load) } : {}),
                ...(details?.rpe ? { rpe: Math.min(10, Math.max(1, Math.floor(Number(details.rpe)))) } : {}),
              };
            }),
          })),
        }),
      });
      const data = await response.json() as { error?: string; alreadyCompletedToday?: boolean; alreadyCompletedThisWeek?: boolean };
      if (!response.ok) throw new Error(data.error || 'Não foi possível concluir sua ficha.');
      clearLocalProgress();
      if (data.alreadyCompletedToday) toast.info('Você já concluiu a ficha de hoje.');
      else if (data.alreadyCompletedThisWeek) toast.info('Esta ficha já atingiu a meta da semana.');
      else toast.success('Ficha concluída! A próxima ficha da semana já foi preparada.');
      await loadPlan(true);
    } catch (completionError) {
      toast.error(completionError instanceof Error ? completionError.message : 'Não foi possível concluir sua ficha.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Preparando a ficha do dia...</div>;
  if (error && !plan) return <div className="mx-auto max-w-md py-20 text-center"><Dumbbell className="mx-auto size-12 text-muted-foreground/40" /><h1 className="mt-4 text-xl font-black">Não foi possível abrir sua ficha</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button className="mt-5" onClick={() => void loadPlan()}><RefreshCw className="mr-2 size-4" /> Tentar novamente</Button></div>;
  if (!plan || !activeDay) return <div className="mx-auto max-w-md py-20 text-center"><Dumbbell className="mx-auto size-12 text-muted-foreground/40" /><h1 className="mt-4 text-xl font-black">Monte sua primeira ficha</h1><p className="mt-2 text-sm text-muted-foreground">Depois de salvar, a ficha executável aparecerá aqui.</p><Button nativeButton={false} className="mt-5" render={<Link href="/my-exercises" />}><Plus className="mr-2 size-4" /> Montar ficha</Button></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12 animate-fade-in">
      <section className="dk-hero-panel p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="mb-6 rounded-2xl border border-[#c9ff32]/30 bg-[#c9ff32]/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c9ff32]">Sua ficha ativa</p><h1 className="mt-1 text-xl font-bold">{plan.name}</h1><p className="mt-1 text-sm text-white/60">{plan.goal}</p></div>
              <div className="flex flex-wrap gap-2">
                <Button nativeButton={false} size="sm" variant="secondary" render={<Link href="/my-history" />} className="border border-white/15 bg-white/10 text-white hover:bg-white/20"><History className="mr-2 size-4" /> Histórico</Button>
                {isDemoUser(user?.id) ? (
                  <Button size="sm" variant="secondary" onClick={() => toast.error('Exclusivo para assinantes.', { description: 'Assine o G KONG para liberar o download do PDF.', action: { label: 'Ver planos', onClick: () => { window.location.href = '/'; } } })} className="border border-white/15 bg-white/10 text-white hover:bg-white/20">
                    <Lock className="mr-2 size-4" /> PDF
                  </Button>
                ) : (
                  <Button nativeButton={false} size="sm" variant="secondary" render={<a href={`/api/individual/workout-plans/${plan.id}/pdf`} download />} className="border border-white/15 bg-white/10 text-white hover:bg-white/20"><Download className="mr-2 size-4" /> PDF</Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => void loadPlan(true)} disabled={refreshing} className="border border-white/15 bg-white/10 text-white hover:bg-white/20"><RefreshCw className={`mr-2 size-4 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3"><div className="rounded-2xl border border-white/12 bg-white/[0.06] p-4"><Target className="size-4 text-[#c9ff32]" /><p className="mt-2 text-lg font-black">{plan.daysPerWeek}x</p><p className="text-[10px] text-white/60">fichas por semana</p></div><div className="rounded-2xl bg-[#c9ff32] p-4 text-black"><CheckCircle2 className="size-4" /><p className="mt-2 text-lg font-black">{plan.week.completed}/{plan.week.target}</p><p className="text-[10px] text-black/60">concluídas</p></div><div className="rounded-2xl border border-white/12 bg-white/[0.06] p-4"><Dumbbell className="size-4 text-[#c9ff32]" /><p className="mt-2 text-lg font-black">{suggestedDay?.label || activeDay.label}</p><p className="text-[10px] text-white/60">próxima ficha</p></div></div>
      </section>

      <Card className={plan.week.isComplete ? 'border-[#9fdb00]/30 bg-[#c9ff32]/10' : ''}><CardContent className="p-4 sm:p-5"><div className="flex items-center justify-between gap-4"><div><p className="font-bold">{plan.week.isComplete ? 'Sequência semanal concluída' : 'Fichas desta semana'}</p><p className="text-xs text-muted-foreground">Sequência: {weeklySequence.join(' → ')}. Na próxima semana, começa novamente pela Ficha {plan.days[0]?.label}.</p></div><strong className="text-2xl text-[#668f00]">{Math.min(100, Math.round((plan.week.completed / Math.max(1, plan.week.target)) * 100))}%</strong></div><Progress className="mt-3" value={(plan.week.completed / Math.max(1, plan.week.target)) * 100} /></CardContent></Card>

      <div className="flex gap-2 overflow-x-auto pb-1">{plan.days.map((day) => <button type="button" key={day.id} onClick={() => selectDay(day.id)} className={`relative min-w-[135px] rounded-xl border px-4 py-3 text-left ${activeDay.id === day.id ? 'border-black bg-black text-[#c9ff32] dark:border-[#c9ff32] dark:bg-[#c9ff32] dark:text-black' : day.completedThisWeek ? 'border-[#9fdb00]/40 bg-[#c9ff32]/10' : 'border-border bg-card'}`}>{day.completedThisWeek && <CheckCircle2 className="absolute right-2 top-2 size-4" />}<span className="block text-[10px] font-black uppercase opacity-70">Ficha {day.label}</span><span className="mt-1 block truncate font-bold">{day.name}</span><span className="mt-1 block text-[10px] opacity-70">{day.weeklyCompletions}/{day.weeklyAllowance} na semana</span></button>)}</div>

      {lockedUntilTomorrow && <Card className="border-[#9fdb00]/30 bg-[#c9ff32]/10"><CardContent className="flex gap-3 p-5"><CalendarClock className="mt-0.5 size-5 shrink-0 text-[#668f00]" /><div><p className="font-bold">Próxima ficha do dia: Ficha {activeDay.label}</p><p className="mt-1 text-sm text-muted-foreground">Você já concluiu a ficha de hoje. A próxima fica disponível amanhã, mas pode ser consultada agora.</p></div></CardContent></Card>}

      {lockedByRotation && !lockedUntilTomorrow && !activeDay.completedThisWeek && <Card className="border-amber-500/30 bg-amber-500/10"><CardContent className="flex gap-3 p-5"><CalendarClock className="mt-0.5 size-5 shrink-0 text-amber-600" /><div><p className="font-bold">Ficha disponível somente para consulta</p><p className="mt-1 text-sm text-muted-foreground">Para manter sua progressão, conclua primeiro a ficha destacada na sequência.</p></div></CardContent></Card>}

      {!isRunning && !unavailable && <Card className="overflow-hidden border-[#9fdb00]/30"><CardContent className="p-6 text-center sm:p-8"><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#c9ff32] text-black"><Play className="ml-1 size-6" /></div><p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-[#668f00]">Ficha do dia</p><h2 className="mt-2 text-2xl font-black">Ficha {activeDay.label} · {activeDay.name}</h2><p className="mt-2 text-sm text-muted-foreground">{activeDay.exercises.length} exercícios · {totalSets} séries. O tempo começa quando você tocar no botão.</p><Button className="mt-5 h-12 bg-black px-8 text-white dark:bg-[#c9ff32] dark:text-black" onClick={startWorkout}><Play className="mr-2 size-4" /> Iniciar ficha {activeDay.label}</Button></CardContent></Card>}

      {isRunning && <Card><CardContent className="p-4 sm:p-5"><div className="flex items-center justify-between gap-4"><div><p className="font-bold">Ficha {activeDay.label} em andamento</p><p className="text-xs text-muted-foreground">{completedCount} de {totalSets} séries concluídas</p></div><strong className="text-2xl text-[#668f00]">{progress}%</strong></div><Progress className="mt-3" value={progress} />{progress > 0 && <Button variant="ghost" size="sm" className="mt-2 text-xs text-muted-foreground" onClick={clearLocalProgress}><RotateCcw className="mr-1 size-3" /> Reiniciar ficha</Button>}</CardContent></Card>}

      <div className="space-y-4">{activeDay.exercises.map((exercise, exerciseIndex) => {
        const exerciseCompleted = Array.from({ length: exercise.sets }).every((_, index) => completedSets.has(`${exercise.id}:${index}`));
        return <Card key={exercise.id} className={`overflow-hidden ${exerciseCompleted ? 'border-[#9fdb00]/40 bg-[#c9ff32]/8' : ''} ${!isRunning || unavailable ? 'opacity-85' : ''}`}><CardHeader className="border-b border-border/50 pb-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${exerciseCompleted ? 'bg-[#c9ff32] text-black' : 'bg-black text-[#c9ff32] dark:bg-[#c9ff32] dark:text-black'}`}>{exerciseCompleted ? <Check className="size-4" /> : exerciseIndex + 1}</span><div><CardTitle className="text-base">{exercise.name}</CardTitle><div className="mt-2 flex flex-wrap gap-1.5"><Badge variant="outline">{exercise.primaryMuscleLabel}</Badge><Badge variant="secondary">{exercise.sets} × {exercise.reps}</Badge><Badge variant="secondary"><Clock3 className="mr-1 size-3" /> {exercise.restTime}s</Badge></div>{exercise.lastPerformance && <p className="mt-3 rounded-xl border border-[#9fdb00]/25 bg-[#c9ff32]/10 px-3 py-2 text-xs"><strong className="text-[#668f00]">Última vez:</strong> {exercise.lastPerformance.sets}×{exercise.lastPerformance.repetitions ?? '—'}{exercise.lastPerformance.load !== null ? ` com ${exercise.lastPerformance.load} kg` : ''}{exercise.lastPerformance.rpe !== null ? ` · RPE ${exercise.lastPerformance.rpe}` : ''}</p>}</div></div>{exercise.videoUrl && <Button size="icon" variant="outline" onClick={() => setPlayingVideo(exercise.videoUrl)}><PlayCircle className="size-4 text-danger" /></Button>}</div></CardHeader><CardContent className="space-y-4 p-4 sm:p-5"><p className="text-sm leading-6 text-muted-foreground">{exercise.instructions}</p><TrainingMethodGuidance method={exercise.method} methodNotes={exercise.methodNotes} noteLabel="Minha orientação" /><div className="space-y-2">{Array.from({ length: exercise.sets }).map((_, setIndex) => {
          const key = `${exercise.id}:${setIndex}`;
          const checked = completedSets.has(key);
          const details = setDetails[key] || { repetitions: '', load: '', rpe: '' };
          return <div key={key} className={`rounded-xl border p-3 ${checked ? 'border-[#9fdb00]/40 bg-[#c9ff32]/10' : 'border-border'}`}><div className="flex items-center gap-3"><button type="button" disabled={!isRunning || unavailable} onClick={() => toggleSet(exercise, setIndex)} aria-label={`Série ${setIndex + 1}`} className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 font-black ${checked ? 'border-[#9fdb00] bg-[#c9ff32] text-black' : 'border-border'}`}>{checked ? <Check className="size-5" /> : setIndex + 1}</button><div className="grid min-w-0 flex-1 grid-cols-3 gap-2"><label className="text-[10px] font-bold uppercase text-muted-foreground">Reps<Input aria-label={`Repetições da série ${setIndex + 1}`} inputMode="numeric" disabled={!isRunning || unavailable} className="mt-1 h-9 px-2" placeholder={exercise.reps} value={details.repetitions} onChange={(event) => updateSetDetail(key, 'repetitions', event.target.value)} /></label><label className="text-[10px] font-bold uppercase text-muted-foreground">Carga kg<Input aria-label={`Carga da série ${setIndex + 1}`} inputMode="decimal" disabled={!isRunning || unavailable} className="mt-1 h-9 px-2" placeholder="0" value={details.load} onChange={(event) => updateSetDetail(key, 'load', event.target.value)} /></label><label className="text-[10px] font-bold uppercase text-muted-foreground">RPE<Input aria-label={`RPE da série ${setIndex + 1}`} inputMode="numeric" disabled={!isRunning || unavailable} className="mt-1 h-9 px-2" placeholder="1-10" value={details.rpe} onChange={(event) => updateSetDetail(key, 'rpe', event.target.value)} /></label></div></div></div>;
        })}</div></CardContent></Card>;
      })}</div>

      {isRunning && progress === 100 && <Card className="border-[#9fdb00]/40 bg-[#c9ff32]/10"><CardContent className="p-6 text-center"><CheckCircle2 className="mx-auto size-10 text-[#668f00]" /><h2 className="mt-3 text-xl font-black">Todas as séries concluídas</h2><p className="mt-1 text-sm text-muted-foreground">Avalie e salve a Ficha {activeDay.label} para liberar a próxima ficha da semana.</p><div className="mt-4 flex justify-center gap-1">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} onClick={() => setRating(value)} aria-label={`${value} estrela(s)`} className="flex size-11 items-center justify-center rounded-full"><Star className={`size-6 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} /></button>)}</div><Textarea className="mx-auto mt-3 max-w-md" rows={2} maxLength={1000} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Como foi o treino? (opcional)" /><Button className="mt-4 bg-black text-white dark:bg-[#c9ff32] dark:text-black" disabled={submitting} onClick={() => void completeWorkout()}>{submitting && <Loader2 className="mr-2 size-4 animate-spin" />} Concluir e salvar ficha</Button></CardContent></Card>}

      {restTimer && <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-[#9fdb00]/40 bg-background/95 p-4 shadow-2xl backdrop-blur lg:bottom-6"><div className="flex items-center gap-4"><span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#c9ff32] text-black"><Timer className="size-6" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-black uppercase tracking-wide text-[#668f00]">Tempo de descanso</p><p className="truncate font-bold">{restTimer.exerciseName} · próxima série {restTimer.nextSet}</p></div><strong className="font-mono text-2xl text-[#668f00]">{formatCountdown(restTimer.remainingSeconds)}</strong></div><Progress className="mt-2 h-2" value={((restTimer.totalSeconds - restTimer.remainingSeconds) / Math.max(1, restTimer.totalSeconds)) * 100} /><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => setRestTimer((current) => current ? { ...current, totalSeconds: current.totalSeconds + 15, remainingSeconds: current.remainingSeconds + 15, endsAt: current.endsAt + 15_000 } : null)}><Plus className="mr-1 size-3" /> 15s</Button><Button size="sm" variant="ghost" onClick={() => setRestTimer(null)}><SkipForward className="mr-1 size-3" /> Pular descanso</Button></div></div></div></div>}

      <Dialog open={Boolean(playingVideo)} onOpenChange={(open) => !open && setPlayingVideo(null)}><DialogContent className="overflow-hidden border-zinc-800 bg-black p-0 sm:max-w-3xl"><DialogTitle className="sr-only">Vídeo de execução do exercício</DialogTitle><div className="aspect-video w-full bg-black">{playingVideo && <video src={playingVideo} controls autoPlay playsInline className="size-full object-contain" />}</div></DialogContent></Dialog>
    </div>
  );
}
