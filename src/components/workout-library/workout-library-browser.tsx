'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Dumbbell,
  Download,
  Eye,
  Filter,
  Flame,
  Layers,
  Loader2,
  Lock,
  Search,
  Send,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { isDemoUser } from '@/lib/auth/demo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exerciseThumbnailUrl } from '@/lib/exercises/media';
import { downloadPdfFile } from '@/lib/pdf/download-client';

type LibraryMode = 'trainer' | 'individual';

interface TemplateSummary {
  id: string;
  title: string;
  audience: 'male' | 'female';
  audienceLabel: string;
  goal: 'hypertrophy' | 'definition' | 'general';
  goalLabel: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  levelLabel: string;
  month: number | null;
  durationWeeks: number;
  daysPerWeek: number;
  description: string;
  workoutDayCount: number;
  exerciseCount: number;
  previewExercises: Array<{ name: string; videoUrl: string | null }>;
}

interface TemplateDetail extends Omit<TemplateSummary, 'audienceLabel' | 'goalLabel' | 'levelLabel' | 'previewExercises'> {
  days: Array<{
    label: string;
    name: string;
    exercises: Array<{
      exerciseKey: string;
      sourceName: string;
      sets: number;
      reps: string;
      restTime: number;
      method: string;
      methodNotes: string;
      primaryMuscleLabel: string;
      catalog: { name: string; equipment: string; instructions: string; videoUrl: string | null };
    }>;
  }>;
}

interface StudentSummary {
  id: string;
  name: string;
  status: string;
}

const METHOD_LABELS: Record<string, string> = {
  standard: 'Tradicional',
  dropset: 'Drop set',
  rest_pause: 'Rest-pause',
  to_failure: 'Até a falha',
  partial_reps: 'Repetições parciais',
  biset: 'Biset',
  triset: 'Triset',
  circuit: 'Circuito',
  pyramid_ascending: 'Pirâmide crescente',
  superset: 'Superset',
  giant_set: 'Giant set',
};

interface CategoryOption {
  id: string;
  label: string;
  icon?: string;
  matches: (template: TemplateSummary) => boolean;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'all',
    label: 'Todas as categorias',
    matches: () => true,
  },
  {
    id: 'gluteos_pernas',
    label: 'Glúteos & Pernas',
    icon: '🍑',
    matches: (t) => {
      const txt = `${t.title} ${t.description}`.toLowerCase();
      return (
        txt.includes('glúteo') ||
        txt.includes('gluteo') ||
        txt.includes('quadríceps') ||
        txt.includes('quadriceps') ||
        txt.includes('posterior') ||
        txt.includes('pernas') ||
        txt.includes('inferior') ||
        txt.includes('abdut')
      );
    },
  },
  {
    id: 'peito_ombros',
    label: 'Peitoral & Ombros',
    icon: '🛡️',
    matches: (t) => {
      const txt = `${t.title} ${t.description}`.toLowerCase();
      return (
        txt.includes('peitoral') ||
        txt.includes('peito') ||
        txt.includes('ombro') ||
        txt.includes('deltoid') ||
        txt.includes('push')
      );
    },
  },
  {
    id: 'costas',
    label: 'Costas & Densidade',
    icon: '🦅',
    matches: (t) => {
      const txt = `${t.title} ${t.description}`.toLowerCase();
      return (
        txt.includes('costas') ||
        txt.includes('dorsal') ||
        txt.includes('remada') ||
        txt.includes('largura') ||
        txt.includes('espessura') ||
        txt.includes('pull')
      );
    },
  },
  {
    id: 'bracos',
    label: 'Braços & Detalhes',
    icon: '💪',
    matches: (t) => {
      const txt = `${t.title} ${t.description}`.toLowerCase();
      return (
        txt.includes('braço') ||
        txt.includes('braco') ||
        txt.includes('bíceps') ||
        txt.includes('tríceps') ||
        txt.includes('biceps') ||
        txt.includes('triceps')
      );
    },
  },
  {
    id: 'upper_lower',
    label: 'Upper / Lower & Torso',
    icon: '⚡',
    matches: (t) => {
      const txt = `${t.title} ${t.description}`.toLowerCase();
      return txt.includes('upper') || txt.includes('torso') || txt.includes('superior');
    },
  },
  {
    id: 'full_body',
    label: 'Full Body & Atléticos',
    icon: '🌐',
    matches: (t) => {
      const txt = `${t.title} ${t.description}`.toLowerCase();
      return txt.includes('full body') || txt.includes('full') || txt.includes('atlético') || txt.includes('atletico');
    },
  },
  {
    id: 'maquinas',
    label: '100% Máquinas',
    icon: '⚙️',
    matches: (t) => {
      const txt = `${t.title} ${t.description}`.toLowerCase();
      return txt.includes('máquina') || txt.includes('maquina');
    },
  },
  {
    id: 'halteres',
    label: 'Halteres & Livre',
    icon: '🏋️',
    matches: (t) => {
      const txt = `${t.title} ${t.description}`.toLowerCase();
      return txt.includes('halter') || txt.includes('livre');
    },
  },
  {
    id: 'express',
    label: 'Express (45–55 min)',
    icon: '⏱️',
    matches: (t) => {
      const txt = `${t.title} ${t.description}`.toLowerCase();
      return txt.includes('45') || txt.includes('55') || txt.includes('densidade');
    },
  },
  {
    id: 'forca',
    label: 'Força & Alta Intensidade',
    icon: '🔥',
    matches: (t) => {
      const txt = `${t.title} ${t.description}`.toLowerCase();
      return txt.includes('força') || txt.includes('forca') || txt.includes('avançad') || txt.includes('intensidade');
    },
  },
];

