'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCheck, Loader2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StudentMessage {
  id: string;
  sender_type: 'trainer' | 'student';
  content: string;
  read_at: string | null;
  created_at: string;
}

export default function StudentMessagesPage() {
  const [trainer, setTrainer] = useState<{ id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<StudentMessage[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  // A rota devolve só a página mais recente. O que o aluno pediu para ver
  // antes fica à parte, para a recarga de 3 em 3 segundos não desfazer.
  const [olderMessages, setOlderMessages] = useState<StudentMessage[]>([]);
  const [hasMoreBefore, setHasMoreBefore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const olderMessagesRef = useRef<StudentMessage[]>([]);
  const oldestVisibleRef = useRef<StudentMessage | null>(null);

  const loadMessages = useCallback(async (silent = false) => {
    try {
      const response = await fetch('/api/messages', { cache: 'no-store' });
      const data = await response.json() as { contacts?: Array<{ id: string; name: string }>; messages?: StudentMessage[]; hasMoreBefore?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar as mensagens.');
      setTrainer(data.contacts?.[0] ?? null);
      const page = data.messages ?? [];
      setMessages(page);
      oldestVisibleRef.current = page[0] ?? null;
      if (olderMessagesRef.current.length === 0) setHasMoreBefore(Boolean(data.hasMoreBefore));
      void fetch('/api/messages', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    } catch (error) {
      if (!silent) toast.error(error instanceof Error ? error.message : 'Não foi possível carregar as mensagens.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadOlderMessages = useCallback(async () => {
    const oldest = olderMessagesRef.current[0] ?? oldestVisibleRef.current;
    if (!oldest) return;
    setLoadingOlder(true);
    try {
      const url = new URL('/api/messages', window.location.origin);
      url.searchParams.set('before', oldest.created_at);
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json() as { messages?: StudentMessage[]; hasMoreBefore?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar as mensagens anteriores.');
      const known = new Set(olderMessagesRef.current.map((message) => message.id));
      const fetched = (data.messages ?? []).filter((message) => !known.has(message.id));
      const next = [...fetched, ...olderMessagesRef.current];
      olderMessagesRef.current = next;
      setOlderMessages(next);
      setHasMoreBefore(Boolean(data.hasMoreBefore));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar as mensagens anteriores.');
    } finally {
      setLoadingOlder(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadMessages(), 0);
    const interval = window.setInterval(() => void loadMessages(true), 3_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadMessages]);

  async function sendMessage() {
    if (!content.trim()) return;
    setSending(true);
    try {
      const response = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível enviar.');
      setContent('');
      await loadMessages(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar.');
    } finally {
      setSending(false);
    }
  }

  const visibleMessages = olderMessages.length > 0 ? [...olderMessages, ...messages] : messages;

  return (
    <div className="space-y-4 animate-fade-in">
      <div><p className="dk-kicker text-muted-foreground">Canal direto</p><h1 className="dk-display mt-3 flex items-center gap-3 text-4xl"><MessageSquare className="size-7 text-brand-accent-strong" /> MENSAGENS</h1><p className="mt-2 text-sm text-muted-foreground">Converse diretamente com seu personal.</p></div>
      <Card className="flex h-[calc(100vh-12rem)] min-h-[520px] flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b p-4"><Avatar><AvatarFallback>{trainer?.name?.split(' ').map((name) => name[0]).join('').slice(0, 2) || 'PT'}</AvatarFallback></Avatar><div><p className="font-semibold">{trainer?.name || 'Seu personal'}</p><p className="text-xs text-ok">Atualização automática</p></div></header>
        <ScrollArea className="flex-1 bg-muted/20 p-4"><div className="space-y-3 pr-4">{hasMoreBefore && !loading && <div className="flex justify-center pb-1"><Button type="button" variant="outline" size="sm" onClick={() => void loadOlderMessages()} disabled={loadingOlder}>{loadingOlder && <Loader2 className="mr-2 size-3.5 animate-spin" />} Ver mensagens anteriores</Button></div>}{loading ? <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div> : visibleMessages.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">Envie a primeira mensagem para seu personal.</div> : visibleMessages.map((message) => {
          const mine = message.sender_type === 'student';
          return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[84%] rounded-2xl px-4 py-2.5 ${mine ? 'bg-black text-white dark:bg-brand-accent dark:text-black' : 'border bg-background'}`}><p className="whitespace-pre-wrap text-sm">{message.content}</p><span className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? 'opacity-60' : 'text-muted-foreground'}`}>{new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{mine && message.read_at && <CheckCheck className="size-3" />}</span></div></div>;
        })}</div></ScrollArea>
        <form className="flex gap-2 border-t p-3" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}><Input value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} placeholder="Escreva uma mensagem..." /><Button type="submit" size="icon" className="bg-brand-accent text-black hover:bg-brand-accent-hover" disabled={sending || !content.trim()}>{sending ? <Loader2 className="animate-spin" /> : <Send />}</Button></form>
      </Card>
    </div>
  );
}
