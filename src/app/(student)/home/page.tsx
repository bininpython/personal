'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronRight, Dumbbell, Loader2, RefreshCw, Target, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { APP_TIME_ZONE, hourInSaoPaulo } from '@/lib/time/sao-paulo';

interface HomePlan {
  id: string;
  name: string;
  goal: string;
  daysPerWeek: number;
  week: {
    target: number;
    completed: number;
    isComplete: boolean;
    completedToday: boolean;
    nextWorkoutDayId: string | null;
  };
  days: Array<{
    id: string;
    label: string;
    name: string;
    completedThisWeek: boolean;
    completedToday: boolean;
    weeklyCompletions: number;
    weeklyAllowance: number;
    exercises: Array<{ id: string; name: string }>;
  }>;
}

interface StudentAppointment {
  id: string;
  studentName: string;
  type: string;
  startTime: string;
  endTime: string;
  status: string;
}

export default function StudentHomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [greeting] = useState(() => {
    const hour = hourInSaoPaulo();
    return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  });
  const [plan, setPlan] = useState<HomePlan | null>(null);
  const [appointments, setAppointments] = useState<StudentAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const [planResponse, appointmentResponse] = await Promise.all([
          fetch('/api/workout-plans', { cache: 'no-store' }),
        fetch('/api/appointments?upcoming=true', { cache: 'no-store' }),
        ]);
        const data = await planResponse.json() as { plan?: HomePlan | null };
        if (planResponse.ok) setPlan(data.plan ?? null);
        if (appointmentResponse.ok) {
          const appointmentData = await appointmentResponse.json() as { appointments?: StudentAppointment[] };
          setAppointments((appointmentData.appointments ?? []).filter((item) => item.status === 'scheduled' && new Date(item.endTime) >= new Date()).slice(0, 3));
        }
      } finally {
        setLoading(false);
      }
    };

    void loadPlan();
    const refresh = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void loadPlan();
    };
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
    };
  }, []);

  const nextWorkout = plan?.days.find((day) => day.id === plan.week.nextWorkoutDayId) ?? plan?.days[0] ?? null;

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="dk-hero-panel p-6 sm:p-8 lg:p-10">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <p className="dk-kicker text-[#c9ff32]">Painel do atleta</p>
            <h1 className="dk-display mt-6 text-[clamp(2.8rem,7vw,5.4rem)]">
              {greeting.toUpperCase()},<br />
              <span className="text-[#c9ff32]">{user?.name?.split(' ')[0]?.toUpperCase() || 'ALUNO'}.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/72 sm:text-base">Sua ficha, seu ritmo e sua evolução em um só lugar.</p>
          </div>
          {plan && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/65">Meta semanal</p><p className="mt-4 text-4xl font-black tracking-[-0.06em]">{plan.week.target}</p></div>
              <div className="rounded-2xl bg-[#c9ff32] p-4 text-black"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-black/65">Concluídos</p><p className="mt-4 text-4xl font-black tracking-[-0.06em]">{plan.week.completed}</p></div>
            </div>
          )}
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center rounded-3xl border border-black/8 bg-white/70 py-16 text-muted-foreground dark:border-white/8 dark:bg-white/[0.04]">
          <Loader2 className="mr-2 size-5 animate-spin text-[#7cae00]" /> Buscando sua ficha...
        </div>
      ) : plan && nextWorkout ? (
        <Card className="relative overflow-hidden bg-white dark:bg-[#151613]">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-[#c9ff32]" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge className="dk-volt-chip mb-3 border-0">{plan.week.completedToday ? 'Treino de hoje concluído' : plan.week.isComplete ? 'Meta semanal concluída' : 'Próximo treino'}</Badge>
                <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">{nextWorkout.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.name} · {plan.goal}</p>
              </div>
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-black text-[#c9ff32] dark:bg-[#c9ff32] dark:text-black">
                <Dumbbell className="size-6" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="dk-metric p-4">
                <Dumbbell className="mb-2 size-4" />
                <p className="text-lg font-black">{nextWorkout.exercises.length} exercícios</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Treino {nextWorkout.label}</p>
              </div>
              <div className="dk-metric p-4">
                <Target className="mb-2 size-4 text-[#7cae00]" />
                <p className="text-lg font-black">{plan.daysPerWeek}x por semana</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Frequência prescrita</p>
              </div>
            </div>
            <Button className="mt-5 h-12 w-full bg-black text-base text-white hover:bg-black/80 dark:bg-[#c9ff32] dark:text-black dark:hover:bg-[#b8ef22]" onClick={() => router.push(`/workout?day=${nextWorkout.id}`)}>
              <Zap className="mr-2 size-5" /> {plan.week.completedToday || plan.week.isComplete ? `Consultar próximo: treino ${nextWorkout.label}` : 'Começar próximo treino'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <div className="mb-3 rounded-full bg-black p-4 text-[#c9ff32] dark:bg-[#c9ff32] dark:text-black"><Dumbbell className="size-8" /></div>
            <h2 className="text-xl font-black">Aguardando sua primeira ficha</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Quando o personal publicar seu treino, ele aparecerá automaticamente aqui.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/workout')}>
              <RefreshCw className="mr-2 size-4" /> Verificar ficha
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      {plan && plan.days.length > 1 && (
        <Card>
          <CardHeader className="border-b border-black/8 pb-4 dark:border-white/8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#668f00]">Sua semana</p>
            <CardTitle className="mt-1 text-xl font-black tracking-tight">Treinos da ficha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plan.days.map((day) => (
              <button
                type="button"
                key={day.id}
                onClick={() => router.push(`/workout?day=${day.id}`)}
                className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors hover:border-[#9fdb00] hover:bg-[#c9ff32]/10 ${day.completedThisWeek ? 'border-[#9fdb00]/40 bg-[#c9ff32]/10' : ''}`}
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#668f00]">Treino {day.label}</p>
                  <p className="font-medium">{day.name}</p>
                  <p className="text-xs text-muted-foreground">{day.exercises.length} exercícios</p>
                </div>
                <div className="flex items-center gap-2">{day.completedThisWeek && <Badge className="dk-volt-chip border-0">Concluído</Badge>}<ChevronRight className="size-4 text-muted-foreground" /></div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {appointments.length > 0 && (
        <Card>
          <CardHeader className="border-b border-black/8 pb-4 dark:border-white/8"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#668f00]">Agenda</p><CardTitle className="mt-1 flex items-center gap-2 text-xl font-black tracking-tight"><CalendarDays className="size-5" /> Próximos compromissos</CardTitle></CardHeader>
          <CardContent className="space-y-2">{appointments.map((appointment) => <div key={appointment.id} className="rounded-2xl border p-4"><p className="font-bold">{appointment.type === 'assessment' ? 'Avaliação física' : appointment.type === 'training' ? 'Treino acompanhado' : 'Acompanhamento'}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(appointment.startTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: APP_TIME_ZONE })}</p></div>)}</CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
