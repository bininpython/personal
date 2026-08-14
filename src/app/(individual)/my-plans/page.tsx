'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Download, Dumbbell, Eye, FileText, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import type { IndividualPlanView } from '@/types/individual';

function date(value: string | null) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem prazo';
}

export default function IndividualPlansPage() {
  const [plans, setPlans] = useState<IndividualPlanView[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [deletePlan, setDeletePlan] = useState<IndividualPlanView | null>(null);
  const [error, setError] = useState('');

  const loadPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/individual/workout-plans', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar suas fichas.');
      setPlans(data.plans ?? []);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar suas fichas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadPlans(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadPlans]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return term ? plans.filter((plan) => `${plan.name} ${plan.goal}`.toLocaleLowerCase('pt-BR').includes(term)) : plans;
  }, [plans, search]);

  async function activate(plan: IndividualPlanView) {
    setWorking(plan.id);
    try {
      const response = await fetch(`/api/individual/workout-plans/${plan.id}/activate`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível ativar a ficha.');
      toast.success(`${plan.name} agora é sua ficha ativa.`);
      await loadPlans();
    } catch (activationError) {
      toast.error(activationError instanceof Error ? activationError.message : 'Não foi possível ativar a ficha.');
    } finally {
      setWorking('');
    }
  }

  async function remove() {
    if (!deletePlan) return;
    setWorking(deletePlan.id);
    try {
      const response = await fetch(`/api/individual/workout-plans/${deletePlan.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível excluir a ficha.');
      toast.success('Ficha excluída.');
      setDeletePlan(null);
      await loadPlans();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir a ficha.');
    } finally {
      setWorking('');
    }
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <PageHeader kicker="Organização pessoal" title="Minhas fichas" description="Consulte, edite, ative e baixe todas as versões do seu treino." actions={<Button nativeButton={false} render={<Link href="/my-exercises" />} className="h-11"><Plus className="mr-2 size-4" /> Nova ficha</Button>} />
      <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou objetivo..." className="h-11 pl-10" /></div>

      {loading ? <div className="flex justify-center py-20 text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Carregando fichas...</div> : error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">{error}</div> : filtered.length === 0 ? <div className="rounded-3xl border border-dashed p-12 text-center"><FileText className="mx-auto size-11 text-muted-foreground/30" /><h2 className="mt-5 text-xl font-black">{plans.length ? 'Nenhuma ficha encontrada' : 'Você ainda não criou uma ficha'}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Use a anatomia interativa e o catálogo G KONG para montar seu primeiro treino.</p><Button nativeButton={false} render={<Link href="/my-exercises" />} className="mt-6"><Dumbbell className="mr-2 size-4" /> Abrir montador</Button></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((plan) => {
        const active = plan.status === 'active' && !plan.isExpired;
        return <Card key={plan.id} className={`overflow-hidden ${active ? 'border-[#9fdb00] shadow-[0_18px_55px_rgba(159,219,0,0.12)]' : ''}`}><div className={`h-1.5 ${active ? 'bg-[#c9ff32]' : 'bg-muted'}`} /><CardHeader className="pb-4"><div className="flex items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><Badge variant="outline" className={plan.isExpired ? 'border-danger/30 bg-danger-wash text-danger' : active ? 'border-[#9fdb00]/40 bg-[#c9ff32]/15 text-[#527300]' : ''}>{plan.isExpired ? 'Prazo encerrado' : active ? 'Ficha ativa' : 'Histórico'}</Badge>{plan.libraryTemplateId && <Badge variant="secondary">Biblioteca G KONG</Badge>}</div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">{plan.workoutDayCount} treinos</span></div><CardTitle className="mt-3 text-xl">{plan.name}</CardTitle><p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{plan.goal}</p></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-3 gap-2"><div className="rounded-xl bg-muted/60 p-3 text-center"><p className="text-lg font-black">{plan.exerciseCount}</p><p className="text-[9px] uppercase text-muted-foreground">Exercícios</p></div><div className="rounded-xl bg-muted/60 p-3 text-center"><p className="text-lg font-black">{plan.daysPerWeek}x</p><p className="text-[9px] uppercase text-muted-foreground">Semana</p></div><div className="rounded-xl bg-muted/60 p-3 text-center"><p className="text-lg font-black">{plan.workoutDayCount}</p><p className="text-[9px] uppercase text-muted-foreground">Rotinas</p></div></div><div className="flex items-center justify-between rounded-xl border border-border/60 p-3 text-xs"><span className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="size-3.5" /> Validade</span><span className="font-bold">{date(plan.endDate)}</span></div><div className="grid grid-cols-2 gap-2"><Button nativeButton={false} variant="outline" render={<Link href={`/my-plans/${plan.id}`} />}><Eye className="mr-2 size-4" /> Abrir</Button><Button nativeButton={false} variant="outline" render={<a href={`/api/individual/workout-plans/${plan.id}/pdf`} download />}><Download className="mr-2 size-4" /> PDF</Button><Button nativeButton={false} variant="outline" render={<Link href={`/my-exercises?planId=${plan.id}`} />}><Pencil className="mr-2 size-4" /> Editar</Button>{active ? <Button variant="outline" disabled><CheckCircle2 className="mr-2 size-4" /> Ativa</Button> : <Button onClick={() => void activate(plan)} disabled={working === plan.id || plan.isExpired}>{working === plan.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />} Ativar</Button>}</div><Button variant="ghost" className="w-full text-destructive hover:bg-destructive/8 hover:text-destructive" onClick={() => setDeletePlan(plan)}><Trash2 className="mr-2 size-4" /> Excluir ficha</Button></CardContent></Card>;
      })}</div>}

      <Dialog open={Boolean(deletePlan)} onOpenChange={(open) => !open && setDeletePlan(null)}><DialogContent><DialogHeader><DialogTitle>Excluir esta ficha?</DialogTitle><DialogDescription>{deletePlan?.name} e todos os exercícios desta versão serão removidos. Esta ação não pode ser desfeita.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeletePlan(null)}>Cancelar</Button><Button variant="destructive" onClick={() => void remove()} disabled={Boolean(deletePlan && working === deletePlan.id)}>{deletePlan && working === deletePlan.id && <Loader2 className="mr-2 size-4 animate-spin" />} Excluir definitivamente</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
