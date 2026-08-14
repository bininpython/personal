'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, CheckCircle2, Copy, Loader2, ShieldCheck } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<IndividualRegisterInput>({
    resolver: zodResolver(individualRegisterSchema),
    defaultValues: {
      full_name: '',
      goal: '',
      level: 'beginner',
      terms_accepted: false,
    },
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
      setAccessCode(result.access_code);
      setCheckoutUrl(result.checkout_url);
      toast.success('Conta pendente. Conclua o pagamento para ativar.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!accessCode) return;
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      toast.success('Código copiado!');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Não foi possível copiar. Anote o código.');
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
        {accessCode ? (
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#c9ff32]"><CheckCircle2 className="size-8" /></div>
            <p className="mt-7 text-[0.65rem] font-black uppercase tracking-[0.25em] text-[#648d00]">Código reservado</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Seu código G KONG</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/50">Guarde seu código, ele será a sua chave de acesso. Para finalizar e ativar a conta, conclua a assinatura.</p>

            <div className="mt-8 rounded-3xl bg-black p-7 text-white shadow-2xl">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-white/40">Código pessoal</p>
              <div className="mt-3 flex items-center justify-center gap-4">
                <code className="font-mono text-4xl font-black tracking-[0.18em] text-[#c9ff32] sm:text-5xl">{accessCode}</code>
                <Button type="button" size="icon" variant="outline" onClick={() => void copyCode()} aria-label="Copiar código" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                  {copied ? <Check className="size-4 text-[#c9ff32]" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-warn/25 bg-warn-wash p-4 text-left text-xs leading-5 text-black/55">
              Salve agora: por segurança, o código completo não ficará visível depois desta tela.
            </div>
            {checkoutUrl ? (
              <a href={checkoutUrl} className="mt-7 flex h-14 w-full items-center justify-center rounded-full bg-black text-white hover:bg-black/85">
                Efetuar Pagamento <ArrowRight className="ml-2 size-4" />
              </a>
            ) : (
              <Button className="mt-7 h-14 w-full rounded-full bg-black text-white" onClick={() => { router.replace('/login/individual'); router.refresh(); }}>
                Ir para o Login <ArrowRight className="ml-2 size-4" />
              </Button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[#648d00]">Treino independente</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Crie sua conta</h1>
            <p className="mt-3 text-sm leading-6 text-black/50">Informe seus dados e receba seu código de acesso de 6 números.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-[0.12em]">Nome completo</Label>
                  <Input id="full_name" autoComplete="name" placeholder="Ex.: Abner Pereira" className="h-12 rounded-xl border-black/12 bg-white px-4" {...register('full_name')} />
                  {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
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
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-xs font-bold uppercase tracking-[0.12em]">Idade</Label>
                  <Input id="age" type="number" min={18} max={100} inputMode="numeric" placeholder="18" className="h-12 rounded-xl border-black/12 bg-white px-4" {...register('age', { valueAsNumber: true })} />
                  {errors.age && <p className="text-xs text-destructive">{errors.age.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.12em]">Senha de recuperação</Label>
                  <Input id="password" type="password" placeholder="Mínimo de 6 caracteres" className="h-12 rounded-xl border-black/12 bg-white px-4" {...register('password')} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
              </div>

              <div className="flex gap-3 rounded-2xl border border-black/8 bg-white/60 p-4">
                <ShieldCheck className="mt-0.5 size-5 shrink-0" />
                <p className="text-xs leading-5 text-black/50">A senha não é pedida no login. Ela confirma sua identidade apenas quando você precisa gerar um novo código.</p>
              </div>
              <label className="flex items-start gap-3 text-xs leading-5 text-black/55">
                <input type="checkbox" className="mt-0.5 size-4 accent-black" {...register('terms_accepted')} />
                <span>Li e aceito os <Link href="/terms" target="_blank" className="font-bold underline">Termos de Uso</Link> e a <Link href="/privacy" target="_blank" className="font-bold underline">Política de Privacidade</Link>.</span>
              </label>
              {errors.terms_accepted && <p className="text-xs text-destructive">{errors.terms_accepted.message}</p>}

              <Button type="submit" className="h-14 w-full rounded-full bg-black text-white hover:bg-black/85" disabled={loading}>
                {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
                Criar conta e gerar código
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-black/45">Já tem conta? <Link href="/login/individual" className="font-bold text-black hover:underline">Entrar</Link></p>
          </div>
        )}
      </AuthScene>
    </div>
  );
}
