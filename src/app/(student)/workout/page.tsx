'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dumbbell, Clock, Check, ChevronLeft, ChevronRight, AlertTriangle,
  Play, Pause, RotateCcw, MessageSquare, SkipForward, Minus, Plus, X, PlayCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { DIFFICULTY_LABELS, TRAINING_METHODS, MUSCLE_GROUPS } from '@/constants';

const workoutExercises = [
  {
    id: '1', name: 'Supino Reto com Barra', category: 'Peitoral', method: 'standard',
    primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'],
    video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/SUPINO%20RETO.mp4',
    sets: [
      { number: 1, reps: 12, load: 30, completed: false },
      { number: 2, reps: 12, load: 30, completed: false },
      { number: 3, reps: 10, load: 35, completed: false },
      { number: 4, reps: 8, load: 40, completed: false },
    ],
    restSeconds: 90,
    instructions: 'Deite no banco, segure a barra na largura dos ombros, desça até o peito e empurre.',
    notes: 'Foco na contração do peitoral',
  },
  {
    id: '2', name: 'Supino Inclinado com Halteres', category: 'Peitoral', method: 'standard',
    primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'],
    video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/SUPINO%20INCLINADO%2030.mp4',
    sets: [
      { number: 1, reps: 12, load: 16, completed: false },
      { number: 2, reps: 12, load: 16, completed: false },
      { number: 3, reps: 10, load: 18, completed: false },
    ],
    restSeconds: 60,
    instructions: 'Banco a 30-45°, desça os halteres ao lado do peito e empurre.',
    notes: '',
  },
  {
    id: '3', name: 'Crucifixo na Máquina', category: 'Peitoral', method: 'standard',
    primaryMuscle: 'chest', secondaryMuscles: ['shoulders'],
    video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/VOADOR.mp4',
    sets: [
      { number: 1, reps: 15, load: 25, completed: false },
      { number: 2, reps: 15, load: 25, completed: false },
      { number: 3, reps: 12, load: 30, completed: false },
    ],
    restSeconds: 60,
    instructions: 'Sente-se, segure as alavancas e junte na frente do peito.',
    notes: '',
  },
  {
    id: '4', name: 'Tríceps Pulley', category: 'Tríceps', method: 'standard',
    primaryMuscle: 'triceps', secondaryMuscles: [],
    sets: [
      { number: 1, reps: 12, load: 20, completed: false },
      { number: 2, reps: 12, load: 20, completed: false },
      { number: 3, reps: 10, load: 25, completed: false },
    ],
    restSeconds: 60,
    instructions: 'Em pé, estenda os cotovelos empurrando a barra para baixo.',
    notes: '',
  },
  {
    id: '5', name: 'Tríceps Testa', category: 'Tríceps', method: 'standard',
    primaryMuscle: 'triceps', secondaryMuscles: ['shoulders'],
    sets: [
      { number: 1, reps: 12, load: 15, completed: false },
      { number: 2, reps: 12, load: 15, completed: false },
      { number: 3, reps: 10, load: 18, completed: false },
    ],
    restSeconds: 60,
    instructions: 'Deitado no banco, desça a barra até a testa e estenda.',
    notes: '',
  },
];

type SetData = {
  number: number;
  reps: number;
  load: number;
  completed: boolean;
  performedReps?: number;
  performedLoad?: number;
  difficulty?: string;
  rpe?: number;
};

