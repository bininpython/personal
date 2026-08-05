'use client';

import { useCallback, useEffect, useState } from 'react';
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

  const loadMessages = useCallback(async (silent = false) => {
    try {
      const response = await fetch('/api/messages', { cache: 'no-store' });
      const data = await response.json() as { contacts?: Array<{ id: string; name: string }>; messages?: StudentMessage[]; error?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar as mensagens.');
      setTrainer(data.contacts?.[0] ?? null);
      setMessages(data.messages ?? []);
      void fetch('/api/messages', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    } catch (error) {
      if (!silent) toast.error(error instanceof Error ? error.message : 'Não foi possível carregar as mensagens.');
    } finally {
      if (!silent) setLoading(false);
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

  return (
    <div className="space-y-4 animate-fade-in">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><MessageSquare className="size-6 text-blue-500" /> Mensagens</h1><p className="mt-1 text-sm text-muted-foreground">Converse diretamente com seu personal.</p></div>
      <Card className="flex h-[calc(100vh-12rem)] min-h-[520px] flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b p-4"><Avatar><AvatarFallback>{trainer?.name?.split(' ').map((name) => name[0]).join('').slice(0, 2) || 'PT'}</AvatarFallback></Avatar><div><p className="font-semibold">{trainer?.name || 'Seu personal'}</p><p className="text-xs text-emerald-600">Atualização automática</p></div></header>
        <ScrollArea className="flex-1 bg-muted/20 p-4"><div className="space-y-3 pr-4">{loading ? <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div> : messages.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">Envie a primeira mensagem para seu personal.</div> : messages.map((message) => {
          const mine = message.sender_type === 'student';
          return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[84%] rounded-2xl px-4 py-2.5 ${mine ? 'bg-blue-500 text-white' : 'border bg-background'}`}><p className="whitespace-pre-wrap text-sm">{message.content}</p><span className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-white/70' : 'text-muted-foreground'}`}>{new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{mine && message.read_at && <CheckCheck className="size-3" />}</span></div></div>;
        })}</div></ScrollArea>
        <form className="flex gap-2 border-t p-3" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}><Input value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} placeholder="Escreva uma mensagem..." /><Button type="submit" size="icon" className="bg-blue-500 text-white" disabled={sending || !content.trim()}>{sending ? <Loader2 className="animate-spin" /> : <Send />}</Button></form>
      </Card>
    </div>
  );
}
