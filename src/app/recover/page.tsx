'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PublicBackLink } from '@/components/navigation/public-back-link';
import { useAuth } from '@/hooks/use-auth';

export default function RecoverPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', trainer_code: '', recovery_code: '' });
  const [newCodes, setNewCodes] = useState<{ access: string; recovery: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/auth/trainer/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) return toast.error(result.error || 'Não foi possível recuperar.');
      login(result.user);
      setNewCodes({ access: result.access_code, recovery: result.recovery_code });
      toast.success('Acesso recuperado. Os códigos antigos foram invalidados.');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <PublicBackLink href="/login/trainer" />
      <Card className="mx-auto mt-10 w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          {newCodes ? <ShieldCheck className="mx-auto h-12 w-12 text-emerald-500" /> : <KeyRound className="mx-auto h-12 w-12 text-primary" />}
          <h1 className="text-2xl font-bold">{newCodes ? 'Acesso recuperado' : 'Recuperar acesso'}</h1>
          <p className="text-sm text-muted-foreground">A recuperação não usa e-mail nem telefone.</p>
        </CardHeader>
        <CardContent>
          {newCodes ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">NOVO CÓDIGO SECRETO</p><code className="mt-2 block break-all text-lg font-bold">{newCodes.access}</code></div>
              <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">NOVA CHAVE DE RECUPERAÇÃO</p><code className="mt-2 block break-all text-lg font-bold">{newCodes.recovery}</code></div>
              <p className="text-sm text-amber-700 dark:text-amber-300">Salve os dois agora. Eles não serão exibidos novamente.</p>
              <Button className="w-full" onClick={() => { router.replace('/dashboard'); router.refresh(); }}>Ir para o painel</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="name">Nome profissional</Label><Input id="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="trainer_code">Código público</Label><Input id="trainer_code" required placeholder="FC-XXXXXXXX" className="font-mono uppercase" value={form.trainer_code} onChange={(event) => setForm({ ...form, trainer_code: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="recovery_code">Chave de recuperação</Label><Input id="recovery_code" required type="password" className="font-mono" value={form.recovery_code} onChange={(event) => setForm({ ...form, recovery_code: event.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Gerar novos códigos</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
