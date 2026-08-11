'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CalendarDays, Download, Dumbbell, FileText, Loader2, Sparkles, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import type { IndividualPlanView, IndividualProfileView } from '@/types/individual';

const LEVELS = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' } as const;

export default function IndividualDashboardPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<IndividualPlanView[]>([]);
  const [profile, setProfile] = useState<IndividualProfileView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/individual/workout-plans', { cache: 'no-store' }).then(async (response) => ({ response, data: await response.json() })),
      fetch('/api/individual/profile', { cache: 'no-store' }).then(async (response) => ({ response, data: await response.json() })),
    ]).then(([plansResult, profileResult]) => {
      if (!plansResult.response.ok) throw new Error(plansResult.data.error || 'Não foi possível carregar suas fichas.');
      if (!profileResult.response.ok) throw new Error(profileResult.data.error || 'Não foi possível carregar seu perfil.');
      setPlans(plansResult.data.plans ?? []);
      setProfile(profileResult.data.profile);
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar sua área.')).finally(() => setLoading(false));
  }, []);

  const activePlan = plans.find((plan) => plan.status === 'active' && !plan.isExpired);
  const totalExercises = useMemo(() => new Set(plans.flatMap((plan) => plan.days.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseKey)))).size, [plans]);
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
            <div className="mt-7 flex flex-wrap gap-3"><Button nativeButton={false} render={<Link href="/my-exercises" />} className="h-12 rounded-full bg-[#c9ff32] px-6 text-black hover:bg-[#d5ff60]"><BookOpen className="mr-2 size-4" /> Montar nova ficha</Button><Button nativeButton={false} variant="outline" render={<Link href="/my-plans" />} className="h-12 rounded-full border-white/20 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"><FileText className="mr-2 size-4" /> Minhas fichas</Button></div>
          </div>
          <div className="rounded-3xl border border-white/12 bg-white/[0.06] p-5 backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c9ff32]">Ficha em uso</p>
            {activePlan ? <><h2 className="mt-3 text-2xl font-black">{activePlan.name}</h2><p className="mt-2 text-sm text-white/60">{activePlan.goal}</p><div className="mt-5 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white/8 p-3"><p className="text-xl font-black">{activePlan.workoutDayCount}</p><p className="text-[9px] uppercase text-white/45">Treinos</p></div><div className="rounded-xl bg-[#c9ff32] p-3 text-black"><p className="text-xl font-black">{activePlan.exerciseCount}</p><p className="text-[9px] uppercase text-black/55">Exercícios</p></div><div className="rounded-xl bg-white/8 p-3"><p className="text-xl font-black">{activePlan.daysPerWeek}x</p><p className="text-[9px] uppercase text-white/45">Semana</p></div></div><div className="mt-4 flex gap-2"><Button nativeButton={false} size="sm" render={<Link href={`/my-plans/${activePlan.id}`} />} className="flex-1">Abrir treino</Button><Button nativeButton={false} size="icon" variant="outline" render={<a href={`/api/individual/workout-plans/${activePlan.id}/pdf`} download />} className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" aria-label="Baixar PDF"><Download className="size-4" /></Button></div></> : <div className="py-7 text-center"><Sparkles className="mx-auto size-9 text-[#c9ff32]" /><p className="mt-4 font-bold">Sua primeira ficha começa aqui</p><p className="mt-2 text-xs leading-5 text-white/50">Escolha o músculo, adicione exercícios e publique para você mesmo.</p></div>}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{ label: 'Fichas criadas', value: plans.length, icon: FileText }, { label: 'Exercícios organizados', value: totalExercises, icon: Dumbbell }, { label: 'Frequência ativa', value: activePlan ? `${activePlan.daysPerWeek}x` : '—', icon: CalendarDays }, { label: 'Objetivo', value: profile?.goal || 'Definir', icon: Target }].map((metric) => <Card key={metric.label} className="overflow-hidden border-border/60"><CardContent className="flex min-h-32 items-end justify-between gap-4 p-5"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">{metric.label}</p><p className="mt-3 truncate text-3xl font-black">{metric.value}</p></div><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-black text-[#c9ff32] dark:bg-[#c9ff32] dark:text-black"><metric.icon className="size-5" /></span></CardContent></Card>)}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[{ href: '/my-exercises', kicker: '01 · Anatomia', title: 'Encontre o movimento certo', text: 'Navegue por grupos musculares e veja a execução antes de adicionar.', icon: BookOpen }, { href: '/my-plans', kicker: '02 · Organização', title: 'Gerencie todas as fichas', text: 'Edite, ative, consulte e baixe cada versão em PDF.', icon: FileText }, { href: '/my-profile', kicker: '03 · Identidade', title: 'Complete seu perfil', text: 'Registre objetivo, nível, disponibilidade e restrições.', icon: Target }].map((item) => <Link key={item.href} href={item.href} className="group rounded-3xl border border-border/70 bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-xl"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#c9ff32] text-black"><item.icon className="size-5" /></span><p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-[#668f00]">{item.kicker}</p><h2 className="mt-2 text-xl font-black">{item.title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p><span className="mt-5 inline-flex items-center text-xs font-black uppercase tracking-[0.1em]">Acessar <ArrowRight className="ml-2 size-3.5 transition-transform group-hover:translate-x-1" /></span></Link>)}
      </section>
    </div>
  );
}
