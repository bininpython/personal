'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, Eye, Loader2, Lock, Search, Send, Sparkles } from 'lucide-react';
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
  standard: 'Tradicional', dropset: 'Drop set', rest_pause: 'Rest-pause', to_failure: 'Até a falha',
  partial_reps: 'Repetições parciais', biset: 'Biset', triset: 'Triset', circuit: 'Circuito',
  pyramid_ascending: 'Pirâmide crescente', superset: 'Superset', giant_set: 'Giant set',
};

function ExerciseImage({ name, videoUrl, className = '' }: { name: string; videoUrl: string | null; className?: string }) {
  const thumbnail = exerciseThumbnailUrl(videoUrl);
  return (
    <div className={`relative overflow-hidden bg-[#11130e] ${className}`}>
      {thumbnail ? (
        <Image src={thumbnail} alt={`Demonstração de ${name}`} fill unoptimized sizes="(max-width: 768px) 33vw, 180px" className="object-cover" />
      ) : (
        <div className="flex h-full min-h-20 items-center justify-center text-center text-[10px] font-black uppercase tracking-[0.18em] text-[#c9ff32]">G KONG<br />Movimento</div>
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
  const [audience, setAudience] = useState('all');
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
        const libraryData = await libraryResponse.json() as { templates?: TemplateSummary[]; error?: string };
        if (!libraryResponse.ok) throw new Error(libraryData.error || 'Não foi possível carregar a Biblioteca.');
        if (!active) return;
        setTemplates(libraryData.templates ?? []);
        if (studentResponse?.ok) {
          const studentData = await studentResponse.json() as { students?: StudentSummary[] };
          setStudents((studentData.students ?? []).filter((student) => student.status === 'active'));
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a Biblioteca.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [mode]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return templates.filter((template) => (
      (!term || `${template.title} ${template.description} ${template.goalLabel}`.toLocaleLowerCase('pt-BR').includes(term))
      && (audience === 'all' || template.audience === audience)
      && (goal === 'all' || template.goal === goal)
      && (level === 'all' || template.level === level)
    ));
  }, [audience, goal, level, search, templates]);

  async function openTemplate(templateId: string) {
    setDetailLoading(templateId);
    setStudentId('');
    try {
      const response = await fetch(`/api/workout-library/${templateId}`, { cache: 'no-store' });
      const data = await response.json() as { template?: TemplateDetail; error?: string };
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
      const endpoint = mode === 'trainer'
        ? `/api/workout-library/${selected.id}/assign`
        : `/api/workout-library/${selected.id}/adopt`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: mode === 'trainer' ? JSON.stringify({ studentId }) : undefined,
      });
      const data = await response.json() as { error?: string; message?: string };
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
    <div className="space-y-7 pb-12 animate-fade-in">
      <PageHeader
        kicker="Acervo G KONG"
        title="Biblioteca de fichas"
        description={mode === 'trainer'
          ? 'Escolha um programa completo, confira cada exercício e publique para o aluno em poucos segundos.'
          : 'Escolha uma ficha profissional, baixe o PDF ou ative o programa para iniciar seus treinos.'}
      />

      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#090a08] px-6 py-8 text-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:px-8 lg:px-10">
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-[#c9ff32]/12 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9ff32]/30 bg-[#c9ff32]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#c9ff32]"><Sparkles className="size-3.5" /> Programas revisados</div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">22 fichas prontas, 64 rotinas e mais de 500 prescrições</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Conteúdo consolidado das planilhas mensais de homens e mulheres, com métodos estruturados, vídeos e PDF no padrão G KONG.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-2xl font-black text-[#c9ff32]">8</p><p className="text-[10px] uppercase tracking-wider text-white/55">semanas</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-2xl font-black text-[#c9ff32]">PDF</p><p className="text-[10px] uppercase tracking-wider text-white/55">com imagens</p></div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 rounded-2xl border bg-card p-4 lg:grid-cols-[1fr_180px_220px_180px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ficha ou objetivo..." className="h-11 pl-10" /></div>
        <Select value={audience} onValueChange={(value) => setAudience(value ?? 'all')}><SelectTrigger className="h-11 w-full"><SelectValue placeholder="Público" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os públicos</SelectItem><SelectItem value="female">Feminino</SelectItem><SelectItem value="male">Masculino</SelectItem></SelectContent></Select>
        <Select value={goal} onValueChange={(value) => setGoal(value ?? 'all')}><SelectTrigger className="h-11 w-full"><SelectValue placeholder="Objetivo" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os objetivos</SelectItem><SelectItem value="hypertrophy">Hipertrofia</SelectItem><SelectItem value="definition">Definição e emagrecimento</SelectItem><SelectItem value="general">Condicionamento geral</SelectItem></SelectContent></Select>
        <Select value={level} onValueChange={(value) => setLevel(value ?? 'all')}><SelectTrigger className="h-11 w-full"><SelectValue placeholder="Nível" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os níveis</SelectItem><SelectItem value="beginner">Iniciante</SelectItem><SelectItem value="intermediate">Intermediário</SelectItem><SelectItem value="advanced">Avançado</SelectItem></SelectContent></Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Organizando a Biblioteca...</div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-14 text-center"><Search className="mx-auto size-10 text-muted-foreground/30" /><h2 className="mt-4 font-black">Nenhuma ficha encontrada</h2><p className="mt-2 text-sm text-muted-foreground">Altere os filtros para visualizar outros programas.</p></div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((template) => (
            <Card key={template.id} className="group overflow-hidden transition-all hover:-translate-y-1 hover:border-[#9fdb00]/50 hover:shadow-[0_20px_60px_rgba(77,101,0,0.12)]">
              <div className="grid h-32 grid-cols-3 gap-px bg-border">
                {template.previewExercises.map((exercise) => <ExerciseImage key={`${template.id}-${exercise.name}`} name={exercise.name} videoUrl={exercise.videoUrl} className="h-32" />)}
                {Array.from({ length: Math.max(0, 3 - template.previewExercises.length) }, (_, index) => <ExerciseImage key={`${template.id}-placeholder-${index}`} name="G KONG" videoUrl={null} className="h-32" />)}
              </div>
              <CardHeader className="pb-4">
                <div className="flex flex-wrap gap-2"><Badge className="bg-[#c9ff32] text-black hover:bg-[#c9ff32]">{template.audienceLabel}</Badge><Badge variant="outline">{template.levelLabel}</Badge>{template.month && <Badge variant="secondary">Mês {String(template.month).padStart(2, '0')}</Badge>}</div>
                <CardTitle className="mt-2 text-xl leading-tight">{template.title}</CardTitle>
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{template.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-muted/55 p-3"><p className="font-black">{template.workoutDayCount}</p><p className="text-[9px] uppercase text-muted-foreground">Fichas</p></div><div className="rounded-xl bg-muted/55 p-3"><p className="font-black">{template.exerciseCount}</p><p className="text-[9px] uppercase text-muted-foreground">Exercícios</p></div><div className="rounded-xl bg-muted/55 p-3"><p className="font-black">{template.daysPerWeek}x</p><p className="text-[9px] uppercase text-muted-foreground">Semana</p></div></div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => void openTemplate(template.id)} disabled={detailLoading === template.id}>
                    {detailLoading === template.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Eye className="mr-2 size-4" />} Ver ficha
                  </Button>
                  {isDemoUser(user?.id) ? (
                    <Button variant="outline" onClick={() => toast.error('Exclusivo para assinantes.', { description: 'Assine o G KONG para liberar o download de todas as fichas.', action: { label: 'Ver planos', onClick: () => { window.location.href = '/'; } } })}>
                      <Lock className="mr-2 size-4" /> PDF
                    </Button>
                  ) : (
                    <Button nativeButton={false} variant="outline" render={<a href={`/api/workout-library/${template.id}/pdf`} download />}>
                      <Download className="mr-2 size-4" /> PDF
                    </Button>
                  )}
                </div>
                <Button className="w-full" onClick={() => void openTemplate(template.id)} disabled={detailLoading === template.id}>{mode === 'trainer' ? <Send className="mr-2 size-4" /> : <CheckCircle2 className="mr-2 size-4" />}{mode === 'trainer' ? 'Enviar para aluno' : 'Usar esta ficha'}</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open && !working) setSelected(null); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-5xl">
          {selected && <>
            <div className="sticky top-0 z-10 border-b bg-popover/95 p-5 pr-14 backdrop-blur-xl sm:p-6">
              <DialogHeader><div className="flex flex-wrap gap-2"><Badge className="bg-[#c9ff32] text-black">{selected.audience === 'female' ? 'Feminino' : 'Masculino'}</Badge><Badge variant="outline">8 semanas</Badge><Badge variant="outline">{selected.daysPerWeek}x por semana</Badge></div><DialogTitle className="mt-2 text-2xl font-black">{selected.title}</DialogTitle><DialogDescription>{selected.description}</DialogDescription></DialogHeader>
            </div>
            <div className="px-5 sm:px-6">
              <Tabs defaultValue={selected.days[0]?.label}><TabsList className="h-11 max-w-full overflow-x-auto">{selected.days.map((day) => <TabsTrigger key={day.label} value={day.label} className="px-4">Ficha {day.label}</TabsTrigger>)}</TabsList>{selected.days.map((day) => <TabsContent key={day.label} value={day.label} className="mt-5"><div className="mb-4 flex items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#668b00]">Rotina {day.label}</p><h3 className="text-lg font-black">{day.name}</h3></div><Badge variant="secondary">{day.exercises.length} exercícios</Badge></div><div className="grid gap-3 md:grid-cols-2">{day.exercises.map((exercise, index) => <div key={`${day.label}-${exercise.exerciseKey}-${index}`} className="grid grid-cols-[96px_1fr] overflow-hidden rounded-2xl border bg-card"><ExerciseImage name={exercise.sourceName || exercise.catalog.name} videoUrl={exercise.catalog.videoUrl} className="min-h-32" /><div className="min-w-0 p-3"><div className="flex items-start gap-2"><span className="text-[10px] font-black text-[#668b00]">{String(index + 1).padStart(2, '0')}</span><h4 className="leading-5 font-bold">{exercise.sourceName || exercise.catalog.name}</h4></div><p className="mt-1 text-[11px] text-muted-foreground">{exercise.primaryMuscleLabel} · {exercise.catalog.equipment}</p><p className="mt-2 text-xs font-bold">{exercise.sets} séries · {exercise.reps} reps · {exercise.restTime}s</p><Badge variant="outline" className="mt-2 text-[9px]">{METHOD_LABELS[exercise.method] || exercise.method}</Badge>{exercise.methodNotes && <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-muted-foreground">{exercise.methodNotes}</p>}</div></div>)}</div></TabsContent>)}</Tabs>
            </div>
            <DialogFooter className="sticky bottom-0 mt-2 bg-popover/95 backdrop-blur-xl">
              {isDemoUser(user?.id) ? (
                <Button variant="outline" onClick={() => toast.error('Exclusivo para assinantes.', { description: 'Assine o G KONG para liberar o download de todas as fichas.', action: { label: 'Ver planos', onClick: () => { window.location.href = '/'; } } })}>
                  <Lock className="mr-2 size-4" /> Baixar PDF
                </Button>
              ) : (
                <Button nativeButton={false} variant="outline" render={<a href={`/api/workout-library/${selected.id}/pdf`} download />}>
                  <Download className="mr-2 size-4" /> Baixar PDF
                </Button>
              )}
              {mode === 'trainer' && <Select value={studentId} onValueChange={(value) => setStudentId(value ?? '')}><SelectTrigger className="h-10 w-full sm:w-64"><SelectValue placeholder="Escolha o aluno" /></SelectTrigger><SelectContent>{students.length ? students.map((student) => <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>) : <SelectItem value="none" disabled>Nenhum aluno ativo</SelectItem>}</SelectContent></Select>}
              <Button onClick={() => void applyTemplate()} disabled={working || (mode === 'trainer' && !studentId)}>{working ? <Loader2 className="mr-2 size-4 animate-spin" /> : mode === 'trainer' ? <Send className="mr-2 size-4" /> : <CheckCircle2 className="mr-2 size-4" />}{mode === 'trainer' ? 'Publicar para aluno' : 'Ativar por 8 semanas'}</Button>
            </DialogFooter>
            <p className="px-5 pb-5 text-xs leading-5 text-muted-foreground sm:px-6">{mode === 'trainer' ? 'Ao publicar, esta ficha fica ativa para o aluno e a ficha ativa anterior vai para o histórico.' : 'Ao ativar, sua ficha atual vai para o histórico e este programa aparece imediatamente em Ficha do dia.'}</p>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
