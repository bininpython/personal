'use client';

import { Activity, CalendarDays, ClipboardList, Dumbbell, HeartPulse, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ProgressAssessment, StudentProgressData } from '@/types/student-progress';

interface StudentProgressDashboardProps {
  data: StudentProgressData;
  showTimeline?: boolean;
}

function delta(value: number | null, suffix: string) {
  if (value === null) return 'Sem comparação';
  return `${value > 0 ? '+' : ''}${value} ${suffix}`;
}

function formatDate(value: string) {
  return new Date(value.includes('T') ? value : `${value}T12:00:00`).toLocaleDateString('pt-BR');
}

function metric(value: number | null, suffix: string) {
  return value === null ? '—' : `${value} ${suffix}`;
}

function AssessmentDetails({ assessment }: { assessment: ProgressAssessment }) {
  const measurements = [
    ['Tórax', assessment.measurements.chest],
    ['Cintura', assessment.measurements.waist],
    ['Abdômen', assessment.measurements.abdomen],
    ['Quadril', assessment.measurements.hips],
    ['Braço direito', assessment.measurements.rightArm],
    ['Braço esquerdo', assessment.measurements.leftArm],
    ['Coxa direita', assessment.measurements.rightThigh],
    ['Coxa esquerda', assessment.measurements.leftThigh],
    ['Panturrilha direita', assessment.measurements.rightCalf],
    ['Panturrilha esquerda', assessment.measurements.leftCalf],
  ].filter(([, value]) => value !== null);

  return (
    <details className="rounded-xl border bg-card p-4 print:break-inside-avoid" open={false}>
      <summary className="cursor-pointer list-none font-semibold">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2"><ClipboardList className="size-4 text-primary" /> {assessment.dateLabel}</span>
          <span className="text-xs font-normal text-muted-foreground">Clique para ver todas as medidas</span>
        </div>
      </summary>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Peso', metric(assessment.weight, 'kg')],
          ['Gordura corporal', metric(assessment.bodyFat, '%')],
          ['Massa muscular', metric(assessment.muscleMass, 'kg')],
          ['IMC', metric(assessment.bmi, '')],
          ['Pressão arterial', assessment.bloodPressure || '—'],
          ['FC em repouso', metric(assessment.restingHeartRate, 'bpm')],
        ].map(([label, value]) => <div key={label} className="rounded-lg bg-muted/50 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="font-semibold">{value}</p></div>)}
      </div>
      {measurements.length > 0 && <div className="mt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Perimetria</p><div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3">{measurements.map(([label, value]) => <div key={String(label)} className="flex justify-between border-b py-1 text-sm"><span className="text-muted-foreground">{label}</span><strong>{value} cm</strong></div>)}</div></div>}
      {assessment.notes && <p className="mt-4 rounded-lg bg-muted/40 p-3 text-sm"><strong>Observações:</strong> {assessment.notes}</p>}
    </details>
  );
}

