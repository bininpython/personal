'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ClockAlert, Copy, Dumbbell, Loader2, Pencil, Plus, Search, User } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PageHeader } from '@/components/ui/page-header';

interface WorkoutPlanSummary {
  id: string;
  studentId: string;
  name: string;
  student: string;
  studentLevel: string | null;
  goal: string;
  days: number;
  workoutDayCount: number;
  exerciseCount: number;
  status: 'active' | 'draft' | 'archived';
  startDate: string | null;
  endDate: string | null;
  isExpired: boolean;
}

interface StudentOption {
  id: string;
  name: string;
  level: string;
  status: string;
}

export default function WorkoutsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [plans, setPlans] = useState<WorkoutPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [duplicatingPlan, setDuplicatingPlan] = useState<WorkoutPlanSummary | null>(null);
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([]);
  const [sameLevelOnly, setSameLevelOnly] = useState(true);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');

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

    const loadStudents = async () => {
      try {
        const response = await fetch('/api/students', { cache: 'no-store' });
        const data = await response.json() as { students?: StudentOption[] };
        if (response.ok) setStudents(data.students ?? []);
      } catch (loadError) {
        console.error('[Workouts] Student list error:', loadError);
      }
    };

    void loadPlans();
    void loadStudents();
  }, []);

  const openDuplicateDialog = (plan: WorkoutPlanSummary) => {
    setDuplicatingPlan(plan);
    setTargetStudentIds([]);
    setSameLevelOnly(true);
    setDuplicateError('');
  };

  // Alunos que já treinam com uma ficha ativa: receber a cópia arquiva a ficha
  // atual deles, então o personal precisa ver isso antes de confirmar.
  const studentsWithActivePlan = useMemo(
    () => new Set(plans.filter((plan) => plan.status === 'active').map((plan) => plan.studentId)),
    [plans],
  );

  const duplicateCandidates = useMemo(() => {
    if (!duplicatingPlan) return [];
    return students.filter((student) => (
      student.status === 'active'
      && student.id !== duplicatingPlan.studentId
      && (!sameLevelOnly || student.level === duplicatingPlan.studentLevel)
    ));
  }, [students, duplicatingPlan, sameLevelOnly]);

  const toggleTargetStudent = (studentId: string) => {
    setTargetStudentIds((current) => (
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    ));
  };

  const replacedCount = targetStudentIds.filter((id) => studentsWithActivePlan.has(id)).length;

  const submitDuplicate = async () => {
    if (!duplicatingPlan || targetStudentIds.length === 0) return;
    setDuplicating(true);
    setDuplicateError('');
    try {
      const response = await fetch(`/api/workout-plans/${duplicatingPlan.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStudentIds }),
      });
      const data = await response.json() as {
        error?: string;
        message?: string;
        failed?: Array<{ studentName: string; error: string }>;
      };
      if (!response.ok) throw new Error(data.error || 'Não foi possível duplicar a ficha.');

      setDuplicatingPlan(null);
      toast.success(data.message || 'Ficha duplicada.');
      if (data.failed?.length) {
        toast.error(`Não foi possível atribuir a: ${data.failed.map((item) => item.studentName).join(', ')}.`);
      }

      const refreshed = await fetch('/api/workout-plans', { cache: 'no-store' });
      const refreshedData = await refreshed.json() as { plans?: WorkoutPlanSummary[] };
      if (refreshed.ok) setPlans(refreshedData.plans ?? []);
    } catch (submitError) {
      setDuplicateError(submitError instanceof Error ? submitError.message : 'Não foi possível duplicar a ficha.');
    } finally {
      setDuplicating(false);
    }
  };

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
      <PageHeader
        kicker="Operação"
        title="Fichas de treino"
        description="Acompanhe as fichas publicadas para seus alunos."
        actions={
          <Button onClick={() => router.push('/exercises')} className="h-11">
            <Plus className="mr-2 size-4" /> Nova ficha
          </Button>
        }
      />

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
            <Card key={plan.id} className={plan.isExpired ? 'border-danger/40' : ''}>
              <CardHeader className="border-b border-border/40 pb-4">
                <Badge
                  variant="outline"
                  className={plan.isExpired
                    ? 'border-danger/30 bg-danger-wash text-danger'
                    : plan.status === 'active'
                    ? 'border-ok/30 text-ok'
                    : 'border-muted-foreground/30 text-muted-foreground'}
                >
                  {plan.isExpired ? 'Prazo encerrado' : plan.status === 'active' ? 'Ativa' : plan.status === 'archived' ? 'Arquivada' : 'Rascunho'}
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
                <div className={`flex items-center justify-between rounded-lg p-2 text-xs ${plan.isExpired ? 'bg-danger-wash text-danger' : 'bg-muted/50'}`}>
                  <span className="flex items-center gap-1.5"><ClockAlert className="size-3.5" /> {plan.isExpired ? 'Expirou em' : 'Válida até'}</span>
                  <span className="font-medium">
                    {plan.endDate ? new Date(`${plan.endDate}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem prazo'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={plan.isExpired ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => router.push(`/exercises?planId=${plan.id}`)}
                  >
                    <Pencil className="mr-2 size-4" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => openDuplicateDialog(plan)}
                  >
                    <Copy className="mr-2 size-4" /> Duplicar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(duplicatingPlan)} onOpenChange={(open) => { if (!open) setDuplicatingPlan(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reaproveitar ficha</DialogTitle>
            <DialogDescription>
              Envie uma cópia de &quot;{duplicatingPlan?.name}&quot; para um ou mais alunos. Marque quantos quiser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sameLevelOnly}
                onChange={(event) => { setSameLevelOnly(event.target.checked); setTargetStudentIds([]); }}
                className="size-4 rounded border-input"
              />
              Somente alunos do nível <strong>{duplicatingPlan?.studentLevel}</strong>
            </label>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Enviar para</Label>
                {duplicateCandidates.length > 0 && (
                  <button
                    type="button"
                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                    onClick={() => setTargetStudentIds(
                      targetStudentIds.length === duplicateCandidates.length
                        ? []
                        : duplicateCandidates.map((student) => student.id),
                    )}
                  >
                    {targetStudentIds.length === duplicateCandidates.length ? 'Limpar seleção' : 'Selecionar todos'}
                  </button>
                )}
              </div>
              {duplicateCandidates.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Nenhum outro aluno ativo{sameLevelOnly ? ` no nível ${duplicatingPlan?.studentLevel}` : ''}.
                  {sameLevelOnly && ' Desmarque o filtro acima para ver todos.'}
                </p>
              ) : (
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border p-1">
                  {duplicateCandidates.map((student) => (
                    <label
                      key={student.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md p-2 text-sm hover:bg-muted/60"
                    >
                      <input
                        type="checkbox"
                        checked={targetStudentIds.includes(student.id)}
                        onChange={() => toggleTargetStudent(student.id)}
                        className="size-4 rounded border-input"
                      />
                      <span className="flex-1 truncate font-medium">{student.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{student.level}</span>
                      {studentsWithActivePlan.has(student.id) && (
                        <Badge variant="outline" className="shrink-0 border-amber-500/40 text-[10px] text-amber-600">
                          tem ficha ativa
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {replacedCount > 0 && (
              <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                <ClockAlert className="mt-0.5 size-3.5 shrink-0" />
                {replacedCount === 1
                  ? '1 aluno selecionado já tem uma ficha ativa. Ela será arquivada e substituída por esta cópia.'
                  : `${replacedCount} alunos selecionados já têm ficha ativa. Elas serão arquivadas e substituídas por esta cópia.`}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              A cópia começa hoje e mantém a mesma duração da ficha original. Depois é só abrir cada ficha em
              &quot;Editar&quot; para ajustar cargas e exercícios individualmente.
            </p>
            {duplicateError && <p className="text-sm text-destructive">{duplicateError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicatingPlan(null)}>Cancelar</Button>
            <Button onClick={submitDuplicate} disabled={targetStudentIds.length === 0 || duplicating}>
              {duplicating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Copy className="mr-2 size-4" />}
              {targetStudentIds.length > 1 ? `Enviar para ${targetStudentIds.length} alunos` : 'Enviar ficha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
