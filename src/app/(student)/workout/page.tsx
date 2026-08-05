'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Loader2,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Star,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

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
  exercises: StudentExercise[];
}

interface WorkoutPlan {
  id: string;
  name: string;
  goal: string;
  daysPerWeek: number;
  startDate: string | null;
  updatedAt: string;
  days: WorkoutDay[];
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

function progressStorageKey(planId: string) {
  return `fitcontrol-workout-progress:${planId}`;
}

function currentTimestamp() {
  return Date.now();
}

export default function StudentWorkoutPage() {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedDayId, setSelectedDayId] = useState('');
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [completingWorkout, setCompletingWorkout] = useState(false);
  const [recordedDays, setRecordedDays] = useState<Set<string>>(new Set());
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const currentPlanId = useRef('');
  const workoutStartedAt = useRef<number | null>(null);

  const loadPlan = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch('/api/workout-plans', { cache: 'no-store' });
      const data = await response.json() as WorkoutResponse;
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar sua ficha.');

      const nextPlan = data.plan ?? null;
      if (nextPlan && currentPlanId.current !== nextPlan.id) {
        currentPlanId.current = nextPlan.id;
        setSelectedDayId(nextPlan.days[0]?.id ?? '');
        workoutStartedAt.current = currentTimestamp();
        setRating(0);
        setFeedback('');
        try {
          const saved = window.localStorage.getItem(progressStorageKey(nextPlan.id));
          setCompletedSets(new Set(saved ? JSON.parse(saved) as string[] : []));
        } catch {
          setCompletedSets(new Set());
        }
      } else if (!nextPlan) {
        currentPlanId.current = '';
        setSelectedDayId('');
        setCompletedSets(new Set());
      } else {
        setSelectedDayId((current) => (
          nextPlan.days.some((day) => day.id === current) ? current : (nextPlan.days[0]?.id ?? '')
        ));
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
    window.localStorage.setItem(progressStorageKey(plan.id), JSON.stringify([...completedSets]));
  }, [completedSets, plan]);

  const activeDay = plan?.days.find((day) => day.id === selectedDayId) ?? plan?.days[0] ?? null;
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

  function selectWorkoutDay(dayId: string) {
    setSelectedDayId(dayId);
    workoutStartedAt.current = currentTimestamp();
    setRating(0);
    setFeedback('');
  }

  function toggleSet(exerciseId: string, setIndex: number) {
    const key = `${exerciseId}:${setIndex}`;
    setCompletedSets((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function resetDay() {
    if (!activeDay) return;
    const exerciseIds = new Set(activeDay.exercises.map((exercise) => exercise.id));
    setCompletedSets((current) => new Set(
      [...current].filter((key) => !exerciseIds.has(key.split(':')[0])),
    ));
  }

  async function completeWorkout() {
    if (!activeDay || progress < 100) return;
    setCompletingWorkout(true);
    try {
      const completedAt = currentTimestamp();
      const startedAt = workoutStartedAt.current ?? completedAt;
      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutDayId: activeDay.id,
          completionPercentage: progress,
          durationSeconds: Math.max(0, Math.round((completedAt - startedAt) / 1000)),
          ...(rating > 0 ? { rating } : {}),
          feedback,
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível concluir o treino.');
      setRecordedDays((current) => new Set(current).add(activeDay.id));
      toast.success('Treino concluído e salvo no histórico!');
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
    <div className="mx-auto max-w-4xl space-y-5 pb-12 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white shadow-lg sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-blue-100">
              <span className="inline-flex size-2 rounded-full bg-emerald-300" />
              Ficha sincronizada com seu personal
            </div>
            <h1 className="mt-2 text-2xl font-bold">{plan.name}</h1>
            <p className="mt-1 text-sm text-blue-100">{plan.goal}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void loadPlan(true)}
            disabled={refreshing}
            className="bg-white/15 text-white hover:bg-white/25"
          >
            <RefreshCw className={`mr-2 size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-3">
            <Target className="mb-1 size-4 text-blue-200" />
            <p className="text-lg font-bold">{plan.daysPerWeek}x</p>
            <p className="text-[11px] text-blue-100">por semana</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <Dumbbell className="mb-1 size-4 text-blue-200" />
            <p className="text-lg font-bold">{plan.days.length}</p>
            <p className="text-[11px] text-blue-100">treinos diferentes</p>
          </div>
          <div className="col-span-2 rounded-xl bg-white/10 p-3 sm:col-span-1">
            <RefreshCw className="mb-1 size-4 text-blue-200" />
            <p className="text-sm font-bold">Automático</p>
            <p className="text-[11px] text-blue-100">
              {lastSync ? `Atualizado às ${lastSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Sincronização ativa'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {plan.days.map((day) => (
          <button
            type="button"
            key={day.id}
            onClick={() => selectWorkoutDay(day.id)}
            className={`min-w-[120px] rounded-xl border px-4 py-3 text-left transition-colors ${
              activeDay?.id === day.id
                ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                : 'border-border bg-card hover:border-blue-400'
            }`}
          >
            <span className="block text-[10px] font-bold uppercase opacity-75">Treino {day.label}</span>
            <span className="mt-0.5 block truncate text-sm font-semibold">{day.name}</span>
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
                  <p className="text-xs text-muted-foreground">{completedInDay} de {totalSets} séries concluídas neste aparelho</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">{progress}%</span>
              </div>
              <Progress value={progress} className="mt-3" />
              {progress > 0 && (
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

              return (
                <Card key={exercise.id} className={`overflow-hidden border-border/60 ${isComplete ? 'border-emerald-500/40 bg-emerald-500/[0.03]' : ''}`}>
                  <CardHeader className="border-b border-border/40 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isComplete ? 'bg-emerald-500 text-white' : 'bg-blue-500/10 text-blue-600'}`}>
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
                          <PlayCircle className="size-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    {exercise.instructions && (
                      <p className="text-sm leading-relaxed text-muted-foreground">{exercise.instructions}</p>
                    )}
                    {exercise.method && (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm">
                        <span className="font-semibold">Orientação do personal:</span> {exercise.method}
                      </div>
                    )}
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Toque para marcar cada série</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: exercise.sets }).map((_, setIndex) => {
                          const checked = completedSets.has(`${exercise.id}:${setIndex}`);
                          return (
                            <button
                              type="button"
                              key={setIndex}
                              onClick={() => toggleSet(exercise.id, setIndex)}
                              className={`flex h-10 min-w-20 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${
                                checked
                                  ? 'border-emerald-500 bg-emerald-500 text-white'
                                  : 'border-border bg-background hover:border-blue-400'
                              }`}
                            >
                              {checked ? <CheckCircle2 className="size-4" /> : <span className="flex size-5 items-center justify-center rounded-full border text-[10px]">{setIndex + 1}</span>}
                              {exercise.reps} reps
                            </button>
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
            <Card className="border-emerald-500/30 bg-emerald-500/[0.05]">
              <CardContent className="p-5 text-center">
                <CheckCircle2 className="mx-auto mb-2 size-9 text-emerald-500" />
                <h2 className="font-bold">Todas as séries foram marcadas</h2>
                <p className="mt-1 text-sm text-muted-foreground">Conclua para registrar este treino no histórico e na evolução.</p>
                <div className="mx-auto mt-4 max-w-sm space-y-3">
                  <div className="flex justify-center gap-1" aria-label="Avaliação do treino">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} estrela(s)`}><Star className={`size-6 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} /></button>)}</div>
                  <Textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} maxLength={1000} rows={2} placeholder="Como foi o treino? Dificuldade, dor ou observação (opcional)" />
                </div>
                <Button
                  className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => void completeWorkout()}
                  disabled={completingWorkout || recordedDays.has(activeDay.id)}
                >
                  {completingWorkout && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {recordedDays.has(activeDay.id) ? 'Treino salvo' : 'Concluir e salvar treino'}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
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
