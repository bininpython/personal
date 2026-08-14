'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Loader2, PlaySquare, ShieldCheck, UserCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function DemoTrigger() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleDemo(role: 'trainer' | 'individual' | 'student') {
    setLoading(role);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Falha ao iniciar teste');
      router.push(role === 'trainer' ? '/workouts' : role === 'student' ? '/workout' : '/my');
      router.refresh();
    } catch (error) {
      toast.error('Não foi possível iniciar o ambiente de teste.');
      setLoading(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <button className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-7 text-sm font-bold transition-colors hover:bg-[#c9ff32]">
          <PlaySquare className="size-4" />
          Amostra Grátis
        </button>
      } />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Como você quer testar?</DialogTitle>
          <DialogDescription>
            Escolha um perfil para entrar no ambiente de demonstração.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-1 p-4"
            onClick={() => void handleDemo('trainer')}
            disabled={loading !== null}
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex items-center gap-2 font-bold"><ShieldCheck className="size-4" /> Personal Trainer</span>
              {loading === 'trainer' && <Loader2 className="size-4 animate-spin" />}
            </div>
            <p className="text-xs font-normal text-muted-foreground text-left">
              Teste o envio de fichas, gestão de alunos e acesso à biblioteca.
            </p>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-1 p-4"
            onClick={() => void handleDemo('individual')}
            disabled={loading !== null}
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex items-center gap-2 font-bold"><Dumbbell className="size-4" /> Atleta Independente</span>
              {loading === 'individual' && <Loader2 className="size-4 animate-spin" />}
            </div>
            <p className="text-xs font-normal text-muted-foreground text-left">
              Crie seu próprio treino e copie fichas da biblioteca para você.
            </p>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-1 p-4"
            onClick={() => void handleDemo('student')}
            disabled={loading !== null}
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex items-center gap-2 font-bold"><UserCheck className="size-4" /> Aluno (Guiado)</span>
              {loading === 'student' && <Loader2 className="size-4 animate-spin" />}
            </div>
            <p className="text-xs font-normal text-muted-foreground text-left">
              Veja como o aluno recebe e executa os treinos que o personal envia.
            </p>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
