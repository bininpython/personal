'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dumbbell, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PublicBackLink } from '@/components/navigation/public-back-link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { studentLoginSchema, type StudentLoginInput } from '@/lib/validators';
import { toast } from 'sonner';
import { APP_NAME } from '@/constants';

export default function StudentLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentLoginInput>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: { name: '', access_code: '' },
  });

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
      router.replace('/home');
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
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-background to-emerald-600/5 dark:from-blue-600/15 dark:via-background dark:to-emerald-600/10 pointer-events-none" />

      <PublicBackLink href="/login" />

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
                <Label htmlFor="name">Seu nome</Label>
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
                <Label htmlFor="access_code">Código de acesso com 4 números</Label>
                <Input
                  id="access_code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="Ex: 4821"
                  autoComplete="one-time-code"
                  className="h-11 text-center font-mono text-xl tracking-[0.35em] placeholder:text-base placeholder:tracking-normal"
                  {...register('access_code', {
                    onChange: (event) => {
                      event.target.value = event.target.value.replace(/\D/g, '').slice(0, 4);
                    },
                  })}
                />
                {errors.access_code && (
                  <p className="text-sm text-destructive">{errors.access_code.message}</p>
                )}
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
                Esqueceu seu código? Peça ao seu personal para consultá-lo na lista de alunos.
              </p>
            </div>


          </CardContent>
        </Card>
      </div>
    </div>
  );
}
