'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Dumbbell, Loader2, Plus, Search, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface WorkoutPlanSummary {
  id: string;
  name: string;
  student: string;
  goal: string;
  days: number;
  workoutDayCount: number;
  exerciseCount: number;
  status: 'active' | 'draft' | 'archived';
  startDate: string | null;
}

export default function WorkoutsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [plans, setPlans] = useState<WorkoutPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await fetch('/api/workout-plans', { cache: 'no-store' });
        const data = await response.json() as { plans?: WorkoutPlanSummary[]; error?: string };
        if (!response.ok) throw new Error(data.error || 'Não foi possível carregar as fichas.');
        setPlans(data.plans ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as fichas.');
      } finally {
        setLoading(false);
      }
    };

    void loadPlans();
  }, []);

  const filteredPlans = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return plans;
    return plans.filter((plan) => (
      plan.name.toLocaleLowerCase('pt-BR').includes(term)
      || plan.student.toLocaleLowerCase('pt-BR').includes(term)
    ));
  }, [plans, search]);

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fichas de Treino</h1>
          <p className="mt-1 text-muted-foreground">Acompanhe as fichas publicadas para seus alunos.</p>
        </div>
        <Button onClick={() => router.push('/exercises')} className="h-10">
          <Plus className="mr-2 size-4" /> Nova ficha
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por ficha ou aluno..."
          className="h-10 pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Carregando fichas...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">{error}</div>
      ) : filteredPlans.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <Dumbbell className="mx-auto mb-3 size-10 text-muted-foreground/30" />
          <p className="font-medium">Nenhuma ficha encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">Monte a primeira ficha no diagrama de exercícios.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/exercises')}>Abrir montador</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan) => (
            <Card key={plan.id} className="border-border/60">
              <CardHeader className="border-b border-border/40 pb-4">
                <Badge
                  variant="outline"
                  className={plan.status === 'active'
                    ? 'border-emerald-500/30 text-emerald-600'
                    : 'border-muted-foreground/30 text-muted-foreground'}
                >
                  {plan.status === 'active' ? 'Ativa' : plan.status === 'archived' ? 'Arquivada' : 'Rascunho'}
                </Badge>
                <CardTitle className="mt-2 text-lg">{plan.name}</CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <User className="size-3.5" /> {plan.student}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Objetivo</span>
                  <span className="truncate font-medium">{plan.goal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estrutura</span>
                  <span className="font-medium">{plan.workoutDayCount} treino(s) · {plan.exerciseCount} exercícios</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Frequência</span>
                  <span className="font-medium">{plan.days}x por semana</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="size-3.5" /> Início</span>
                  <span className="font-medium">
                    {plan.startDate ? new Date(`${plan.startDate}T12:00:00`).toLocaleDateString('pt-BR') : 'Não informado'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