export function StudentProgressDashboard({ data, showTimeline = true }: StudentProgressDashboardProps) {
  const latestAssessment = data.assessments.at(-1);
  const riskLabel = data.performance.risk === 'high' ? 'Precisa de atenção' : data.performance.risk === 'medium' ? 'Acompanhar' : 'Bom ritmo';
  const riskClass = data.performance.risk === 'high' ? 'text-danger border-danger/30' : data.performance.risk === 'medium' ? 'text-warn border-warn/30' : 'text-ok border-ok/30';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          { label: 'Constância', value: `${data.performance.consistencyScore}%`, icon: Activity },
          { label: 'Treinos em 7 dias', value: `${data.performance.workouts7d}/${data.performance.plannedFrequency}`, icon: Dumbbell },
          { label: 'Treinos concluídos', value: data.performance.completedWorkouts, icon: Dumbbell },
          { label: 'Evolução do peso', value: delta(data.performance.weightChange, 'kg'), icon: data.performance.weightChange !== null && data.performance.weightChange < 0 ? TrendingDown : TrendingUp },
          { label: 'Evolução de gordura', value: delta(data.performance.bodyFatChange, '%'), icon: TrendingDown },
          { label: 'Evolução muscular', value: delta(data.performance.muscleMassChange, 'kg'), icon: TrendingUp },
        ].map((item) => <Card key={item.label} className="print:break-inside-avoid"><CardContent className="p-4"><item.icon className="mb-2 size-4 text-primary" /><p className="text-lg font-bold sm:text-xl">{item.value}</p><p className="text-[11px] text-muted-foreground">{item.label}</p></CardContent></Card>)}
      </div>

      <Card className="print:break-inside-avoid">
        <CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3"><span className="text-sm font-medium">Acompanhamento atual</span><Badge variant="outline" className={riskClass}>{riskLabel}</Badge></div>
            <Progress value={data.performance.consistencyScore} />
            <p className="mt-3 text-sm text-muted-foreground">{data.performance.recommendation}</p>
          </div>
          <div className="rounded-xl bg-muted/50 px-5 py-3 text-center"><p className="text-2xl font-bold">{data.performance.completionAverage}%</p><p className="text-xs text-muted-foreground">execução média</p></div>
        </CardContent>
      </Card>

      {data.assessments.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="print:break-inside-avoid">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Scale className="size-5 text-[#7cae00]" /> Peso e massa muscular</CardTitle></CardHeader>
            <CardContent><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.assessments}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} /><Tooltip /><Legend /><Line type="monotone" dataKey="weight" name="Peso (kg)" stroke="#7cae00" strokeWidth={3} connectNulls /><Line type="monotone" dataKey="muscleMass" name="Massa muscular (kg)" stroke="#111111" strokeWidth={3} connectNulls /></LineChart></ResponsiveContainer></div></CardContent>
          </Card>
          <Card className="print:break-inside-avoid">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="size-5 text-rose-500" /> Gordura corporal e IMC</CardTitle></CardHeader>
            <CardContent><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.assessments}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} /><Tooltip /><Legend /><Line type="monotone" dataKey="bodyFat" name="Gordura (%)" stroke="#e11d48" strokeWidth={3} connectNulls /><Line type="monotone" dataKey="bmi" name="IMC" stroke="#7c3aed" strokeWidth={3} connectNulls /></LineChart></ResponsiveContainer></div></CardContent>
          </Card>
        </div>
      ) : <Card><CardContent className="py-12 text-center text-sm text-muted-foreground"><ClipboardList className="mx-auto mb-3 size-10 opacity-40" />Ainda não há avaliações físicas para gerar os gráficos.</CardContent></Card>}

      <Card className="print:break-inside-avoid">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Dumbbell className="size-5 text-primary" /> Treinos concluídos por semana</CardTitle></CardHeader>
        <CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.weeklyWorkouts}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="workouts" name="Treinos" fill="#9fdb00" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="size-5 text-primary" /> Histórico de avaliações</CardTitle></CardHeader>
          <CardContent className="space-y-3">{data.assessments.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma avaliação registrada.</p> : data.assessments.slice().reverse().map((assessment) => <AssessmentDetails key={assessment.id} assessment={assessment} />)}</CardContent>
        </Card>

        {showTimeline && <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="size-5 text-primary" /> Linha do tempo da evolução</CardTitle></CardHeader>
          <CardContent>{data.timeline.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">A evolução aparecerá conforme avaliações e treinos forem registrados.</p> : <div className="relative ml-3 border-l pl-6">{data.timeline.map((item) => <div key={item.id} className="relative mb-6 last:mb-0"><span className={`absolute -left-[31px] top-0 flex size-4 items-center justify-center rounded-full ring-4 ring-background ${item.type === 'assessment' ? 'bg-black dark:bg-white' : 'bg-[#9fdb00]'}`} /><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div><Badge variant="secondary" className="text-[10px]">{formatDate(item.date)}</Badge></div></div>)}</div>}</CardContent>
        </Card>}
      </div>

      {latestAssessment && <Card className="border-primary/20 bg-primary/[0.03] print:break-inside-avoid"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><HeartPulse className="size-5 text-primary" /> Última avaliação — {latestAssessment.dateLabel}</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-5">{[
        ['Peso', metric(latestAssessment.weight, 'kg')],
        ['Massa muscular', metric(latestAssessment.muscleMass, 'kg')],
        ['Gordura', metric(latestAssessment.bodyFat, '%')],
        ['IMC', metric(latestAssessment.bmi, '')],
        ['Altura', metric(latestAssessment.height, 'cm')],
      ].map(([label, value]) => <div key={label} className="rounded-lg bg-background p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="font-bold">{value}</p></div>)}</CardContent></Card>}
    </div>
  );
}
