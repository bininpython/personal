'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AuthScene } from '@/components/auth/auth-scene';
import { PublicBackLink } from '@/components/navigation/public-back-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { individualRegisterSchema, type IndividualRegisterInput } from '@/lib/validators';

export default function IndividualRegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<IndividualRegisterInput>({
    resolver: zodResolver(individualRegisterSchema),
    defaultValues: { full_name: '', email: '', password: '', goal: '', level: 'beginner', terms_accepted: false },
  });

  async function onSubmit(data: IndividualRegisterInput) {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/individual/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível criar sua conta.');
      login(result.user);
      toast.success('Sua área individual está pronta.');
      router.replace('/my');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f4ef] text-black">
      <PublicBackLink href="/login/individual" />
      <AuthScene
        eyebrow="Nova conta individual"
        title="MONTE. EVOLUA. REPITA."
        description="Uma área pessoal para conhecer os exercícios, organizar seu treino e levar sua ficha com você."
        wide
      >
        <p className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[#648d00]">Treino independente</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Crie sua conta</h1>
        <p className="mt-3 text-sm leading-6 text-black/50">Seu catálogo, suas fichas e seu perfil em um único lugar.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-[0.12em]">Nome completo</Label>
              <Input id="full_name" autoComplete="name" placeholder="Ex.: Abner Pereira" className="h-12 rounded-xl border-black/12 bg-white px-4" {...register('full_name')} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.12em]">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="voce@email.com" className="h-12 rounded-xl border-black/12 bg-white px-4" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal" className="text-xs font-bold uppercase tracking-[0.12em]">Objetivo <span className="normal-case tracking-normal text-black/35">(opcional)</span></Label>
              <Input id="goal" placeholder="Ex.: Hipertrofia" className="h-12 rounded-xl border-black/12 bg-white px-4" {...register('goal')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level" className="text-xs font-bold uppercase tracking-[0.12em]">Nível atual</Label>
              <select id="level" className="flex h-12 w-full rounded-xl border border-black/12 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-black/20" {...register('level')}>
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediário</option>
                <option value="advanced">Avançado</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.12em]">Senha</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" className="h-12 rounded-xl border-black/12 bg-white px-4 pr-12" {...register('password')} />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 rounded-2xl border border-black/8 bg-white/60 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" />
            <p className="text-xs leading-5 text-black/50">Esta conta é somente sua. Ela não possui mensagens, avaliações, agenda ou acesso de personal.</p>
          </div>
          <label className="flex items-start gap-3 text-xs leading-5 text-black/55">
            <input type="checkbox" className="mt-0.5 size-4 accent-black" {...register('terms_accepted')} />
            <span>Li e aceito os <Link href="/terms" target="_blank" className="font-bold underline">Termos de Uso</Link> e a <Link href="/privacy" target="_blank" className="font-bold underline">Política de Privacidade</Link>.</span>
          </label>
          {errors.terms_accepted && <p className="text-xs text-destructive">{errors.terms_accepted.message}</p>}

          <Button type="submit" className="h-14 w-full rounded-full bg-black text-white hover:bg-black/85" disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
            Criar minha área G KONG
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-black/45">Já tem conta? <Link href="/login/individual" className="font-bold text-black hover:underline">Entrar</Link></p>
      </AuthScene>
    </div>
  );
}
