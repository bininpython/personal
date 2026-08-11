'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { KeyRound, Loader2, Paintbrush, ShieldCheck, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AvatarPicker } from '@/components/profile/avatar-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { AVATAR_COUNT } from '@/lib/profile/avatars';
import { AccountControls } from '@/components/privacy/account-controls';

interface TrainerProfile {
  name: string;
  nickname: string;
  city: string;
  age: number;
  avatar_url: string;
}

export default function TrainerSettingsPage() {
  const { user, refreshUser } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [profile, setProfile] = useState<TrainerProfile>({
    name: user?.name || '',
    nickname: '',
    city: '',
    age: 18,
    avatar_url: user?.avatar_url || '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/trainer-profile', { cache: 'no-store' });
        const data = await response.json() as { profile?: TrainerProfile; error?: string };
        if (!response.ok) throw new Error(data.error || 'Não foi possível carregar o perfil.');
        if (data.profile) setProfile(data.profile);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Não foi possível carregar o perfil.');
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      const response = await fetch('/api/trainer-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          nickname: profile.nickname,
          city: profile.city,
          age: Number(profile.age),
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar o perfil.');
      await refreshUser();
      toast.success('Perfil atualizado.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o perfil.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      <section className="dk-hero-panel p-6 sm:p-8 lg:p-10">
        <div className="relative z-10 grid gap-7 md:grid-cols-[1fr_auto] md:items-end">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <AvatarPicker
              name={profile.name || 'Personal'}
              avatarUrl={profile.avatar_url}
              onChange={async (value) => {
                setProfile((current) => ({ ...current, avatar_url: value }));
                await refreshUser();
              }}
              sizeClassName="size-24 border-4 border-white/15"
            />
            <div><p className="dk-kicker rounded-md bg-white px-2 py-1 text-black">G KONG ID · Personal</p><h1 className="dk-display mt-4 text-4xl sm:text-5xl">{profile.nickname || profile.name || 'SEU PERFIL'}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/70">Sua identidade profissional, seus acessos e a segurança da operação.</p></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-4"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/65">Cidade</p><p className="mt-3 max-w-36 truncate text-lg font-black">{profile.city || '—'}</p></div>
            <div className="rounded-2xl bg-[#c9ff32] p-4 text-black"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-black/65">Idade</p><p className="mt-3 text-lg font-black">{profile.age || '—'} anos</p></div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="h-fit space-y-2 rounded-[1.5rem] bg-black p-3 text-white lg:sticky lg:top-8 dark:bg-[#c9ff32] dark:text-black" aria-label="Seções das configurações">
          <a href="#perfil" className="flex items-center rounded-full bg-[#c9ff32] px-4 py-3 text-sm font-black text-black dark:bg-black dark:text-white"><User className="mr-2 size-4" /> Perfil</a>
          <a href="#acessos" className="flex items-center rounded-full px-4 py-3 text-sm text-white/55 hover:bg-white/10 hover:text-white dark:text-black/55 dark:hover:bg-black/10 dark:hover:text-black"><KeyRound className="mr-2 size-4" /> Acessos</a>
          <a href="#aparencia" className="flex items-center rounded-full px-4 py-3 text-sm text-white/55 hover:bg-white/10 hover:text-white dark:text-black/55 dark:hover:bg-black/10 dark:hover:text-black"><Paintbrush className="mr-2 size-4" /> Aparência</a>
          <a href="#privacidade" className="flex items-center rounded-full px-4 py-3 text-sm text-white/55 hover:bg-white/10 hover:text-white dark:text-black/55 dark:hover:bg-black/10 dark:hover:text-black"><ShieldCheck className="mr-2 size-4" /> Segurança</a>
        </nav>

        <div className="space-y-6">
          <Card id="perfil" className="scroll-mt-20">
            <CardHeader className="border-b border-black/8 dark:border-white/8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#668f00]">Identidade</p>
              <CardTitle className="mt-1 text-2xl font-black tracking-tight">Perfil profissional</CardTitle>
              <CardDescription>Informações usadas na sua conta G KONG.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <div className="flex py-8 text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Carregando perfil...</div>
              ) : (
                <>
                  <div className="rounded-2xl border border-[#9fdb00]/25 bg-[#c9ff32]/10 p-4 text-sm"><p className="font-black">Foto e avatar no cartão acima</p><p className="mt-1 text-xs text-muted-foreground">Toque na imagem para enviar uma foto ou escolher entre {AVATAR_COUNT} opções.</p></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2"><Label htmlFor="trainer-name">Nome completo</Label><Input id="trainer-name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} maxLength={100} /></div>
                    <div className="space-y-2"><Label htmlFor="trainer-nickname">Apelido <span className="text-muted-foreground">(opcional)</span></Label><Input id="trainer-nickname" value={profile.nickname} onChange={(event) => setProfile({ ...profile, nickname: event.target.value })} maxLength={50} /></div>
                    <div className="space-y-2"><Label htmlFor="trainer-city">Cidade</Label><Input id="trainer-city" value={profile.city} onChange={(event) => setProfile({ ...profile, city: event.target.value })} maxLength={100} /></div>
                    <div className="space-y-2"><Label htmlFor="trainer-age">Idade</Label><Input id="trainer-age" type="number" min={18} max={100} value={profile.age} onChange={(event) => setProfile({ ...profile, age: Number(event.target.value) })} /></div>
                  </div>
                  <Button className="h-11 bg-black px-5 text-white hover:bg-black/80 dark:bg-[#c9ff32] dark:text-black" onClick={() => void saveProfile()} disabled={saving || profile.name.trim().length < 2 || profile.city.trim().length < 2}>
                    {saving && <Loader2 className="mr-2 size-4 animate-spin" />} Salvar alterações
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card id="acessos" className="scroll-mt-20 overflow-hidden">
            <CardHeader className="bg-black text-white dark:bg-[#c9ff32] dark:text-black">
              <CardTitle className="flex items-center gap-2"><Users className="size-5" /> Códigos dos alunos</CardTitle>
              <CardDescription className="text-white/55 dark:text-black/55">Cada aluno acessa usando apenas o nome e o código individual que você gerar.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">Abra o perfil do aluno para criar ou trocar o código `000-000`. O código anterior deixa de funcionar imediatamente.</p>
              <Link href="/students" className="inline-flex h-10 shrink-0 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Gerenciar alunos</Link>
            </CardContent>
          </Card>

          <Card id="aparencia" className="scroll-mt-20 border-border/60">
            <CardHeader><CardTitle>Aparência</CardTitle><CardDescription>Escolha o tema usado neste dispositivo.</CardDescription></CardHeader>
            <CardContent className="flex gap-3">
              <Button variant={resolvedTheme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>Claro</Button>
              <Button variant={resolvedTheme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>Escuro</Button>
            </CardContent>
          </Card>

          <Card id="privacidade" className="scroll-mt-20 border-border/60">
            <CardHeader><CardTitle>Segurança e privacidade</CardTitle><CardDescription>Troque seu código pessoal, baixe uma cópia ou exclua seus dados.</CardDescription></CardHeader>
            <CardContent><AccountControls name={profile.name} trainer /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
