'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Model, {
  type IExerciseData,
  type IMuscleStats,
} from '@phelian/react-body-highlighter';
import {
  Check,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Info,
  Loader2,
  PlayCircle,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  EXERCISE_CATALOG,
  MUSCLE_REGIONS,
  isMuscleRegion,
  type ExerciseCatalogItem,
  type MuscleRegion,
} from '@/lib/exercises/catalog';
import {
  addPlanValidity,
  brazilToday,
  formatPlanDate,
  inferPlanValidity,
  type PlanValidityUnit,
} from '@/lib/workouts/plan-validity';

interface StudentOption {
  id: string;
  name: string;
  status: string;
}

interface BuilderExercise extends ExerciseCatalogItem {
  sets: number;
  reps: string;
  restTime: number;
  method: string;
}

interface BuilderDay {
  id: string;
  label: string;
  name: string;
  exercises: BuilderExercise[];
}

interface ExerciseResponse {
  exercises?: ExerciseCatalogItem[];
  error?: string;
}

interface EditablePlanResponse {
  plan?: {
    id: string;
    studentId: string;
    studentName: string;
    name: string;
    goal: string;
    daysPerWeek: number;
    startDate: string | null;
    endDate: string | null;
    days: Array<{
      id: string;
      label: string;
      name: string;
      exercises: Array<{
        exerciseKey: string;
        name: string;
        sets: number;
        reps: string;
        restTime: number;
        method: string;
      }>;
    }>;
  };
  error?: string;
}

const MAX_WORKOUT_DAYS = 30;

// Abaixo de xl as três colunas não cabem lado a lado. Em vez de empilhá-las —
// o que produzia rolagem dentro de rolagem — cada coluna vira uma etapa e o
// personal caminha entre elas pela barra inferior fixa.
const MOBILE_STEPS = [
  { title: 'Músculo', hint: 'Escolha o grupo muscular' },
  { title: 'Exercícios', hint: 'Adicione ao treino atual' },
  { title: 'Ficha', hint: 'Ajuste séries e publique' },
] as const;

const LAST_MOBILE_STEP = MOBILE_STEPS.length - 1;

function workoutDayLabel(index: number) {
  let value = index + 1;
  let label = '';
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}
const CATALOG_BY_KEY = new Map(EXERCISE_CATALOG.map((exercise) => [exercise.key, exercise]));
const CATALOG_BY_NAME = new Map(EXERCISE_CATALOG.map((exercise) => [
  exercise.name.toLocaleLowerCase('pt-BR'),
  exercise,
]));
const DIFFICULTY_LABELS = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
} as const;

function createDay(index: number): BuilderDay {
  const label = workoutDayLabel(index);
  return {
    id: `${label}-${Date.now()}-${index}`,
    label,
    name: `Treino ${label}`,
    exercises: [],
  };
}

