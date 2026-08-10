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
    <div className="space-y-6 pb-10 animate-fade-in">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">D KONG ID</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Configurações</h1>
        <p className="mt-1 text-muted-foreground">Seu perfil, códigos e preferências em um só lugar.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-2" aria-label="Seções das configurações">
          <a href="#perfil" className="flex items-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium"><User className="mr-2 size-4" /> Perfil</a>
          <a href="#acessos" className="flex items-center rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent"><KeyRound className="mr-2 size-4" /> Acessos</a>
          <a href="#aparencia" className="flex items-center rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent"><Paintbrush className="mr-2 size-4" /> Aparência</a>
          <a href="#privacidade" className="flex items-center rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent"><ShieldCheck className="mr-2 size-4" /> Segurança</a>
        </nav>

        <div className="space-y-6">
          <Card id="perfil" className="scroll-mt-20 border-border/60">
            <CardHeader>
              <CardTitle>Perfil profissional</CardTitle>
              <CardDescription>Informações usadas na sua conta D KONG.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <div className="flex py-8 text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Carregando perfil...</div>
              ) : (
                <>
                  <div className="flex items-center gap-4 rounded-xl border bg-muted/20 p-4">
                    <AvatarPicker
                      name={profile.name || 'Personal'}
                      avatarUrl={profile.avatar_url}
                      onChange={async (value) => {
                        setProfile((current) => ({ ...current, avatar_url: value }));
                        await refreshUser();
                      }}
                    />
                    <div><p className="font-medium">Foto ou avatar</p><p className="text-xs text-muted-foreground">Envie uma foto ou escolha entre {AVATAR_COUNT} opções.</p></div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2"><Label htmlFor="trainer-name">Nome completo</Label><Input id="trainer-name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} maxLength={100} /></div>
                    <div className="space-y-2"><Label htmlFor="trainer-nickname">Apelido <span className="text-muted-foreground">(opcional)</span></Label><Input id="trainer-nickname" value={profile.nickname} onChange={(event) => setProfile({ ...profile, nickname: event.target.value })} maxLength={50} /></div>
                    <div className="space-y-2"><Label htmlFor="trainer-city">Cidade</Label><Input id="trainer-city" value={profile.city} onChange={(event) => setProfile({ ...profile, city: event.target.value })} maxLength={100} /></div>
                    <div className="space-y-2"><Label htmlFor="trainer-age">Idade</Label><Input id="trainer-age" type="number" min={18} max={100} value={profile.age} onChange={(event) => setProfile({ ...profile, age: Number(event.target.value) })} /></div>
                  </div>
                  <Button onClick={() => void saveProfile()} disabled={saving || profile.name.trim().length < 2 || profile.city.trim().length < 2}>
                    {saving && <Loader2 className="mr-2 size-4 animate-spin" />} Salvar alterações
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card id="acessos" className="scroll-mt-20 overflow-hidden border-border/60">
            <CardHeader className="bg-foreground text-background">
              <CardTitle className="flex items-center gap-2"><Users className="size-5" /> Códigos dos alunos</CardTitle>
              <CardDescription className="text-background/60">Cada aluno acessa usando apenas o nome e o código individual que você gerar.</CardDescription>
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
