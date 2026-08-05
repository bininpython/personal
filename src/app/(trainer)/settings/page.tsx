'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Paintbrush, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AvatarPicker } from '@/components/profile/avatar-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';

interface TrainerProfile {
  name: string;
  trainer_code: string;
  avatar_url: string;
}

export default function TrainerSettingsPage() {
  const { user, refreshUser } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [trainerCode, setTrainerCode] = useState(user?.trainer_code || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/trainer-profile', { cache: 'no-store' });
        const data = await response.json() as { profile?: TrainerProfile; error?: string };
        if (!response.ok) throw new Error(data.error || 'Não foi possível carregar o perfil.');
        if (data.profile) {
          setName(data.profile.name);
          setTrainerCode(data.profile.trainer_code);
          setAvatarUrl(data.profile.avatar_url || '');
        }
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
        body: JSON.stringify({ name }),
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

  async function copyCode() {
    if (!trainerCode) return;
    await navigator.clipboard.writeText(trainerCode);
    setCopied(true);
    toast.success('Código copiado.');
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Configurações</h1>
        <p className="mt-1 text-muted-foreground">Gerencie seu perfil e a aparência do sistema.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-2" aria-label="Seções das configurações">
          <a href="#perfil" className="flex items-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium">
            <User className="mr-2 size-4" /> Perfil
          </a>
          <a href="#aparencia" className="flex items-center rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent">
            <Paintbrush className="mr-2 size-4" /> Aparência
          </a>
        </nav>

        <div className="space-y-6">
          <Card id="perfil" className="scroll-mt-20 border-border/60">
            <CardHeader>
              <CardTitle>Perfil profissional</CardTitle>
              <CardDescription>Nome exibido no painel e código usado para entrar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex py-8 text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Carregando perfil...</div>
              ) : (
                <>
                  <div className="flex items-center gap-4 rounded-xl border bg-muted/20 p-4">
                    <AvatarPicker
                      name={name || 'Personal'}
                      avatarUrl={avatarUrl}
                      onChange={async (value) => {
                        setAvatarUrl(value);
                        await refreshUser();
                      }}
                    />
                    <div><p className="font-medium">Foto ou avatar</p><p className="text-xs text-muted-foreground">Envie uma foto ou escolha entre 50 opções.</p></div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainer-name">Nome</Label>
                    <Input id="trainer-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainer-code">Código de acesso do personal</Label>
                    <div className="flex gap-2">
                      <Input id="trainer-code" readOnly value={trainerCode} className="bg-muted font-mono tracking-[0.2em]" />
                      <Button type="button" variant="outline" size="icon" onClick={() => void copyCode()} aria-label="Copiar código">
                        {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Este é o código gerado no cadastro. Contas novas recebem 6 números, e códigos antigos continuam válidos.</p>
                  </div>
                  <Button onClick={() => void saveProfile()} disabled={saving || name.trim().length < 2}>
                    {saving && <Loader2 className="mr-2 size-4 animate-spin" />} Salvar alterações
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card id="aparencia" className="scroll-mt-20 border-border/60">
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Escolha o tema usado neste dispositivo.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant={resolvedTheme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>Claro</Button>
              <Button variant={resolvedTheme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>Escuro</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
