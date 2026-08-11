'use client';

import { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Dumbbell, History, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface WorkoutHistoryItem {
  id: string;
  date: string;
  name: string;
  dayLabel: string;
  durationSeconds: number | null;
  completion: number;
  volume: number;
  status: string;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return 'Duração não registrada';
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch('/api/workout-sessions', { cache: 'no-store' });
        const data = await response.json() as { history?: WorkoutHistoryItem[]; error?: string };
        if (!response.ok) throw new Error(data.error || 'Não foi possível carregar o histórico.');
        setHistory(data.history ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o histórico.');
      } finally {
        setLoading(false);
      }
    };
    void loadHistory();
  }, []);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Carregando histórico...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><p className="dk-kicker text-muted-foreground">Memória de treino</p><h1 className="dk-display mt-3 flex items-center gap-3 text-4xl"><History className="size-7 text-[#7cae00]" /> HISTÓRICO</h1><p className="mt-2 text-muted-foreground">{history.length} treino(s) registrado(s)</p></div>
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">{error}</div>
      ) : history.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center p-10 text-center"><Dumbbell className="mb-3 size-10 text-muted-foreground/30" /><h2 className="font-bold">Nenhum treino concluído ainda</h2><p className="mt-1 max-w-sm text-sm text-muted-foreground">Marque todas as séries na aba Treino e use “Concluir e salvar treino”. O registro aparecerá aqui.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {history.map((workout) => (
            <Card key={workout.id}><CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3"><div><p className="font-semibold">{workout.name}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Calendar className="size-3" />{new Date(workout.date).toLocaleDateString('pt-BR')}</span><span className="flex items-center gap-1"><Clock className="size-3" />{formatDuration(workout.durationSeconds)}</span></div></div><Badge className="bg-ok-wash text-ok"><CheckCircle2 className="mr-1 size-3" /> {workout.completion}%</Badge></div>
              <Progress value={workout.completion} className="h-1.5" />
              {workout.volume > 0 && <p className="mt-2 text-xs text-muted-foreground">Volume: {workout.volume.toLocaleString('pt-BR')} kg</p>}
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
