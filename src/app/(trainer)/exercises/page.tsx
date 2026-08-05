'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Plus, X, Save, CheckCircle2, Dumbbell, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

// Map of categories to nice names
const MUSCLE_NAMES: Record<string, string> = {
  chest: 'Peito',
  back: 'Costas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  abs: 'Abdômen',
  quadriceps: 'Quadríceps',
  hamstrings: 'Posterior',
  calves: 'Panturrilha',
  glutes: 'Glúteos'
};

export default function ExercisesPage() {
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [planName, setPlanName] = useState('');
  const [dayLabel, setDayLabel] = useState('A');
  const [submitting, setSubmitting] = useState(false);

  // Fetch exercises when muscle is clicked
  const fetchExercises = async (muscle: string) => {
    setActiveMuscle(muscle);
    setLoading(true);
    try {
      const res = await fetch(`/api/exercises?category=${muscle}`);
      const data = await res.json();
      if (data.exercises) setExercises(data.exercises);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students for the dropdown/modal
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/students');
        const data = await res.json();
        if (data.students) setStudents(data.students);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStudents();
  }, []);

  const addToCart = (exercise: any) => {
    if (!cart.find((item) => item.id === exercise.id)) {
      setCart([...cart, { ...exercise, sets: 3, reps: '10', restTime: 60 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const submitPlan = async () => {
    if (!selectedStudentId || !planName || cart.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        studentId: selectedStudentId,
        name: planName,
        dayLabel: dayLabel,
        exercises: cart.map(item => ({
          exerciseId: item.id,
          sets: item.sets,
          reps: item.reps,
          restTime: item.restTime
        }))
      };

      const res = await fetch('/api/workout-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setCart([]);
        setIsModalOpen(false);
        setPlanName('');
        setSelectedStudentId('');
        alert('Ficha enviada para o aluno com sucesso!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Montador de Fichas</h1>
          <p className="text-muted-foreground mt-1">Selecione o músculo no diagrama para adicionar exercícios</p>
        </div>
        {cart.length > 0 && (
          <Button onClick={() => setIsModalOpen(true)} className="h-10 bg-primary hover:bg-primary/90 shadow-md">
            <Save className="w-4 h-4 mr-2" />
            Finalizar Ficha ({cart.length})
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* DIAGRAMA DO CORPO HUMANO (Left Column) */}
        <Card className="lg:col-span-4 border-border/50 bg-card/50 overflow-hidden">
          <CardHeader className="pb-3 text-center border-b border-border/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Anatomia</CardTitle>
              <div className="flex bg-muted rounded-md p-0.5">
                <button 
                  onClick={() => setGender('male')}
                  className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${gender === 'male' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                >
                  Masc
                </button>
                <button 
                  onClick={() => setGender('female')}
                  className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${gender === 'female' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                >
                  Fem
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 relative flex justify-center">
            <div className="relative w-full max-w-[400px] aspect-[4/3] sm:aspect-auto sm:h-[500px]">
              <Image 
                src={gender === 'male' ? '/anatomy-male.png' : '/anatomy-female.png'} 
                alt="Corpo Humano" 
                fill
                className="object-contain"
                priority
              />
              
              {/* === ZONAS DE CLIQUE (FRONTAL - Esquerda da imagem) === */}
              {/* Ombro Frontal Esq/Dir */}
              <div 
                className={`absolute top-[16%] left-[23%] w-[7%] h-[8%] rounded-full cursor-pointer hover:bg-primary/40 transition-colors z-10 ${activeMuscle === 'shoulders' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('shoulders')} title="Ombros"
              />
              <div 
                className={`absolute top-[16%] left-[37%] w-[7%] h-[8%] rounded-full cursor-pointer hover:bg-primary/40 transition-colors z-10 ${activeMuscle === 'shoulders' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('shoulders')} title="Ombros"
              />
              
              {/* Peito */}
              <div 
                className={`absolute top-[19%] left-[29%] w-[12%] h-[9%] rounded-xl cursor-pointer hover:bg-primary/40 transition-colors z-20 ${activeMuscle === 'chest' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('chest')} title="Peito"
              />
              
              {/* Abdômen */}
              <div 
                className={`absolute top-[28%] left-[30%] w-[10%] h-[12%] rounded-lg cursor-pointer hover:bg-primary/40 transition-colors z-20 ${activeMuscle === 'abs' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('abs')} title="Abdômen"
              />
              
              {/* Braço Frontal Esq/Dir (Bíceps) */}
              <div 
                className={`absolute top-[25%] left-[19%] w-[5%] h-[10%] rounded-full cursor-pointer hover:bg-primary/40 transition-colors ${activeMuscle === 'biceps' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('biceps')} title="Bíceps"
              />
              <div 
                className={`absolute top-[25%] left-[43%] w-[5%] h-[10%] rounded-full cursor-pointer hover:bg-primary/40 transition-colors ${activeMuscle === 'biceps' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('biceps')} title="Bíceps"
              />

              {/* Quadríceps Esq/Dir */}
              <div 
                className={`absolute top-[48%] left-[26%] w-[7%] h-[18%] rounded-full cursor-pointer hover:bg-primary/40 transition-colors ${activeMuscle === 'quadriceps' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('quadriceps')} title="Quadríceps"
              />
              <div 
                className={`absolute top-[48%] left-[36%] w-[7%] h-[18%] rounded-full cursor-pointer hover:bg-primary/40 transition-colors ${activeMuscle === 'quadriceps' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('quadriceps')} title="Quadríceps"
              />

              {/* Panturrilha Frontal Esq/Dir */}
              <div 
                className={`absolute top-[72%] left-[27%] w-[5%] h-[15%] rounded-full cursor-pointer hover:bg-primary/40 transition-colors ${activeMuscle === 'calves' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('calves')} title="Panturrilha"
              />
              <div 
                className={`absolute top-[72%] left-[37%] w-[5%] h-[15%] rounded-full cursor-pointer hover:bg-primary/40 transition-colors ${activeMuscle === 'calves' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('calves')} title="Panturrilha"
              />


              {/* === ZONAS DE CLIQUE (TRASEIRA - Direita da imagem) === */}
              {/* Costas */}
              <div 
                className={`absolute top-[18%] left-[72%] w-[16%] h-[18%] rounded-xl cursor-pointer hover:bg-primary/40 transition-colors ${activeMuscle === 'back' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('back')} title="Costas"
              />

              {/* Tríceps Esq/Dir */}
              <div 
                className={`absolute top-[24%] left-[67%] w-[5%] h-[10%] rounded-full cursor-pointer hover:bg-primary/40 transition-colors ${activeMuscle === 'triceps' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('triceps')} title="Tríceps"
              />
              <div 
                className={`absolute top-[24%] left-[89%] w-[5%] h-[10%] rounded-full cursor-pointer hover:bg-primary/40 transition-colors ${activeMuscle === 'triceps' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('triceps')} title="Tríceps"
              />

              {/* Glúteos */}
              <div 
                className={`absolute top-[40%] left-[73%] w-[14%] h-[10%] rounded-full cursor-pointer hover:bg-primary/40 transition-colors ${activeMuscle === 'glutes' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('glutes')} title="Glúteos"
              />

              {/* Posterior de Coxa (Hamstrings) */}
              <div 
                className={`absolute top-[52%] left-[74%] w-[6%] h-[15%] rounded-full cursor-pointer hover:bg-primary/40 transition-colors ${activeMuscle === 'hamstrings' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('hamstrings')} title="Posterior de Coxa"
              />
              <div 
                className={`absolute top-[52%] left-[81%] w-[6%] h-[15%] rounded-full cursor-pointer hover:bg-primary/40 transition-colors ${activeMuscle === 'hamstrings' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('hamstrings')} title="Posterior de Coxa"
              />

              {/* Panturrilha Traseira Esq/Dir */}
              <div 
                className={`absolute top-[72%] left-[73%] w-[6%] h-[15%] rounded-full cursor-pointer hover:bg-primary/40 transition-colors ${activeMuscle === 'calves' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('calves')} title="Panturrilha"
              />
              <div 
                className={`absolute top-[72%] left-[81%] w-[6%] h-[15%] rounded-full cursor-pointer hover:bg-primary/40 transition-colors ${activeMuscle === 'calves' ? 'bg-primary/40' : ''}`}
                onClick={() => fetchExercises('calves')} title="Panturrilha"
              />

            </div>
          </CardContent>
        </Card>

        {/* LISTA DE EXERCICIOS (Middle Column) */}
        <Card className="lg:col-span-4 border-border/50">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              {activeMuscle ? `Exercícios: ${MUSCLE_NAMES[activeMuscle] || activeMuscle}` : 'Selecione um músculo'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[580px] custom-scrollbar">
            {!activeMuscle ? (
              <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3">
                  <User className="w-6 h-6 text-muted-foreground/50" />
                </div>
                Clique em uma região do diagrama ao lado para ver os exercícios correspondentes.
              </div>
            ) : loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
            ) : exercises.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Nenhum exercício encontrado.</div>
            ) : (
              <div className="divide-y divide-border/30">
                {exercises.map((ex) => (
                  <div key={ex.id} className="p-4 hover:bg-accent/30 transition-colors flex items-center justify-between group">
                    <div>
                      <h4 className="font-medium text-sm">{ex.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ex.description}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => addToCart(ex)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                      disabled={cart.some(i => i.id === ex.id)}
                    >
                      {cart.some(i => i.id === ex.id) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Plus className="w-4 h-4 text-primary" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CARRINHO / FICHA ATUAL (Right Column) */}
        <Card className="lg:col-span-4 border-border/50 bg-primary/5">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Save className="w-4 h-4 text-primary" />
              Ficha em Construção
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[580px] custom-scrollbar">
            {cart.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6 text-muted-foreground/50" />
                </div>
                Nenhum exercício selecionado ainda.
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="bg-card p-3 rounded-lg border border-border/50 shadow-sm relative">
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <h4 className="font-medium text-sm pr-4 mb-2 truncate">{item.name}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1 block">Séries</label>
                        <Input 
                          type="number" 
                          value={item.sets} 
                          onChange={(e) => {
                            const newCart = [...cart];
                            const idx = newCart.findIndex(i => i.id === item.id);
                            newCart[idx].sets = parseInt(e.target.value);
                            setCart(newCart);
                          }}
                          className="h-8 text-xs" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1 block">Reps</label>
                        <Input 
                          type="text" 
                          value={item.reps}
                          onChange={(e) => {
                            const newCart = [...cart];
                            const idx = newCart.findIndex(i => i.id === item.id);
                            newCart[idx].reps = e.target.value;
                            setCart(newCart);
                          }}
                          className="h-8 text-xs" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Modal Enviar Ficha */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enviar Ficha para Aluno</DialogTitle>
            <DialogDescription>
              A ficha será salva e enviada imediatamente para o aplicativo do aluno.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2 col-span-3">
                <label className="text-sm font-medium">Nome da Ficha</label>
                <Input 
                  placeholder="Ex: Treino - Hipertrofia Peito" 
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-1">
                <label className="text-sm font-medium">Tipo</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={dayLabel}
                  onChange={(e) => setDayLabel(e.target.value)}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecionar Aluno</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                <option value="" disabled>Escolha um aluno...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={submitPlan} disabled={submitting || !selectedStudentId || !planName}>
              {submitting ? 'Salvando...' : 'Salvar e Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
