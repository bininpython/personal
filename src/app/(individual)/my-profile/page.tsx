'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { KeyRound, Loader2, LogOut, Save, Target, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { AccountControls } from '@/components/privacy/account-controls';
import { AvatarPicker } from '@/components/profile/avatar-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import type { IndividualProfileView } from '@/types/individual';

const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function IndividualProfilePage() {
  const router = useRouter();
  const { logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<IndividualProfileView | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/individual/profile', { cache: 'no-store' }).then(async (response) => ({ response, data: await response.json() })).then(({ response, data }) => {
      if (!response.ok || !data.profile) throw new Error(data.error || 'Não foi possível carregar seu perfil.');
      setProfile(data.profile);
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar seu perfil.')).finally(() => setLoading(false));
  }, []);

  function update<K extends keyof IndividualProfileView>(key: K, value: IndividualProfileView[K]) {
    setProfile((current) => current ? { ...current, [key]: value } : current);
  }

  function toggleDay(day: string) {
    if (!profile) return;
    update('available_days', profile.available_days.includes(day) ? profile.available_days.filter((item) => item !== day) : [...profile.available_days, day]);
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      const response = await fetch('/api/individual/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: profile.full_name, city: profile.city || undefined, birth_date: profile.birth_date || '', gender: profile.gender, height: profile.height || undefined, weight: profile.weight || undefined, goal: profile.goal || undefined, level: profile.level, available_days: profile.available_days, restrictions: profile.restrictions || undefined, biography: profile.biography || undefined }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar seu perfil.');
      setProfile(data.profile);
      await refreshUser();
      toast.success('Perfil atualizado.');
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : 'Não foi possível salvar seu perfil.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Carregando perfil...</div>;
  if (error || !profile) return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">{error || 'Perfil não encontrado.'}</div>;

  return <div className="space-y-7 pb-10 animate-fade-in"><PageHeader kicker="Conta individual" title="Meu perfil" description="Mantenha seus dados, objetivo e disponibilidade atualizados." actions={<Button onClick={() => void save()} disabled={saving}>{saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Salvar perfil</Button>} />
    <section className="dk-hero-panel p-6 sm:p-8"><div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center"><AvatarPicker name={profile.full_name} avatarUrl={profile.avatar_url} sizeClassName="size-28 border-4 border-white/15" onChange={async (avatarUrl) => { update('avatar_url', avatarUrl); await refreshUser(); }} /><div><p className="dk-kicker text-[#c9ff32]">Atleta independente</p><h1 className="dk-display mt-3 text-4xl sm:text-5xl">{profile.full_name}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/65">{profile.biography || 'Adicione uma apresentação curta sobre sua rotina e o que deseja conquistar.'}</p><p className="mt-3 text-xs text-white/45">Toque na foto para trocar seu avatar.</p></div></div></section>

    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]"><Card><CardHeader className="border-b border-border/60"><CardTitle className="flex items-center gap-2 text-xl"><UserRound className="size-5 text-[#668f00]" /> Dados pessoais</CardTitle></CardHeader><CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6"><div className="space-y-2 sm:col-span-2"><Label htmlFor="name">Nome completo</Label><Input id="name" value={profile.full_name} onChange={(event) => update('full_name', event.target.value)} /><p className="text-xs text-muted-foreground">Este é o nome usado junto com seu código para entrar.</p></div><div className="space-y-2"><Label htmlFor="city">Cidade</Label><Input id="city" value={profile.city} onChange={(event) => update('city', event.target.value)} placeholder="Sua cidade" /></div><div className="space-y-2"><Label htmlFor="birth">Data de nascimento</Label><Input id="birth" type="date" value={profile.birth_date} onChange={(event) => update('birth_date', event.target.value)} /></div><div className="space-y-2"><Label htmlFor="gender">Gênero</Label><select id="gender" value={profile.gender} onChange={(event) => update('gender', event.target.value as IndividualProfileView['gender'])} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="female">Feminino</option><option value="male">Masculino</option><option value="other">Outro / prefiro não informar</option></select></div><div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="height">Altura (cm)</Label><Input id="height" type="number" min={1} max={300} value={profile.height ?? ''} onChange={(event) => update('height', event.target.value ? Number(event.target.value) : undefined)} /></div><div className="space-y-2"><Label htmlFor="weight">Peso (kg)</Label><Input id="weight" type="number" min={1} max={1000} step="0.1" value={profile.weight ?? ''} onChange={(event) => update('weight', event.target.value ? Number(event.target.value) : undefined)} /></div></div><div className="space-y-2"><Label htmlFor="goal">Objetivo</Label><Input id="goal" value={profile.goal} onChange={(event) => update('goal', event.target.value)} placeholder="Ex.: Hipertrofia" /></div><div className="space-y-2"><Label htmlFor="level">Nível</Label><select id="level" value={profile.level} onChange={(event) => update('level', event.target.value as IndividualProfileView['level'])} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="beginner">Iniciante</option><option value="intermediate">Intermediário</option><option value="advanced">Avançado</option></select></div><div className="space-y-2 sm:col-span-2"><Label>Dias disponíveis</Label><div className="flex flex-wrap gap-2">{WEEKDAYS.map((day) => <button type="button" key={day} onClick={() => toggleDay(day)} className={`rounded-full border px-3 py-2 text-xs font-bold ${profile.available_days.includes(day) ? 'border-black bg-black text-[#c9ff32] dark:border-[#c9ff32] dark:bg-[#c9ff32] dark:text-black' : 'border-border bg-background text-muted-foreground'}`}>{day}</button>)}</div></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="bio">Sobre você</Label><Textarea id="bio" value={profile.biography} onChange={(event) => update('biography', event.target.value)} placeholder="Conte brevemente sobre sua rotina de treino..." rows={4} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="restrictions">Restrições e cuidados</Label><Textarea id="restrictions" value={profile.restrictions} onChange={(event) => update('restrictions', event.target.value)} placeholder="Lesões, desconfortos ou orientações profissionais importantes..." rows={4} /></div><Button onClick={() => void save()} disabled={saving} className="sm:col-span-2">{saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Salvar alterações</Button></CardContent></Card>

      <div className="space-y-6"><Card><CardHeader className="border-b border-border/60"><CardTitle className="flex items-center gap-2 text-xl"><Target className="size-5 text-[#668f00]" /> Resumo esportivo</CardTitle></CardHeader><CardContent className="space-y-3 p-5"><div className="rounded-2xl bg-[#c9ff32] p-4 text-black"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-black/55">Objetivo atual</p><p className="mt-2 text-xl font-black">{profile.goal || 'Defina seu objetivo'}</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-muted p-4"><p className="text-2xl font-black">{profile.available_days.length || '—'}x</p><p className="text-[9px] uppercase text-muted-foreground">Disponibilidade</p></div><div className="rounded-2xl bg-muted p-4"><p className="text-2xl font-black">{profile.level === 'advanced' ? 'Avançado' : profile.level === 'intermediate' ? 'Interm.' : 'Iniciante'}</p><p className="text-[9px] uppercase text-muted-foreground">Nível</p></div></div></CardContent></Card>
      <Card><CardHeader className="border-b border-border/60"><CardTitle className="flex items-center gap-2 text-xl"><KeyRound className="size-5 text-[#668f00]" /> Acesso e privacidade</CardTitle></CardHeader><CardContent className="space-y-5 p-5"><div className="rounded-2xl border border-border/60 bg-muted/45 p-4"><p className="font-bold">Seu acesso usa nome + código</p><p className="mt-2 text-xs leading-5 text-muted-foreground">O código possui 6 números. Ao gerar um novo, o anterior deixa de funcionar e as outras sessões são encerradas.</p></div><AccountControls name={profile.full_name} individual /></CardContent></Card>
      <Card className="border-red-500/30 bg-red-500/5">
        <CardHeader className="border-b border-red-500/20">
          <CardTitle className="flex items-center gap-2 text-xl text-red-500">
            <LogOut className="size-5" /> Sair do aplicativo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          <p className="text-xs leading-5 text-muted-foreground">
            Deseja sair da sua conta neste aparelho? Você precisará do seu nome e código de 6 dígitos para entrar novamente.
          </p>
          <Button
            variant="destructive"
            onClick={async () => {
              await logout();
              router.replace('/login');
              router.refresh();
            }}
            className="w-full sm:w-auto font-bold bg-red-600 hover:bg-red-700 text-white"
          >
            <LogOut className="mr-2 size-4" /> Desconectar agora
          </Button>
        </CardContent>
      </Card></div></div>
  </div>;
}
