'use client';

import { useEffect, useState } from 'react';
import { Activity, Dumbbell, Loader2, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BRAND_COLORS } from '@/lib/brand';

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
      <div><p className="dk-kicker text-muted-foreground">Performance real</p><h1 className="dk-display mt-3 flex items-center gap-3 text-4xl"><TrendingUp className="size-7 text-brand-accent-strong" /> EVOLUÇÃO</h1><p className="mt-2 text-muted-foreground">Dados reais dos treinos concluídos e avaliações.</p></div>
      <Card><CardContent className="flex items-center gap-4 p-5"><div className="flex size-12 items-center justify-center rounded-full bg-black text-brand-accent dark:bg-brand-accent dark:text-black"><Dumbbell className="size-6" /></div><div><p className="text-4xl font-black tracking-[-0.06em]">{progress.completedWorkouts}</p><p className="text-sm text-muted-foreground">treino(s) concluído(s)</p></div></CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="size-4 text-brand-accent-strong" /> Frequência nas últimas semanas</CardTitle></CardHeader><CardContent><div className="grid grid-cols-4 gap-2">{progress.frequency.map((week) => <div key={week.label} className="rounded-2xl bg-brand-accent/12 p-3 text-center"><p className="text-xl font-black">{week.workouts}</p><p className="text-[10px] text-muted-foreground">{week.label}</p></div>)}</div></CardContent></Card>

      {progress.weight.length > 0 ? (
        <Card><CardHeader><CardTitle className="text-base">Evolução de peso</CardTitle></CardHeader><CardContent><div className="h-56"><ResponsiveContainer width="100%" height="100%"><AreaChart data={progress.weight}><defs><linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND_COLORS.accentDeep} stopOpacity={0.35} /><stop offset="95%" stopColor={BRAND_COLORS.accentDeep} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" /><YAxis domain={['auto', 'auto']} /><Tooltip /><Area type="monotone" dataKey="weight" name="Peso (kg)" stroke={BRAND_COLORS.accentStrong} strokeWidth={3} fill="url(#weightGradient)" /></AreaChart></ResponsiveContainer></div></CardContent></Card>
      ) : (
        <Card className="border-dashed"><CardContent className="p-8 text-center"><p className="font-medium">Sem medidas para o gráfico de peso</p><p className="mt-1 text-sm text-muted-foreground">O gráfico aparecerá após o personal registrar uma avaliação com seu peso.</p></CardContent></Card>
      )}
    </div>
  );
}
