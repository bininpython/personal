'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Dumbbell, History, Loader2, Star, Timer, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkoutHistoryItem {
  id: string;
  date: string;
  name: string;
  planName: string;
  dayLabel: string;
  durationSeconds: number;
  completion: number;
  volume: number;
  status: string;
  rating: number | null;
  feedback: string | null;
}

function duration(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes}min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

export default function IndividualHistoryPage() {
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [summary, setSummary] = useState({ completedWorkouts: 0, totalVolume: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/individual/workout-sessions', { cache: 'no-store' })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!response.ok) throw new Error(data.error || 'Não foi possível carregar seu histórico.');
        setHistory(data.history ?? []);
        setSummary(data.summary ?? { completedWorkouts: 0, totalVolume: 0 });
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar seu histórico.'))
      .finally(() => setLoading(false));
  }, []);

  const averageCompletion = useMemo(() => history.length > 0
    ? Math.round(history.reduce((sum, item) => sum + item.completion, 0) / history.length)
    : 0, [history]);

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Carregando seu histórico...</div>;
  if (error) return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">{error}</div>;

  return (
    <div className="space-y-7 pb-10 animate-fade-in">
      <section className="dk-hero-panel p-6 sm:p-8 lg:p-10"><div className="relative z-10"><p className="dk-kicker text-[#c9ff32]">Minha evolução</p><h1 className="dk-display mt-5 text-4xl sm:text-5xl">HISTÓRICO DE TREINOS</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">Cada conclusão registra duração, volume e avaliação da ficha feita naquele dia.</p></div></section>

      <section className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="p-5"><History className="size-5 text-[#668f00]" /><p className="mt-4 text-3xl font-black">{summary.completedWorkouts}</p><p className="text-xs text-muted-foreground">treinos concluídos</p></CardContent></Card><Card><CardContent className="p-5"><TrendingUp className="size-5 text-[#668f00]" /><p className="mt-4 text-3xl font-black">{averageCompletion}%</p><p className="text-xs text-muted-foreground">conclusão média</p></CardContent></Card><Card><CardContent className="p-5"><Dumbbell className="size-5 text-[#668f00]" /><p className="mt-4 text-3xl font-black">{summary.totalVolume.toLocaleString('pt-BR')}</p><p className="text-xs text-muted-foreground">kg de volume registrado</p></CardContent></Card></section>

      {history.length === 0 ? <Card className="border-dashed"><CardContent className="py-14 text-center"><Dumbbell className="mx-auto size-10 text-muted-foreground/40" /><h2 className="mt-4 text-xl font-black">Seu primeiro resultado aparecerá aqui</h2><p className="mt-2 text-sm text-muted-foreground">Inicie a ficha do dia, conclua todas as séries e salve o resultado.</p></CardContent></Card> : <section className="space-y-3">{history.map((item) => <Card key={item.id}><CardHeader className="pb-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#668f00]">Ficha {item.dayLabel} · {item.planName}</p><CardTitle className="mt-2 text-xl">{item.name}</CardTitle></div><Badge className="border-0 bg-[#c9ff32] text-black"><CalendarDays className="mr-1 size-3" /> {new Date(item.date).toLocaleDateString('pt-BR')}</Badge></div></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-3"><div className="rounded-xl bg-muted/60 p-3"><Timer className="size-4" /><p className="mt-2 font-black">{duration(item.durationSeconds)}</p><p className="text-[10px] uppercase text-muted-foreground">duração</p></div><div className="rounded-xl bg-muted/60 p-3"><TrendingUp className="size-4" /><p className="mt-2 font-black">{Math.round(item.completion)}%</p><p className="text-[10px] uppercase text-muted-foreground">conclusão</p></div><div className="rounded-xl bg-muted/60 p-3"><Dumbbell className="size-4" /><p className="mt-2 font-black">{item.volume.toLocaleString('pt-BR')} kg</p><p className="text-[10px] uppercase text-muted-foreground">volume</p></div></div>{item.rating ? <p className="mt-3 flex items-center gap-1 text-sm"><Star className="size-4 fill-amber-400 text-amber-400" /> {item.rating}/5</p> : null}{item.feedback ? <p className="mt-3 rounded-xl border p-3 text-sm text-muted-foreground">{item.feedback}</p> : null}</CardContent></Card>)}</section>}
    </div>
  );
}
