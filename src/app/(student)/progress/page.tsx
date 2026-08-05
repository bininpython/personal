'use client';

import { useEffect, useState } from 'react';
import { Activity, Dumbbell, Loader2, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentProgress {
  completedWorkouts: number;
  frequency: Array<{ label: string; workouts: number }>;
  weight: Array<{ date: string; weight: number }>;
  bodyFat: Array<{ date: string; value: number }>;
}

export default function ProgressPage() {
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await fetch('/api/workout-sessions', { cache: 'no-store' });
        const data = await response.json() as { progress?: StudentProgress; error?: string };
        if (!response.ok) throw new Error(data.error || 'Não foi possível carregar sua evolução.');
        setProgress(data.progress ?? null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar sua evolução.');
      } finally {
        setLoading(false);
      }
    };
    void loadProgress();
  }, []);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Carregando evolução...</div>;
  if (error || !progress) return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">{error || 'Dados indisponíveis.'}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><TrendingUp className="size-6 text-blue-500" /> Evolução</h1><p className="mt-1 text-muted-foreground">Dados reais dos treinos concluídos e avaliações.</p></div>
      <Card className="border-border/60"><CardContent className="flex items-center gap-4 p-5"><div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10"><Dumbbell className="size-6 text-blue-500" /></div><div><p className="text-3xl font-bold">{progress.completedWorkouts}</p><p className="text-sm text-muted-foreground">treino(s) concluído(s)</p></div></CardContent></Card>

      <Card className="border-border/60"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="size-4 text-emerald-500" /> Frequência nas últimas semanas</CardTitle></CardHeader><CardContent><div className="grid grid-cols-4 gap-2">{progress.frequency.map((week) => <div key={week.label} className="rounded-lg bg-muted/50 p-3 text-center"><p className="text-xl font-bold">{week.workouts}</p><p className="text-[10px] text-muted-foreground">{week.label}</p></div>)}</div></CardContent></Card>

      {progress.weight.length > 0 ? (
        <Card className="border-border/60"><CardHeader><CardTitle className="text-base">Evolução de peso</CardTitle></CardHeader><CardContent><div className="h-56"><ResponsiveContainer width="100%" height="100%"><AreaChart data={progress.weight}><defs><linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" /><YAxis domain={['auto', 'auto']} /><Tooltip /><Area type="monotone" dataKey="weight" name="Peso (kg)" stroke="#2563eb" fill="url(#weightGradient)" /></AreaChart></ResponsiveContainer></div></CardContent></Card>
      ) : (
        <Card className="border-dashed"><CardContent className="p-8 text-center"><p className="font-medium">Sem medidas para o gráfico de peso</p><p className="mt-1 text-sm text-muted-foreground">O gráfico aparecerá após o personal registrar uma avaliação com seu peso.</p></CardContent></Card>
      )}
    </div>
  );
}
