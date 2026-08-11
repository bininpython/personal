'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ChevronLeft, ClipboardList, Dumbbell, Edit3, KeyRound, Loader2, Mail, TrendingUp, User } from 'lucide-react';
import { toast } from 'sonner';
import { AccessInvite } from '@/components/students/access-invite';
import { StudentProgressDashboard } from '@/components/students/student-progress-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { StudentProgressData } from '@/types/student-progress';

interface StudentDetails {
  full_name: string;
  avatar_url: string;
  status: 'active' | 'inactive';
  goal: string;
  current_weight: number;
  height: number;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  start_date: string;
  injuries: string;
  restrictions: string;
  medical_notes: string;
  notes: string;
}

interface StudentPerformance {
  id: string;
  plannedFrequency: number;
  workouts7d: number;
  workouts30d: number;
  completionAverage: number;
  consistencyScore: number;
  daysSinceLastWorkout: number | null;
  weightChange: number | null;
  bodyFatChange: number | null;
  risk: 'low' | 'medium' | 'high';
  recommendation: string;
}

const LEVEL_LABELS = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' };

export default function StudentProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [performance, setPerformance] = useState<StudentPerformance | null>(null);
  const [progressData, setProgressData] = useState<StudentProgressData | null>(null);
  const [draft, setDraft] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [rotatingCode, setRotatingCode] = useState(false);
  const [newAccessCode, setNewAccessCode] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentResponse, analyticsResponse, progressResponse] = await Promise.all([
          fetch(`/api/students/${params.id}`, { cache: 'no-store' }),
          fetch('/api/analytics', { cache: 'no-store' }),
          fetch(`/api/student-progress/${params.id}`, { cache: 'no-store' }),
        ]);
        const studentData = await studentResponse.json() as { student?: StudentDetails; error?: string };
        if (!studentResponse.ok || !studentData.student) throw new Error(studentData.error || 'Erro ao carregar aluno');
        setStudent(studentData.student);
        setDraft(studentData.student);
        if (analyticsResponse.ok) {
          const analytics = await analyticsResponse.json() as { students?: StudentPerformance[] };
          setPerformance(analytics.students?.find((item) => item.id === params.id) ?? null);
        }
        if (progressResponse.ok) {
          const progressPayload = await progressResponse.json() as { progress?: StudentProgressData };
          setProgressData(progressPayload.progress ?? null);
        }
        if (window.location.hash === '#edit') setEditOpen(true);
        if (window.location.hash === '#assessments') setActiveTab('assessments');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro de conexão ao carregar aluno');
        router.push('/students');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [params.id, router]);

  function openEdit() {
    setDraft(student ? { ...student } : null);
    setEditOpen(true);
  }

  async function saveStudent() {
    if (!draft) return;
    setSaving(true);
    try {
      const payload = {
        full_name: draft.full_name,
        status: draft.status,
        goal: draft.goal,
        experience_level: draft.experience_level,
        ...(draft.height > 0 ? { height: draft.height } : {}),
        ...(draft.current_weight > 0 ? { current_weight: draft.current_weight } : {}),
        restrictions: draft.restrictions,
        injuries: draft.injuries,
        medical_notes: draft.medical_notes,
        notes: draft.notes,
      };
      const response = await fetch(`/api/students/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar o aluno.');
      setStudent({ ...draft });
      setEditOpen(false);
      window.history.replaceState(null, '', window.location.pathname);
      toast.success('Perfil do aluno atualizado.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o aluno.');
    } finally {
      setSaving(false);
    }
  }

  async function rotateStudentCode() {
    setRotatingCode(true);
    try {
      const response = await fetch(`/api/students/${params.id}/access-code`, { method: 'POST' });
      const data = await response.json() as { access_code?: string; error?: string };
      if (!response.ok || !data.access_code) throw new Error(data.error || 'Não foi possível gerar o código.');
      setNewAccessCode(data.access_code);
      toast.success('Novo código gerado. O anterior e as sessões do aluno foram invalidados.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível gerar o código.');
    } finally {
      setRotatingCode(false);
    }
  }

  if (loading) return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (!student) return <div className="py-12 text-center text-muted-foreground">Aluno não encontrado.</div>;

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => router.push('/students')}><ChevronLeft /></Button><div><p className="dk-kicker text-muted-foreground">Acompanhamento individual</p><h1 className="dk-display mt-2 text-3xl">PERFIL DO ALUNO</h1></div></div>
      <section className="dk-hero-panel p-6 sm:p-8">
        <div className="relative z-10 flex flex-col items-start justify-between gap-7 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar className="size-24 border-4 border-white/15">{student.avatar_url && <AvatarImage src={student.avatar_url} alt={`Avatar de ${student.full_name}`} />}<AvatarFallback className="bg-[#c9ff32] text-2xl font-black text-black">{student.full_name.split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
            <div><div className="mb-3 flex flex-wrap items-center gap-2"><span className="dk-kicker text-[#c9ff32]">Atleta D KONG</span><Badge className="dk-volt-chip border-0">{student.status === 'active' ? 'Ativo' : 'Arquivado'}</Badge></div><h2 className="dk-display text-3xl sm:text-4xl">{student.full_name}</h2><p className="mt-3 flex items-center gap-1.5 text-sm text-white/48"><Activity className="size-3.5 text-[#c9ff32]" /> {student.goal || 'Sem objetivo'}</p></div>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto"><Button variant="outline" className="flex-1 border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => router.push(`/messages?contactId=${params.id}`)}><Mail className="mr-2 size-4" /> Mensagem</Button><Button variant="outline" className="flex-1 border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => void rotateStudentCode()} disabled={rotatingCode}>{rotatingCode ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRound className="mr-2 size-4" />} Novo código</Button><Button className="flex-1 bg-[#c9ff32] text-black hover:bg-[#b8ef22]" onClick={openEdit}><Edit3 className="mr-2 size-4" /> Editar</Button></div>
        </div>
      </section>

      <Card className={newAccessCode ? 'border-[#9fdb00]/35 bg-[#c9ff32]/12' : undefined}>
        <CardHeader><CardTitle className="text-lg">Entrega do acesso</CardTitle></CardHeader>
        <CardContent className="space-y-4 p-5 pt-0">
          {newAccessCode && (
            <div>
              <p className="font-black">Entregue este código ao aluno agora. Ele aparece uma única vez.</p>
              <code className="mt-3 block break-all text-2xl font-black tracking-[0.15em]">{newAccessCode}</code>
            </div>
          )}
          <AccessInvite
            studentName={student.full_name}
            accessCode={newAccessCode}
            onGenerateCode={() => void rotateStudentCode()}
            generatingCode={rotatingCode}
          />
          {newAccessCode && <Button variant="ghost" size="sm" onClick={() => setNewAccessCode('')}>Já entreguei, pode ocultar</Button>}
        </CardContent>
      </Card>

      {performance && <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[[`${performance.consistencyScore}%`, 'constância'], [`${performance.workouts7d}/${performance.plannedFrequency}`, 'meta semanal'], [`${performance.completionAverage}%`, 'conclusão média'], [performance.workouts30d, 'treinos em 30 dias']].map(([value, label]) => <Card key={label}><CardContent className="p-4"><p className="text-3xl font-black tracking-[-0.06em]">{value}</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p></CardContent></Card>)}<Card><CardContent className="p-4"><Badge variant="outline" className={performance.risk === 'high' ? 'text-danger' : performance.risk === 'medium' ? 'text-warn' : 'text-volt-ink'}>{performance.risk === 'high' ? 'Risco alto' : performance.risk === 'medium' ? 'Atenção' : 'Bom ritmo'}</Badge><p className="mt-2 text-xs text-muted-foreground">{performance.daysSinceLastWorkout === null ? 'Sem treino' : `${performance.daysSinceLastWorkout} dia(s) desde o último`}</p></CardContent></Card></div>}

      <Tabs value={activeTab} onValueChange={setActiveTab}><TabsList className="grid h-12 w-full grid-cols-4"><TabsTrigger value="overview"><User className="mr-2 hidden size-4 sm:inline" /> Visão geral</TabsTrigger><TabsTrigger value="workouts"><Dumbbell className="mr-2 hidden size-4 sm:inline" /> Fichas</TabsTrigger><TabsTrigger value="progress"><TrendingUp className="mr-2 hidden size-4 sm:inline" /> Evolução</TabsTrigger><TabsTrigger value="assessments"><ClipboardList className="mr-2 hidden size-4 sm:inline" /> Avaliações</TabsTrigger></TabsList>
        <TabsContent value="overview" className="mt-6"><div className="grid gap-6 md:grid-cols-3"><Card className="md:col-span-2"><CardHeader><CardTitle className="text-lg">Dados físicos</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-4">{[['Peso', student.current_weight ? `${student.current_weight} kg` : '--'], ['Altura', student.height ? `${student.height} cm` : '--'], ['Nível', LEVEL_LABELS[student.experience_level]], ['Início', student.start_date ? new Date(`${student.start_date.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '--']].map(([label, value]) => <div key={label} className="rounded-xl bg-muted/40 p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></div>)}</div></CardContent></Card><Card className="border-warn/25 bg-warn-wash"><CardHeader><CardTitle className="text-lg text-warn">Observações</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{student.injuries || student.restrictions || student.notes || 'Nenhuma observação registrada.'}</p></CardContent></Card></div></TabsContent>
        <TabsContent value="workouts"><Card className="py-12 text-center"><CardContent><Dumbbell className="mx-auto mb-4 size-12 text-muted-foreground/40" /><h3 className="font-bold">Fichas do aluno</h3><p className="mb-5 mt-1 text-sm text-muted-foreground">Consulte as fichas ou crie uma nova.</p><div className="flex justify-center gap-2"><Button variant="outline" onClick={() => router.push('/workouts')}>Ver fichas</Button><Button onClick={() => router.push('/exercises')}>Criar ficha</Button></div></CardContent></Card></TabsContent>
        <TabsContent value="progress" className="mt-6">{progressData ? <StudentProgressDashboard data={progressData} /> : <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Registre treinos e avaliações para calcular a evolução.</CardContent></Card>}</TabsContent>
        <TabsContent value="assessments" className="mt-6"><div className="mb-4 flex justify-end"><Button onClick={() => router.push(`/assessments/new?studentId=${params.id}`)}><ClipboardList className="mr-2 size-4" /> Nova avaliação</Button></div>{progressData?.assessments.length ? <div className="grid gap-4 md:grid-cols-2">{progressData.assessments.slice().reverse().map((assessment) => <Card key={assessment.id}><CardHeader><CardTitle className="flex items-center justify-between text-base"><span>Avaliação de {assessment.dateLabel}</span><Badge variant="secondary">{assessment.bmi === null ? 'IMC —' : `IMC ${assessment.bmi}`}</Badge></CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-3 text-sm">{[['Peso', assessment.weight === null ? '—' : `${assessment.weight} kg`], ['Gordura corporal', assessment.bodyFat === null ? '—' : `${assessment.bodyFat}%`], ['Massa muscular', assessment.muscleMass === null ? '—' : `${assessment.muscleMass} kg`], ['Pressão', assessment.bloodPressure || '—']].map(([label, value]) => <div key={label} className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">{label}</p><strong>{value}</strong></div>)}{assessment.notes && <p className="col-span-2 rounded-lg border p-3 text-muted-foreground">{assessment.notes}</p>}</CardContent></Card>)}</div> : <Card className="py-12 text-center"><CardContent><ClipboardList className="mx-auto mb-4 size-12 text-muted-foreground/40" /><p className="mb-5 text-sm text-muted-foreground">Nenhuma avaliação registrada para este aluno.</p><Button onClick={() => router.push(`/assessments/new?studentId=${params.id}`)}>Nova avaliação</Button></CardContent></Card>}</TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Editar aluno</DialogTitle></DialogHeader>{draft && <div className="space-y-4"><div className="space-y-2"><Label>Nome</Label><Input value={draft.full_name} onChange={(event) => setDraft({ ...draft, full_name: event.target.value })} /></div><div className="space-y-2"><Label>Status</Label><Select value={draft.status} onValueChange={(value) => setDraft({ ...draft, status: value as StudentDetails['status'] })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Arquivado</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Objetivo</Label><Input value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value })} /></div><div className="space-y-2"><Label>Nível</Label><Select value={draft.experience_level} onValueChange={(value) => setDraft({ ...draft, experience_level: value as StudentDetails['experience_level'] })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="beginner">Iniciante</SelectItem><SelectItem value="intermediate">Intermediário</SelectItem><SelectItem value="advanced">Avançado</SelectItem></SelectContent></Select></div><div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Peso (kg)</Label><Input type="number" step="0.1" value={draft.current_weight || ''} onChange={(event) => setDraft({ ...draft, current_weight: Number(event.target.value) })} /></div><div className="space-y-2"><Label>Altura (cm)</Label><Input type="number" value={draft.height || ''} onChange={(event) => setDraft({ ...draft, height: Number(event.target.value) })} /></div></div><div className="space-y-2"><Label>Lesões</Label><Textarea value={draft.injuries} onChange={(event) => setDraft({ ...draft, injuries: event.target.value })} /></div><div className="space-y-2"><Label>Restrições</Label><Textarea value={draft.restrictions} onChange={(event) => setDraft({ ...draft, restrictions: event.target.value })} /></div><div className="space-y-2"><Label>Observações internas</Label><Textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button onClick={() => void saveStudent()} disabled={saving || draft.full_name.trim().length < 2}>{saving && <Loader2 className="mr-2 size-4 animate-spin" />} Salvar</Button></div></div>}</DialogContent></Dialog>
    </div>
  );
}
