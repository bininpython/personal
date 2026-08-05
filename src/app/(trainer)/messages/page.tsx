'use client';

import { useState } from 'react';
import { MessageSquare, Search, Edit } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MessagesPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mensagens</h1>
          <p className="text-muted-foreground mt-1">Comunique-se com seus alunos</p>
        </div>
        <Button className="h-10">
          <Edit className="w-4 h-4 mr-2" />
          Nova Mensagem
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar conversa..." 
          className="pl-9 h-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-border/50 bg-card/50">
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Caixa de entrada vazia</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Você ainda não tem conversas com seus alunos. As mensagens que você enviar e receber aparecerão aqui.
          </p>
          <Button variant="outline">Enviar nova mensagem</Button>
        </div>
      </Card>
    </div>
  );
}
