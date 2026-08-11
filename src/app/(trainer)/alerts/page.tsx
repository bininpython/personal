'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/app/page-header';
import { ContentSkeleton } from '@/components/app/content-skeleton';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

export default function AlertsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      const data = await response.json() as { notifications?: NotificationItem[]; error?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar os alertas.');
      setItems(data.notifications ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os alertas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadAlerts(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadAlerts]);

  async function markRead(id?: string) {
    setUpdating(true);
    try {
      const response = await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(id ? { id } : { all: true }) });
      if (!response.ok) throw new Error('Não foi possível atualizar.');
      setItems((current) => current.map((item) => !id || item.id === id ? { ...item, read: true } : item));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar.');
    } finally {
      setUpdating(false);
    }
  }

  const unread = items.filter((item) => !item.read).length;

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <PageHeader eyebrow="Gestão · atenção necessária" title="ALERTAS" description="Identifique rapidamente quem perdeu constância, está inativo ou precisa de contato." icon={Bell} actions={<Button variant="outline" onClick={() => void markRead()} disabled={updating || unread === 0}>{updating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />} Marcar todos como lidos</Button>} />
      <div className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-2xl font-bold">{unread}</p><p className="text-sm text-muted-foreground">não lidos</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-2xl font-bold">{items.filter((item) => item.type === 'risk_high').length}</p><p className="text-sm text-muted-foreground">risco alto</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-2xl font-bold">{items.length}</p><p className="text-sm text-muted-foreground">histórico</p></CardContent></Card></div>
      {loading ? <ContentSkeleton count={3} /> : items.length === 0 ? <Card className="border-dashed"><CardContent className="flex flex-col items-center py-20 text-center"><Bell className="mb-3 size-12 text-muted-foreground/40" /><h2 className="font-semibold">Nenhum alerta gerado</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Os alertas aparecerão quando os dados indicarem queda de constância ou inatividade.</p></CardContent></Card> : <div className="space-y-3">{items.map((item) => <Card key={item.id} className={!item.read ? 'border-amber-500/30 bg-amber-500/[0.04]' : ''}><CardContent className="flex items-start gap-4 p-4"><div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${item.type === 'risk_high' ? 'bg-red-500/10 text-red-700' : 'bg-amber-500/10 text-amber-700'}`}><AlertTriangle className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.title}</p>{!item.read && <Badge>Novo</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{item.message}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString('pt-BR')}</p></div><div className="flex gap-1">{!item.read && <Button variant="ghost" size="sm" onClick={() => void markRead(item.id)}>Lido</Button>}{item.action_url && <Button variant="ghost" size="icon" onClick={() => { void markRead(item.id); router.push(item.action_url!); }} aria-label={`Abrir ação de ${item.title}`}><ChevronRight /></Button>}</div></CardContent></Card>)}</div>}
    </div>
  );
}
