'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Scale, Ruler, HeartPulse, Save, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';
import {
  physicalAssessmentSchema,
  type PhysicalAssessmentFormInput,
  type PhysicalAssessmentInput,
} from '@/lib/validators';

export default function NewAssessmentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PhysicalAssessmentFormInput, unknown, PhysicalAssessmentInput>({
    resolver: zodResolver(physicalAssessmentSchema),
    defaultValues: {
      assessment_date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await fetch('/api/students', { cache: 'no-store' });
        const data = await response.json() as { students?: Array<{ id: string; name: string; status: string }> };
        if (response.ok) {
          const activeStudents = (data.students ?? []).filter((student) => student.status === 'active');
          setStudents(activeStudents);
          const requestedStudent = new URLSearchParams(window.location.search).get('studentId');
          if (requestedStudent && activeStudents.some((student) => student.id === requestedStudent)) {
            setSelectedStudentId(requestedStudent);
            setValue('student_id', requestedStudent, { shouldValidate: true });
          }
        }
      } catch (error) {
        console.error('[New Assessment] Student list error:', error);
      } finally {
        setLoadingStudents(false);
      }
    };

    void loadStudents();
  }, [setValue]);

  const onSubmit = async (data: PhysicalAssessmentInput) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar a avaliação.');

      toast.success('Avaliação salva com sucesso!');
      router.push('/assessments');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar a avaliação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/assessments')} className="mt-2 size-11 shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <PageHeader
          kicker="Análise"
          title="Nova avaliação"
          description="Registre as medidas e o progresso do aluno."
          className="flex-1"
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
        <Card>
          <CardContent className="p-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Aluno *</Label>
                <Select value={selectedStudentId} onValueChange={(val) => { const value = val ?? ''; setSelectedStudentId(value); setValue('student_id', value, { shouldValidate: true }); }} disabled={loadingStudents || students.length === 0}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={loadingStudents ? 'Carregando alunos...' : students.length === 0 ? 'Nenhum aluno ativo' : 'Selecione o aluno'} />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.student_id && <p className="text-xs text-destructive">{errors.student_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Data da Avaliação *</Label>
                <Input 
                  type="date"
                  className="bg-background"
                  required
                  {...register('assessment_date')}
                />
                {errors.assessment_date && <p className="text-xs text-destructive">{errors.assessment_date.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-500" />
                Composição Corporal
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input type="number" step="0.1" placeholder="Ex: 75.5" {...register('weight', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Estatura (cm)</Label>
                  <Input type="number" placeholder="Ex: 175" {...register('height', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>% de Gordura</Label>
                  <Input type="number" step="0.1" placeholder="Ex: 15.5" {...register('body_fat_percentage', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Massa Muscular (kg)</Label>
                  <Input type="number" step="0.1" placeholder="Ex: 35.0" {...register('muscle_mass', { valueAsNumber: true })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-500" />
                Sinais Vitais (Opcional)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PA Sistólica</Label>
                  <Input type="number" placeholder="Ex: 120" {...register('blood_pressure_systolic', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>PA Diastólica</Label>
                  <Input type="number" placeholder="Ex: 80" {...register('blood_pressure_diastolic', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Frequência Cardíaca de Repouso (bpm)</Label>
                  <Input type="number" placeholder="Ex: 65" {...register('resting_heart_rate', { valueAsNumber: true })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 md:col-span-2">
            <CardHeader className="pb-3 border-b border-border/30 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ruler className="w-5 h-5 text-volt-ink" />
                Perimetria (cm)
              </CardTitle>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Deixe em branco se não mensurado
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Tórax</Label>
                  <Input type="number" step="0.1" {...register('chest', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Cintura</Label>
                  <Input type="number" step="0.1" {...register('waist', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Abdômen</Label>
                  <Input type="number" step="0.1" {...register('abdomen', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Quadril</Label>
                  <Input type="number" step="0.1" {...register('hips', { valueAsNumber: true })} />
                </div>
                
                {/* Braços */}
                <div className="space-y-2">
                  <Label>Braço Direito</Label>
                  <Input type="number" step="0.1" {...register('right_arm', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Braço Esquerdo</Label>
                  <Input type="number" step="0.1" {...register('left_arm', { valueAsNumber: true })} />
                </div>
                
                {/* Coxas */}
                <div className="space-y-2">
                  <Label>Coxa Direita</Label>
                  <Input type="number" step="0.1" {...register('right_thigh', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Coxa Esquerda</Label>
                  <Input type="number" step="0.1" {...register('left_thigh', { valueAsNumber: true })} />
                </div>
                
                {/* Panturrilhas */}
                <div className="space-y-2">
                  <Label>Panturrilha Dir.</Label>
                  <Input type="number" step="0.1" {...register('right_calf', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Panturrilha Esq.</Label>
                  <Input type="number" step="0.1" {...register('left_calf', { valueAsNumber: true })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <Label>Observações Gerais</Label>
          <Textarea 
            placeholder="Anotações sobre a postura, evolução, dores relatadas, etc." 
            rows={4}
            {...register('notes')}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" onClick={() => router.push('/assessments')} className="h-11 px-8">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="h-11 px-8">
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Avaliação
          </Button>
        </div>
      </form>
    </div>
  );
}
