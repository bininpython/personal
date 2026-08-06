'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Check,
  CheckCircle2,
  Copy,
  Dumbbell,
  Eye,
  EyeOff,
  Loader2,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { trainerRegisterSchema, type TrainerRegisterInput } from '@/lib/validators';
import { toast } from 'sonner';
import { TRAINER_ACCESS_CODE_LENGTH } from '@/constants';
import { PublicBackLink } from '@/components/navigation/public-back-link';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrainerRegisterInput>({
    resolver: zodResolver(trainerRegisterSchema),
    defaultValues: { full_name: '', city: '', state: '', password: '' },
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

      if (!response.ok) {
        toast.error(result.error || 'Erro ao fazer cadastro');
        return;
      }

      setCreatedCode(result.trainer_code);
      setIsLoggedIn(Boolean(result.user));

      if (result.user) login(result.user);

      toast.success('Conta criada! Guarde seu código de acesso.');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(createdCode);
      setCopied(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar. Anote o código.');
    }
  };

  const continueToAccount = () => {
    router.replace(isLoggedIn ? '/dashboard' : '/login/trainer');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-background to-blue-600/5 dark:from-emerald-600/15 dark:via-background dark:to-blue-600/10 pointer-events-none" />

      <PublicBackLink href="/login" />

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-lg border-border/50 shadow-xl animate-slide-up">
          {createdCode ? (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-bold">Conta criada com sucesso!</h1>
                <p className="text-sm text-muted-foreground">
                  Este é o seu código exclusivo para entrar como personal.
                </p>
              </CardHeader>
              <CardContent className="space-y-6 pt-5">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Seu código de acesso
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-mono text-4xl font-bold tracking-[0.2em]">
                      {createdCode}
                    </span>
                    <Button type="button" variant="outline" size="icon" onClick={copyCode} aria-label="Copiar código">
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Guarde este código. Para entrar novamente, você usará apenas ele e sua senha.
                </p>

                <Button className="h-11 w-full text-base" onClick={continueToAccount}>
                  Acessar minha conta
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-2">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                    <Shield className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold">Cadastro de Personal</h1>
                <p className="text-sm text-muted-foreground">
                  Preencha seus dados e receba um código de {TRAINER_ACCESS_CODE_LENGTH} dígitos.
                </p>
              </CardHeader>

              <CardContent className="pt-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome do Personal</Label>
                    <Input
                      id="full_name"
                      placeholder="Ex: Abner Pereira"
                      autoComplete="name"
                      className="h-11"
                      {...register('full_name')}
                    />
                    {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
                  </div>

                  <div className="grid grid-cols-[1fr_100px] gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        placeholder="Ex: Goiânia"
                        autoComplete="address-level2"
                        className="h-11"
                        {...register('city')}
                      />
                      {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        placeholder="GO"
                        autoComplete="address-level1"
                        maxLength={2}
                        className="h-11 uppercase"
                        {...register('state', {
                          onChange: (event) => {
                            event.target.value = event.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
                          },
                        })}
                      />
                      {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Crie uma senha segura"
                        autoComplete="new-password"
                        className="h-11 pr-10"
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                  </div>

                  <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      <>
                        <Dumbbell className="w-4 h-4 mr-2" />
                        Criar conta e gerar código
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center border-t border-border/50 pt-6">
                  <p className="text-sm text-muted-foreground mb-4">Já tem uma conta?</p>
                  <Button variant="outline" className="w-full h-11" onClick={() => router.push('/login/trainer')}>
                    Fazer login
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
