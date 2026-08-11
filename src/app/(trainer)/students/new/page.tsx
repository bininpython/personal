'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  ChevronLeft,
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
import { PageHeader } from '@/components/app/page-header';
import { StudentAccessCard } from '@/components/students/student-access-card';

interface CreatedStudent {
  name: string;
  accessCode: string;
}

export default function NewStudentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [createdStudent, setCreatedStudent] = useState<CreatedStudent | null>(null);

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
      privacy_consent: false,
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

  const startAnotherRegistration = () => {
    reset();
    setCreatedStudent(null);
  };

  const limitReached = (studentCount ?? 0) >= MAX_STUDENTS_PER_TRAINER;

  if (createdStudent) {
    return (
      <div className="space-y-6 animate-fade-in pb-10">
        <PageHeader
          eyebrow="Ativação concluída"
          title="ALUNO PRONTO"
          description={`${createdStudent.name} já pode acessar o D KONG. O último passo é entregar o convite abaixo.`}
          icon={CheckCircle2}
        />
        <StudentAccessCard studentName={createdStudent.name} accessCode={createdStudent.accessCode} />
        <Card><CardContent className="flex flex-col items-center justify-between gap-4 p-5 text-center sm:flex-row sm:text-left"><p className="text-sm text-muted-foreground"><strong className="text-foreground">{studentCount ?? 0} de {MAX_STUDENTS_PER_TRAINER}</strong> alunos cadastrados</p><div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><Button variant="outline" onClick={() => router.push('/students')}>Voltar para alunos</Button><Button onClick={startAnotherRegistration} disabled={limitReached}>Cadastrar outro aluno</Button></div></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        eyebrow="Operação · alunos"
        title="NOVO ALUNO"
        description={studentCount === null ? 'Cadastre o aluno e gere o acesso individual.' : `${studentCount} de ${MAX_STUDENTS_PER_TRAINER} alunos cadastrados. Nome e código serão suficientes para entrar.`}
        icon={User}
        actions={<Button variant="outline" onClick={() => router.push('/students')}><ChevronLeft className="mr-2 size-4" /> Voltar para alunos</Button>}
      />

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
                <p>O sistema criará um código individual de 6 números no formato 000-000, exibido uma única vez.</p>
                <p>No banco ele fica somente em formato irreversível. Se for perdido, gere outro.</p>
                <p>Entregue ao aluno somente o nome cadastrado e o código individual.</p>
              </CardContent>
            </Card>
          </div>

          <label className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4 text-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" {...register('privacy_consent')} />
            <span>Confirmo que expliquei a finalidade do cadastro e que tenho autorização para inserir estes dados. No primeiro acesso, o próprio aluno deverá aceitar os Termos e a Política de Privacidade para continuar. <a href="/privacy" target="_blank" className="text-primary underline">Ler a Política de Privacidade</a>.</span>
          </label>
          {errors.privacy_consent && <p className="text-sm text-destructive">{errors.privacy_consent.message}</p>}

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