function getTemplateCategoryBadge(template: TemplateSummary) {
  const txt = `${template.title} ${template.description}`.toLowerCase();
  if (txt.includes('glúteo') || txt.includes('gluteo') || txt.includes('abdut')) return { label: 'Glúteos & Quadril', icon: '🍑' };
  if (txt.includes('quadríceps') || txt.includes('quadriceps') || txt.includes('pernas') || txt.includes('posterior')) return { label: 'Pernas & Coxas', icon: '🦵' };
  if (txt.includes('peitoral') || txt.includes('peito')) return { label: 'Peitoral', icon: '🛡️' };
  if (txt.includes('ombro') || txt.includes('deltoid')) return { label: 'Ombros 3D', icon: '🎯' };
  if (txt.includes('costas') || txt.includes('dorsal')) return { label: 'Costas & Asa', icon: '🦅' };
  if (txt.includes('braço') || txt.includes('braco') || txt.includes('bíceps') || txt.includes('tríceps')) return { label: 'Braços', icon: '💪' };
  if (txt.includes('máquina') || txt.includes('maquina')) return { label: 'Máquinas', icon: '⚙️' };
  if (txt.includes('halter')) return { label: 'Halteres', icon: '🏋️' };
  if (txt.includes('upper') || txt.includes('torso')) return { label: 'Upper / Lower', icon: '⚡' };
  if (txt.includes('full body') || txt.includes('full')) return { label: 'Full Body', icon: '🌐' };
  if (txt.includes('45') || txt.includes('densidade')) return { label: 'Express 45m', icon: '⏱️' };
  if (txt.includes('força') || txt.includes('forca')) return { label: 'Força', icon: '🔥' };
  return { label: 'Hipertrofia', icon: '✨' };
}

function ExerciseImage({ name, videoUrl, className = '' }: { name: string; videoUrl: string | null; className?: string }) {
  const thumbnail = exerciseThumbnailUrl(videoUrl);
  return (
    <div className={`relative overflow-hidden bg-[#11130e] ${className}`}>
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={`Demonstração de ${name}`}
          fill
          unoptimized
          sizes="(max-width: 768px) 33vw, 180px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full min-h-20 items-center justify-center text-center text-[10px] font-black uppercase tracking-[0.18em] text-[#c9ff32]">
          G KONG
          <br />
          Movimento
        </div>
      )}
    </div>
  );
}

