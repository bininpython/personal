'use client';

import { useEffect, useState } from 'react';
import { Calendar, Dumbbell, Loader2, Ruler, Target, User, Weight } from 'lucide-react';
import { AvatarPicker } from '@/components/profile/avatar-picker';
import { StudentProgressDashboard } from '@/components/students/student-progress-dashboard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import type { StudentProgressData } from '@/types/student-progress';

interface StudentProfile {
  full_name: string;
  avatar_url: string;
  status: string;
  goal: string;
  experience_level: string;
  height: number;
  current_weight: number;
  start_date: string;
  available_days: string[];
}

const LEVELS: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [progress, setProgress] = useState<StudentProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    const loadProfile = async () => {
      try {
        const [profileResponse, progressResponse] = await Promise.all([
          fetch(`/api/students/${user.id}`, { cache: 'no-store' }),
          fetch(`/api/student-progress/${user.id}`, { cache: 'no-store' }),
        ]);
        const profileData = await profileResponse.json() as { student?: StudentProfile; error?: string };
        const progressData = await progressResponse.json() as { progress?: StudentProgressData; error?: string };
        if (!profileResponse.ok || !profileData.student) throw new Error(profileData.error || 'Não foi possível carregar seu perfil.');
        if (!progressResponse.ok || !progressData.progress) throw new Error(progressData.error || 'Não foi possível carregar sua evolução.');
        setProfile(profileData.student);
        setProgress(progressData.progress);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar seu perfil.');
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, [user?.id]);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Carregando perfil...</div>;
  if (error || !profile || !progress) return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">{error || 'Perfil não encontrado.'}</div>;

  const items = [
    { icon: Target, label: 'Objetivo', value: profile.goal || 'Não informado' },
    { icon: Dumbbell, label: 'Nível', value: LEVELS[profile.experience_level] || 'Não informado' },
    { icon: Ruler, label: 'Altura', value: profile.height > 0 ? `${profile.height} cm` : 'Não informada' },
    { icon: Weight, label: 'Peso atual', value: profile.current_weight > 0 ? `${profile.current_weight} kg` : 'Não informado' },
    { icon: Calendar, label: 'Início', value: profile.start_date ? new Date(`${profile.start_date.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : 'Não informado' },
    { icon: Calendar, label: 'Dias disponíveis', value: profile.available_days.length > 0 ? `${profile.available_days.length} por semana` : 'Não informado' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><User className="size-6 text-blue-500" /> Meu perfil e evolução</h1>
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <AvatarPicker
              name={profile.full_name}
              avatarUrl={profile.avatar_url}
              onChange={async (avatarUrl) => {
                setProfile((current) => current ? { ...current, avatar_url: avatarUrl } : current);
                setProgress((current) => current ? { ...current, student: { ...current.student, avatarUrl } } : current);
                await refreshUser();
              }}
              sizeClassName="size-20"
            />
            <div><h2 className="text-xl font-bold">{profile.full_name}</h2><Badge className="bg-emerald-500/10 text-emerald-600">{profile.status === 'active' ? 'Ativo' : 'Inativo'}</Badge><p className="mt-2 text-xs text-muted-foreground">Toque na foto para trocar ou escolher um avatar.</p></div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((item) => <div key={item.label} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"><item.icon className="size-4 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground">{item.label}</p><p className="text-sm font-medium">{item.value}</p></div></div>)}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60"><CardHeader><CardTitle className="text-lg">Minha evolução detalhada</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Suas avaliações, mudanças corporais, constância e treinos registrados pelo personal aparecem abaixo.</p></CardContent></Card>
      <StudentProgressDashboard data={progress} />
    </div>
  );
}
