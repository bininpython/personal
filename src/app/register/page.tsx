'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dumbbell, Shield, Eye, EyeOff, ArrowLeft, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { trainerRegisterSchema, type TrainerRegisterInput } from '@/lib/validators';
import { toast } from 'sonner';
import { APP_NAME } from '@/constants';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrainerRegisterInput>({
    resolver: zodResolver(trainerRegisterSchema),
    defaultValues: { full_name: '', trainer_code: '', password: '', confirm_password: '' },
  });

  const onSubmit = async (data: TrainerRegisterInput) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/trainer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Erro ao fazer cadastro');
        return;
      }

      if (result.requires_login || !result.user) {
        toast.success(result.message || 'Conta criada. Faça login para continuar.');
        router.replace('/login/trainer');
        return;
      }

      login(result.user);
      toast.success(`Conta criada! Bem-vindo(a), ${result.user.name}!`);
      router.replace('/dashboard');
      router.refresh();
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-background to-blue-600/5 dark:from-emerald-600/15 dark:via-background dark:to-blue-600/10 pointer-events-none" />

      {/* Back */}
      <div className="relative z-10 p-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/login')} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
      </div>

      {/* Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-lg border-border/50 shadow-xl animate-slide-up">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Cadastro de Personal</h1>
            <p className="text-sm text-muted-foreground">Junte-se ao {APP_NAME}</p>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  placeholder="Ex: Abner Pereira"
                  autoComplete="name"
                  className="h-11"
                  {...register('full_name')}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="trainer_code">Código exclusivo para login</Label>
                <Input
                  id="trainer_code"
                  placeholder="Ex: #PRO-ABNER"
                  autoComplete="username"
                  className="h-11 uppercase"
                  {...register('trainer_code', {
                    onChange: (e) => e.target.value = e.target.value.toUpperCase()
                  })}
                />
                <div className="flex items-start gap-1 text-xs text-muted-foreground mt-1">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <p>Este código será usado por você e por seus alunos para acessar o sistema.</p>
                </div>
                {errors.trainer_code && (
                  <p className="text-sm text-destructive">{errors.trainer_code.message}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua senha"
                      className="h-11 pr-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirmar Senha</Label>
                  <Input
                    id="confirm_password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    className="h-11"
                    {...register('confirm_password')}
                  />
                  {errors.confirm_password && (
                    <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-base mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <Dumbbell className="w-4 h-4 mr-2" />
                    Criar Conta
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center border-t border-border/50 pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                Já tem uma conta?
              </p>
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => router.push('/login/trainer')}
              >
                Fazer Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
