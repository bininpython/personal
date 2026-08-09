'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dumbbell, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PublicBackLink } from '@/components/navigation/public-back-link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { trainerLoginSchema, type TrainerLoginInput } from '@/lib/validators';
import { toast } from 'sonner';
import { APP_NAME } from '@/constants';

export default function TrainerLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<TrainerLoginInput>({
    resolver: zodResolver(trainerLoginSchema),
    defaultValues: { name: '', access_code: '', remember: false },
  });

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
      if (result.credential_upgrade) {
        toast.info('Sua conta antiga foi atualizada. Troque os códigos em Configurações.');
      } else {
        toast.success(`Bem-vindo, ${result.user.name}!`);
      }
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
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-background to-blue-600/5 pointer-events-none" />
      <PublicBackLink href="/login" />
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-md">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Acesso do Personal</h1>
            <p className="text-sm text-muted-foreground">{APP_NAME} · sem e-mail ou telefone</p>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Seu nome profissional</Label>
                <Input id="name" autoComplete="name" placeholder="Ex: Abner Pereira" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="access_code">Código de acesso</Label>
                <div className="relative">
                  <Input
                    id="access_code"
                    type={showCode ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="XXXX-XXXX"
                    className="pr-10 font-mono uppercase tracking-wider"
                    {...register('access_code')}
                  />
                  <button type="button" onClick={() => setShowCode((value) => !value)} aria-label={showCode ? 'Ocultar código' : 'Mostrar código'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">8 caracteres, sem diferenciar maiúsculas e minúsculas. O hífen é opcional.</p>
                {errors.access_code && <p className="text-sm text-destructive">{errors.access_code.message}</p>}
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" className="h-4 w-4 accent-primary" {...register('remember')} />
                Manter conectado neste dispositivo por 30 dias
              </label>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Dumbbell className="mr-2 h-4 w-4" />}
                Entrar como Personal
              </Button>
            </form>
            <div className="mt-6 flex items-center justify-between text-sm">
              <Link href="/recover" className="text-primary hover:underline">Recuperar acesso</Link>
              <Link href="/register" className="text-primary hover:underline">Criar conta</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
