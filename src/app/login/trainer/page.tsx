'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dumbbell, Shield, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { trainerLoginSchema, type TrainerLoginInput } from '@/lib/validators';
import { toast } from 'sonner';
import { APP_NAME } from '@/constants';

export default function TrainerLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TrainerLoginInput>({
    resolver: zodResolver(trainerLoginSchema),
    defaultValues: { trainer_code: '', password: '', remember_me: false },
  });

  const rememberMe = watch('remember_me');

  const onSubmit = async (data: TrainerLoginInput) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/trainer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Erro ao fazer login');
        return;
      }

      login(result.user);
      toast.success(`Bem-vindo, ${result.user.name}!`);
      router.push('/dashboard');
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
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 -mt-10">
        <Card className="w-full max-w-md border-border/50 shadow-xl animate-slide-up">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Acesso do Personal</h1>
            <p className="text-sm text-muted-foreground">{APP_NAME}</p>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trainer_code">Código de Acesso (Login)</Label>
                <Input
                  id="trainer_code"
                  placeholder="Ex: #001-CHRIS"
                  autoComplete="username"
                  className="h-11"
                  {...register('trainer_code')}
                />
                {errors.trainer_code && (
                  <p className="text-sm text-destructive">{errors.trainer_code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    className="h-11 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember_me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setValue('remember_me', !!checked)}
                />
                <Label htmlFor="remember_me" className="text-sm text-muted-foreground cursor-pointer">
                  Manter meu acesso
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Dumbbell className="w-4 h-4 mr-2" />
                    Entrar como Personal
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/register')}
                className="text-sm text-primary hover:underline"
              >
                Não tem conta? Cadastre-se
              </button>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">
                Demo: <code className="font-mono">#001-CHRIS</code> / <code className="font-mono">senha123</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
