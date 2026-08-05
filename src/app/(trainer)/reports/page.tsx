'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, Download, FileText, Loader2, RefreshCw, Target, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { StudentProgressDashboard } from '@/components/students/student-progress-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StudentProgressData } from '@/types/student-progress';

interface StudentOption {
  id: string;
  name: string;
  status: string;
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export default function ReportsPage() {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState('');
  const [report, setReport] = useState<StudentProgressData | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const response = await fetch('/api/students', { cache: 'no-store' });
      const data = await response.json() as { students?: StudentOption[]; error?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar os alunos.');
      const available = data.students ?? [];
      setStudents(available);
      setStudentId((current) => current || available.find((student) => student.status === 'active')?.id || available[0]?.id || '');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os alunos.');
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const loadReport = useCallback(async (id: string) => {
    if (!id) {
      setReport(null);
      return;
    }
    setLoadingReport(true);
    try {
      const response = await fetch(`/api/student-progress/${id}`, { cache: 'no-store' });
      const data = await response.json() as { progress?: StudentProgressData; error?: string };
      if (!response.ok || !data.progress) throw new Error(data.error || 'Não foi possível gerar o relatório individual.');
      setReport(data.progress);
    } catch (error) {
      setReport(null);
      toast.error(error instanceof Error ? error.message : 'Não foi possível gerar o relatório individual.');
    } finally {
      setLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadStudents(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadStudents]);
  useEffect(() => {
    const reportLoad = window.setTimeout(() => void loadReport(studentId), 0);
    return () => window.clearTimeout(reportLoad);
  }, [loadReport, studentId]);

  if (loadingStudents) return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-6 animate-spin" /> Carregando alunos...</div>;

  return (
    <div className="print-report space-y-6 pb-10 animate-fade-in">
      <div className="no-print flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Relatório individual de evolução</h1><p className="mt-1 text-muted-foreground">Acompanhamento de treinos, avaliações físicas e progresso de cada aluno.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={studentId} onValueChange={(value) => setStudentId(value ?? '')}>
            <SelectTrigger className="w-full min-w-64 sm:w-72"><SelectValue placeholder="Selecione um aluno" /></SelectTrigger>
            <SelectContent>{students.map((student) => <SelectItem key={student.id} value={student.id}>{student.name}{student.status !== 'active' ? ' (arquivado)' : ''}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" disabled={!studentId || loadingReport} onClick={() => void loadReport(studentId)}><RefreshCw className={`mr-2 size-4 ${loadingReport ? 'animate-spin' : ''}`} /> Atualizar</Button>
          <Button disabled={!report || loadingReport} onClick={() => window.print()}><Download className="mr-2 size-4" /> Salvar relatório em PDF</Button>
        </div>
      </div>

      {students.length === 0 ? <Card><CardContent className="py-16 text-center text-sm text-muted-foreground"><UserRound className="mx-auto mb-3 size-12 opacity-40" />Cadastre um aluno para gerar o primeiro relatório.</CardContent></Card> : loadingReport ? <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-6 animate-spin" /> Montando relatório detalhado...</div> : report ? <>
        <header className="rounded-2xl border bg-card p-6 print:border-black">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <Avatar className="size-20">
                {report.student.avatarUrl && <AvatarImage src={report.student.avatarUrl} alt={`Avatar de ${report.student.name}`} />}
                <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">{initials(report.student.name)}</AvatarFallback>
              </Avatar>
              <div><div className="mb-1 flex flex-wrap items-center gap-2"><h2 className="text-2xl font-bold">{report.student.name}</h2><Badge variant="outline">{report.student.status === 'active' ? 'Ativo' : 'Arquivado'}</Badge></div><p className="text-sm text-muted-foreground">Acompanhado por {report.trainer.name}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:text-right">
              <div><p className="flex items-center gap-1 text-xs text-muted-foreground sm:justify-end"><Target className="size-3" /> Objetivo</p><strong>{report.student.goal}</strong></div>
              <div><p className="flex items-center gap-1 text-xs text-muted-foreground sm:justify-end"><Calendar className="size-3" /> Início</p><strong>{new Date(report.student.startDate).toLocaleDateString('pt-BR')}</strong></div>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><FileText className="size-3.5" /> Relatório individual de evolução</span><span>Gerado em {new Date(report.generatedAt).toLocaleString('pt-BR')}</span></div>
        </header>
        <StudentProgressDashboard data={report} />
        <footer className="hidden border-t pt-4 text-center text-xs text-muted-foreground print:block">Relatório gerado pelo FitControl Pro em {new Date(report.generatedAt).toLocaleString('pt-BR')}.</footer>
      </> : <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">Selecione um aluno para visualizar o relatório.</CardContent></Card>}
    </div>
  );
}
