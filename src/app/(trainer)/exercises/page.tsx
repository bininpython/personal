'use client';

import { useState, useEffect } from 'react';
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
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [planName, setPlanName] = useState('');
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
          <CardHeader className="pb-0 text-center">
            <CardTitle className="text-base font-semibold">Anatomia</CardTitle>
          </CardHeader>
          <CardContent className="p-6 relative">
            <div className="relative w-full max-w-[280px] h-[520px] mx-auto">
              
              {/* Head */}
              <div 
                className="absolute top-[5%] left-1/2 -translate-x-1/2 w-14 h-16 rounded-[40%] bg-muted cursor-pointer hover:bg-primary hover:scale-105 transition-all shadow-sm border border-border/30" 
                title="Pescoço/Trapézio"
              />
              
              {/* Shoulders */}
              <div 
                className={`absolute top-[20%] left-1/2 -translate-x-1/2 w-32 h-10 rounded-full cursor-pointer hover:bg-primary hover:scale-105 transition-all shadow-sm border border-border/30 z-10
                  ${activeMuscle === 'shoulders' ? 'bg-primary scale-105 shadow-primary/50 shadow-lg' : 'bg-muted'}`}
                onClick={() => fetchExercises('shoulders')}
                title="Ombros"
              />
              
              {/* Chest */}
              <div 
                className={`absolute top-[26%] left-1/2 -translate-x-1/2 w-24 h-16 rounded-xl cursor-pointer hover:bg-primary hover:scale-105 transition-all shadow-sm border border-border/30 z-20
                  ${activeMuscle === 'chest' ? 'bg-primary scale-105 shadow-primary/50 shadow-lg' : 'bg-muted'}`}
                onClick={() => fetchExercises('chest')}
                title="Peito"
              />
              
              {/* Abs */}
              <div 
                className={`absolute top-[39%] left-1/2 -translate-x-1/2 w-20 h-24 rounded-lg cursor-pointer hover:bg-primary hover:scale-105 transition-all shadow-sm border border-border/30 z-20
                  ${activeMuscle === 'abs' ? 'bg-primary scale-105 shadow-primary/50 shadow-lg' : 'bg-muted'}`}
                onClick={() => fetchExercises('abs')}
                title="Abdômen"
              />

              {/* Back (Hint: Since it's 2D, we can put Back in the center, or have a toggle for front/back. Let's make the trapz/lats clickable edges) */}
              <div 
                className={`absolute top-[26%] left-[10%] w-8 h-28 rounded-l-full cursor-pointer hover:bg-primary hover:scale-105 transition-all shadow-sm border border-border/30
                  ${activeMuscle === 'back' ? 'bg-primary scale-105 shadow-primary/50 shadow-lg' : 'bg-muted'}`}
                onClick={() => fetchExercises('back')}
                title="Costas"
              />
              <div 
                className={`absolute top-[26%] right-[10%] w-8 h-28 rounded-r-full cursor-pointer hover:bg-primary hover:scale-105 transition-all shadow-sm border border-border/30
                  ${activeMuscle === 'back' ? 'bg-primary scale-105 shadow-primary/50 shadow-lg' : 'bg-muted'}`}
                onClick={() => fetchExercises('back')}
                title="Costas"
              />
              
              {/* Left Arm (Biceps) */}
              <div 
                className={`absolute top-[25%] -left-[5%] w-10 h-20 rounded-full cursor-pointer hover:bg-primary hover:scale-105 transition-all shadow-sm border border-border/30 -rotate-12
                  ${activeMuscle === 'biceps' ? 'bg-primary scale-105 shadow-primary/50 shadow-lg' : 'bg-muted'}`}
                onClick={() => fetchExercises('biceps')}
                title="Bíceps (Braço Esquerdo)"
              />
              {/* Right Arm (Triceps) */}
              <div 
                className={`absolute top-[25%] -right-[5%] w-10 h-20 rounded-full cursor-pointer hover:bg-primary hover:scale-105 transition-all shadow-sm border border-border/30 rotate-12
                  ${activeMuscle === 'triceps' ? 'bg-primary scale-105 shadow-primary/50 shadow-lg' : 'bg-muted'}`}
                onClick={() => fetchExercises('triceps')}
                title="Tríceps (Braço Direito)"
              />

              {/* Left Forearm */}
              <div className="absolute top-[41%] -left-[10%] w-8 h-20 rounded-full bg-muted cursor-pointer hover:bg-primary hover:scale-105 transition-all shadow-sm border border-border/30 -rotate-12" />
              {/* Right Forearm */}
              <div className="absolute top-[41%] -right-[10%] w-8 h-20 rounded-full bg-muted cursor-pointer hover:bg-primary hover:scale-105 transition-all shadow-sm border border-border/30 rotate-12" />
              
              {/* Left Quad */}
              <div 
                className={`absolute top-[59%] left-[22%] w-14 h-32 rounded-full cursor-pointer hover:bg-primary hover:scale-105 transition-all shadow-sm border border-border/30
                  ${activeMuscle === 'quadriceps' ? 'bg-primary scale-105 shadow-primary/50 shadow-lg' : 'bg-muted'}`}
                onClick={() => fetchExercises('quadriceps')}
                title="Quadríceps"
              />
              {/* Right Hamstring/Glute */}
              <div 
                className={`absolute top-[59%] right-[22%] w-14 h-32 rounded-full cursor-pointer hover:bg-primary hover:scale-105 transition-all shadow-sm border border-border/30
                  ${activeMuscle === 'hamstrings' || activeMuscle === 'glutes' ? 'bg-primary scale-105 shadow-primary/50 shadow-lg' : 'bg-muted'}`}
                onClick={() => fetchExercises('glutes')}
                title="Posterior e Glúteos"
              />

              {/* Left Calf */}
              <div 
                className={`absolute top-[82%] left-[24%] w-10 h-24 rounded-full cursor-pointer hover:bg-primary hover:scale-105 transition-all shadow-sm border border-border/30
                  ${activeMuscle === 'calves' ? 'bg-primary scale-105 shadow-primary/50 shadow-lg' : 'bg-muted'}`}
                onClick={() => fetchExercises('calves')}
                title="Panturrilha"
              />
              {/* Right Calf */}
              <div 
                className={`absolute top-[82%] right-[24%] w-10 h-24 rounded-full cursor-pointer hover:bg-primary hover:scale-105 transition-all shadow-sm border border-border/30
                  ${activeMuscle === 'calves' ? 'bg-primary scale-105 shadow-primary/50 shadow-lg' : 'bg-muted'}`}
                onClick={() => fetchExercises('calves')}
                title="Panturrilha"
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Ficha</label>
              <Input 
                placeholder="Ex: Treino A - Hipertrofia Peito" 
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
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
