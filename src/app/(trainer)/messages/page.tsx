'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCheck, Loader2, MessageSquare, Search, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/ui/page-header';

interface Contact {
  id: string;
  name: string;
  status: string;
  lastMessage: string;
  lastMessageAt: string | null;
  unread: number;
}

interface ChatMessage {
  id: string;
  sender_type: 'trainer' | 'student';
  content: string;
  read_at: string | null;
  created_at: string;
}

export default function MessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContactId, setActiveContactId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const activeContactRef = useRef('');

  const loadMessages = useCallback(async (silent = false, requestedId?: string) => {
    const contactId = requestedId ?? activeContactRef.current;
    try {
      const messagesUrl = new URL('/api/messages', window.location.origin);
      if (contactId) messagesUrl.searchParams.set('contactId', contactId);
      const response = await fetch(messagesUrl, { cache: 'no-store' });
      const data = await response.json() as {
        contacts?: Contact[];
        activeContactId?: string | null;
        messages?: ChatMessage[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar as mensagens.');
      setContacts(data.contacts ?? []);
      const nextContact = data.activeContactId || '';
      setActiveContactId(nextContact);
      activeContactRef.current = nextContact;
      setMessages(data.messages ?? []);
      if (nextContact) {
        void fetch('/api/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId: nextContact }),
        });
      }
    } catch (error) {
      if (!silent) toast.error(error instanceof Error ? error.message : 'Não foi possível carregar as mensagens.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const requestedContact = new URLSearchParams(window.location.search).get('contactId') || undefined;
    const initialLoad = window.setTimeout(() => void loadMessages(false, requestedContact), 0);
    const interval = window.setInterval(() => void loadMessages(true), 3_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadMessages]);

  async function sendMessage() {
    if (!activeContactId || !content.trim()) return;
    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: activeContactId, content }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível enviar.');
      setContent('');
      await loadMessages(true, activeContactId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar.');
    } finally {
      setSending(false);
    }
  }

  const activeContact = contacts.find((contact) => contact.id === activeContactId);
  const filteredContacts = contacts.filter((contact) => contact.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));

  return (
    <div className="space-y-4 pb-10 animate-fade-in">
      <PageHeader
        kicker="Operação"
        title="Mensagens"
        description="Converse com seus alunos. A conversa se atualiza sozinha."
      />
      <Card className="grid min-h-[650px] overflow-hidden md:grid-cols-[300px_1fr]">
        <aside className="border-b md:border-b-0 md:border-r">
          <div className="border-b p-4"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar aluno..." className="pl-9" /></div></div>
          <ScrollArea className="h-[220px] md:h-[590px]">
            {loading ? <div className="flex justify-center p-8 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div> : filteredContacts.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Nenhum aluno cadastrado.</div> : filteredContacts.map((contact) => (
              <button key={contact.id} type="button" onClick={() => { activeContactRef.current = contact.id; setActiveContactId(contact.id); void loadMessages(false, contact.id); }} className={`flex w-full gap-3 border-b p-4 text-left transition-colors hover:bg-muted/60 ${activeContactId === contact.id ? 'bg-muted' : ''}`}>
                <Avatar><AvatarFallback>{contact.name.split(' ').map((name) => name[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold">{contact.name}</p>{contact.unread > 0 && <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5">{contact.unread}</Badge>}</div><p className="truncate text-xs text-muted-foreground">{contact.lastMessage}</p></div>
              </button>
            ))}
          </ScrollArea>
        </aside>

        <section className="flex min-h-[430px] flex-col">
          {activeContact ? (
            <>
              <header className="flex items-center gap-3 border-b p-4"><Avatar><AvatarFallback>{activeContact.name.split(' ').map((name) => name[0]).join('').slice(0, 2)}</AvatarFallback></Avatar><div><p className="font-semibold">{activeContact.name}</p><p className="text-xs text-ok">Conversa protegida</p></div></header>
              <ScrollArea className="flex-1 bg-muted/20 p-4"><div className="space-y-3 pr-4">{messages.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground"><MessageSquare className="mx-auto mb-3 size-9 opacity-30" />Envie a primeira mensagem.</div> : messages.map((message) => {
                const mine = message.sender_type === 'trainer';
                return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] rounded-2xl px-4 py-2.5 ${mine ? 'bg-black text-white dark:bg-[#c9ff32] dark:text-black' : 'border bg-background'}`}><p className="whitespace-pre-wrap text-sm">{message.content}</p><span className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? 'opacity-70' : 'text-muted-foreground'}`}>{new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{mine && message.read_at && <CheckCheck className="size-3" />}</span></div></div>;
              })}</div></ScrollArea>
              <form className="flex gap-2 border-t p-4" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}><Input value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} placeholder="Digite sua mensagem..." /><Button type="submit" size="icon" disabled={sending || !content.trim()}>{sending ? <Loader2 className="animate-spin" /> : <Send />}</Button></form>
            </>
          ) : <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground"><MessageSquare className="mb-3 size-12 opacity-25" /><p>Cadastre um aluno para iniciar uma conversa.</p></div>}
        </section>
      </Card>
    </div>
  );
}
