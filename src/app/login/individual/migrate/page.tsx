'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, Copy, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AuthScene } from '@/components/auth/auth-scene';
import { PublicBackLink } from '@/components/navigation/public-back-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { individualLegacyMigrationSchema, type IndividualLegacyMigrationInput } from '@/lib/validators';

export default function IndividualMigratePage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<IndividualLegacyMigrationInput>({
    resolver: zodResolver(individualLegacyMigrationSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: IndividualLegacyMigrationInput) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/individual/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) return toast.error(result.error || 'Não foi possível migrar sua conta.');
      login(result.user);
      setNewCode(result.access_code);
      toast.success('Conta migrada com sucesso! Seu código de acesso foi gerado.');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    if (!newCode) return;
    try {
      await navigator.clipboard.writeText(newCode);
      setCopied(true);
      toast.success('Código copiado!');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Não foi possível copiar o código. Anote-o em um local seguro.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f4ef] text-black">
      <PublicBackLink href="/login/individual" />
      <AuthScene
        eyebrow="Migração de conta"
        title="MIGRE SEU ACESSO PARA CÓDIGO PRIVADO."
        description="A G KONG agora utiliza código exclusivo para login rápido sem necessidade de e-mail e senha convencionais."
      >
        {newCode ? (
          <div className="text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#c9ff32]">
              <ShieldCheck className="size-8" />
            </div>
            <p className="mt-7 text-[0.65rem] font-black uppercase tracking-[0.25em] text-[#648d00]">
              Migração concluída
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Seu novo código de acesso</h1>
            <p className="mt-3 text-sm leading-6 text-black/50">
              Guarde este código em local seguro. Você o utilizará junto com o seu nome para entrar no aplicativo.
            </p>
            <div className="mt-8 rounded-3xl bg-black p-7 text-white shadow-2xl">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-white/40">Código exclusivo</p>
              <div className="mt-3 flex items-center justify-center gap-4">
                <code className="font-mono text-4xl font-black tracking-[0.18em] text-[#c9ff32]">{newCode}</code>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => void copyCode()}
                  aria-label="Copiar código"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  {copied ? <Check className="size-4 text-[#c9ff32]" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
            <Button
              className="mt-7 h-14 w-full rounded-full bg-black text-white"
              onClick={() => {
                router.replace('/my');
                router.refresh();
              }}
            >
              Ir para o painel <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        ) : (
          <div>
            <div className="mb-8 flex size-14 items-center justify-center rounded-2xl bg-black text-[#c9ff32]">
              <KeyRound className="size-6" />
            </div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[#648d00]">
              Atualizar credenciais
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Acesse com seu e-mail antigo</h1>
            <p className="mt-3 text-sm leading-6 text-black/50">
              Informe seu e-mail e senha cadastrados para gerar seu novo código de acesso.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.12em]">
                  E-mail cadastrado
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className="h-12 rounded-xl border-black/12 bg-white px-4"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.12em]">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    required
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Sua senha anterior"
                    className="h-12 rounded-xl border-black/12 bg-white px-4 pr-11"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                className="h-14 w-full rounded-full bg-black text-white hover:bg-black/85"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
                Migrar e gerar código
              </Button>
            </form>
          </div>
        )}
      </AuthScene>
    </div>
  );
}
