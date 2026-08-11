'use client';

import { useEffect, useState } from 'react';
import { Activity, Calendar, Dumbbell, Loader2, Ruler, ShieldCheck, Target, TrendingUp, Weight } from 'lucide-react';
import { AvatarPicker } from '@/components/profile/avatar-picker';
import { StudentProgressDashboard } from '@/components/students/student-progress-dashboard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import type { StudentProgressData } from '@/types/student-progress';
import { AccountControls } from '@/components/privacy/account-controls';

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
    <div className="space-y-8 animate-fade-in pb-10">
      <section className="dk-hero-panel p-6 sm:p-8 lg:p-10">
        <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <AvatarPicker
              name={profile.full_name}
              avatarUrl={profile.avatar_url}
              onChange={async (avatarUrl) => {
                setProfile((current) => current ? { ...current, avatar_url: avatarUrl } : current);
                setProgress((current) => current ? { ...current, student: { ...current.student, avatarUrl } } : current);
                await refreshUser();
              }}
              sizeClassName="size-24 border-4 border-white/15"
            />
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2"><span className="dk-kicker text-[#c9ff32]">Perfil do atleta</span><Badge className="dk-volt-chip border-0">{profile.status === 'active' ? 'Ativo' : 'Inativo'}</Badge></div>
              <h1 className="dk-display text-4xl sm:text-5xl">{profile.full_name}</h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70"><span className="flex items-center gap-1.5"><Target className="size-4 text-[#c9ff32]" /> {profile.goal || 'Objetivo não informado'}</span><span className="flex items-center gap-1.5"><Dumbbell className="size-4 text-[#c9ff32]" /> {LEVELS[profile.experience_level] || 'Nível não informado'}</span></p>
              <p className="mt-3 text-xs text-white/65">Toque na foto para trocar seu avatar.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-4"><Ruler className="size-4 text-[#c9ff32]" /><p className="mt-4 text-2xl font-black">{profile.height > 0 ? `${profile.height} cm` : '—'}</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">Altura</p></div>
            <div className="rounded-2xl bg-[#c9ff32] p-4 text-black"><Weight className="size-4" /><p className="mt-4 text-2xl font-black">{profile.current_weight > 0 ? `${profile.current_weight} kg` : '—'}</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-black/65">Peso atual</p></div>
            <div className="col-span-2 rounded-2xl border border-white/12 bg-white/[0.06] p-4 sm:col-span-1"><Calendar className="size-4 text-[#c9ff32]" /><p className="mt-4 text-2xl font-black">{profile.available_days.length || '—'}x</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">Disponibilidade</p></div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4"><p className="dk-kicker text-muted-foreground">Identidade esportiva</p><h2 className="dk-display mt-3 text-3xl sm:text-4xl">SEUS DADOS. SEU RITMO.</h2></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {items.map((item) => <div key={item.label} className="dk-metric flex items-center gap-3 p-4 sm:p-5"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black text-[#c9ff32] dark:bg-[#c9ff32] dark:text-black"><item.icon className="size-4" /></span><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p><p className="mt-1 truncate text-sm font-black sm:text-base">{item.value}</p></div></div>)}
        </div>
      </section>

      <Card><CardHeader className="border-b border-black/8 dark:border-white/8"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#668f00]">Performance real</p><CardTitle className="mt-1 flex items-center gap-2 text-2xl font-black tracking-tight"><TrendingUp className="size-5" /> Minha evolução detalhada</CardTitle></CardHeader><CardContent className="flex items-start gap-3 p-5 sm:p-6"><Activity className="mt-0.5 size-5 shrink-0 text-[#7cae00]" /><p className="text-sm leading-6 text-muted-foreground">Suas avaliações, mudanças corporais, constância e treinos registrados pelo personal aparecem abaixo.</p></CardContent></Card>
      <StudentProgressDashboard data={progress} />
      <Card><CardHeader className="border-b border-black/8 dark:border-white/8"><CardTitle className="flex items-center gap-2 text-xl font-black"><ShieldCheck className="size-5 text-[#7cae00]" /> Meus dados e privacidade</CardTitle></CardHeader><CardContent className="p-5 sm:p-6"><AccountControls name={profile.full_name} /></CardContent></Card>
    </div>
  );
}
