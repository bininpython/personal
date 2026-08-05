'use client';

import { Settings, User, Bell, Shield, Paintbrush } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';

export default function TrainerSettingsPage() {
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas preferências e perfil de personal trainer.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <Button variant="ghost" className="w-full justify-start bg-accent">
            <User className="w-4 h-4 mr-2" />
            Perfil
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground">
            <Paintbrush className="w-4 h-4 mr-2" />
            Aparência
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground">
            <Bell className="w-4 h-4 mr-2" />
            Notificações
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground">
            <Shield className="w-4 h-4 mr-2" />
            Segurança
          </Button>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Perfil Profissional</CardTitle>
              <CardDescription>Suas informações básicas de cadastro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input defaultValue={user?.name || ''} />
              </div>
              <div className="space-y-2">
                <Label>Código de Acesso</Label>
                <Input readOnly defaultValue={user?.trainer_id || ''} className="bg-muted text-muted-foreground" />
              </div>
              <Button>Salvar Alterações</Button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Personalize o tema do sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button variant={resolvedTheme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>Claro</Button>
                <Button variant={resolvedTheme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>Escuro</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
