'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AuthScene } from '@/components/auth/auth-scene';
import { PublicBackLink } from '@/components/navigation/public-back-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { individualLoginSchema, type IndividualLoginInput } from '@/lib/validators';

export default function IndividualLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<IndividualLoginInput>({
    resolver: zodResolver(individualLoginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  async function onSubmit(data: IndividualLoginInput) {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/individual/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível entrar.');
      login(result.user);
      toast.success(`Bem-vindo, ${result.user.name}!`);
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
      <PublicBackLink href="/login" />
      <AuthScene
        eyebrow="Treino independente"
        title="SEU TREINO. SUAS REGRAS."
        description="Explore a anatomia, escolha entre centenas de exercícios e crie fichas profissionais no seu próprio ritmo."
      >
        <div className="mb-8 flex size-14 items-center justify-center rounded-2xl bg-black text-[#c9ff32]"><Sparkles className="size-6" /></div>
        <p className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[#648d00]">Conta individual</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Entre na sua área</h1>
        <p className="mt-3 text-sm leading-6 text-black/50">Use o e-mail e a senha da sua conta independente.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.12em]">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="voce@email.com" className="h-12 rounded-xl border-black/12 bg-white px-4" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.12em]">Senha</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Sua senha" className="h-12 rounded-xl border-black/12 bg-white px-4 pr-12" {...register('password')} />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-black/50">
            <input type="checkbox" className="size-4 accent-black" {...register('remember')} />
            Manter conectado por 30 dias
          </label>
          <Button type="submit" className="h-13 w-full rounded-full bg-black text-white hover:bg-black/85" disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
            Entrar na minha área
          </Button>
        </form>
        <p className="mt-7 text-center text-sm text-black/50">Ainda não tem conta? <Link href="/register/individual" className="font-bold text-[#557900] hover:underline">Criar conta individual</Link></p>
      </AuthScene>
    </div>
  );
}
