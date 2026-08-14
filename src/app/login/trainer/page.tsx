'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { AuthScene } from '@/components/auth/auth-scene';
import { PublicBackLink } from '@/components/navigation/public-back-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { formatAccessCodeInput } from '@/lib/auth/credentials';
import { trainerLoginSchema, type TrainerLoginInput } from '@/lib/validators';
import { toast } from 'sonner';

export default function TrainerLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<TrainerLoginInput>({
    resolver: zodResolver(trainerLoginSchema),
    defaultValues: { name: '', access_code: '', remember: false },
  });
  const accessCodeField = register('access_code');

  const onSubmit = async (data: TrainerLoginInput) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/trainer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) return toast.error(result.error || 'Não foi possível entrar.');
      login(result.user);
      toast.success(`Bem-vindo, ${result.user.name}!`);
      router.replace('/dashboard');
      router.refresh();
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'trainer' }),
      });
      const result = await response.json();
      if (!response.ok) return toast.error(result.error || 'Não foi possível entrar no modo teste.');
      login(result.user);
      toast.success('Modo Teste ativado!');
      router.replace('/dashboard');
      router.refresh();
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f4ef] text-black">
      <PublicBackLink href="/login" />
      <AuthScene
        eyebrow="Área do personal"
        title="CONTROLE TOTAL. ACESSO DIRETO."
        description="Seu painel profissional com todos os alunos, treinos, avaliações e indicadores em um só lugar."
      >
        <div className="mb-8 flex size-14 items-center justify-center rounded-2xl bg-black text-[#c9ff32]"><ShieldCheck className="size-6" /></div>
        <p className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[#648d00]">Personal trainer</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Entre no seu painel</h1>
        <p className="mt-3 text-sm leading-6 text-black/50">Use seu nome e o código de 6 números.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-[0.12em]">Seu nome</Label>
            <Input id="name" autoComplete="name" placeholder="Ex: Abner Pereira" className="h-12 rounded-xl border-black/12 bg-white px-4" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="access_code" className="text-xs font-bold uppercase tracking-[0.12em]">Código pessoal</Label>
            <div className="relative">
              <Input
                {...accessCodeField}
                id="access_code"
                type={showCode ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                placeholder="000-000"
                className="h-14 rounded-xl border-black/12 bg-white px-4 pr-12 font-mono text-xl font-black tracking-[0.22em]"
                onChange={(event) => {
                  event.target.value = formatAccessCodeInput(event.target.value);
                  void accessCodeField.onChange(event);
                }}
              />
              <button type="button" onClick={() => setShowCode((value) => !value)} aria-label={showCode ? 'Ocultar código' : 'Mostrar código'} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40">
                {showCode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.access_code && <p className="text-sm text-destructive">{errors.access_code.message}</p>}
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-black/50">
            <input type="checkbox" className="size-4 accent-black" {...register('remember')} />
            Manter conectado por 30 dias
          </label>
          
          <div className="flex flex-col gap-3">
            <Button type="submit" className="h-13 w-full rounded-full bg-black text-white hover:bg-black/85" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
              Entrar como personal
            </Button>
            <Button type="button" variant="outline" className="h-13 w-full rounded-full border-black/10 text-black hover:bg-black/5" onClick={loginDemo} disabled={isLoading}>
              Acessar ambiente de teste
            </Button>
          </div>
        </form>

        <div className="mt-7 flex items-center justify-between text-sm font-semibold">
          <Link href="/recover" className="text-black/55 hover:text-black">Esqueci meu código</Link>
          <Link href="/register" className="text-[#557900] hover:underline">Criar conta</Link>
        </div>
      </AuthScene>
    </div>
  );
}
