'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, TrendingUp, AlertTriangle, CalendarDays,
  ChevronRight, Activity, Target,
  ArrowUpRight, ArrowDownRight, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { ActivationChecklist, type OnboardingState } from '@/components/trainer/activation-checklist';
import { groupIntoCategories } from '@/lib/charts/palette';
import { hourInSaoPaulo } from '@/lib/time/sao-paulo';
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
  consistency: number;
  risk: 'low' | 'medium' | 'high';
  trend: 'up' | 'down' | 'stable';
}

interface GoalDistribution {
  name: string;
  value: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [greeting] = useState(() => {
    const hour = hourInSaoPaulo();
    return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  });
  const [stats, setStats] = useState({
    activeStudents: 0,
    trainedToday: 0,
    completionRate: 0,
    alerts: 0,
    averageConsistency: 0,
    atRisk: 0,
    appointmentsToday: 0,
  });
  const [ranking, setRanking] = useState<RankingStudent[]>([]);
  const [goalDist, setGoalDist] = useState<GoalDistribution[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (data.stats) setStats(data.stats);
        if (data.studentRanking) setRanking(data.studentRanking);
        if (data.goalDistribution) setGoalDist(data.goalDistribution);
        if (data.onboarding) setOnboarding(data.onboarding);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  const goalSlices = groupIntoCategories(goalDist, resolvedTheme === 'dark');

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="dk-hero-panel grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:p-10">
        <div className="relative z-10">
          <p className="dk-kicker text-[#c9ff32]">Central de performance</p>
          <h1 className="dk-display mt-6 max-w-4xl text-[clamp(2.8rem,6vw,5.8rem)]">
            {greeting.toUpperCase()},<br />
            <span className="text-[#c9ff32]">{user?.name?.split(' ')[0]?.toUpperCase() || 'PERSONAL'}.</span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-6 text-white/52 sm:text-base">
            Sua operação em uma visão direta: alunos, consistência, agenda e pontos que pedem ação.
          </p>
          <Button onClick={() => router.push('/students/new')} className="mt-7 h-12 bg-[#c9ff32] px-6 text-black hover:bg-[#b8ef22]">
            <Users className="mr-2 size-4" /> Novo aluno
          </Button>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/38">Alunos ativos</p>
            <p className="mt-5 text-4xl font-black tracking-[-0.06em]">{stats.activeStudents}</p>
          </div>
          <div className="rounded-2xl bg-[#c9ff32] p-4 text-black">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/45">Constância</p>
            <p className="mt-5 text-4xl font-black tracking-[-0.06em]">{stats.averageConsistency}%</p>
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-2xl border border-white/12 bg-white/[0.06] p-4">
            <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/38">Hoje na agenda</p><p className="mt-1 text-xl font-black">{stats.appointmentsToday} compromisso(s)</p></div>
            <CalendarDays className="size-6 text-[#c9ff32]" />
          </div>
        </div>
      </section>

      {onboarding && <ActivationChecklist state={onboarding} />}

      <div>
        <p className="dk-kicker text-muted-foreground">Pulso da operação</p>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Alunos ativos', value: stats.activeStudents.toString(), icon: Users },
          { label: 'Treinaram hoje', value: stats.trainedToday.toString(), icon: Activity },
          { label: 'Constância média', value: `${stats.averageConsistency}%`, icon: TrendingUp },
          { label: 'Conclusão', value: `${stats.completionRate}%`, icon: Target },
          { label: 'Risco alto', value: stats.atRisk.toString(), icon: AlertTriangle },
          { label: 'Agenda hoje', value: stats.appointmentsToday.toString(), icon: CalendarDays },
        ].map((stat, i) => (
          <Card key={stat.label} className="group animate-slide-up transition-transform hover:-translate-y-1" style={{ animationDelay: `${0.05 * i}s` }}>
            <CardContent className="p-4 sm:p-5">
              <div className="mb-5 flex size-10 items-center justify-center rounded-full bg-black text-[#c9ff32] dark:bg-[#c9ff32] dark:text-black">
                <stat.icon className="size-4" />
              </div>
              <div className="text-3xl font-black tracking-[-0.06em]">{stat.value}</div>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="border-b border-black/8 pb-4 dark:border-white/8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#668f00]">Distribuição</p>
            <CardTitle className="mt-1 flex items-center gap-2 text-xl font-black tracking-tight">
              <Target className="size-5" /> Foco dos alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalDist.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-center text-muted-foreground text-sm flex-col">
                <PieChart className="mb-2 size-10 opacity-20" />
                Sem alunos cadastrados
              </div>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={goalSlices}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {goalSlices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        color: 'var(--card-foreground)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {goalSlices.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {goalSlices.map((goal, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: goal.color }} />
                    <span className="text-muted-foreground">{goal.name} ({goal.value})</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-black/8 pb-4 dark:border-white/8">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#668f00]">Performance</p><CardTitle className="mt-1 flex items-center gap-2 text-xl font-black tracking-tight"><TrendingUp className="size-5" /> Ranking de engajamento</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => router.push('/students')} className="text-xs">Ver todos <ChevronRight className="ml-0.5 size-3.5" /></Button>
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
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent p-3 transition-colors hover:border-black/8 hover:bg-[#c9ff32]/10 dark:hover:border-white/8"
                  onClick={() => router.push(`/students/${student.id}`)}
                >
                  <div className="w-5 text-center font-mono text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-black text-sm font-black text-[#c9ff32] dark:bg-[#c9ff32] dark:text-black">
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
                        <span className="text-sm font-semibold">{student.consistency}%</span>
                        {student.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-ok" />}
                        {student.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-danger" />}
                        {student.trend === 'stable' && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                      <Progress value={student.consistency} className="w-16 h-1.5 mt-1" />
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
