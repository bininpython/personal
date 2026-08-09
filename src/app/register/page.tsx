'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, CheckCircle2, Copy, Dumbbell, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { trainerRegisterSchema, type TrainerRegisterInput } from '@/lib/validators';
import { toast } from 'sonner';
import { PublicBackLink } from '@/components/navigation/public-back-link';

interface CreatedCodes {
  access: string;
  public: string;
  recovery: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [codes, setCodes] = useState<CreatedCodes | null>(null);
  const [copied, setCopied] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<TrainerRegisterInput>({
    resolver: zodResolver(trainerRegisterSchema),
    defaultValues: { full_name: '', city: '', state: '', terms_accepted: false },
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
      setCodes({
        access: result.access_code,
        public: result.trainer_code,
        recovery: result.recovery_code,
      });
      login(result.user);
      toast.success('Conta criada. Salve os três códigos agora.');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  async function copyCode(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      toast.success('Código copiado!');
      setTimeout(() => setCopied(''), 1500);
    } catch {
      toast.error('Não foi possível copiar. Anote o código.');
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-background to-blue-600/5 pointer-events-none" />
      <PublicBackLink href="/login" />
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-xl border-border/50 shadow-xl">
          {codes ? (
            <>
              <CardHeader className="text-center pb-2">
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
                <h1 className="text-2xl font-bold">Conta protegida e pronta</h1>
                <p className="text-sm text-muted-foreground">Estes segredos aparecem uma única vez. Guarde-os fora do sistema.</p>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                {[
                  { key: 'access', title: 'Código secreto de entrada', value: codes.access, help: 'Use com seu nome para entrar.' },
                  { key: 'public', title: 'Código público do personal', value: codes.public, help: 'Compartilhe com seus alunos.' },
                  { key: 'recovery', title: 'Chave de recuperação', value: codes.recovery, help: 'Não compartilhe. Ela recupera sua conta.' },
                ].map((item) => (
                  <div key={item.key} className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.title}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <code className="break-all text-lg font-bold tracking-wider">{item.value}</code>
                      <Button type="button" size="icon" variant="outline" onClick={() => copyCode(item.key, item.value)} aria-label={`Copiar ${item.title}`}>
                        {copied === item.key ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{item.help}</p>
                  </div>
                ))}
                <Button className="w-full h-11" onClick={() => { router.replace('/dashboard'); router.refresh(); }}>
                  Acessar painel
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold">Cadastro de Personal</h1>
                <p className="text-sm text-muted-foreground">Sem e-mail, telefone ou senha. O sistema gerará códigos seguros.</p>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome profissional</Label>
                    <Input id="full_name" autoComplete="name" placeholder="Ex: Abner Pereira" {...register('full_name')} />
                    {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
                  </div>
                  <div className="grid grid-cols-[1fr_100px] gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input id="city" autoComplete="address-level2" placeholder="Ex: Goiânia" {...register('city')} />
                      {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input id="state" autoComplete="address-level1" maxLength={2} placeholder="GO" className="uppercase" {...register('state')} />
                      {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                    Seus códigos serão protegidos por hash e nunca poderão ser consultados pelo suporte. Guarde a chave de recuperação.
                  </div>
                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" {...register('terms_accepted')} />
                    <span>Li e aceito os <a href="/terms" target="_blank" className="text-primary underline">Termos de Uso</a> e a <a href="/privacy" target="_blank" className="text-primary underline">Política de Privacidade</a>.</span>
                  </label>
                  {errors.terms_accepted && <p className="text-sm text-destructive">{errors.terms_accepted.message}</p>}
                  <Button type="submit" className="w-full h-11" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Dumbbell className="mr-2 h-4 w-4" />}
                    Criar conta segura
                  </Button>
                </form>
                <Button variant="outline" className="mt-4 w-full" onClick={() => router.push('/login/trainer')}>Já tenho conta</Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
