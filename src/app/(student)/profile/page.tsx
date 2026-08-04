'use client';

import { User, Ruler, Weight, Target, Calendar, Dumbbell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <User className="w-6 h-6 text-blue-500" />
        Meu Perfil
      </h1>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-blue-500/10 text-blue-500 text-xl font-bold">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AL'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user?.name || 'Aluno'}</h2>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Ativo</Badge>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Target, label: 'Objetivo', value: 'Hipertrofia' },
              { icon: Dumbbell, label: 'Nível', value: 'Intermediário' },
              { icon: Ruler, label: 'Altura', value: '175 cm' },
              { icon: Weight, label: 'Peso', value: '78 kg' },
              { icon: Calendar, label: 'Início', value: '07/05/2026' },
              { icon: Calendar, label: 'Frequência', value: '4x/semana' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
