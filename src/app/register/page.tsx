'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, CheckCircle2, Copy, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { AuthScene } from '@/components/auth/auth-scene';
import { PublicBackLink } from '@/components/navigation/public-back-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trainerRegisterSchema, type TrainerRegisterInput } from '@/lib/validators';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<TrainerRegisterInput>({
    resolver: zodResolver(trainerRegisterSchema),
    defaultValues: {
      full_name: '',
      city: '',
      nickname: '',
      password: '',
      age: 18,
      terms_accepted: false,
    },
  });

  const onSubmit = async (data: TrainerRegisterInput) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/trainer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) return toast.error(result.error || 'Erro ao fazer cadastro.');
      setAccessCode(result.access_code);
      setCheckoutUrl(result.checkout_url);
      // login(result.user); -> Login só após o pagamento
      toast.success('Conta pendente. Conclua o pagamento para ativar.');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

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
      <PublicBackLink href="/login" />
      <AuthScene
        eyebrow="Novo personal"
        title="COMECE FORTE. CRESÇA ORGANIZADO."
        description="Crie sua conta profissional e receba um único código para acessar toda a operação G KONG."
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
              Salve agora: por segurança, o código completo não ficará visível depois desta tela. Se esquecer, use nome, senha e idade para gerar outro.
            </div>
            {checkoutUrl ? (
              <a href={checkoutUrl} className="mt-7 flex h-14 w-full items-center justify-center rounded-full bg-black text-white hover:bg-black/85">
                Efetuar Pagamento <ArrowRight className="ml-2 size-4" />
              </a>
            ) : (
              <Button className="mt-7 h-14 w-full rounded-full bg-black text-white" onClick={() => { router.replace('/login/trainer'); router.refresh(); }}>
                Ir para o Login <ArrowRight className="ml-2 size-4" />
              </Button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[#648d00]">Conta profissional</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Crie seu acesso</h1>
            <p className="mt-3 text-sm leading-6 text-black/50">Cinco informações e sua conta está pronta.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-[0.12em]">Nome completo</Label>
                  <Input id="full_name" autoComplete="name" placeholder="Ex: Abner Pereira" className="h-12 rounded-xl border-black/12 bg-white px-4" {...register('full_name')} />
                  {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-xs font-bold uppercase tracking-[0.12em]">Cidade</Label>
                  <Input id="city" autoComplete="address-level2" placeholder="Ex: Goiânia" className="h-12 rounded-xl border-black/12 bg-white px-4" {...register('city')} />
                  {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname" className="text-xs font-bold uppercase tracking-[0.12em]">Apelido <span className="normal-case tracking-normal text-black/35">(opcional)</span></Label>
                  <Input id="nickname" placeholder="Como prefere ser chamado" className="h-12 rounded-xl border-black/12 bg-white px-4" {...register('nickname')} />
                  {errors.nickname && <p className="text-xs text-destructive">{errors.nickname.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-xs font-bold uppercase tracking-[0.12em]">Idade</Label>
                  <Input id="age" type="number" min={18} max={100} inputMode="numeric" className="h-12 rounded-xl border-black/12 bg-white px-4" {...register('age', { valueAsNumber: true })} />
                  {errors.age && <p className="text-xs text-destructive">{errors.age.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.12em]">Senha de recuperação</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo de 6 caracteres" className="h-12 rounded-xl border-black/12 bg-white px-4 pr-11" {...register('password')} />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
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

              <Button type="submit" className="h-14 w-full rounded-full bg-black text-white hover:bg-black/85" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
                Criar conta e gerar código
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-black/45">Já tem conta? <Link href="/login/trainer" className="font-bold text-black hover:underline">Entrar</Link></p>
          </div>
        )}
      </AuthScene>
    </div>
  );
}
