'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check, Dumbbell, User, Calendar, Layers, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, name: 'Informações Básicas' },
  { id: 2, name: 'Dias de Treino' },
  { id: 3, name: 'Exercícios' },
];

export default function NewWorkoutWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [basicInfo, setBasicInfo] = useState({
    studentId: '',
    name: 'Ficha de Hipertrofia',
    goal: 'Hipertrofia',
    level: 'intermediate',
    startDate: new Date().toISOString().split('T')[0],
    daysPerWeek: 4,
  });

  const [workoutDays, setWorkoutDays] = useState([
    { id: '1', name: 'Treino A - Peito e Tríceps', label: 'A' },
    { id: '2', name: 'Treino B - Costas e Bíceps', label: 'B' },
  ]);

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
    else router.push('/workouts');
  };

  const handleSave = () => {
    setIsLoading(true);
    // Simulate save
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Ficha de treino criada com sucesso!');
      router.push('/workouts');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Criar Nova Ficha</h1>
          <p className="text-muted-foreground mt-1">Configure o treino em 3 passos</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 hidden sm:block" />
        <div className="relative flex justify-between gap-4">
          {STEPS.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-2 flex-1 sm:flex-none">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors z-10 bg-background
                  ${currentStep > step.id 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : currentStep === step.id
                      ? 'border-primary text-primary'
                      : 'border-muted text-muted-foreground'
                  }`}
              >
                {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <span className={`text-xs sm:text-sm font-medium text-center ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {currentStep === 1 && (
        <Card className="border-border/50 animate-slide-up">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Para quem é este treino?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Selecione o Aluno</Label>
              <Select value={basicInfo.studentId} onValueChange={(val) => setBasicInfo(prev => ({ ...prev, studentId: val || '' }))}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione um aluno da sua lista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="s1">João Pedro Silva</SelectItem>
                  <SelectItem value="s2">Maria Oliveira</SelectItem>
                  <SelectItem value="s3">Carlos Santos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Ficha</Label>
                <Input 
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Objetivo do Treino</Label>
                <Select value={basicInfo.goal} onValueChange={(val) => setBasicInfo(prev => ({ ...prev, goal: val || '' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                    <SelectItem value="Emagrecimento">Emagrecimento</SelectItem>
                    <SelectItem value="Força">Força</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequência Semanal</Label>
                <Select value={basicInfo.daysPerWeek.toString()} onValueChange={(val) => setBasicInfo(prev => ({ ...prev, daysPerWeek: parseInt(val || '0') }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} dias por semana</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input 
                  type="date" 
                  value={basicInfo.startDate}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button onClick={handleNext} disabled={!basicInfo.studentId} className="w-full sm:w-auto h-11">
                Avançar <ChevronLeft className="w-4 h-4 rotate-180 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Workout Days */}
      {currentStep === 2 && (
        <Card className="border-border/50 animate-slide-up">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Divisão de Treinos
            </CardTitle>
            <CardDescription>
              Crie a estrutura da semana (ex: Treino A, Treino B, Treino C)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workoutDays.map((day, index) => (
              <div key={day.id} className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                  {day.label}
                </div>
                <Input 
                  value={day.name}
                  onChange={(e) => {
                    const newDays = [...workoutDays];
                    newDays[index].name = e.target.value;
                    setWorkoutDays(newDays);
                  }}
                  className="bg-background"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => setWorkoutDays(workoutDays.filter(d => d.id !== day.id))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              className="w-full h-11 border-dashed"
              onClick={() => {
                const nextLabel = String.fromCharCode(65 + workoutDays.length);
                setWorkoutDays([...workoutDays, { id: crypto.randomUUID(), name: `Treino ${nextLabel}`, label: nextLabel }]);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Dia
            </Button>

            <div className="flex justify-between pt-6">
              <Button onClick={handleBack} variant="outline" className="h-11">Voltar</Button>
              <Button onClick={handleNext} disabled={workoutDays.length === 0} className="h-11">
                Avançar <ChevronLeft className="w-4 h-4 rotate-180 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Exercises */}
      {currentStep === 3 && (
        <Card className="border-border/50 animate-slide-up">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Montagem dos Exercícios
            </CardTitle>
            <CardDescription>
              Adicione exercícios para cada dia de treino
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {workoutDays.map((day) => (
              <div key={day.id} className="space-y-3">
                <h3 className="font-semibold text-primary">{day.name}</h3>
                <div className="bg-muted/30 border border-border/50 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                  <Dumbbell className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-4">Nenhum exercício adicionado a este treino.</p>
                  <Button variant="secondary" size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Buscar Exercícios
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-between pt-6 border-t border-border/50">
              <Button onClick={handleBack} variant="outline" className="h-11">Voltar</Button>
              <Button onClick={handleSave} className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Ficha Completa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