export default function WorkoutPage() {
  const router = useRouter();
  const [currentExercise, setCurrentExercise] = useState(0);
  const [exercises, setExercises] = useState(workoutExercises.map(e => ({
    ...e,
    sets: e.sets.map(s => ({ ...s, performedReps: s.reps, performedLoad: s.load })) as SetData[],
    completed: false,
    skipped: false,
  })));
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [restTimerRunning, setRestTimerRunning] = useState(false);
  const [showPainDialog, setShowPainDialog] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [painNote, setPainNote] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  // Workout timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Rest timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimerRunning && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(t => {
          if (t <= 1) {
            setRestTimerRunning(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimerRunning, restTimer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const exercise = exercises[currentExercise];
  const totalSets = exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const completedSets = exercises.reduce((sum, e) => sum + e.sets.filter(s => s.completed).length, 0);
  const progressPercent = Math.round((completedSets / totalSets) * 100);

  const toggleSet = (setIndex: number) => {
    const updated = [...exercises];
    const set = updated[currentExercise].sets[setIndex];
    set.completed = !set.completed;

    // Auto-start rest timer when completing a set
    if (set.completed) {
      setRestTimer(exercise.restSeconds);
      setRestTimerRunning(true);
    }

    setExercises(updated);
  };

  const updateSetField = (setIndex: number, field: keyof SetData, value: number) => {
    const updated = [...exercises];
    (updated[currentExercise].sets[setIndex] as Record<string, unknown>)[field] = value;
    setExercises(updated);
  };

  const startWorkout = () => {
    setWorkoutStarted(true);
    setTimerRunning(true);
  };

  const handleSkip = () => {
    const updated = [...exercises];
    updated[currentExercise].skipped = true;
    setExercises(updated);
    setShowSkipDialog(false);
    setSkipReason('');
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
    }
  };

  const isWorkoutComplete = exercises.every(e =>
    e.skipped || e.sets.every(s => s.completed)
  );

  const finishWorkout = () => {
    setTimerRunning(false);
    setShowCompleteDialog(true);
  };

  // Pre-workout view
  if (!workoutStarted) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-blue-500" />
            Treino A — Peito/Tríceps
          </h1>
          <p className="text-muted-foreground mt-1">
            {exercises.length} exercícios · ~55 min · {totalSets} séries
          </p>
        </div>

        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-sm font-bold text-blue-500">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ex.sets.length} séries · {ex.sets[0].reps} reps · {ex.sets[0].load} kg · {ex.restSeconds}s desc.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {ex.category}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white text-lg shadow-lg shadow-blue-500/20"
          onClick={startWorkout}
        >
          <Play className="w-5 h-5 mr-2" />
          Iniciar Treino
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setCurrentExercise(Math.max(0, currentExercise - 1))} disabled={currentExercise === 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">{currentExercise + 1}/{exercises.length}</span>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setCurrentExercise(Math.min(exercises.length - 1, currentExercise + 1))} disabled={currentExercise === exercises.length - 1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm font-mono">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{formatTime(timer)}</span>
          </div>
          <Badge variant="outline" className="font-mono">{progressPercent}%</Badge>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progressPercent} className="h-2" />

      {/* Exercise Card */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs mb-2">{exercise.category}</Badge>
              <h2 className="text-lg font-bold flex items-center gap-2">
                {exercise.name}
                {(exercise as any).video_url && (
                  <button onClick={() => setPlayingVideo((exercise as any).video_url)} title="Assistir Vídeo">
                    <PlayCircle className="w-5 h-5 text-blue-500 hover:text-blue-600 transition-colors" />
                  </button>
                )}
              </h2>
              {exercise.instructions && (
                <p className="text-xs text-muted-foreground mt-1">{exercise.instructions}</p>
              )}
            </div>
          </div>

          {/* Muscle info */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <Badge variant="outline" className="text-[10px] bg-emerald-500/5 border-emerald-500/20 text-emerald-500">
              {MUSCLE_GROUPS[exercise.primaryMuscle as keyof typeof MUSCLE_GROUPS]?.name || exercise.primaryMuscle}
            </Badge>
            {exercise.secondaryMuscles.map((m, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">
                {MUSCLE_GROUPS[m as keyof typeof MUSCLE_GROUPS]?.name || m}
              </Badge>
            ))}
          </div>

          {/* Sets Checklist */}
          <div className="space-y-3">
            {exercise.sets.map((set, si) => (
              <div
                key={si}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
                  ${set.completed
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-card border-border/50'}`}
              >
                <Checkbox
                  checked={set.completed}
                  onCheckedChange={() => toggleSet(si)}
                  className="w-6 h-6 rounded-md"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">Série {set.number}</span>
                    {set.completed && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Label className="text-[10px] text-muted-foreground">Reps</Label>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateSetField(si, 'performedReps', Math.max(0, (set.performedReps || set.reps) - 1))}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          value={set.performedReps ?? set.reps}
                          onChange={(e) => updateSetField(si, 'performedReps', parseInt(e.target.value) || 0)}
                          className="w-12 h-7 text-center text-sm p-0 font-mono"
                        />
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateSetField(si, 'performedReps', (set.performedReps || set.reps) + 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Label className="text-[10px] text-muted-foreground">Carga</Label>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateSetField(si, 'performedLoad', Math.max(0, (set.performedLoad || set.load) - 2.5))}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          value={set.performedLoad ?? set.load}
                          onChange={(e) => updateSetField(si, 'performedLoad', parseFloat(e.target.value) || 0)}
                          className="w-14 h-7 text-center text-sm p-0 font-mono"
                        />
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateSetField(si, 'performedLoad', (set.performedLoad || set.load) + 2.5)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="text-[10px] text-muted-foreground">kg</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rest Timer */}
      {restTimerRunning && (
        <Card className="border-amber-500/30 bg-amber-500/5 animate-fade-in">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium">Descanso</p>
                <p className="text-2xl font-bold font-mono text-amber-500">{formatTime(restTimer)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setRestTimerRunning(false)}>
                <Pause className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setRestTimer(exercise.restSeconds); setRestTimerRunning(true); }}>
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setRestTimer(0); setRestTimerRunning(false); }}>
                <SkipForward className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-11 border-red-500/30 text-red-500 hover:bg-red-500/10"
          onClick={() => setShowPainDialog(true)}
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Dor/Desconforto
        </Button>
        <Button
          variant="outline"
          className="h-11"
          onClick={() => setShowSkipDialog(true)}
        >
          <SkipForward className="w-4 h-4 mr-2" />
          Pular Exercício
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {currentExercise < exercises.length - 1 ? (
          <Button
            className="flex-1 h-12 bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => setCurrentExercise(currentExercise + 1)}
          >
            Próximo Exercício
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={finishWorkout}
          >
            <Check className="w-5 h-5 mr-2" />
            Finalizar Treino
          </Button>
        )}
      </div>

      {/* Pain Dialog */}
      <Dialog open={showPainDialog} onOpenChange={setShowPainDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Relatar Dor ou Desconforto
            </DialogTitle>
            <DialogDescription>
              Informe ao seu personal sobre qualquer dor ou desconforto durante o exercício.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Descreva a dor ou desconforto</Label>
            <Textarea
              placeholder="Ex: Dor no ombro direito durante o movimento..."
              value={painNote}
              onChange={(e) => setPainNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPainDialog(false)}>Cancelar</Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={() => { setShowPainDialog(false); setPainNote(''); }}>
              Enviar Relato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Dialog */}
      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pular Exercício</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja pular {exercise.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Motivo (opcional)</Label>
            <Textarea
              placeholder="Ex: Equipamento ocupado, dor..."
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkipDialog(false)}>Cancelar</Button>
            <Button onClick={handleSkip}>Pular Exercício</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              🎉 Treino Concluído!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-500">{progressPercent}%</div>
              <p className="text-sm text-muted-foreground mt-1">de conclusão</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-lg font-bold">{formatTime(timer)}</div>
                <p className="text-[10px] text-muted-foreground">Duração</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-lg font-bold">{completedSets}/{totalSets}</div>
                <p className="text-[10px] text-muted-foreground">Séries</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-lg font-bold">
                {exercises.reduce((sum, e) => sum + e.sets.filter(s => s.completed).reduce((sSum, s) => sSum + (s.performedReps || 0) * (s.performedLoad || 0), 0), 0).toLocaleString()} kg
              </div>
              <p className="text-[10px] text-muted-foreground">Volume Total</p>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => router.push('/home')}>
              Voltar ao Início
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
