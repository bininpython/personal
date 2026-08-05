'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, TrendingUp, Dumbbell, AlertTriangle, Calendar,
  MessageSquare, ChevronRight, Activity, Target, Clock,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

// Demo data for charts
const weeklyFrequency = [
  { day: 'Seg', treinos: 4 }, { day: 'Ter', treinos: 3 },
  { day: 'Qua', treinos: 5 }, { day: 'Qui', treinos: 4 },
  { day: 'Sex', treinos: 5 }, { day: 'Sáb', treinos: 2 },
  { day: 'Dom', treinos: 1 },
];

const monthlyCompletion = [
  { semana: 'Sem 1', taxa: 82 }, { semana: 'Sem 2', taxa: 78 },
  { semana: 'Sem 3', taxa: 85 }, { semana: 'Sem 4', taxa: 88 },
];

const goalDistribution = [
  { name: 'Hipertrofia', value: 2, color: '#10b981' },
  { name: 'Emagrecimento', value: 1, color: '#3b82f6' },
  { name: 'Força', value: 1, color: '#f59e0b' },
  { name: 'Condicionamento', value: 1, color: '#8b5cf6' },
];

const recentStudents = [
  { name: 'João Pedro', goal: 'Hipertrofia', lastWorkout: 'Hoje', completion: 92, trend: 'up' },
  { name: 'Maria Oliveira', goal: 'Emagrecimento', lastWorkout: 'Ontem', completion: 78, trend: 'up' },
  { name: 'Carlos Santos', goal: 'Força', lastWorkout: 'Há 2 dias', completion: 95, trend: 'stable' },
  { name: 'Ana Beatriz', goal: 'Condicionamento', lastWorkout: 'Há 4 dias', completion: 60, trend: 'down' },
  { name: 'Lucas Mendes', goal: 'Definição', lastWorkout: 'Ontem', completion: 85, trend: 'up' },
];

const alerts = [
  { type: 'pain', message: 'João Pedro relatou desconforto no ombro', time: '2h atrás', severity: 'high' },
  { type: 'absence', message: 'Ana Beatriz não treina há 4 dias', time: '12h atrás', severity: 'medium' },
  { type: 'record', message: 'Carlos Santos: novo recorde no Agachamento (120kg)', time: '1 dia', severity: 'success' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    activeStudents: 0,
    trainedToday: 0,
    completionRate: 0,
    alerts: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (data.stats) setStats(data.stats);
        if (data.recentStudents) setRecent(data.recentStudents);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {greeting}, {user?.name?.split(' ')[0] || 'Personal'} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Aqui está o resumo dos seus alunos e treinos.
          </p>
        </div>
        <Button onClick={() => router.push('/students/new')} className="bg-primary hover:bg-primary/90 shrink-0">
          <Users className="w-4 h-4 mr-2" />
          Novo Aluno
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Alunos Ativos', value: stats.activeStudents.toString(), icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10', change: '' },
          { label: 'Treinaram Hoje', value: stats.trainedToday.toString(), icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10', change: '' },
          { label: 'Taxa de Conclusão', value: `${stats.completionRate}%`, icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10', change: '' },
          { label: 'Alertas', value: stats.alerts.toString(), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', change: '' },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50 hover:shadow-md transition-shadow animate-slide-up" style={{ animationDelay: `${0.05 * i}s` }}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
              <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Weekly Frequency */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              Frequência Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyFrequency} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="treinos" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Treinos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate Trend */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Taxa de Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyCompletion}>
                  <defs>
                    <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="semana" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value}%`, 'Conclusão']}
                  />
                  <Area
                    type="monotone"
                    dataKey="taxa"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#completionGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students & Alerts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent Students */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Alunos Recentes
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/students')} className="text-xs">
                Ver todos
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Nenhum aluno recente encontrado.
              </div>
            ) : (
              recent.map((student, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => router.push('/students')}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.goal} · {student.lastWorkout}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-sm font-semibold">{student.completion}%</span>
                        {student.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />}
                        {student.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                      <Progress value={student.completion} className="w-16 h-1.5 mt-1" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Alerts & Goal Distribution */}
        <div className="space-y-4">
          {/* Alerts */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Alertas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.alerts === 0 ? (
                <div className="py-4 text-center text-muted-foreground text-sm">
                  Nenhum alerta recente.
                </div>
              ) : (
                alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border text-sm
                      ${alert.severity === 'high' ? 'border-red-500/20 bg-red-500/5' :
                        alert.severity === 'medium' ? 'border-amber-500/20 bg-amber-500/5' :
                        'border-emerald-500/20 bg-emerald-500/5'}`}
                  >
                    <p className="text-xs font-medium">{alert.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Goal Distribution */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Objetivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={goalDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      dataKey="value"
                      stroke="none"
                    >
                      {goalDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {goalDistribution.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
