'use client';

import { Bell, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AlertsPage() {
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alertas do Sistema</h1>
          <p className="text-muted-foreground mt-1">Central de notificações em desenvolvimento</p>
        </div>
        <Button variant="outline" className="h-10" disabled>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Nenhum alerta pendente
        </Button>
      </div>

      <Card className="border-border/50 bg-card/50">
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Alertas automáticos ainda não estão ativos</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Esta tela está preparada para uma futura atualização. Nenhum aviso automático é gerado na versão atual.
          </p>
        </div>
      </Card>
    </div>
  );
}
