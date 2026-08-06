'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  Copy,
  FileText,
  Loader2,
  Shield,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MAX_STUDENTS_PER_TRAINER } from '@/constants';
import { studentCreateSchema, type StudentCreateInput } from '@/lib/validators';
import { toast } from 'sonner';

interface CreatedStudent {
  name: string;
  accessCode: string;
}

export default function NewStudentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [createdStudent, setCreatedStudent] = useState<CreatedStudent | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentCreateInput>({
    resolver: zodResolver(studentCreateSchema),
    defaultValues: {
      full_name: '',
      nickname: '',
      notes: '',
      experience_level: 'beginner',
      gender: 'other',
    },
  });

  useEffect(() => {
    const loadStudentCount = async () => {
      try {
        const response = await fetch('/api/students');
        const result = await response.json();
        if (response.ok) setStudentCount(result.student_count ?? 0);
      } catch {
        setStudentCount(null);
      }
    };

    void loadStudentCount();
  }, []);

  const onSubmit = async (data: StudentCreateInput) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Erro ao cadastrar aluno');
        return;
      }

      setStudentCount(result.student_count);
      setCreatedStudent({
        name: result.student.name,
        accessCode: result.student.access_code,
      });
      toast.success('Aluno cadastrado com sucesso!');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    if (!createdStudent) return;

    try {
      await navigator.clipboard.writeText(createdStudent.accessCode);
      setCopied(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar. Anote o código.');
    }
  };

  const startAnotherRegistration = () => {
    reset();
    setCreatedStudent(null);
    setCopied(false);
  };

  const limitReached = (studentCount ?? 0) >= MAX_STUDENTS_PER_TRAINER;

  if (createdStudent) {
    return (
      <div className="mx-auto max-w-xl space-y-6 animate-fade-in pb-10">
        <Card className="border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <CardTitle>Aluno cadastrado!</CardTitle>
            <CardDescription>
              Passe o nome e o código abaixo para {createdStudent.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Código de acesso do aluno
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-5xl font-bold tracking-[0.25em]">
                  {createdStudent.accessCode}
                </span>
                <Button type="button" variant="outline" size="icon" onClick={copyCode} aria-label="Copiar código">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              O aluno entrará na área de aluno usando o nome <strong>{createdStudent.name}</strong> e o código <strong>{createdStudent.accessCode}</strong>. Não precisa de e-mail nem senha.
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {studentCount ?? 0} de {MAX_STUDENTS_PER_TRAINER} alunos cadastrados
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={() => router.push('/students')}>
                Voltar para alunos
              </Button>
              <Button onClick={startAnotherRegistration} disabled={limitReached}>
                Cadastrar outro aluno
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/students')} className="shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Novo Aluno</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            {studentCount === null
              ? 'Cadastre um aluno e gere seu código de acesso.'
              : `${studentCount} de ${MAX_STUDENTS_PER_TRAINER} alunos cadastrados.`}
          </p>
        </div>
      </div>

      {limitReached ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6 text-center">
            <Shield className="mx-auto mb-3 h-8 w-8 text-amber-500" />
            <h2 className="font-semibold">Limite de alunos atingido</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada personal pode cadastrar no máximo {MAX_STUDENTS_PER_TRAINER} alunos.
            </p>
            <Button className="mt-4" variant="outline" onClick={() => router.push('/students')}>
              Voltar para alunos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-primary" />
                    Informações do aluno
                  </CardTitle>
                  <CardDescription>O nome será usado junto com o código para entrar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nome completo *</Label>
                      <Input id="full_name" placeholder="Ex: João Silva" {...register('full_name')} />
                      {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nickname">Como prefere ser chamado</Label>
                      <Input id="nickname" placeholder="Ex: João" {...register('nickname')} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Anotações internas
                  </CardTitle>
                  <CardDescription>O aluno não verá estas anotações.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Informações úteis sobre este aluno..."
                    className="min-h-[100px] resize-none"
                    {...register('notes')}
                  />
                </CardContent>
              </Card>
            </div>

            <Card className="h-fit border-primary/20 shadow-md shadow-primary/5">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Acesso do aluno
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6 text-sm text-muted-foreground">
                <p>Ao cadastrar, o sistema criará automaticamente um código aleatório com exatamente 4 números.</p>
                <p>O código é exclusivo, fica reservado e nunca será entregue a outro aluno.</p>
                <p>Depois, basta passar ao aluno o nome cadastrado e o código.</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => router.push('/students')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[170px]">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar e gerar código
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
