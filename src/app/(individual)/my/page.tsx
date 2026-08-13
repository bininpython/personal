'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CalendarDays, Download, Dumbbell, FileText, History, Loader2, PlayCircle, Sparkles, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import type { IndividualPlanView, IndividualProfileView } from '@/types/individual';

const LEVELS = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' } as const;

interface ActiveWorkoutSummary {
  week: { completed: number; target: number; completedToday: boolean; nextWorkoutDayId: string | null };
  days: Array<{ id: string; label: string; name: string }>;
}

export default function IndividualDashboardPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<IndividualPlanView[]>([]);
  const [profile, setProfile] = useState<IndividualProfileView | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutSummary | null>(null);
  const [completedWorkouts, setCompletedWorkouts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/individual/workout-plans', { cache: 'no-store' }).then(async (response) => ({ response, data: await response.json() })),
      fetch('/api/individual/profile', { cache: 'no-store' }).then(async (response) => ({ response, data: await response.json() })),
      fetch('/api/individual/workout', { cache: 'no-store' }).then(async (response) => ({ response, data: await response.json() })),
      fetch('/api/individual/workout-sessions', { cache: 'no-store' }).then(async (response) => ({ response, data: await response.json() })),
    ]).then(([plansResult, profileResult, workoutResult, historyResult]) => {
      if (!plansResult.response.ok) throw new Error(plansResult.data.error || 'Não foi possível carregar suas fichas.');
      if (!profileResult.response.ok) throw new Error(profileResult.data.error || 'Não foi possível carregar seu perfil.');
      if (!workoutResult.response.ok) throw new Error(workoutResult.data.error || 'Não foi possível preparar seu treino.');
      if (!historyResult.response.ok) throw new Error(historyResult.data.error || 'Não foi possível carregar sua evolução.');
      setPlans(plansResult.data.plans ?? []);
      setProfile(profileResult.data.profile);
      setActiveWorkout(workoutResult.data.plan ?? null);
      setCompletedWorkouts(historyResult.data.summary?.completedWorkouts ?? 0);
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar sua área.')).finally(() => setLoading(false));
  }, []);

  const activePlan = plans.find((plan) => plan.status === 'active' && !plan.isExpired);
  const totalExercises = useMemo(() => new Set(plans.flatMap((plan) => plan.days.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseKey)))).size, [plans]);
  const nextWorkout = activeWorkout?.days.find((day) => day.id === activeWorkout.week.nextWorkoutDayId) ?? activeWorkout?.days[0] ?? null;
  const firstName = (user?.name || 'Atleta').split(' ')[0];

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Preparando sua área...</div>;
  if (error) return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">{error}</div>;

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      <section className="dk-hero-panel overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2"><span className="dk-kicker text-[#c9ff32]">Área individual</span><Badge className="border-0 bg-white/10 text-white">{profile ? LEVELS[profile.level] : 'Atleta'}</Badge></div>
            <h1 className="dk-display mt-5 max-w-3xl text-4xl sm:text-5xl lg:text-6xl">OLÁ, {firstName.toLocaleUpperCase('pt-BR')}. VAMOS CONSTRUIR SEU PRÓXIMO NÍVEL.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">Explore a anatomia, selecione os movimentos e transforme sua rotina em uma ficha clara, visual e pronta para baixar.</p>
            <div className="mt-7 flex flex-wrap gap-3">{activePlan ? <Button nativeButton={false} render={<Link href="/my-workout" />} className="h-12 rounded-full bg-[#c9ff32] px-6 text-black hover:bg-[#d5ff60]"><PlayCircle className="mr-2 size-4" /> {activeWorkout?.week.completedToday ? 'Ver próximo treino' : 'Iniciar próximo treino'}</Button> : <Button nativeButton={false} render={<Link href="/my-exercises" />} className="h-12 rounded-full bg-[#c9ff32] px-6 text-black hover:bg-[#d5ff60]"><BookOpen className="mr-2 size-4" /> Montar primeira ficha</Button>}<Button nativeButton={false} variant="outline" render={<Link href="/my-plans" />} className="h-12 rounded-full border-white/20 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"><FileText className="mr-2 size-4" /> Minhas fichas</Button></div>
          </div>
          <div className="rounded-3xl border border-white/12 bg-white/[0.06] p-5 backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c9ff32]">Ficha em uso</p>
            {activePlan ? <><p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#c9ff32]">{activeWorkout?.week.completedToday ? 'Disponível amanhã' : 'Próximo da rotação'}</p><h2 className="mt-1 text-2xl font-black">{nextWorkout ? `Treino ${nextWorkout.label} · ${nextWorkout.name}` : activePlan.name}</h2><p className="mt-2 text-sm text-white/60">{activePlan.name} · {activePlan.goal}</p><div className="mt-5 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white/8 p-3"><p className="text-xl font-black">{activePlan.workoutDayCount}</p><p className="text-[9px] uppercase text-white/45">Treinos</p></div><div className="rounded-xl bg-[#c9ff32] p-3 text-black"><p className="text-xl font-black">{activeWorkout?.week.completed ?? 0}/{activeWorkout?.week.target ?? activePlan.daysPerWeek}</p><p className="text-[9px] uppercase text-black/55">Na semana</p></div><div className="rounded-xl bg-white/8 p-3"><p className="text-xl font-black">{activePlan.daysPerWeek}x</p><p className="text-[9px] uppercase text-white/45">Meta</p></div></div><div className="mt-4 flex gap-2"><Button nativeButton={false} size="sm" render={<Link href="/my-workout" />} className="flex-1">{activeWorkout?.week.completedToday ? 'Consultar próximo' : 'Iniciar treino'}</Button><Button nativeButton={false} size="icon" variant="outline" render={<a href={`/api/individual/workout-plans/${activePlan.id}/pdf`} download />} className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" aria-label="Baixar PDF"><Download className="size-4" /></Button></div></> : <div className="py-7 text-center"><Sparkles className="mx-auto size-9 text-[#c9ff32]" /><p className="mt-4 font-bold">Sua primeira ficha começa aqui</p><p className="mt-2 text-xs leading-5 text-white/50">Escolha o músculo, adicione exercícios e publique para você mesmo.</p></div>}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{ label: 'Treinos concluídos', value: completedWorkouts, icon: History }, { label: 'Exercícios organizados', value: totalExercises, icon: Dumbbell }, { label: 'Progresso semanal', value: activeWorkout ? `${activeWorkout.week.completed}/${activeWorkout.week.target}` : '—', icon: CalendarDays }, { label: 'Objetivo', value: profile?.goal || 'Definir', icon: Target }].map((metric) => <Card key={metric.label} className="overflow-hidden border-border/60"><CardContent className="flex min-h-32 items-end justify-between gap-4 p-5"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">{metric.label}</p><p className="mt-3 truncate text-3xl font-black">{metric.value}</p></div><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-black text-[#c9ff32] dark:bg-[#c9ff32] dark:text-black"><metric.icon className="size-5" /></span></CardContent></Card>)}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[{ href: '/my-workout', kicker: '01 · Execução', title: 'Inicie o próximo treino', text: 'Registre séries, carga e RPE com descanso regressivo automático.', icon: PlayCircle }, { href: '/my-history', kicker: '02 · Evolução', title: 'Acompanhe seu histórico', text: 'Veja conclusão, duração e volume de cada treino salvo.', icon: History }, { href: '/my-exercises', kicker: '03 · Planejamento', title: 'Ajuste sua ficha', text: 'Escolha exercícios, métodos e orientações da sua rotina.', icon: BookOpen }].map((item) => <Link key={item.href} href={item.href} className="group rounded-3xl border border-border/70 bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-xl"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#c9ff32] text-black"><item.icon className="size-5" /></span><p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-[#668f00]">{item.kicker}</p><h2 className="mt-2 text-xl font-black">{item.title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p><span className="mt-5 inline-flex items-center text-xs font-black uppercase tracking-[0.1em]">Acessar <ArrowRight className="ml-2 size-3.5 transition-transform group-hover:translate-x-1" /></span></Link>)}
      </section>
    </div>
  );
}
