'use client';

import { TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const weightData = [
  { date: 'Mai', peso: 80 }, { date: 'Jun', peso: 79 },
  { date: 'Jul', peso: 78.5 }, { date: 'Ago', peso: 78 },
];

const loadData = [
  { date: 'Sem 1', supino: 30, agachamento: 60 },
  { date: 'Sem 2', supino: 32, agachamento: 65 },
  { date: 'Sem 3', supino: 35, agachamento: 70 },
  { date: 'Sem 4', supino: 38, agachamento: 75 },
];

const frequencyData = [
  { week: 'Sem 1', treinos: 4 }, { week: 'Sem 2', treinos: 3 },
  { week: 'Sem 3', treinos: 5 }, { week: 'Sem 4', treinos: 4 },
];

export default function ProgressPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          Evolução
        </h1>
        <p className="text-muted-foreground mt-1">Acompanhe seu progresso ao longo do tempo</p>
      </div>

      {/* Consistency Score */}
      <Card className="border-border/50 bg-gradient-to-br from-blue-500/5 to-emerald-500/5">
        <CardContent className="p-5 text-center">
          <div className="text-5xl font-bold gradient-text mb-1">78</div>
          <p className="text-sm text-muted-foreground">Pontuação de Consistência</p>
          <div className="flex justify-center gap-2 mt-2">
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">+5 esta semana</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Weight Evolution */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Evolução de Peso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={2} fill="url(#weightGrad)" name="Peso (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Load Evolution */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Evolução de Carga</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="supino" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Supino (kg)" />
                <Line type="monotone" dataKey="agachamento" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Agachamento (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Frequency */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Frequência Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {frequencyData.map((w, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-xl font-bold">{w.treinos}</div>
                <p className="text-[10px] text-muted-foreground">{w.week}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
