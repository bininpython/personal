'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dumbbell, User, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { studentLoginSchema, type StudentLoginInput } from '@/lib/validators';
import { toast } from 'sonner';
import { APP_NAME } from '@/constants';

export default function StudentLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentLoginInput>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: { name: '', access_code: '', remember_me: false },
  });

  const rememberMe = watch('remember_me');

  const onSubmit = async (data: StudentLoginInput) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/student/login', {
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
      router.push('/home');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-background to-emerald-600/5 dark:from-blue-600/15 dark:via-background dark:to-emerald-600/10 pointer-events-none" />

      {/* Back */}
      <div className="relative z-10 p-4">
        <Link href="/login" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Link>
      </div>

      {/* Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 -mt-10">
        <Card className="w-full max-w-md border-border/50 shadow-xl animate-slide-up">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Acesso do Aluno</h1>
            <p className="text-sm text-muted-foreground">{APP_NAME}</p>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Seu Nome</Label>
                <Input
                  id="name"
                  placeholder="Digite seu nome completo"
                  autoComplete="name"
                  className="h-11"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="access_code">Código de Acesso</Label>
                <div className="relative">
                  <Input
                    id="access_code"
                    type={showCode ? 'text' : 'password'}
                    placeholder="Ex: JP8X41"
                    autoComplete="off"
                    className="h-11 pr-10 font-mono tracking-wider"
                    {...register('access_code')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.access_code && (
                  <p className="text-sm text-destructive">{errors.access_code.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember_me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setValue('remember_me', !!checked)}
                />
                <Label htmlFor="remember_me" className="text-sm text-muted-foreground cursor-pointer">
                  Manter meu acesso neste aparelho
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white text-base"
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
                    Entrar no Meu Treino
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <p className="text-xs text-muted-foreground text-center">
                Esqueceu seu código? Solicite um novo código ao seu personal trainer.
              </p>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">
                Demo: <code className="font-mono">João Pedro Silva</code> / <code className="font-mono">JP8X41</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
