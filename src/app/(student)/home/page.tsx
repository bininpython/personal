'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dumbbell, Clock, Flame, Trophy, TrendingUp,
  ChevronRight, Calendar, MessageSquare, Target, Activity, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { MuscleAnatomy } from '@/components/ui/muscle-anatomy';

// Demo data
const todayWorkout = {
  name: 'Treino A — Peito/Tríceps',
  estimatedTime: 55,
  exercises: 5,
  muscleGroups: ['Peitoral', 'Tríceps'],
  anatomyGroups: ['chest', 'triceps'] as any,
  completedPercentage: 0,
};

const weekProgress = [
  { day: 'Seg', done: true },
  { day: 'Ter', done: true },
  { day: 'Qua', done: false, isToday: true },
  { day: 'Qui', done: false },
  { day: 'Sex', done: false },
  { day: 'Sáb', done: false },
  { day: 'Dom', done: false },
];

const recentAchievements = [
  { icon: Trophy, name: 'Primeiro Treino', date: 'Há 90 dias' },
  { icon: Flame, name: '7 Dias de Fogo', date: 'Há 60 dias' },
  { icon: Target, name: '10 Treinos', date: 'Há 30 dias' },
];

const lastRecords = [
  { exercise: 'Supino Reto', load: '60 kg', date: 'Há 3 dias' },
  { exercise: 'Agachamento', load: '100 kg', date: 'Há 5 dias' },
];

export default function StudentHomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  const streak = 5;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {user?.name?.split(' ')[0] || 'Aluno'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Pronto para mais um treino?
        </p>
      </div>

      {/* Streak & Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <Flame className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <div className="text-lg font-bold">{streak}</div>
            <p className="text-[10px] text-muted-foreground">Dias seguidos</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <Target className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <div className="text-lg font-bold">85%</div>
            <p className="text-[10px] text-muted-foreground">Conclusão</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <Activity className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-lg font-bold">10</div>
            <p className="text-[10px] text-muted-foreground">Treinos</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Workout CTA */}
      <Card className="border border-border/50 bg-muted/20 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 mb-2">
                Treino de hoje
              </Badge>
              <h2 className="text-lg font-bold">{todayWorkout.name}</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-blue-500" />
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{todayWorkout.estimatedTime} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Dumbbell className="w-3.5 h-3.5" />
              <span>{todayWorkout.exercises} exercícios</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {todayWorkout.muscleGroups.map((mg, i) => (
              <Badge key={i} variant="outline" className="text-[10px] border-blue-500/20 text-blue-500">
                {mg}
              </Badge>
            ))}
          </div>

          <Button
            className="w-full h-12 text-base shadow-sm"
            onClick={() => router.push('/workout')}
          >
            <Zap className="w-5 h-5 mr-2" />
            Iniciar Treino
          </Button>

          <div className="mt-6 pt-6 border-t border-blue-500/20">
            <h3 className="text-sm font-medium mb-4 text-center">Músculos Ativados Hoje</h3>
            <MuscleAnatomy highlighted={todayWorkout.anatomyGroups} highlightColor="#3b82f6" />
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Progresso Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2">
            {weekProgress.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${day.done
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : day.isToday
                        ? 'bg-blue-500/10 text-blue-500 border-2 border-blue-500/50'
                        : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {day.done ? '✓' : day.day.charAt(0)}
                </div>
                <span className={`text-[10px] font-medium ${day.isToday ? 'text-blue-500' : 'text-muted-foreground'}`}>
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Records */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Últimos Recordes
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push('/progress')}>
              Ver mais
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {lastRecords.map((record, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <div>
                <p className="text-sm font-medium">{record.exercise}</p>
                <p className="text-xs text-muted-foreground">{record.date}</p>
              </div>
              <Badge className="bg-muted text-foreground border-border/50 font-bold">
                {record.load}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recentAchievements.map((ach, i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[80px]">
                <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-2xl">
                  <ach.icon className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-[10px] font-medium text-center leading-tight">{ach.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Messages from trainer */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Mensagem do Personal</p>
              <p className="text-xs text-muted-foreground">Ótimo treino ontem! Continue assim!</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/student-messages')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
