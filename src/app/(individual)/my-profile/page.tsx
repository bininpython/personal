'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, Save, ShieldCheck, Target, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { AccountControls } from '@/components/privacy/account-controls';
import { AvatarPicker } from '@/components/profile/avatar-picker';
import { BackgroundPicker } from '@/components/profile/background-picker';
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
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<IndividualProfileView | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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

  async function changePassword() {
    if (passwords.next.length < 8) return toast.error('A nova senha deve ter pelo menos 8 caracteres.');
    if (passwords.next !== passwords.confirm) return toast.error('A confirmação da nova senha não confere.');
    setChangingPassword(true);
    try {
      const response = await fetch('/api/individual/profile/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: passwords.current, new_password: passwords.next }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível alterar a senha.');
      setPasswords({ current: '', next: '', confirm: '' });
      toast.success('Senha alterada e outras sessões encerradas.');
    } catch (passwordError) {
      toast.error(passwordError instanceof Error ? passwordError.message : 'Não foi possível alterar a senha.');
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Carregando perfil...</div>;
  if (error || !profile) return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">{error || 'Perfil não encontrado.'}</div>;

  return <div className="space-y-7 pb-10 animate-fade-in"><PageHeader kicker="Conta individual" title="Meu perfil" description="Mantenha seus dados, objetivo e disponibilidade atualizados." actions={<Button onClick={() => void save()} disabled={saving}>{saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Salvar perfil</Button>} />
    <section className="dk-hero-panel p-6 sm:p-8"><div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center"><AvatarPicker name={profile.full_name} avatarUrl={profile.avatar_url} sizeClassName="size-28 border-4 border-white/15" onChange={async (avatarUrl) => { update('avatar_url', avatarUrl); await refreshUser(); }} /><div><p className="dk-kicker text-[#c9ff32]">Atleta independente</p><h1 className="dk-display mt-3 text-4xl sm:text-5xl">{profile.full_name}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/65">{profile.biography || 'Adicione uma apresentação curta sobre sua rotina e o que deseja conquistar.'}</p><p className="mt-3 text-xs text-white/45">Toque na foto para trocar seu avatar.</p></div></div></section>

    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]"><Card><CardHeader className="border-b border-border/60"><CardTitle className="flex items-center gap-2 text-xl"><UserRound className="size-5 text-[#668f00]" /> Dados pessoais</CardTitle></CardHeader><CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6"><div className="space-y-2 sm:col-span-2"><Label htmlFor="name">Nome completo</Label><Input id="name" value={profile.full_name} onChange={(event) => update('full_name', event.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="email">E-mail de acesso</Label><Input id="email" value={profile.email} disabled /><p className="text-xs text-muted-foreground">O e-mail identifica sua conta e não pode ser alterado aqui.</p></div><div className="space-y-2"><Label htmlFor="city">Cidade</Label><Input id="city" value={profile.city} onChange={(event) => update('city', event.target.value)} placeholder="Sua cidade" /></div><div className="space-y-2"><Label htmlFor="birth">Data de nascimento</Label><Input id="birth" type="date" value={profile.birth_date} onChange={(event) => update('birth_date', event.target.value)} /></div><div className="space-y-2"><Label htmlFor="gender">Gênero</Label><select id="gender" value={profile.gender} onChange={(event) => update('gender', event.target.value as IndividualProfileView['gender'])} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="female">Feminino</option><option value="male">Masculino</option><option value="other">Outro / prefiro não informar</option></select></div><div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="height">Altura (cm)</Label><Input id="height" type="number" min={1} max={300} value={profile.height ?? ''} onChange={(event) => update('height', event.target.value ? Number(event.target.value) : undefined)} /></div><div className="space-y-2"><Label htmlFor="weight">Peso (kg)</Label><Input id="weight" type="number" min={1} max={1000} step="0.1" value={profile.weight ?? ''} onChange={(event) => update('weight', event.target.value ? Number(event.target.value) : undefined)} /></div></div><div className="space-y-2"><Label htmlFor="goal">Objetivo</Label><Input id="goal" value={profile.goal} onChange={(event) => update('goal', event.target.value)} placeholder="Ex.: Hipertrofia" /></div><div className="space-y-2"><Label htmlFor="level">Nível</Label><select id="level" value={profile.level} onChange={(event) => update('level', event.target.value as IndividualProfileView['level'])} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="beginner">Iniciante</option><option value="intermediate">Intermediário</option><option value="advanced">Avançado</option></select></div><div className="space-y-2 sm:col-span-2"><Label>Dias disponíveis</Label><div className="flex flex-wrap gap-2">{WEEKDAYS.map((day) => <button type="button" key={day} onClick={() => toggleDay(day)} className={`rounded-full border px-3 py-2 text-xs font-bold ${profile.available_days.includes(day) ? 'border-black bg-black text-[#c9ff32] dark:border-[#c9ff32] dark:bg-[#c9ff32] dark:text-black' : 'border-border bg-background text-muted-foreground'}`}>{day}</button>)}</div></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="bio">Sobre você</Label><Textarea id="bio" value={profile.biography} onChange={(event) => update('biography', event.target.value)} placeholder="Conte brevemente sobre sua rotina de treino..." rows={4} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="restrictions">Restrições e cuidados</Label><Textarea id="restrictions" value={profile.restrictions} onChange={(event) => update('restrictions', event.target.value)} placeholder="Lesões, desconfortos ou orientações profissionais importantes..." rows={4} /></div><Button onClick={() => void save()} disabled={saving} className="sm:col-span-2">{saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Salvar alterações</Button></CardContent></Card>

      <div className="space-y-6"><Card><CardHeader className="border-b border-border/60"><CardTitle className="flex items-center gap-2 text-xl"><Target className="size-5 text-[#668f00]" /> Resumo esportivo</CardTitle></CardHeader><CardContent className="space-y-3 p-5"><div className="rounded-2xl bg-[#c9ff32] p-4 text-black"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-black/55">Objetivo atual</p><p className="mt-2 text-xl font-black">{profile.goal || 'Defina seu objetivo'}</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-muted p-4"><p className="text-2xl font-black">{profile.available_days.length || '—'}x</p><p className="text-[9px] uppercase text-muted-foreground">Disponibilidade</p></div><div className="rounded-2xl bg-muted p-4"><p className="text-2xl font-black">{profile.level === 'advanced' ? 'Avançado' : profile.level === 'intermediate' ? 'Interm.' : 'Iniciante'}</p><p className="text-[9px] uppercase text-muted-foreground">Nível</p></div></div></CardContent></Card>
      <Card><CardHeader className="border-b border-border/60"><CardTitle className="flex items-center gap-2 text-xl"><UserRound className="size-5 text-[#668f00]" /> Aparência</CardTitle></CardHeader><CardContent className="p-5"><BackgroundPicker backgroundUrl={user?.background_url} onChange={async () => { await refreshUser(); }} /></CardContent></Card>
      <Card><CardHeader className="border-b border-border/60"><CardTitle className="flex items-center gap-2 text-xl"><LockKeyhole className="size-5 text-[#668f00]" /> Segurança</CardTitle></CardHeader><CardContent className="space-y-4 p-5">{[['current', 'Senha atual'], ['next', 'Nova senha'], ['confirm', 'Confirmar nova senha']].map(([key, label]) => <div key={key} className="space-y-2"><Label htmlFor={`password-${key}`}>{label}</Label><div className="relative"><Input id={`password-${key}`} type={showPasswords ? 'text' : 'password'} autoComplete={key === 'current' ? 'current-password' : 'new-password'} value={passwords[key as keyof typeof passwords]} onChange={(event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))} className="pr-11" />{key === 'current' && <button type="button" onClick={() => setShowPasswords((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPasswords ? 'Ocultar senhas' : 'Mostrar senhas'}>{showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>}</div></div>)}<Button variant="outline" className="w-full" onClick={() => void changePassword()} disabled={changingPassword}>{changingPassword ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ShieldCheck className="mr-2 size-4" />} Alterar senha</Button></CardContent></Card>
      <Card><CardHeader className="border-b border-border/60"><CardTitle className="flex items-center gap-2 text-xl"><ShieldCheck className="size-5 text-[#668f00]" /> Dados e privacidade</CardTitle></CardHeader><CardContent className="p-5"><AccountControls name={profile.full_name} individual /></CardContent></Card></div></div>
  </div>;
}
