'use client';

import { MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function MessagesPage() {
  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mensagens</h1>
        <p className="mt-1 text-muted-foreground">Comunicação direta em desenvolvimento</p>
      </div>

      <Card className="border-border/60">
        <CardContent className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="size-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Mensagens ainda não estão ativas</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Nenhuma conversa fictícia é exibida. O envio e o recebimento de mensagens serão adicionados quando houver armazenamento e entrega em tempo real.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
