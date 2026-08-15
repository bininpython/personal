'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Dumbbell, Loader2, PlaySquare, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';

export function DemoTrigger() {
  const router = useRouter();
  const { refreshUser } = useAuth();
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
      
      await refreshUser();
      
      router.push(role === 'trainer' ? '/workouts' : role === 'student' ? '/workout' : '/my');
      router.refresh();
    } catch {
      toast.error('Não foi possível iniciar o ambiente de teste.');
      setLoading(null);
    }
  }

  const options = [
    {
      role: 'trainer' as const,
      title: 'Personal Trainer',
      badge: 'Gestão & Fichas',
      desc: 'Prescreva treinos, gerencie alunos, veja aderência e explore o acervo completo.',
      icon: ShieldCheck,
      color: 'bg-[#c9ff32] text-black',
    },
    {
      role: 'individual' as const,
      title: 'Atleta Independente',
      badge: 'Treino Autônomo',
      desc: 'Crie suas fichas, use o cronômetro com checklist e registre suas cargas e evolução.',
      icon: Dumbbell,
      color: 'bg-black text-white dark:bg-white dark:text-black',
    },
    {
      role: 'student' as const,
      title: 'Aluno (Consultoria)',
      badge: 'Execução Guiada',
      desc: 'Veja como o aluno recebe o treino do personal, marca séries e acompanha o descanso.',
      icon: UserCheck,
      color: 'bg-[#c9ff32] text-black',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <button
          type="button"
          className="inline-flex h-14 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full border border-black/15 bg-white px-7 text-sm font-bold text-black transition-all hover:bg-[#c9ff32] hover:border-black/20 hover:shadow-lg active:scale-95"
        >
          <PlaySquare className="size-4 text-[#5c8000]" />
          <span>Amostra Grátis</span>
        </button>
      } />
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg p-5 sm:p-7 rounded-3xl">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#c9ff32]/20 text-[#5c8000] dark:text-[#c9ff32] border-0 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="mr-1 size-3" /> Amostra Grátis
            </Badge>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black mt-2 leading-tight">
            Como você deseja testar o G KONG?
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
            Escolha um perfil para entrar no ambiente demonstrativo sem precisar de cadastro.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 pt-3 pb-1">
          {options.map((opt) => (
            <button
              type="button"
              key={opt.role}
              disabled={loading !== null}
              onClick={() => void handleDemo(opt.role)}
              className="group relative flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-3.5 sm:p-4 text-left transition-all duration-200 hover:border-[#c9ff32] hover:bg-muted/40 hover:shadow-md active:scale-[0.99] disabled:opacity-60"
            >
              <div className={`flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl ${opt.color} shadow-sm transition-transform group-hover:scale-105`}>
                {loading === opt.role ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <opt.icon className="size-5 sm:size-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-sm sm:text-base text-foreground leading-tight">
                    {opt.title}
                  </span>
                  <Badge variant="outline" className="text-[10px] shrink-0 font-bold opacity-75">
                    {opt.badge}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {opt.desc}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
