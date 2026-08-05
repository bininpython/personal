'use client';

import { useState } from 'react';
import { BookOpen, Search, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ExercisesPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Biblioteca de Exercícios</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu catálogo de exercícios</p>
        </div>
        <Button className="h-10">
          <Plus className="w-4 h-4 mr-2" />
          Novo Exercício
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar exercício..." 
          className="pl-9 h-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-border/50 bg-card/50">
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Nenhum exercício encontrado</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Você ainda não cadastrou nenhum exercício na sua biblioteca ou não há resultados para sua busca.
          </p>
          <Button variant="outline">Adicionar meu primeiro exercício</Button>
        </div>
      </Card>
    </div>
  );
}
