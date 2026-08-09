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
  const { register, handleSubmit, formState: { errors } } = useForm<StudentLoginInput>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: { name: '', trainer_code: '', access_code: '', remember: false },
  });

  const onSubmit = async (data: StudentLoginInput) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) return toast.error(result.error || 'Não foi possível entrar.');
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
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-background to-emerald-600/5 pointer-events-none" />
      <PublicBackLink href="/login" />
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
              <User className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Acesso do Aluno</h1>
            <p className="text-sm text-muted-foreground">{APP_NAME} · sem e-mail ou telefone</p>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Seu nome</Label>
                <Input id="name" autoComplete="name" placeholder="Digite seu nome completo" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="trainer_code">Código público do personal</Label>
                <Input id="trainer_code" placeholder="FC-XXXXXXXX" className="font-mono uppercase tracking-wider" {...register('trainer_code')} />
                {errors.trainer_code && <p className="text-sm text-destructive">{errors.trainer_code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="access_code">Seu código individual</Label>
                <Input id="access_code" type="password" autoComplete="current-password" placeholder="XXXX-XXXX-XXXX" className="font-mono uppercase tracking-wider" {...register('access_code')} />
                {errors.access_code && <p className="text-sm text-destructive">{errors.access_code.message}</p>}
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" className="h-4 w-4 accent-blue-500" {...register('remember')} />
                Manter conectado neste dispositivo por 30 dias
              </label>
              <Button type="submit" className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Dumbbell className="mr-2 h-4 w-4" />}
                Entrar no Meu Treino
              </Button>
            </form>
            <p className="mt-6 rounded-lg border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
              Esqueceu o código? Peça ao seu personal para gerar um novo. O código antigo será invalidado.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
