'use client';

import { History, Calendar, Dumbbell, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const workoutHistory = [
  { date: '02/08/2026', name: 'Treino A — Peito/Tríceps', duration: '52 min', completion: 100, volume: '8,450 kg', exercises: 5 },
  { date: '31/07/2026', name: 'Treino C — Pernas', duration: '65 min', completion: 90, volume: '12,300 kg', exercises: 5 },
  { date: '30/07/2026', name: 'Treino B — Costas/Bíceps', duration: '48 min', completion: 85, volume: '7,200 kg', exercises: 5 },
  { date: '28/07/2026', name: 'Treino A — Peito/Tríceps', duration: '55 min', completion: 95, volume: '8,900 kg', exercises: 5 },
  { date: '26/07/2026', name: 'Treino C — Pernas', duration: '60 min', completion: 80, volume: '11,500 kg', exercises: 5 },
  { date: '25/07/2026', name: 'Treino B — Costas/Bíceps', duration: '50 min', completion: 92, volume: '7,800 kg', exercises: 5 },
];

export default function HistoryPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-blue-500" />
          Histórico de Treinos
        </h1>
        <p className="text-muted-foreground mt-1">{workoutHistory.length} treinos realizados</p>
      </div>

      <div className="space-y-3">
        {workoutHistory.map((workout, i) => (
          <Card key={i} className="border-border/50 hover:shadow-md transition-shadow animate-slide-up" style={{ animationDelay: `${0.05 * i}s` }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold">{workout.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{workout.date}</span>
                    <Clock className="w-3 h-3 ml-1" />
                    <span>{workout.duration}</span>
                  </div>
                </div>
                <Badge className={workout.completion === 100 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}>
                  {workout.completion}%
                </Badge>
              </div>
              <Progress value={workout.completion} className="h-1.5 mb-2" />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span><Dumbbell className="w-3 h-3 inline mr-1" />{workout.exercises} exercícios</span>
                <span><Target className="w-3 h-3 inline mr-1" />{workout.volume}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