export default function ExercisesPage() {
  const router = useRouter();
  const [activeMuscle, setActiveMuscle] = useState<MuscleRegion>('chest');
  const [exercises, setExercises] = useState<ExerciseCatalogItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [viewType, setViewType] = useState<'anterior' | 'posterior'>('anterior');
  const [days, setDays] = useState<BuilderDay[]>([createDay(0)]);
  const [activeDayId, setActiveDayId] = useState(() => days[0].id);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [planName, setPlanName] = useState('');
  const [goal, setGoal] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState('');
  const [editingPlanLoading, setEditingPlanLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => brazilToday());
  const [validityAmount, setValidityAmount] = useState(4);
  const [validityUnit, setValidityUnit] = useState<PlanValidityUnit>('weeks');
  const [mobileStep, setMobileStep] = useState(0);
  const builderRef = useRef<HTMLDivElement>(null);

  const activeDay = days.find((day) => day.id === activeDayId) ?? days[0];
  const totalSelected = days.reduce((total, day) => total + day.exercises.length, 0);
  const endDate = useMemo(
    () => addPlanValidity(startDate, validityAmount, validityUnit),
    [startDate, validityAmount, validityUnit],
  );

  const loadMuscle = useCallback(async (muscle: MuscleRegion) => {
    setActiveMuscle(muscle);
    setLoading(true);
    setSearch('');

    try {
      const response = await fetch(`/api/exercises?muscle=${encodeURIComponent(muscle)}`, {
        cache: 'no-store',
      });
      const data = await response.json() as ExerciseResponse;
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar os exercícios.');
      setExercises(data.exercises ?? []);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os exercícios.');
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEditablePlan = useCallback(async (planId: string) => {
    setEditingPlanLoading(true);
    try {
      const response = await fetch(`/api/workout-plans/${planId}`, { cache: 'no-store' });
      const data = await response.json() as EditablePlanResponse;
      if (!response.ok || !data.plan) {
        throw new Error(data.error || 'Não foi possível carregar a ficha para edição.');
      }

      let missingExerciseCount = 0;
      const loadedDays: BuilderDay[] = data.plan.days.map((day, dayIndex) => ({
        id: day.id || createDay(dayIndex).id,
        label: day.label || workoutDayLabel(dayIndex),
        name: day.name,
        exercises: day.exercises.flatMap((savedExercise) => {
          const catalogExercise = CATALOG_BY_KEY.get(savedExercise.exerciseKey)
            ?? CATALOG_BY_NAME.get(savedExercise.name.toLocaleLowerCase('pt-BR'));
          if (!catalogExercise) {
            missingExerciseCount += 1;
            return [];
          }
          return [{
            ...catalogExercise,
            sets: savedExercise.sets,
            reps: savedExercise.reps,
            restTime: savedExercise.restTime,
            method: savedExercise.method,
          }];
        }),
      }));
      const normalizedDays = loadedDays.length > 0 ? loadedDays : [createDay(0)];
      const today = brazilToday();
      const validity = inferPlanValidity(data.plan.startDate || today, data.plan.endDate);
      if (missingExerciseCount > 0) {
        toast.warning(`${missingExerciseCount} exercício(s) antigo(s) não existem mais no catálogo. Revise a ficha antes de salvar.`);
      }

      setEditingPlanId(data.plan.id);
      setSelectedStudentId(data.plan.studentId);
      setPlanName(data.plan.name);
      setGoal(data.plan.goal);
      setDaysPerWeek(Math.max(data.plan.daysPerWeek, normalizedDays.length));
      setDays(normalizedDays);
      setActiveDayId(normalizedDays[0].id);
      setStartDate(today);
      setValidityAmount(validity.amount);
      setValidityUnit(validity.unit);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar a ficha.');
      router.push('/workouts');
    } finally {
      setEditingPlanLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const planId = new URLSearchParams(window.location.search).get('planId');
    const initialLoad = window.setTimeout(() => {
      void loadMuscle('chest');
      if (planId) void loadEditablePlan(planId);
    }, 0);

    const loadStudents = async () => {
      try {
        const response = await fetch('/api/students', { cache: 'no-store' });
        const data = await response.json() as { students?: StudentOption[] };
        if (response.ok) setStudents((data.students ?? []).filter((student) => student.status === 'active'));
      } catch (error) {
        console.error('[Exercises] Student list error:', error);
      }
    };

    void loadStudents();
    return () => window.clearTimeout(initialLoad);
  }, [loadEditablePlan, loadMuscle]);

  // A área rolável do painel é o <main> do layout, não a janela. Ao trocar de
  // etapa no celular o topo da nova etapa precisa aparecer.
  const goToStep = useCallback((step: number) => {
    setMobileStep(step);
    builderRef.current?.closest('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Escolher o músculo é a etapa 1: ao escolher, o personal já segue para a
  // lista de exercícios daquele grupo.
  const selectMuscle = useCallback((muscle: MuscleRegion) => {
    void loadMuscle(muscle);
    goToStep(1);
  }, [goToStep, loadMuscle]);

  const handleMuscleClick = useCallback((stats: IMuscleStats) => {
    if (isMuscleRegion(stats.muscle)) {
      selectMuscle(stats.muscle);
    }
  }, [selectMuscle]);

  const filteredExercises = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return exercises;
    return exercises.filter((exercise) => (
      exercise.name.toLocaleLowerCase('pt-BR').includes(term)
      || exercise.equipment.toLocaleLowerCase('pt-BR').includes(term)
    ));
  }, [exercises, search]);

  const modelData: IExerciseData[] = activeMuscle === 'cardio'
    ? []
    : [{
        name: 'Músculo selecionado',
        muscles: [activeMuscle],
      }];

  function addExercise(exercise: ExerciseCatalogItem) {
    if (activeDay.exercises.some((item) => item.key === exercise.key)) {
      toast.info('Este exercício já está no treino atual.');
      return;
    }

    setDays((current) => current.map((day) => (
      day.id === activeDay.id
        ? {
          ...day,
          exercises: [...day.exercises, {
            ...exercise,
            sets: 3,
            reps: '10–12',
            restTime: 60,
            method: '',
          }],
        }
        : day
    )));
  }

  function removeExercise(dayId: string, exerciseKey: string) {
    setDays((current) => current.map((day) => (
      day.id === dayId
        ? { ...day, exercises: day.exercises.filter((exercise) => exercise.key !== exerciseKey) }
        : day
    )));
  }

  function updateExercise(
    dayId: string,
    exerciseKey: string,
    field: 'sets' | 'reps' | 'restTime' | 'method',
    value: string | number,
  ) {
    setDays((current) => current.map((day) => (
      day.id === dayId
        ? {
          ...day,
          exercises: day.exercises.map((exercise) => (
            exercise.key === exerciseKey ? { ...exercise, [field]: value } : exercise
          )),
        }
        : day
    )));
  }

  function addDay() {
    if (days.length >= MAX_WORKOUT_DAYS) return;
    const nextDay = createDay(days.length);
    setDays((current) => [...current, nextDay]);
    setActiveDayId(nextDay.id);
    setDaysPerWeek((current) => Math.max(current, days.length + 1));
  }

  function removeDay(dayId: string) {
    if (days.length === 1) return;
    const remaining = days.filter((day) => day.id !== dayId).map((day, index) => ({
      ...day,
      label: workoutDayLabel(index),
      name: day.name === `Treino ${day.label}` ? `Treino ${workoutDayLabel(index)}` : day.name,
    }));
    setDays(remaining);
    setActiveDayId(remaining[0].id);
    setDaysPerWeek((current) => Math.min(current, remaining.length));
  }

  function openSaveDialog() {
    const emptyDay = days.find((day) => day.exercises.length === 0);
    if (emptyDay) {
      setActiveDayId(emptyDay.id);
      goToStep(LAST_MOBILE_STEP);
      toast.error(`Adicione pelo menos um exercício ao Treino ${emptyDay.label}.`);
      return;
    }
    setDaysPerWeek((current) => Math.max(current, days.length));
    setIsSaveOpen(true);
  }

  async function submitPlan() {
    if (!selectedStudentId || !planName.trim()) {
      toast.error('Selecione o aluno e informe o nome da ficha.');
      return;
    }
    if (!Number.isInteger(validityAmount) || validityAmount < 1) {
      toast.error('Informe um prazo válido para a ficha.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = editingPlanId ? `/api/workout-plans/${editingPlanId}` : '/api/workout-plans';
      const response = await fetch(endpoint, {
        method: editingPlanId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(!editingPlanId ? { studentId: selectedStudentId } : {}),
          name: planName,
          goal,
          daysPerWeek,
          endDate,
          days: days.map((day) => ({
            label: day.label,
            name: day.name,
            exercises: day.exercises.map((exercise) => ({
              exerciseKey: exercise.key,
              sets: exercise.sets,
              reps: exercise.reps,
              restTime: exercise.restTime,
              method: exercise.method || undefined,
            })),
          })),
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar a ficha.');

      toast.success(editingPlanId ? 'Ficha atualizada e publicada.' : 'Ficha publicada para o aluno.');
      setIsSaveOpen(false);
      router.push('/workouts');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar a ficha.');
    } finally {
      setSubmitting(false);
    }
  }

  if (editingPlanLoading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-6 animate-spin" /> Carregando ficha para edição...
      </div>
    );
  }

  return (
    <div ref={builderRef} className="space-y-6 pb-28 animate-fade-in xl:pb-10">
      <PageHeader
        kicker="Operação"
        title={editingPlanId ? 'Editar ficha' : 'Montar ficha'}
        description={editingPlanId
          ? 'Personalize a ficha existente e publique uma nova versão para o aluno.'
          : 'Clique em um músculo, escolha os exercícios e publique para o aluno.'}
        actions={
          <Button onClick={openSaveDialog} disabled={totalSelected === 0} className="hidden h-11 xl:inline-flex">
            <Save className="mr-2 size-4" />
            {editingPlanId ? 'Salvar alterações' : 'Publicar ficha'} ({totalSelected})
          </Button>
        }
      />

      <nav aria-label="Etapas do montador" className="xl:hidden">
        <ol className="flex items-stretch gap-2">
          {MOBILE_STEPS.map((step, index) => {
            const current = mobileStep === index;
            return (
              <li key={step.title} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => goToStep(index)}
                  aria-current={current ? 'step' : undefined}
                  className={`w-full rounded-xl border px-2 py-2 text-left transition-colors ${
                    current
                      ? 'border-black bg-black text-[#c9ff32] dark:border-[#c9ff32] dark:bg-[#c9ff32] dark:text-black'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  <span className="block text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">
                    Passo {index + 1}
                  </span>
                  <span className="block truncate text-sm font-bold">{step.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">{MOBILE_STEPS[mobileStep].hint}</p>
      </nav>

      <div className="flex items-start gap-2 rounded-xl border border-info/20 bg-info-wash p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-info" />
        <span>
          Biblioteca com {EXERCISE_CATALOG.length} exercícios. Movimentos compostos aparecem em todos os músculos que ajudam a trabalhar.
          A prescrição deve respeitar a avaliação, as limitações e o nível do aluno.
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[330px_minmax(360px,1fr)_minmax(390px,1fr)]">
        <Card className={`overflow-hidden border-border/60 ${mobileStep === 0 ? 'xl:flex' : 'hidden xl:flex'}`}>
          <CardHeader className="border-b border-border/40 pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Anatomia interativa</CardTitle>
              <div className="flex rounded-lg bg-muted p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`rounded-md px-2.5 py-1 ${gender === 'male' ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'}`}
                >
                  Masc
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`rounded-md px-2.5 py-1 ${gender === 'female' ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'}`}
                >
                  Fem
                </button>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewType((current) => current === 'anterior' ? 'posterior' : 'anterior')}
              className="mt-3 w-full"
            >
              <RotateCcw className="mr-2 size-3.5" />
              Girar para {viewType === 'anterior' ? 'costas' : 'frente'}
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-4">
            <Model
              data={modelData}
              type={viewType}
              bodyType={gender}
              onClick={handleMuscleClick}
              style={{ width: '100%', maxWidth: '250px', cursor: 'pointer' }}
              svgStyle={{ height: 'auto' }}
              bodyColor="#cbd5e1"
              highlightedColors={["#c9ff32"]}
            />
            <p className="mt-3 text-center text-sm font-black text-[#668f00] dark:text-[#c9ff32]">
              {MUSCLE_REGIONS[activeMuscle]}
            </p>
            <div className="mt-4 flex w-full flex-wrap justify-center gap-1.5">
              {(Object.entries(MUSCLE_REGIONS) as Array<[MuscleRegion, string]>).map(([muscle, label]) => (
                <button
                  type="button"
                  key={muscle}
                  onClick={() => selectMuscle(muscle)}
                  className={`rounded-full border px-2 py-1 text-[11px] transition-colors ${
                    activeMuscle === muscle
                      ? 'border-black bg-black text-[#c9ff32] dark:border-[#c9ff32] dark:bg-[#c9ff32] dark:text-black'
                      : 'border-border bg-background text-muted-foreground hover:border-[#9fdb00] hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={`min-w-0 border-border/60 ${mobileStep === 1 ? 'xl:flex' : 'hidden xl:flex'}`}>
          <CardHeader className="space-y-3 border-b border-border/40 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Dumbbell className="size-4" />
                Exercícios: {MUSCLE_REGIONS[activeMuscle]}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {exercises.length} opções trabalham este grupo muscular
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar exercício ou equipamento..."
                className="pl-9"
              />
            </div>
            {/* No celular a ficha em construção está em outra etapa, então o
                treino que vai receber o exercício precisa estar visível aqui. */}
            <div className="flex flex-wrap items-center gap-1.5 xl:hidden">
              <span className="text-xs text-muted-foreground">Adicionando em:</span>
              {days.map((day) => (
                <button
                  type="button"
                  key={day.id}
                  onClick={() => setActiveDayId(day.id)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                    activeDay.id === day.id
                      ? 'border-black bg-black text-[#c9ff32] dark:border-[#c9ff32] dark:bg-[#c9ff32] dark:text-black'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  {day.label} · {day.exercises.length}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="xl:h-[690px]">
              {loading ? (
                <div className="flex h-52 items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 size-5 animate-spin" /> Carregando exercícios...
                </div>
              ) : filteredExercises.length === 0 ? (
                <div className="flex h-52 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  Nenhum exercício corresponde à busca.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {filteredExercises.map((exercise) => {
                    const selected = activeDay.exercises.some((item) => item.key === exercise.key);
                    return (
                      <div key={exercise.key} className="p-4 transition-colors hover:bg-muted/30">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold leading-tight">{exercise.name}</h3>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Badge variant="outline">{exercise.equipment}</Badge>
                              <Badge variant="secondary">{DIFFICULTY_LABELS[exercise.difficulty]}</Badge>
                              {exercise.videoUrl && <Badge className="bg-red-500/10 text-red-600">Com vídeo</Badge>}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant={selected ? 'secondary' : 'default'}
                            disabled={selected}
                            onClick={() => addExercise(exercise)}
                            aria-label={`Adicionar ${exercise.name}`}
                          >
                            {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
                          </Button>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{exercise.instructions}</p>
                        {exercise.videoUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPlayingVideo(exercise.videoUrl)}
                            className="mt-2 px-3 text-xs text-[#668f00]"
                          >
                            <PlayCircle className="mr-1.5 size-3.5" /> Ver execução
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className={`min-w-0 border-border/60 ${mobileStep === 2 ? 'xl:flex' : 'hidden xl:flex'}`}>
          <CardHeader className="space-y-3 border-b border-border/40 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Ficha em construção</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Configure séries, repetições, descanso e método.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addDay} disabled={days.length >= MAX_WORKOUT_DAYS}>
                <Plus className="mr-1 size-3.5" /> Treino
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {days.map((day) => (
                <button
                  type="button"
                  key={day.id}
                  onClick={() => setActiveDayId(day.id)}
                  className={`min-h-11 rounded-full border px-3 py-2 text-xs font-bold ${
                    activeDay.id === day.id
                      ? 'border-black bg-black text-[#c9ff32] dark:border-[#c9ff32] dark:bg-[#c9ff32] dark:text-black'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  {day.label} · {day.exercises.length}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={activeDay.name}
                onChange={(event) => setDays((current) => current.map((day) => (
                  day.id === activeDay.id ? { ...day, name: event.target.value } : day
                )))}
                aria-label="Nome do treino"
              />
              {days.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeDay(activeDay.id)}
                  aria-label="Excluir dia"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="xl:h-[690px]">
              {activeDay.exercises.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center px-8 text-center text-muted-foreground">
                  <Dumbbell className="mb-3 size-9 opacity-30" />
                  <p className="font-medium">Nenhum exercício selecionado</p>
                  <p className="mt-1 text-xs">Escolha um músculo e use o botão + para montar o Treino {activeDay.label}.</p>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {activeDay.exercises.map((exercise, index) => (
                    <div key={exercise.key} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#668f00]">{index + 1}º exercício</span>
                          <h3 className="truncate text-sm font-semibold">{exercise.name}</h3>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExercise(activeDay.id, exercise.key)}
                          className="size-11 shrink-0"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Séries</Label>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={exercise.sets}
                            onChange={(event) => updateExercise(activeDay.id, exercise.key, 'sets', Number(event.target.value))}
                            className="mt-1 px-2 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Repetições</Label>
                          <Input
                            value={exercise.reps}
                            onChange={(event) => updateExercise(activeDay.id, exercise.key, 'reps', event.target.value)}
                            className="mt-1 px-2 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Descanso automático (s)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={900}
                            value={exercise.restTime}
                            onChange={(event) => updateExercise(activeDay.id, exercise.key, 'restTime', Number(event.target.value))}
                            className="mt-1 px-2 text-sm"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label className="text-xs">Método / observação</Label>
                        <Input
                          value={exercise.method}
                          onChange={(event) => updateExercise(activeDay.id, exercise.key, 'method', event.target.value)}
                          placeholder="Ex.: drop-set na última série"
                          className="mt-1 px-2 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="dk-step-bar border-t border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">
              {totalSelected} exercício(s) na ficha
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Treino {activeDay.label} · {activeDay.exercises.length} selecionado(s)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => goToStep(mobileStep - 1)}
            disabled={mobileStep === 0}
            aria-label="Etapa anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          {mobileStep < LAST_MOBILE_STEP ? (
            <Button type="button" onClick={() => goToStep(mobileStep + 1)}>
              Avançar
              <ChevronRight className="ml-1.5 size-4" />
            </Button>
          ) : (
            <Button type="button" onClick={openSaveDialog} disabled={totalSelected === 0}>
              <Save className="mr-1.5 size-4" />
              {editingPlanId ? 'Salvar' : 'Publicar'}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlanId ? 'Salvar nova versão da ficha' : 'Publicar ficha para o aluno'}</DialogTitle>
            <DialogDescription>
              {editingPlanId
                ? 'A versão atual permanece no histórico e a nova passa a ser exibida para o aluno.'
                : 'Ao publicar, esta ficha passa a ser o treino ativo do aluno e a anterior é arquivada.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="student">Aluno</Label>
              <select
                id="student"
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                disabled={Boolean(editingPlanId)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"
              >
                <option value="">Selecione um aluno</option>
                {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
              </select>
              {students.length === 0 && (
                <p className="text-xs text-amber-600">Cadastre um aluno ativo antes de publicar a ficha.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-name">Nome da ficha</Label>
              <Input
                id="plan-name"
                value={planName}
                onChange={(event) => setPlanName(event.target.value)}
                placeholder="Ex.: Hipertrofia — fase 1"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal">Objetivo</Label>
              <Input
                id="goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="Ex.: Ganho de massa muscular"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="frequency">Frequência semanal</Label>
              <Input
                id="frequency"
                type="number"
                min={days.length}
                max={MAX_WORKOUT_DAYS}
                value={daysPerWeek}
                onChange={(event) => setDaysPerWeek(Number(event.target.value))}
              />
              <p className="text-xs text-muted-foreground">A ficha contém {days.length} treino(s) e {totalSelected} exercício(s). Se a frequência for maior que a quantidade de treinos, o sistema alterna e repete a sequência em dias diferentes.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="validity-amount">Prazo da ficha</Label>
              <div className="grid grid-cols-[1fr_1.4fr] gap-2">
                <Input
                  id="validity-amount"
                  type="number"
                  min={1}
                  max={365}
                  value={validityAmount}
                  onChange={(event) => setValidityAmount(Number(event.target.value))}
                />
                <select
                  aria-label="Unidade do prazo"
                  value={validityUnit}
                  onChange={(event) => setValidityUnit(event.target.value as PlanValidityUnit)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"
                >
                  <option value="days">dia(s)</option>
                  <option value="weeks">semana(s)</option>
                  <option value="months">mês(es)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5 text-xs">
                <CalendarClock className="size-4 text-primary" />
                <span>Nova versão válida de <strong>{formatPlanDate(startDate)}</strong> até <strong>{formatPlanDate(endDate)}</strong>.</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveOpen(false)}>Cancelar</Button>
            <Button onClick={() => void submitPlan()} disabled={submitting || students.length === 0}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingPlanId ? 'Salvar e publicar' : 'Publicar agora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(playingVideo)} onOpenChange={(open) => !open && setPlayingVideo(null)}>
        <DialogContent className="overflow-hidden border-zinc-800 bg-black p-0 sm:max-w-3xl">
          <DialogTitle className="sr-only">Vídeo de execução do exercício</DialogTitle>
          <div className="aspect-video w-full bg-black">
            {playingVideo && (
              <video src={playingVideo} controls autoPlay playsInline className="size-full object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
