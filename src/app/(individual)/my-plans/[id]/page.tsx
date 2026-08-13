'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Download, Dumbbell, Loader2, Pencil, PlayCircle, Timer, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrainingMethodGuidance } from '@/components/workouts/training-method-guidance';
import type { IndividualPlanView } from '@/types/individual';

function date(value: string | null) { return value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem prazo'; }

export default function IndividualPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<IndividualPlanView | null>(null);
  const [activeDay, setActiveDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/individual/workout-plans/${id}`, { cache: 'no-store' }).then(async (response) => ({ response, data: await response.json() })).then(({ response, data }) => {
      if (!response.ok || !data.plan) throw new Error(data.error || 'Não foi possível carregar a ficha.');
      setPlan(data.plan);
      setActiveDay(data.plan.days[0]?.id || '');
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a ficha.')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Abrindo sua ficha...</div>;
  if (error || !plan) return <div className="space-y-5"><Button nativeButton={false} variant="ghost" render={<Link href="/my-plans" />}><ArrowLeft className="mr-2 size-4" /> Voltar</Button><div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">{error || 'Ficha não encontrada.'}</div></div>;
  const day = plan.days.find((item) => item.id === activeDay) || plan.days[0];

  return <div className="space-y-7 pb-10 animate-fade-in"><div className="flex flex-wrap items-center justify-between gap-3"><Button nativeButton={false} variant="ghost" render={<Link href="/my-plans" />}><ArrowLeft className="mr-2 size-4" /> Minhas fichas</Button><div className="flex flex-wrap gap-2"><Button nativeButton={false} variant="outline" render={<Link href={`/my-exercises?planId=${plan.id}`} />}><Pencil className="mr-2 size-4" /> Editar</Button><Button nativeButton={false} render={<a href={`/api/individual/workout-plans/${plan.id}/pdf`} download />}><Download className="mr-2 size-4" /> Baixar PDF</Button></div></div>
    <section className="dk-hero-panel p-6 sm:p-8 lg:p-10"><div className="relative z-10"><div className="flex flex-wrap items-center gap-2"><span className="dk-kicker text-[#c9ff32]">Minha ficha</span><Badge className="border-0 bg-white/10 text-white">{plan.status === 'active' && !plan.isExpired ? 'Ativa' : plan.isExpired ? 'Prazo encerrado' : 'Histórico'}</Badge></div><h1 className="dk-display mt-5 text-4xl sm:text-5xl">{plan.name}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">{plan.goal}</p><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[[Dumbbell, 'Estrutura', `${plan.workoutDayCount} treinos`], [PlayCircle, 'Exercícios', String(plan.exerciseCount)], [Calendar, 'Frequência', `${plan.daysPerWeek}x por semana`], [Timer, 'Validade', date(plan.endDate)]].map(([Icon, label, value]) => { const MetricIcon = Icon as typeof Dumbbell; return <div key={String(label)} className="rounded-2xl border border-white/12 bg-white/[0.06] p-4"><MetricIcon className="size-4 text-[#c9ff32]" /><p className="mt-4 text-lg font-black">{String(value)}</p><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">{String(label)}</p></div>; })}</div></div></section>
    <div className="flex gap-2 overflow-x-auto pb-1">{plan.days.map((item) => <button key={item.id} onClick={() => setActiveDay(item.id)} className={`min-w-max rounded-full border px-5 py-3 text-sm font-black ${day?.id === item.id ? 'border-black bg-black text-[#c9ff32] dark:border-[#c9ff32] dark:bg-[#c9ff32] dark:text-black' : 'border-border bg-card text-muted-foreground'}`}>Treino {item.label} · {item.exercises.length}</button>)}</div>
    {day && <section><div className="mb-5"><p className="dk-kicker text-muted-foreground">Treino {day.label}</p><h2 className="dk-display mt-2 text-3xl">{day.name}</h2></div><div className="grid gap-5 xl:grid-cols-2">{day.exercises.map((exercise, index) => <Card key={exercise.id} id={`exercise-${exercise.id}`} className="scroll-mt-24 overflow-hidden"><div className="grid sm:grid-cols-[220px_1fr]"> <div className="aspect-video bg-black sm:aspect-auto sm:min-h-56">{exercise.videoUrl ? <video src={exercise.videoUrl} controls playsInline preload="metadata" className="size-full object-contain" /> : <div className="flex size-full min-h-48 items-center justify-center text-[#c9ff32]"><Dumbbell className="size-12" /></div>}</div><div><CardHeader className="pb-3"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#668f00]">{String(index + 1).padStart(2, '0')} · {exercise.primaryMuscleLabel}</p><CardTitle className="mt-2 text-xl">{exercise.name}</CardTitle><Badge variant="outline" className="mt-2 w-fit"><Wrench className="mr-1 size-3" /> {exercise.equipment}</Badge></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-3 gap-2"><div className="rounded-xl bg-[#c9ff32] p-3 text-black"><p className="text-lg font-black">{exercise.sets}</p><p className="text-[9px] uppercase">Séries</p></div><div className="rounded-xl bg-muted p-3"><p className="text-lg font-black">{exercise.reps}</p><p className="text-[9px] uppercase text-muted-foreground">Reps</p></div><div className="rounded-xl bg-muted p-3"><p className="text-lg font-black">{exercise.restTime}s</p><p className="text-[9px] uppercase text-muted-foreground">Descanso</p></div></div><p className="text-xs leading-5 text-muted-foreground">{exercise.instructions}</p><TrainingMethodGuidance method={exercise.method} methodNotes={exercise.methodNotes} noteLabel="Minha orientação" /></CardContent></div></div></Card>)}</div></section>}
  </div>;
}
