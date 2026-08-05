'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, TrendingUp, AlertTriangle,
  ChevronRight, Activity, Target,
  ArrowUpRight, ArrowDownRight, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';

interface RankingStudent {
  id: string;
  name: string;
  goal: string;
  lastWorkout: string;
  completion: number;
  workouts: number;
  trend: 'up' | 'down' | 'stable';
}

interface GoalDistribution {
  name: string;
  value: number;
  color: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  });
  const [stats, setStats] = useState({
    activeStudents: 0,
    trainedToday: 0,
    completionRate: 0,
    alerts: 0,
  });
  const [ranking, setRanking] = useState<RankingStudent[]>([]);
  const [goalDist, setGoalDist] = useState<GoalDistribution[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (data.stats) setStats(data.stats);
        if (data.studentRanking) setRanking(data.studentRanking);
        if (data.goalDistribution) setGoalDist(data.goalDistribution);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
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
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Goal Distribution */}
        <Card className="border-border/50 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Foco dos Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalDist.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-center text-muted-foreground text-sm flex-col">
                <PieChart className="w-10 h-10 mb-2 opacity-20" />
                Sem alunos<br/>cadastrados
              </div>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={goalDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {goalDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
            )}
            {goalDist.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {goalDist.map((goal, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: goal.color }} />
                    <span className="text-muted-foreground">{goal.name} ({goal.value})</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Ranking */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Ranking de Engajamento
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/students')} className="text-xs">
                Ver todos
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {ranking.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Nenhum aluno cadastrado para gerar ranking.
              </div>
            ) : (
              ranking.slice(0, 5).map((student, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/students/${student.id}`)}
                >
                  <div className="font-bold text-muted-foreground w-4 text-center">
                    {i + 1}
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.goal} · {student.lastWorkout}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-sm font-semibold">{student.completion}%</span>
                        {student.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />}
                        {student.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
                        {student.trend === 'stable' && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                      <Progress value={student.completion} className="w-16 h-1.5 mt-1" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
