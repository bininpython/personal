'use client';

import { useState } from 'react';
import { Search, Send, MessageSquare, MoreVertical, Phone, Video } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MessagesPage() {
  const [activeChat, setActiveChat] = useState<number | null>(null);

  // TODO: Fetch from actual DB
  const chats: any[] = [];

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-fade-in">
      {/* Sidebar de Chats */}
      <Card className="w-full md:w-80 flex-shrink-0 flex flex-col border-border/50">
        <div className="p-4 border-b border-border/50 space-y-4">
          <h2 className="font-bold text-xl">Mensagens</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar aluno..." className="pl-8 bg-muted/50" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">Nenhum aluno com mensagens no momento.</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {chats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                    ${activeChat === chat.id ? 'bg-accent' : 'hover:bg-accent/50'}`}
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {chat.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium text-sm truncate">{chat.name}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{chat.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                  </div>
                  {chat.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium shrink-0">
                      {chat.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Área do Chat (Desktop) */}
      <Card className="hidden md:flex flex-1 flex-col border-border/50 overflow-hidden relative">
        {activeChat ? (
          <>
            <div className="h-16 border-b border-border/50 flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">JP</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-sm">João Pedro</h3>
                  <p className="text-xs text-emerald-500">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon"><Phone className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon"><Video className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                <div className="text-center text-xs text-muted-foreground my-4">Hoje</div>
                
                <div className="flex justify-start">
                  <div className="bg-muted max-w-[70%] rounded-2xl rounded-tl-none px-4 py-2">
                    <p className="text-sm">Oi professor! O treino B está bem pesado na parte de pernas, posso diminuir o peso?</p>
                    <span className="text-[10px] text-muted-foreground mt-1 block">10:40</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground max-w-[70%] rounded-2xl rounded-tr-none px-4 py-2">
                    <p className="text-sm">Pode sim! Diminui uns 10% da carga e foca na cadência do movimento. Me avisa se a dor continuar.</p>
                    <span className="text-[10px] text-primary-foreground/70 mt-1 block text-right">10:41</span>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="bg-muted max-w-[70%] rounded-2xl rounded-tl-none px-4 py-2">
                    <p className="text-sm">Valeu, mestre! Treino top.</p>
                    <span className="text-[10px] text-muted-foreground mt-1 block">10:42</span>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Input placeholder="Digite sua mensagem..." className="flex-1 rounded-full" />
                <Button size="icon" className="rounded-full shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 opacity-50" />
            </div>
            <h3 className="font-medium text-lg">Suas Mensagens</h3>
            <p className="text-sm">Selecione uma conversa para começar a falar.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
