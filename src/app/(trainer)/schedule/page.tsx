'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Loader2, Plus, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { APP_TIME_ZONE, dateKeyInSaoPaulo, saoPauloDateTimeToIso } from '@/lib/time/sao-paulo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';

interface Appointment {
  id: string;
  studentId: string;
  studentName: string;
  type: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
}

const TYPE_LABELS: Record<string, string> = {
  training: 'Treino acompanhado',
  assessment: 'Avaliação física',
  follow_up: 'Acompanhamento',
  other: 'Outro compromisso',
};

function shiftMonth(month: string, amount: number) {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(() => dateKeyInSaoPaulo().slice(0, 7));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [type, setType] = useState('training');
  const [date, setDate] = useState(() => dateKeyInSaoPaulo());
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [appointmentResponse, studentResponse] = await Promise.all([
        fetch(`/api/appointments?month=${currentMonth}`, { cache: 'no-store' }),
        fetch('/api/students', { cache: 'no-store' }),
      ]);
      const appointmentData = await appointmentResponse.json() as { appointments?: Appointment[]; error?: string };
      const studentData = await studentResponse.json() as { students?: Array<{ id: string; name: string; status: string }>; error?: string };
      if (!appointmentResponse.ok) throw new Error(appointmentData.error || 'Não foi possível carregar a agenda.');
      if (!studentResponse.ok) throw new Error(studentData.error || 'Não foi possível carregar os alunos.');
      setAppointments(appointmentData.appointments ?? []);
      setStudents((studentData.students ?? []).filter((student) => student.status === 'active'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar a agenda.');
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadData]);

  const grouped = useMemo(() => appointments.reduce<Record<string, Appointment[]>>((groups, item) => {
    const key = new Date(item.startTime).toLocaleDateString('pt-BR', { timeZone: APP_TIME_ZONE });
    groups[key] = [...(groups[key] || []), item];
    return groups;
  }, {}), [appointments]);

  async function createAppointment() {
    if (!studentId) return toast.error('Selecione um aluno.');
    setSaving(true);
    try {
      const startTime = saoPauloDateTimeToIso(date, `${start}:00`);
      const endTime = saoPauloDateTimeToIso(date, `${end}:00`);
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, type, startTime, endTime, notes }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível agendar.');
      toast.success('Agendamento criado.');
      setDialogOpen(false);
      setNotes('');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível agendar.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: Appointment['status']) {
    try {
      const response = await fetch('/api/appointments', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível atualizar.');
      setAppointments((items) => items.map((item) => item.id === id ? { ...item, status } : item));
      toast.success(status === 'completed' ? 'Compromisso concluído.' : 'Compromisso cancelado.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar.');
    }
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <PageHeader
        kicker="Operação"
        title="Agenda"
        description="Organize treinos, avaliações e acompanhamentos."
        actions={
          <Button className="h-11" onClick={() => setDialogOpen(true)} disabled={students.length === 0}>
            <Plus className="mr-2 size-4" /> Novo agendamento
          </Button>
        }
      />
      <div className="flex items-center justify-between rounded-xl border bg-card p-4"><Button variant="outline" size="icon" onClick={() => setCurrentMonth((value) => shiftMonth(value, -1))} aria-label="Mês anterior"><ChevronLeft /></Button><h2 className="font-semibold capitalize">{new Date(`${currentMonth}-01T12:00:00Z`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h2><Button variant="outline" size="icon" onClick={() => setCurrentMonth((value) => shiftMonth(value, 1))} aria-label="Próximo mês"><ChevronRight /></Button></div>

      {loading ? <div className="flex justify-center py-20 text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Carregando agenda...</div> : appointments.length === 0 ? <Card className="border-dashed"><CardContent className="flex flex-col items-center py-20 text-center"><CalendarDays className="mb-3 size-12 text-muted-foreground/30" /><h2 className="font-semibold">Nenhum compromisso neste mês</h2><p className="mt-1 text-sm text-muted-foreground">Use “Novo agendamento” para organizar sua agenda.</p></CardContent></Card> : <div className="space-y-5">{Object.entries(grouped).map(([day, items]) => <section key={day}><h3 className="mb-2 text-sm font-bold text-muted-foreground">{day}</h3><div className="space-y-2">{items.map((item) => <Card key={item.id}><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-black text-[#c9ff32] dark:bg-[#c9ff32] dark:text-black"><Clock3 className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{TYPE_LABELS[item.type] || item.type}</p><Badge variant="outline">{item.status === 'scheduled' ? 'Agendado' : item.status === 'completed' ? 'Concluído' : 'Cancelado'}</Badge></div><p className="text-sm text-muted-foreground">{item.studentName} · {new Date(item.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: APP_TIME_ZONE })}–{new Date(item.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: APP_TIME_ZONE })}</p>{item.notes && <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>}</div>{item.status === 'scheduled' && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void updateStatus(item.id, 'completed')}><CheckCircle2 className="mr-1 size-4" /> Concluir</Button><Button size="sm" variant="ghost" className="text-destructive" onClick={() => void updateStatus(item.id, 'cancelled')}><XCircle className="mr-1 size-4" /> Cancelar</Button></div>}</CardContent></Card>)}</div></section>)}</div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>Novo agendamento</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Aluno</Label><Select value={studentId} onValueChange={(value) => setStudentId(String(value))}><SelectTrigger className="w-full"><SelectValue placeholder="Selecione o aluno" /></SelectTrigger><SelectContent>{students.map((student) => <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Tipo</Label><Select value={type} onValueChange={(value) => setType(String(value))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TYPE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Data</Label><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div><div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Início</Label><Input type="time" value={start} onChange={(event) => setStart(event.target.value)} /></div><div className="space-y-2"><Label>Fim</Label><Input type="time" value={end} onChange={(event) => setEnd(event.target.value)} /></div></div><div className="space-y-2"><Label>Observações</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={() => void createAppointment()} disabled={saving}>{saving && <Loader2 className="mr-2 size-4 animate-spin" />} Salvar</Button></div></div></DialogContent></Dialog>
    </div>
  );
}