export function WorkoutLibraryBrowser({ mode }: { mode: LibraryMode }) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [selected, setSelected] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState('');
  const [working, setWorking] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [search, setSearch] = useState('');
  const [genderTab, setGenderTab] = useState<'all' | 'male' | 'female'>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [goal, setGoal] = useState('all');
  const [level, setLevel] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [libraryResponse, studentResponse] = await Promise.all([
          fetch('/api/workout-library', { cache: 'no-store' }),
          mode === 'trainer' ? fetch('/api/students', { cache: 'no-store' }) : Promise.resolve(null),
        ]);
        const libraryData = (await libraryResponse.json()) as { templates?: TemplateSummary[]; error?: string };
        if (!libraryResponse.ok) throw new Error(libraryData.error || 'Não foi possível carregar a Biblioteca.');
        if (!active) return;
        setTemplates(libraryData.templates ?? []);
        if (studentResponse?.ok) {
          const studentData = (await studentResponse.json()) as { students?: StudentSummary[] };
          setStudents((studentData.students ?? []).filter((student) => student.status === 'active'));
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a Biblioteca.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [mode]);

  const maleCount = useMemo(() => templates.filter((t) => t.audience === 'male').length, [templates]);
  const femaleCount = useMemo(() => templates.filter((t) => t.audience === 'female').length, [templates]);

  const activeCategoryObj = useMemo(
    () => CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0],
    [selectedCategory]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return templates.filter((template) => {
      const matchSearch =
        !term ||
        `${template.title} ${template.description} ${template.goalLabel}`
          .toLocaleLowerCase('pt-BR')
          .includes(term);
      const matchGender = genderTab === 'all' || template.audience === genderTab;
      const matchCategory = selectedCategory === 'all' || activeCategoryObj.matches(template);
      const matchGoal = goal === 'all' || template.goal === goal;
      const matchLevel = level === 'all' || template.level === level;

      return matchSearch && matchGender && matchCategory && matchGoal && matchLevel;
    });
  }, [activeCategoryObj, genderTab, goal, level, search, selectedCategory, templates]);

  async function openTemplate(templateId: string) {
    setDetailLoading(templateId);
    setStudentId('');
    try {
      const response = await fetch(`/api/workout-library/${templateId}`, { cache: 'no-store' });
      const data = (await response.json()) as { template?: TemplateDetail; error?: string };
      if (!response.ok || !data.template) throw new Error(data.error || 'Não foi possível abrir esta ficha.');
      setSelected(data.template);
    } catch (loadError) {
      toast.error(loadError instanceof Error ? loadError.message : 'Não foi possível abrir esta ficha.');
    } finally {
      setDetailLoading('');
    }
  }

  async function applyTemplate() {
    if (!selected || (mode === 'trainer' && !studentId)) return;
    setWorking(true);
    try {
      const endpoint =
        mode === 'trainer'
          ? `/api/workout-library/${selected.id}/assign`
          : `/api/workout-library/${selected.id}/adopt`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: mode === 'trainer' ? JSON.stringify({ studentId }) : undefined,
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível usar esta ficha.');
      toast.success(data.message || 'Ficha publicada com sucesso.');
      setSelected(null);
      setStudentId('');
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Não foi possível usar esta ficha.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-8 pb-14 animate-fade-in">
      <PageHeader
        kicker="Acervo Profissional G KONG"
        title="Biblioteca de Fichas"
        description={
          mode === 'trainer'
            ? 'Escolha um programa completo masculino ou feminino, confira cada exercício com fotos e publique para o aluno em segundos.'
            : 'Escolha uma ficha profissional para seu objetivo, baixe o PDF diagramado com imagens ou ative para treinar hoje.'
        }
      />

      {/* Hero Banner with Stats */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#090a08] px-6 py-8 text-white shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:px-8 lg:px-10">
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-[#c9ff32]/14 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 size-72 rounded-full bg-[#38bdf8]/10 blur-3xl pointer-events-none" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9ff32]/30 bg-[#c9ff32]/10 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#c9ff32]">
              <Sparkles className="size-3.5" /> Acervo Oficial Consolidado
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl text-white">
              172 fichas completas, 664 rotinas e mais de 3.600 prescrições
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              Coleção completa de programas estruturados (H01 a H75 masculinos e F01 a F75 femininos) com fotos locais,
              métodos de treino, contagem de descanso e PDF pronto para download no padrão G KONG.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center sm:min-w-[340px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-2xl font-black text-[#38bdf8]">{maleCount || 87}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-white/60">Homens</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-2xl font-black text-[#f472b6]">{femaleCount || 85}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-white/60">Mulheres</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-2xl font-black text-[#c9ff32]">PDF</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-white/60">com Fotos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Gender Navigation Switcher */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-[#c9ff32]" />
            <span className="text-sm font-black uppercase tracking-wider text-foreground">Público do Treino</span>
          </div>

          <div className="inline-flex rounded-2xl border bg-card/60 p-1.5 shadow-sm backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setGenderTab('all')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                genderTab === 'all'
                  ? 'bg-foreground text-background shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="size-3.5" /> Todos os Treinos
              <Badge variant={genderTab === 'all' ? 'outline' : 'secondary'} className="ml-1 px-1.5 py-0 text-[10px]">
                {templates.length}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setGenderTab('male')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                genderTab === 'male'
                  ? 'bg-[#0284c7] text-white shadow-md'
                  : 'text-muted-foreground hover:text-[#38bdf8]'
              }`}
            >
              <Dumbbell className="size-3.5" /> Masculino (Homens)
              <Badge
                variant="secondary"
                className={`ml-1 px-1.5 py-0 text-[10px] ${
                  genderTab === 'male' ? 'bg-white/20 text-white' : ''
                }`}
              >
                {maleCount}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setGenderTab('female')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                genderTab === 'female'
                  ? 'bg-[#db2777] text-white shadow-md'
                  : 'text-muted-foreground hover:text-[#f472b6]'
              }`}
            >
              <Sparkles className="size-3.5" /> Feminino (Mulheres)
              <Badge
                variant="secondary"
                className={`ml-1 px-1.5 py-0 text-[10px] ${
                  genderTab === 'female' ? 'bg-white/20 text-white' : ''
                }`}
              >
                {femaleCount}
              </Badge>
            </button>
          </div>
        </div>

        {/* Focus / Category Pills Horizontal Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold flex items-center gap-1.5">
              <Filter className="size-3.5 text-[#c9ff32]" /> Filtrar por Foco Muscular ou Método:
            </span>
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="text-[11px] font-bold text-[#c9ff32] hover:underline"
              >
                Limpar categoria
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                    isSelected
                      ? 'border-[#c9ff32] bg-[#c9ff32]/15 text-[#c9ff32] shadow-[0_0_20px_rgba(201,255,50,0.15)] ring-1 ring-[#c9ff32]'
                      : 'border-border/60 bg-card/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  }`}
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Advanced Filters Toolbar */}
      <div className="grid gap-3 rounded-2xl border bg-card/80 p-4 backdrop-blur-sm lg:grid-cols-[1fr_220px_180px]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar ficha por nome, músculo ou objetivo (ex: Glúteos, Peito, H01, F01)..."
            className="h-11 pl-10 rounded-xl"
          />
        </div>
        <Select value={goal} onValueChange={(value) => setGoal(value ?? 'all')}>
          <SelectTrigger className="h-11 w-full rounded-xl">
            <SelectValue placeholder="Objetivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os objetivos</SelectItem>
            <SelectItem value="hypertrophy">Hipertrofia</SelectItem>
            <SelectItem value="definition">Definição e emagrecimento</SelectItem>
            <SelectItem value="general">Condicionamento geral</SelectItem>
          </SelectContent>
        </Select>
        <Select value={level} onValueChange={(value) => setLevel(value ?? 'all')}>
          <SelectTrigger className="h-11 w-full rounded-xl">
            <SelectValue placeholder="Nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os níveis</SelectItem>
            <SelectItem value="beginner">Iniciante</SelectItem>
            <SelectItem value="intermediate">Intermediário</SelectItem>
            <SelectItem value="advanced">Avançado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Mostrando <strong className="text-foreground font-black">{filtered.length}</strong> de{' '}
          {templates.length} programas disponíveis
        </span>
        {(search || genderTab !== 'all' || selectedCategory !== 'all' || goal !== 'all' || level !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setGenderTab('all');
              setSelectedCategory('all');
              setGoal('all');
              setLevel('all');
            }}
            className="h-7 text-[11px] font-bold text-[#c9ff32]"
          >
            Redefinir filtros
          </Button>
        )}
      </div>

      {/* Grid of Templates */}
      {loading ? (
        <div className="flex justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin text-[#c9ff32]" /> Organizando a Biblioteca de Fichas...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-14 text-center">
          <Search className="mx-auto size-10 text-muted-foreground/30" />
          <h2 className="mt-4 font-black text-lg">Nenhuma ficha encontrada</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tente ajustar os filtros de público, categoria ou termo de busca.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((template) => {
            const catBadge = getTemplateCategoryBadge(template);
            const isFemale = template.audience === 'female';

            return (
              <Card
                key={template.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-[#c9ff32]/60 hover:shadow-[0_20px_60px_rgba(201,255,50,0.12)]"
              >
                {/* 3 Exercise Photo Thumbnails Preview */}
                <div className="grid h-36 grid-cols-3 gap-px bg-border/80">
                  {template.previewExercises.map((exercise) => (
                    <ExerciseImage
                      key={`${template.id}-${exercise.name}`}
                      name={exercise.name}
                      videoUrl={exercise.videoUrl}
                      className="h-36"
                    />
                  ))}
                  {Array.from({ length: Math.max(0, 3 - template.previewExercises.length) }, (_, index) => (
                    <ExerciseImage
                      key={`${template.id}-placeholder-${index}`}
                      name="G KONG"
                      videoUrl={null}
                      className="h-36"
                    />
                  ))}
                </div>

                <CardHeader className="pb-3 pt-4 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      className={
                        isFemale
                          ? 'bg-[#db2777]/90 text-white hover:bg-[#db2777]'
                          : 'bg-[#0284c7]/90 text-white hover:bg-[#0284c7]'
                      }
                    >
                      {template.audienceLabel}
                    </Badge>
                    <Badge variant="outline" className="border-border text-foreground font-semibold">
                      {catBadge.icon} {catBadge.label}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {template.levelLabel}
                    </Badge>
                    {template.month && (
                      <Badge variant="secondary">Mês {String(template.month).padStart(2, '0')}</Badge>
                    )}
                  </div>

                  <CardTitle className="mt-3 text-xl leading-tight font-black">{template.title}</CardTitle>
                  <p className="line-clamp-2 text-xs leading-5 text-muted-foreground mt-1.5">
                    {template.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-muted/60 p-2.5">
                      <p className="font-black text-sm">{template.workoutDayCount}</p>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Rotinas</p>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-2.5">
                      <p className="font-black text-sm">{template.exerciseCount}</p>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Exercícios</p>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-2.5">
                      <p className="font-black text-sm text-[#c9ff32]">{template.daysPerWeek}x</p>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Semana</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => void openTemplate(template.id)}
                      disabled={detailLoading === template.id}
                      className="rounded-xl font-bold"
                    >
                      {detailLoading === template.id ? (
                        <Loader2 className="mr-2 size-4 animate-spin text-[#c9ff32]" />
                      ) : (
                        <Eye className="mr-2 size-4 text-[#c9ff32]" />
                      )}
                      Ver ficha
                    </Button>
                    {isDemoUser(user?.id) ? (
                      <Button
                        variant="outline"
                        onClick={() =>
                          toast.error('Exclusivo para assinantes.', {
                            description: 'Assine o G KONG para liberar o download de todas as fichas.',
                            action: {
                              label: 'Ver planos',
                              onClick: () => {
                                window.location.href = '/';
                              },
                            },
                          })
                        }
                        className="rounded-xl font-bold"
                      >
                        <Lock className="mr-2 size-4" /> PDF
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => void downloadPdfFile(`/api/workout-library/${template.id}/pdf`, `${template.title}.pdf`)}
                        className="rounded-xl font-bold"
                      >
                        <Download className="mr-2 size-4 text-[#c9ff32]" /> PDF
                      </Button>
                    )}
                  </div>

                  <Button
                    className="w-full rounded-xl font-black bg-foreground text-background hover:bg-foreground/90"
                    onClick={() => void openTemplate(template.id)}
                    disabled={detailLoading === template.id}
                  >
                    {mode === 'trainer' ? <Send className="mr-2 size-4" /> : <CheckCircle2 className="mr-2 size-4" />}
                    {mode === 'trainer' ? 'Enviar para aluno' : 'Usar esta ficha'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Dialog with Full Workout Plan Details */}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open && !working) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-5xl rounded-3xl border-border/80 shadow-2xl">
          {selected && (
            <>
              <div className="sticky top-0 z-10 border-b bg-popover/95 p-5 pr-14 backdrop-blur-xl sm:p-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(null)}
                  className="mb-3 h-8 px-2.5 text-xs font-bold text-foreground/80 hover:bg-accent sm:hidden"
                >
                  <ArrowLeft className="mr-1.5 size-4 text-[#c9ff32]" /> Voltar ao Acervo
                </Button>
                <DialogHeader>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className={
                        selected.audience === 'female'
                          ? 'bg-[#db2777] text-white hover:bg-[#db2777]'
                          : 'bg-[#0284c7] text-white hover:bg-[#0284c7]'
                      }
                    >
                      {selected.audience === 'female' ? 'Feminino' : 'Masculino'}
                    </Badge>
                    <Badge variant="outline">8 semanas</Badge>
                    <Badge variant="outline">{selected.daysPerWeek}x por semana</Badge>
                  </div>
                  <DialogTitle className="mt-2 text-2xl font-black">{selected.title}</DialogTitle>
                  <DialogDescription className="text-sm">{selected.description}</DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-5 sm:px-6 py-2">
                <Tabs defaultValue={selected.days[0]?.label}>
                  <TabsList className="h-12 max-w-full overflow-x-auto rounded-2xl bg-muted/60 p-1.5">
                    {selected.days.map((day) => (
                      <TabsTrigger key={day.label} value={day.label} className="rounded-xl px-4 font-bold text-xs">
                        Ficha {day.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {selected.days.map((day) => (
                    <TabsContent key={day.label} value={day.label} className="mt-5 space-y-4">
                      <div className="flex items-center justify-between gap-4 border-b pb-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#c9ff32]">
                            Rotina {day.label}
                          </p>
                          <h3 className="text-lg font-black">{day.name}</h3>
                        </div>
                        <Badge variant="secondary" className="font-bold">
                          {day.exercises.length} exercícios
                        </Badge>
                      </div>

                      <div className="grid gap-3.5 md:grid-cols-2">
                        {day.exercises.map((exercise, index) => (
                          <div
                            key={`${day.label}-${exercise.exerciseKey}-${index}`}
                            className="grid grid-cols-[100px_1fr] overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:border-[#c9ff32]/40"
                          >
                            <ExerciseImage
                              name={exercise.sourceName || exercise.catalog.name}
                              videoUrl={exercise.catalog.videoUrl}
                              className="min-h-32"
                            />
                            <div className="min-w-0 p-3.5 flex flex-col justify-between">
                              <div>
                                <div className="flex items-start gap-2">
                                  <span className="text-[11px] font-black text-[#c9ff32]">
                                    {String(index + 1).padStart(2, '0')}
                                  </span>
                                  <h4 className="leading-tight font-bold text-sm">
                                    {exercise.sourceName || exercise.catalog.name}
                                  </h4>
                                </div>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  {exercise.primaryMuscleLabel} · {exercise.catalog.equipment}
                                </p>
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-border/40">
                                <p className="text-xs font-black text-foreground">
                                  {exercise.sets} séries · {exercise.reps} reps · {exercise.restTime}s descanso
                                </p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  <Badge variant="outline" className="text-[9px] font-bold py-0">
                                    {METHOD_LABELS[exercise.method] || exercise.method}
                                  </Badge>
                                  {exercise.methodNotes && (
                                    <span className="text-[10px] text-muted-foreground line-clamp-1">
                                      {exercise.methodNotes}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              <DialogFooter className="sticky bottom-0 mt-4 bg-popover/95 p-5 backdrop-blur-xl border-t flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {isDemoUser(user?.id) ? (
                    <Button
                      variant="outline"
                      onClick={() =>
                        toast.error('Exclusivo para assinantes.', {
                          description: 'Assine o G KONG para liberar o download de todas as fichas.',
                          action: {
                            label: 'Ver planos',
                            onClick: () => {
                              window.location.href = '/';
                            },
                          },
                        })
                      }
                      className="rounded-xl font-bold"
                    >
                      <Lock className="mr-2 size-4" /> Baixar PDF
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => void downloadPdfFile(`/api/workout-library/${selected.id}/pdf`, `${selected.title}.pdf`)}
                      className="rounded-xl font-bold"
                    >
                      <Download className="mr-2 size-4 text-[#c9ff32]" /> Baixar PDF
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {mode === 'trainer' && (
                    <Select value={studentId} onValueChange={(value) => setStudentId(value ?? '')}>
                      <SelectTrigger className="h-10 w-full sm:w-64 rounded-xl">
                        <SelectValue placeholder="Escolha o aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.length ? (
                          students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            Nenhum aluno ativo
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    onClick={() => void applyTemplate()}
                    disabled={working || (mode === 'trainer' && !studentId)}
                    className="rounded-xl font-black bg-[#c9ff32] text-black hover:bg-[#c9ff32]/90"
                  >
                    {working ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : mode === 'trainer' ? (
                      <Send className="mr-2 size-4" />
                    ) : (
                      <CheckCircle2 className="mr-2 size-4" />
                    )}
                    {mode === 'trainer' ? 'Publicar para aluno' : 'Ativar por 8 semanas'}
                  </Button>
                </div>
              </DialogFooter>
              <p className="px-5 pb-5 text-xs leading-5 text-muted-foreground sm:px-6">
                {mode === 'trainer'
                  ? 'Ao publicar, esta ficha fica ativa para o aluno e a ficha ativa anterior vai para o histórico.'
                  : 'Ao ativar, sua ficha atual vai para o histórico e este programa aparece imediatamente em Ficha do dia.'}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
