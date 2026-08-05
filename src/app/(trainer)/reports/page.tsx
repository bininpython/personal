'use client';

import { BarChart3, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios e Análises</h1>
          <p className="text-muted-foreground mt-1">Relatórios consolidados em desenvolvimento</p>
        </div>
        <Button className="h-10" variant="outline" disabled>
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50 p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
          <BarChart3 className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
          <h3 className="font-medium text-lg">Evolução de Alunos</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
            O relatório consolidado de evolução será disponibilizado em uma próxima atualização.
          </p>
        </Card>
        
        <Card className="border-border/50 p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
          <BarChart3 className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
          <h3 className="font-medium text-lg">Taxa de Retenção</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
            O cálculo automático de retenção ainda não faz parte da versão atual.
          </p>
        </Card>
      </div>
    </div>
  );
}
