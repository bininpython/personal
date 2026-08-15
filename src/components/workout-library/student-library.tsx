'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookOpenCheck, Download, Loader2, Lock, PlayCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { isDemoUser } from '@/lib/auth/demo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

import { downloadPdfFile } from '@/lib/pdf/download-client';

interface Assignment {
  id: string;
  templateId: string;
  name: string;
  goal: string;
  daysPerWeek: number;
  startDate: string;
  endDate: string | null;
  workoutDayCount: number;
  exerciseCount: number;
}

export function StudentLibrary() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch('/api/workout-library', { cache: 'no-store' });
        const data = await response.json() as { assignments?: Assignment[]; error?: string };
        if (!response.ok) throw new Error(data.error || 'Não foi possível carregar sua Biblioteca.');
        if (active) setAssignments(data.assignments ?? []);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar sua Biblioteca.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-7 pb-10 animate-fade-in">
      <PageHeader kicker="Seu acervo" title="Biblioteca" description="Aqui aparecem somente as fichas profissionais que o seu personal enviou para você." />
      <div className="flex items-start gap-4 rounded-2xl border border-[#9fdb00]/25 bg-[#c9ff32]/8 p-5"><ShieldCheck className="mt-0.5 size-6 shrink-0 text-[#668b00]" /><div><h2 className="font-black">Acesso controlado pelo seu personal</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Você não vê o catálogo geral. Cada programa desta tela foi escolhido e publicado especificamente para o seu treino.</p></div></div>

      {loading ? <div className="flex justify-center py-20 text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Carregando suas fichas...</div> : error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">{error}</div> : assignments.length === 0 ? <div className="rounded-3xl border border-dashed p-12 text-center"><BookOpenCheck className="mx-auto size-12 text-muted-foreground/30" /><h2 className="mt-5 text-xl font-black">Nenhuma ficha da Biblioteca foi enviada</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Quando seu personal escolher um programa pré-pronto para você, ele aparecerá aqui automaticamente.</p></div> : <div className="grid gap-5 md:grid-cols-2">{assignments.map((plan) => <Card key={plan.id} className="overflow-hidden border-[#9fdb00]/35"><div className="h-1.5 bg-[#c9ff32]" /><CardHeader><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#668b00]">Enviada pelo personal</p><CardTitle className="text-xl">{plan.name}</CardTitle><p className="text-sm text-muted-foreground">{plan.goal}</p></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-muted/60 p-3"><p className="font-black">{plan.workoutDayCount}</p><p className="text-[9px] uppercase text-muted-foreground">Fichas</p></div><div className="rounded-xl bg-muted/60 p-3"><p className="font-black">{plan.exerciseCount}</p><p className="text-[9px] uppercase text-muted-foreground">Exercícios</p></div><div className="rounded-xl bg-muted/60 p-3"><p className="font-black">{plan.daysPerWeek}x</p><p className="text-[9px] uppercase text-muted-foreground">Semana</p></div></div><div className="grid grid-cols-2 gap-2"><Button nativeButton={false} render={<Link href="/workout" />}><PlayCircle className="mr-2 size-4" /> Iniciar treino</Button>
      {isDemoUser(user?.id) ? (
        <Button variant="outline" onClick={() => toast.error('Exclusivo para alunos.', { description: 'Solicite o link completo de cadastro ao seu personal para liberar o PDF.' })}>
          <Lock className="mr-2 size-4" /> Baixar PDF
        </Button>
      ) : (
        <Button variant="outline" onClick={() => void downloadPdfFile(`/api/workout-plans/${plan.id}/pdf`, `${plan.name}.pdf`)}><Download className="mr-2 size-4" /> PDF</Button>
      )}
      </div></CardContent></Card>)}</div>}
    </div>
  );
}
