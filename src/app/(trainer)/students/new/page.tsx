'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User, Dumbbell, Shield, ChevronLeft, Loader2, Target, Calendar, Activity,
  Info, RefreshCw, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { studentCreateSchema, type StudentCreateInput } from '@/lib/validators';
import { toast } from 'sonner';

export default function NewStudentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentCreateInput>({
    resolver: zodResolver(studentCreateSchema),
    defaultValues: {
      experience_level: 'beginner',
      gender: 'other',
    },
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCode(code);
    setValue('access_code', code, { shouldValidate: true });
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Código copiado!');
    }
  };

  const onSubmit = async (data: StudentCreateInput) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Erro ao cadastrar aluno');
        return;
      }

      toast.success('Aluno cadastrado com sucesso!');
      router.push('/students');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/students')} className="shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Aluno</h1>
          <p className="text-muted-foreground mt-1">Cadastre um novo aluno no sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>Dados pessoais e de contato do aluno.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      placeholder="Ex: João Silva"
                      {...register('full_name')}
                    />
                    {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Como prefere ser chamado</Label>
                    <Input
                      id="nickname"
                      placeholder="Ex: João"
                      {...register('nickname')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      {...register('birth_date')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gênero</Label>
                    <Select onValueChange={(val) => setValue('gender', val as any)} defaultValue="other">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                        <SelectItem value="other">Outro / Prefiro não informar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Dados Físicos & Objetivos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_weight">Peso Atual (kg)</Label>
                    <Input
                      id="current_weight"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 75.5"
                      {...register('current_weight', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="Ex: 175"
                      {...register('height', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Objetivo Principal</Label>
                    <Select onValueChange={(val) => setValue('goal', val as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                        <SelectItem value="Emagrecimento">Emagrecimento</SelectItem>
                        <SelectItem value="Força">Força</SelectItem>
                        <SelectItem value="Condicionamento">Condicionamento Físico</SelectItem>
                        <SelectItem value="Saúde e Qualidade de Vida">Saúde e Qualidade de Vida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nível de Experiência</Label>
                    <Select onValueChange={(val) => setValue('experience_level', val as any)} defaultValue="beginner">
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

                <div className="space-y-2 mt-4">
                  <Label htmlFor="restrictions">Restrições ou Lesões</Label>
                  <Textarea
                    id="restrictions"
                    placeholder="Descreva se o aluno possui alguma lesão, dor crônica ou restrição médica..."
                    rows={3}
                    {...register('restrictions')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="border-primary/30 bg-primary/5 shadow-md shadow-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Acesso do Aluno
                </CardTitle>
                <CardDescription>
                  Gere o código que o aluno usará para acessar o app.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Código de Acesso *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={watch('access_code') || ''}
                        readOnly
                        placeholder="Clique em Gerar"
                        className="font-mono text-center tracking-widest text-lg bg-background"
                      />
                      {errors.access_code && <p className="text-xs text-destructive absolute -bottom-5">{errors.access_code.message}</p>}
                    </div>
                    <Button type="button" variant="outline" size="icon" onClick={handleCopyCode} disabled={!watch('access_code')}>
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="button" variant="secondary" className="w-full" onClick={generateCode}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar Novo Código
                </Button>

                <div className="bg-background rounded-lg p-3 text-sm text-muted-foreground border border-border/50 flex items-start gap-2 mt-4">
                  <Info className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                  <p>O aluno não precisa de e-mail ou senha. Ele acessará usando apenas o <strong>Nome</strong> e este <strong>Código</strong>.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Informações Internas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    {...register('start_date')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Anotações do Personal (Ocultas)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Anotações internas que o aluno não verá..."
                    rows={4}
                    {...register('notes')}
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full h-12 text-base shadow-lg"
              disabled={isLoading || !watch('access_code')}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Dumbbell className="w-5 h-5 mr-2" />
                  Cadastrar Aluno
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
