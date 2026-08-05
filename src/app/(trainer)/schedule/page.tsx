'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus treinos e avaliações</p>
        </div>
        <Button className="h-10" disabled title="Agendamento ainda não disponível">
          <Plus className="w-4 h-4 mr-2" />
          Agendamento em breve
        </Button>
      </div>

      <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-border/50">
        <Button variant="outline" size="icon" onClick={() => setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))} aria-label="Mês anterior">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-medium">
          {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())}
        </h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))} aria-label="Próximo mês">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <Card className="border-border/50 bg-card/50">
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CalendarIcon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Sua agenda está livre</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Você não tem nenhum compromisso marcado para este mês. Que tal agendar a avaliação de um aluno?
          </p>
          <Button variant="outline" disabled>Agendamento em desenvolvimento</Button>
        </div>
      </Card>
    </div>
  );
}
