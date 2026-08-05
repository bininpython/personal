'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User, Shield, ChevronLeft, Loader2, Copy, Check, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    const chars = '0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
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
    if (!data.access_code) {
      toast.error('Gere um código de acesso para o aluno.');
      return;
    }
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
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Crie o acesso para o seu novo aluno.</p>
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
                <CardDescription>Dados pessoais do aluno.</CardDescription>
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
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Anotações Internas
                </CardTitle>
                <CardDescription>O aluno não verá estas anotações.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Anotações internas que o aluno não verá..."
                  className="resize-none min-h-[100px]"
                  {...register('notes')}
                />
              </CardContent>
            </Card>
          </div>

          {/* Access Code */}
          <div className="space-y-6">
            <Card className="border-border/50 border-primary/20 shadow-md shadow-primary/5">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Acesso do Aluno
                </CardTitle>
                <CardDescription>Gere o código que o aluno usará para acessar o app.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <Label>Código de Acesso *</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      placeholder="Clique em gerar"
                      value={generatedCode}
                      className="font-mono text-center tracking-widest text-lg font-bold bg-muted/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyCode}
                      disabled={!generatedCode}
                      className="shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={generateCode}
                  >
                    Gerar Novo Código
                  </Button>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg text-sm flex gap-3 text-muted-foreground">
                  <div className="shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <p>
                    O aluno não precisa de e-mail ou senha. Ele acessará usando apenas o <strong>Nome</strong> e este <strong>Código</strong>.
                    No primeiro acesso, ele mesmo preencherá seus dados físicos.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-[150px]">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Cadastrar Aluno
          </Button>
        </div>
      </form>
    </div>
  );
}
