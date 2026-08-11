'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Copy, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AuthScene } from '@/components/auth/auth-scene';
import { PublicBackLink } from '@/components/navigation/public-back-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

export default function RecoverPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: '', password: '', age: '' });
  const [newCode, setNewCode] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/auth/trainer/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, age: Number(form.age) }),
      });
      const result = await response.json();
      if (!response.ok) return toast.error(result.error || 'Não foi possível recuperar.');
      login(result.user);
      setNewCode(result.access_code);
      toast.success('Identidade confirmada. Seu novo código está pronto.');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!newCode) return;
    try {
      await navigator.clipboard.writeText(newCode);
      setCopied(true);
      toast.success('Código copiado!');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Não foi possível copiar. Anote o código.');
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f4ef] text-black">
      <PublicBackLink href="/login/trainer" />
      <AuthScene
        eyebrow="Recuperação simples"
        title="VOLTE AO JOGO EM POUCOS SEGUNDOS."
        description="Confirme três dados pessoais e a G KONG substitui o código esquecido por um novo."
      >
        {newCode ? (
          <div className="text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#c9ff32]"><ShieldCheck className="size-8" /></div>
            <p className="mt-7 text-[0.65rem] font-black uppercase tracking-[0.25em] text-[#648d00]">Acesso recuperado</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Novo código gerado</h1>
            <p className="mt-3 text-sm leading-6 text-black/50">O código antigo foi invalidado.</p>
            <div className="mt-8 rounded-3xl bg-black p-7 text-white shadow-2xl">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-white/40">Seu novo código</p>
              <div className="mt-3 flex items-center justify-center gap-4">
                <code className="font-mono text-4xl font-black tracking-[0.18em] text-[#c9ff32]">{newCode}</code>
                <Button type="button" size="icon" variant="outline" onClick={() => void copyCode()} aria-label="Copiar código" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                  {copied ? <Check className="size-4 text-[#c9ff32]" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
            <Button className="mt-7 h-14 w-full rounded-full bg-black text-white" onClick={() => { router.replace('/dashboard'); router.refresh(); }}>
              Ir para o painel <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        ) : (
          <div>
            <div className="mb-8 flex size-14 items-center justify-center rounded-2xl bg-black text-[#c9ff32]"><KeyRound className="size-6" /></div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[#648d00]">Recuperar código</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Confirme sua identidade</h1>
            <p className="mt-3 text-sm leading-6 text-black/50">Informe os mesmos dados usados no cadastro.</p>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-[0.12em]">Seu nome</Label>
                <Input id="name" required autoComplete="name" placeholder="Nome completo" className="h-12 rounded-xl border-black/12 bg-white px-4" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div className="grid gap-5 sm:grid-cols-[1fr_110px]">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.12em]">Senha de recuperação</Label>
                  <div className="relative">
                    <Input id="password" required minLength={6} type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="h-12 rounded-xl border-black/12 bg-white px-4 pr-11" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-xs font-bold uppercase tracking-[0.12em]">Idade</Label>
                  <Input id="age" required type="number" min={18} max={100} inputMode="numeric" className="h-12 rounded-xl border-black/12 bg-white px-4" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} />
                </div>
              </div>
              <Button type="submit" className="h-14 w-full rounded-full bg-black text-white hover:bg-black/85" disabled={loading}>
                {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
                Gerar novo código
              </Button>
            </form>
          </div>
        )}
      </AuthScene>
    </div>
  );
}
