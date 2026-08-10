'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Activity, Target, Scale, Ruler, AlertCircle, ChevronRight, Loader2, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

interface OnboardingData {
  height: string;
  current_weight: string;
  gender: 'male' | 'female' | 'other';
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  goal: string;
  restrictions: string;
  privacy_consent: boolean;
  terms_accepted: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue } = useForm<OnboardingData>({
    defaultValues: {
      experience_level: 'beginner',
      gender: 'other',
      privacy_consent: false,
      terms_accepted: false,
    }
  });

  const onSubmit = async (data: OnboardingData) => {
    if (!user?.id) return;
    if (!data.privacy_consent) {
      toast.error('Confirme a autorização para salvar dados de saúde.');
      return;
    }
    if (!data.terms_accepted) {
      toast.error('Aceite os Termos de Uso para continuar.');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/students/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(data.height ? { height: parseFloat(data.height) } : {}),
          ...(data.current_weight ? { current_weight: parseFloat(data.current_weight) } : {}),
          gender: data.gender,
          experience_level: data.experience_level,
          goal: data.goal,
          restrictions: data.restrictions,
          privacy_consent: true,
          terms_accepted: true,
        }),
      });

      if (!res.ok) {
        toast.error('Erro ao salvar dados');
        return;
      }

      toast.success('Perfil concluído! Bem-vindo.');
      router.push('/home');
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-primary ml-1" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Bem-vindo(a) à D KONG!</h1>
          <p className="text-muted-foreground">
            Para que seu personal possa montar seu treino, precisamos de alguns dados físicos básicos.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Seu Perfil Físico
              </CardTitle>
              <CardDescription>Estes dados serão enviados diretamente para o seu personal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_weight" className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-muted-foreground" />
                    Peso (kg) · opcional
                  </Label>
                  <Input
                    id="current_weight"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 75.5"
                    {...register('current_weight')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-muted-foreground" />
                    Altura (cm) · opcional
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="Ex: 175"
                    {...register('height')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gênero</Label>
                  <Select onValueChange={(value) => setValue('gender', value as OnboardingData['gender'])} defaultValue="other">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="other">Prefiro não informar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nível de Experiência</Label>
                  <Select onValueChange={(value) => setValue('experience_level', value as OnboardingData['experience_level'])} defaultValue="beginner">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal" className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  Qual seu objetivo principal?
                </Label>
                <Select onValueChange={(value) => setValue('goal', String(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ex: Hipertrofia, Emagrecimento..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hipertrofia">Hipertrofia (Ganho de Massa)</SelectItem>
                    <SelectItem value="Emagrecimento">Emagrecimento (Perda de Gordura)</SelectItem>
                    <SelectItem value="Saúde e Condicionamento">Saúde e Condicionamento</SelectItem>
                    <SelectItem value="Força">Ganho de Força</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restrictions" className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  Lesões ou Restrições (Opcional)
                </Label>
                <Textarea
                  id="restrictions"
                  placeholder="Tem alguma dor no joelho, ombro, restrição médica?"
                  className="resize-none"
                  {...register('restrictions')}
                />
              </div>

              <label className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" {...register('privacy_consent')} />
                <span>Autorizo o uso destes dados para acompanhamento de treino pelo meu personal. Sei que posso exportar ou excluir meus dados no perfil. <a href="/privacy" target="_blank" className="text-primary underline">Política de Privacidade</a>.</span>
              </label>
              <label className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" {...register('terms_accepted')} />
                <span>Li e aceito os <a href="/terms" target="_blank" className="text-primary underline">Termos de Uso</a>.</span>
              </label>

            </CardContent>
            <CardFooter className="bg-muted/30 pt-6">
              <Button type="submit" className="w-full text-lg h-12" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <>Concluir Perfil <ChevronRight className="w-5 h-5 ml-2" /></>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
