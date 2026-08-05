'use client';

import { useState, useEffect, useCallback } from 'react';
import Model, { IMuscleStats } from '@phelian/react-body-highlighter';
import { Search, Plus, X, Save, CheckCircle2, Dumbbell, User, RotateCcw, PlayCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

// Map of categories from the demo data to the muscles in react-body-highlighter
const MUSCLE_MAP: Record<string, string> = {
  chest: 'chest',
  back: 'upper-back',
  'lower-back': 'lower-back',
  shoulders: 'front-deltoids',
  'back-deltoids': 'back-deltoids',
  biceps: 'biceps',
  triceps: 'triceps',
  abs: 'abs',
  quadriceps: 'quadriceps',
  hamstrings: 'hamstring',
  calves: 'calves',
  glutes: 'gluteal'
};

// Reverse map for translations
const MUSCLE_NAMES: Record<string, string> = {
  chest: 'Peito',
  'upper-back': 'Costas Superior',
  'lower-back': 'Lombar',
  'front-deltoids': 'Ombros (Frente)',
  'back-deltoids': 'Ombros (Trás)',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  abs: 'Abdômen',
  obliques: 'Oblíquos',
  quadriceps: 'Quadríceps',
  hamstring: 'Posterior de Coxa',
  calves: 'Panturrilha',
  gluteal: 'Glúteos',
  trapezius: 'Trapézio',
  forearm: 'Antebraço',
  adductor: 'Adutores',
  abductors: 'Abdutores',
  neck: 'Pescoço'
};

export default function ExercisesPage() {
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [viewType, setViewType] = useState<'anterior' | 'posterior'>('anterior');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [planName, setPlanName] = useState('');
  const [dayLabel, setDayLabel] = useState('A');
  const [submitting, setSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  // When a muscle is clicked in the SVG Model
  const handleMuscleClick = useCallback(async (stats: IMuscleStats) => {
    const muscle = stats.muscle;
    setActiveMuscle(muscle);
    setLoading(true);

    // Mapear o nome do músculo SVG para a categoria de exercícios da nossa API
    let category: string = muscle;
    if (muscle === 'front-deltoids' || muscle === 'back-deltoids') category = 'shoulders';
    if (muscle === 'upper-back' || muscle === 'lower-back' || muscle === 'trapezius') category = 'back';
    if (muscle === 'gluteal') category = 'glutes';
    if (muscle === 'hamstring') category = 'hamstrings';

    try {
      const res = await fetch(`/api/exercises?category=${category}`);
      const data = await res.json();
      if (data.exercises) setExercises(data.exercises);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch students for the dropdown
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
    setIsSaving(true);
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
      setIsSaving(false);
    }
  };

  // Build data prop to highlight the active muscle
  const modelData = activeMuscle ? [{ name: 'Selected', muscles: [activeMuscle as any] }] : [];

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
        
        {/* DIAGRAMA DO CORPO HUMANO SVG (Left Column) */}
        <Card className="lg:col-span-4 border-border/50 bg-card/50 overflow-hidden">
          <CardHeader className="pb-3 text-center border-b border-border/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Anatomia 3D</CardTitle>
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
            <div className="flex justify-center mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setViewType(viewType === 'anterior' ? 'posterior' : 'anterior')}
                className="text-xs h-7"
              >
                <RotateCcw className="w-3 h-3 mr-2" />
                Girar ({viewType === 'anterior' ? 'Frente' : 'Costas'})
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex flex-col items-center justify-center min-h-[400px]">
            <Model
              data={modelData}
              type={viewType}
              bodyType={gender}
              style={{ width: '100%', maxWidth: '280px' }}
              svgStyle={{ height: 'auto' }}
              bodyColor="#e2e8f0" // Slate 200
              highlightedColors={['#3b82f6']} // Blue 500
              onClick={handleMuscleClick}
            />
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
                Clique em uma região do diagrama SVG ao lado para ver os exercícios correspondentes.
              </div>
            ) : loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
            ) : exercises.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Nenhum exercício encontrado.</div>
            ) : (
              <div className="divide-y divide-border/30">
                {exercises.map((ex) => (
                  <div key={ex.id} className="p-4 hover:bg-accent/30 transition-colors flex items-center justify-between group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{ex.name}</h4>
                        {ex.video_url && (
                          <button onClick={() => setPlayingVideo(ex.video_url)} title="Assistir Vídeo">
                            <PlayCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 transition-colors" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ex.instructions || ex.description}</p>
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
            <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={submitPlan} disabled={isSaving || submitting || !selectedStudentId || !planName}>
              {isSaving || submitting ? 'Enviando...' : 'Confirmar e Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Dialog */}
      <Dialog open={!!playingVideo} onOpenChange={(open) => !open && setPlayingVideo(null)}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-black border-zinc-800">
          <div className="relative w-full aspect-video flex items-center justify-center bg-black">
            {playingVideo && (
              <video 
                src={playingVideo} 
                controls 
                autoPlay 
                playsInline
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
