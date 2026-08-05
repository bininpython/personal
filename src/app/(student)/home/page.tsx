'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Dumbbell, Loader2, RefreshCw, Target, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

interface HomePlan {
  id: string;
  name: string;
  goal: string;
  daysPerWeek: number;
  days: Array<{
    id: string;
    label: string;
    name: string;
    exercises: Array<{ id: string; name: string }>;
  }>;
}

export default function StudentHomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  });
  const [plan, setPlan] = useState<HomePlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const response = await fetch('/api/workout-plans', { cache: 'no-store' });
        const data = await response.json() as { plan?: HomePlan | null };
        if (response.ok) setPlan(data.plan ?? null);
      } finally {
        setLoading(false);
      }
    };

    void loadPlan();
    const interval = window.setInterval(loadPlan, 10_000);
    return () => window.clearInterval(interval);
  }, []);

  const nextWorkout = plan?.days[0] ?? null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {user?.name?.split(' ')[0] || 'Aluno'}
        </h1>
        <p className="mt-1 text-muted-foreground">Seu treino fica sincronizado com o personal.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Buscando sua ficha...
        </div>
      ) : plan && nextWorkout ? (
        <Card className="overflow-hidden border-blue-500/20 bg-gradient-to-br from-blue-500/[0.08] to-transparent">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge className="mb-2 bg-emerald-500/10 text-emerald-600">Ficha ativa e sincronizada</Badge>
                <h2 className="text-xl font-bold">{nextWorkout.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.name} · {plan.goal}</p>
              </div>
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white">
                <Dumbbell className="size-6" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-background/70 p-3">
                <Dumbbell className="mb-1 size-4 text-blue-500" />
                <p className="font-bold">{nextWorkout.exercises.length} exercícios</p>
                <p className="text-[11px] text-muted-foreground">no Treino {nextWorkout.label}</p>
              </div>
              <div className="rounded-xl border bg-background/70 p-3">
                <Target className="mb-1 size-4 text-emerald-500" />
                <p className="font-bold">{plan.daysPerWeek}x por semana</p>
                <p className="text-[11px] text-muted-foreground">frequência prescrita</p>
              </div>
            </div>
            <Button className="mt-5 h-12 w-full text-base" onClick={() => router.push('/workout')}>
              <Zap className="mr-2 size-5" /> Abrir meu treino
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <div className="mb-3 rounded-full bg-muted p-4"><Dumbbell className="size-8 text-muted-foreground/50" /></div>
            <h2 className="font-bold">Aguardando sua primeira ficha</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Quando o personal publicar seu treino, ele aparecerá automaticamente aqui.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/workout')}>
              <RefreshCw className="mr-2 size-4" /> Verificar ficha
            </Button>
          </CardContent>
        </Card>
      )}

      {plan && plan.days.length > 1 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Treinos da ficha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plan.days.map((day) => (
              <button
                type="button"
                key={day.id}
                onClick={() => router.push('/workout')}
                className="flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors hover:border-blue-400 hover:bg-blue-500/[0.03]"
              >
                <div>
                  <p className="text-xs font-bold uppercase text-blue-500">Treino {day.label}</p>
                  <p className="font-medium">{day.name}</p>
                  <p className="text-xs text-muted-foreground">{day.exercises.length} exercícios</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
