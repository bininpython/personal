'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ClockAlert, Download, Dumbbell, Loader2, Lock, Pencil, Plus, Search, Send, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { isDemoUser } from '@/lib/auth/demo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WorkoutPlanSummary {
  id: string;
  studentId: string;
  name: string;
  student: string;
  goal: string;
  days: number;
  workoutDayCount: number;
  exerciseCount: number;
  status: 'active' | 'draft' | 'archived';
  startDate: string | null;
  endDate: string | null;
  isExpired: boolean;
  libraryTemplateId?: string | null;
}

interface StudentSummary {
  id: string;
  name: string;
  status: string;
}

export default function WorkoutsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [plans, setPlans] = useState<WorkoutPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [copyPlan, setCopyPlan] = useState<WorkoutPlanSummary | null>(null);
  const [destinationStudentId, setDestinationStudentId] = useState('');
  const [copying, setCopying] = useState(false);

  async function loadPlans() {
    const response = await fetch('/api/workout-plans', { cache: 'no-store' });
    const data = await response.json() as { plans?: WorkoutPlanSummary[]; error?: string };
    if (!response.ok) throw new Error(data.error || 'Não foi possível carregar as fichas.');
    setPlans(data.plans ?? []);
  }

  useEffect(() => {
    const loadPage = async () => {
      try {
        const [, studentResponse] = await Promise.all([
          loadPlans(),
          fetch('/api/students', { cache: 'no-store' }),
        ]);
        const studentData = await studentResponse.json() as { students?: StudentSummary[] };
        if (studentResponse.ok) setStudents(studentData.students ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as fichas.');
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, []);

  const availableStudents = useMemo(() => students.filter((student) => (
    student.status === 'active' && student.id !== copyPlan?.studentId
  )), [copyPlan?.studentId, students]);

  function openCopyDialog(plan: WorkoutPlanSummary) {
    setCopyPlan(plan);
    setDestinationStudentId('');
  }

  async function sendCopy() {
    if (!copyPlan || !destinationStudentId) return;
    setCopying(true);
    try {
      const response = await fetch(`/api/workout-plans/${copyPlan.id}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: destinationStudentId }),
      });
      const data = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível enviar a ficha.');
      toast.success(data.message || 'Ficha enviada para o aluno.');
      setCopyPlan(null);
      setDestinationStudentId('');
      await loadPlans();
    } catch (copyError) {
      toast.error(copyError instanceof Error ? copyError.message : 'Não foi possível enviar a ficha.');
    } finally {
      setCopying(false);
    }
  }

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
                {plan.libraryTemplateId && <Badge variant="secondary" className="ml-2">Biblioteca G KONG</Badge>}
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
                <div className="grid grid-cols-2 gap-2">
                  {isDemoUser(user?.id) ? (
                    <Button variant="outline" onClick={() => toast.error('Exclusivo para assinantes.', { description: 'Assine o G KONG para liberar o download do PDF.', action: { label: 'Ver planos', onClick: () => { window.location.href = '/'; } } })}>
                      <Lock className="mr-2 size-4" /> PDF
                    </Button>
                  ) : (
                    <Button
                      nativeButton={false}
                      variant="outline"
                      render={<a href={`/api/workout-plans/${plan.id}/pdf`} download />}
                    >
                      <Download className="mr-2 size-4" /> PDF
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => openCopyDialog(plan)}>
                    <Send className="mr-2 size-4" /> Enviar
                  </Button>
                </div>
                <Button
                  variant={plan.isExpired ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => router.push(`/exercises?planId=${plan.id}`)}
                >
                  <Pencil className="mr-2 size-4" /> Editar e personalizar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(copyPlan)} onOpenChange={(open) => { if (!open && !copying) setCopyPlan(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar ficha para outro aluno</DialogTitle>
            <DialogDescription>
              Uma cópia de “{copyPlan?.name}” será publicada para o aluno escolhido, com a validade reiniciada. A ficha ativa atual dele ficará no histórico.
            </DialogDescription>
          </DialogHeader>
          {availableStudents.length > 0 ? (
            <Select value={destinationStudentId} onValueChange={(value) => setDestinationStudentId(value ?? '')}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                {availableStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Não há outro aluno ativo disponível para receber esta ficha.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyPlan(null)} disabled={copying}>Cancelar</Button>
            <Button onClick={() => void sendCopy()} disabled={!destinationStudentId || copying}>
              {copying ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
              Enviar e publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
