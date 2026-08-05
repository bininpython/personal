// ============================================
// FitControl Pro — Demo Data Store
// In-memory store for demonstration without Supabase
// ============================================

import type {
  Trainer, Student, WorkoutPlan, WorkoutDay, Exercise,
  WorkoutExercise, WorkoutSession, ExerciseSession, SetRecord,
  PhysicalAssessment, Message, Notification, Achievement,
  StudentAchievement, Appointment,
} from '@/types';
import { hashPassword, normalizeName, getCodeHint } from '@/lib/auth/hash';

// ---- Demo trainer password: Treino@2026Forte ----
// ---- Demo trainer code: #PRO-ABNER ----

let demoInitialized = false;

// Storage
const trainers: Map<string, Trainer & { password_hash: string }> = new Map();
const students: Map<string, Student & { access_code_hash: string }> = new Map();
const workoutPlans: Map<string, WorkoutPlan> = new Map();
const workoutDays: Map<string, WorkoutDay> = new Map();
const exercises: Map<string, Exercise> = new Map();
const workoutExercises: Map<string, WorkoutExercise> = new Map();
const workoutSessions: Map<string, WorkoutSession> = new Map();
const exerciseSessions: Map<string, ExerciseSession> = new Map();
const setRecords: Map<string, SetRecord> = new Map();
const physicalAssessments: Map<string, PhysicalAssessment> = new Map();
const messages: Map<string, Message> = new Map();
const notifications: Map<string, Notification> = new Map();
const achievements: Map<string, Achievement> = new Map();
const studentAchievements: Map<string, StudentAchievement> = new Map();
const appointments: Map<string, Appointment> = new Map();

function uuid(): string {
  return crypto.randomUUID();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ---- SEED DATA ----

export async function initDemoData() {
  if (demoInitialized) return;
  demoInitialized = true;

  // --- Trainer ---
  const trainerId = uuid();
  const trainerPasswordHash = await hashPassword('Treino@2026Forte');

  trainers.set(trainerId, {
    id: trainerId,
    full_name: 'Abner Lucas',
    trainer_code: '#PRO-ABNER',
    professional_name: 'Abner Lucas Personal',
    password_hash: trainerPasswordHash,
    cref: '012345-G/SP',
    avatar_url: '',
    biography: 'Personal Trainer certificado com 8 anos de experiência em musculação, emagrecimento e condicionamento físico.',
    specialties: ['Musculação', 'Emagrecimento', 'Condicionamento Físico', 'Treinamento Funcional'],
    gym_name: 'FitGym Academia',
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 99999-0000',
    social_links: { instagram: '@abnerlucas.personal' },
    status: 'active',
    failed_login_attempts: 0,
    last_login_at: new Date().toISOString(),
    created_at: daysAgo(365),
    updated_at: new Date().toISOString(),
  });

  // --- Students ---
  const studentData = [
    { name: 'João Pedro Silva', goal: 'Hipertrofia', level: 'intermediate' as const, weight: 78, height: 175, gender: 'male' as const, code: 'JP8X41', daysAgoStart: 90 },
    { name: 'Maria Oliveira', goal: 'Emagrecimento', level: 'beginner' as const, weight: 65, height: 162, gender: 'female' as const, code: 'MO3K92', daysAgoStart: 60 },
    { name: 'Carlos Santos', goal: 'Força', level: 'advanced' as const, weight: 92, height: 182, gender: 'male' as const, code: 'CS7R15', daysAgoStart: 180 },
    { name: 'Ana Beatriz Costa', goal: 'Condicionamento Físico', level: 'intermediate' as const, weight: 58, height: 168, gender: 'female' as const, code: 'AB4T78', daysAgoStart: 45 },
    { name: 'Lucas Mendes', goal: 'Definição Muscular', level: 'intermediate' as const, weight: 82, height: 178, gender: 'male' as const, code: 'LM9P23', daysAgoStart: 120 },
  ];

  const studentIds: string[] = [];

  for (const s of studentData) {
    const id = uuid();
    studentIds.push(id);
    const codeHash = await hashPassword(s.code);

    students.set(id, {
      id,
      trainer_id: trainerId,
      full_name: s.name,
      normalized_name: normalizeName(s.name),
      nickname: s.name.split(' ')[0],
      access_code_hint: getCodeHint(s.code),
      avatar_url: '',
      birth_date: '1995-06-15',
      gender: s.gender,
      height: s.height,
      current_weight: s.weight,
      goal: s.goal,
      experience_level: s.level,
      restrictions: '',
      injuries: '',
      medical_notes: '',
      available_days: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
      start_date: daysAgo(s.daysAgoStart).split('T')[0],
      notes: '',
      status: 'active',
      failed_login_attempts: 0,
      last_login_at: daysAgo(Math.floor(Math.random() * 3)),
      access_code_changed_at: daysAgo(s.daysAgoStart),
      access_code_hash: codeHash,
      created_at: daysAgo(s.daysAgoStart),
      updated_at: new Date().toISOString(),
    });
  }

  // --- Exercises (20+ exercises) ---
  const exerciseData: Array<Omit<Exercise, 'id' | 'created_at'>> = [
    { name: 'Supino Reto com Barra', description: 'Exercício composto para peitoral, realizado deitado em banco reto com barra.', category: 'chest', primary_muscle: 'chest', secondary_muscles: ['triceps', 'shoulders'], stabilizer_muscles: ['abs'], equipment: 'barbell', difficulty: 'intermediate', instructions: 'Deite no banco, segure a barra na largura dos ombros, desça até o peito e empurre.', common_mistakes: 'Arco excessivo nas costas, quicar a barra no peito.', precautions: 'Mantenha os pés firmes no chão e as escápulas retraídas.', is_compound: true, is_unilateral: false },
    { name: 'Supino Inclinado com Halteres', description: 'Trabalha a porção superior do peitoral com halteres em banco inclinado.', category: 'chest', primary_muscle: 'chest', secondary_muscles: ['triceps', 'shoulders'], equipment: 'dumbbell', difficulty: 'intermediate', instructions: 'Banco a 30-45°, desça os halteres ao lado do peito e empurre.', common_mistakes: 'Inclinação excessiva do banco, movimento assimétrico.', precautions: 'Controle a descida e mantenha os cotovelos em ângulo adequado.', is_compound: true, is_unilateral: false },
    { name: 'Crucifixo na Máquina', description: 'Isolamento do peitoral realizado na máquina peck-deck.', category: 'chest', primary_muscle: 'chest', secondary_muscles: ['shoulders'], equipment: 'machine', difficulty: 'beginner', instructions: 'Sente-se, segure as alavancas e junte na frente do peito.', common_mistakes: 'Usar impulso do corpo.', precautions: 'Mantenha leve flexão nos cotovelos.', is_compound: false, is_unilateral: false },
    { name: 'Puxada Frontal', description: 'Exercício para costas na polia alta, trabalhando latíssimo do dorso.', category: 'back', primary_muscle: 'back', secondary_muscles: ['biceps', 'forearms'], stabilizer_muscles: ['abs'], equipment: 'cable', difficulty: 'beginner', instructions: 'Segure a barra larga, puxe até a altura do queixo, controle o retorno.', common_mistakes: 'Puxar atrás do pescoço, usar impulso.', precautions: 'Mantenha o tronco levemente inclinado.', is_compound: true, is_unilateral: false },
    { name: 'Remada Curvada com Barra', description: 'Exercício composto para desenvolvimento das costas.', category: 'back', primary_muscle: 'back', secondary_muscles: ['biceps', 'forearms', 'shoulders'], stabilizer_muscles: ['lower_back', 'abs'], equipment: 'barbell', difficulty: 'intermediate', instructions: 'Incline o tronco a 45°, puxe a barra em direção ao abdômen.', common_mistakes: 'Arredondar as costas, usar balanço.', precautions: 'Mantenha a coluna neutra durante todo o movimento.', is_compound: true, is_unilateral: false },
    { name: 'Remada Unilateral com Halter', description: 'Remada unilateral para correção de assimetrias nas costas.', category: 'back', primary_muscle: 'back', secondary_muscles: ['biceps', 'forearms'], equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Apoie um joelho e mão no banco, puxe o halter até a cintura.', common_mistakes: 'Rotacionar o tronco, usar impulso.', precautions: 'Mantenha o core ativado.', is_compound: true, is_unilateral: true },
    { name: 'Desenvolvimento com Halteres', description: 'Exercício para ombros sentado com halteres.', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: ['triceps', 'traps'], equipment: 'dumbbell', difficulty: 'intermediate', instructions: 'Sentado, empurre os halteres acima da cabeça e desça controlando.', common_mistakes: 'Arco na lombar, descer demais.', precautions: 'Mantenha as costas apoiadas no banco.', is_compound: true, is_unilateral: false },
    { name: 'Elevação Lateral', description: 'Isolamento do deltoide lateral para largura dos ombros.', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: ['traps'], equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Em pé, eleve os halteres até a altura dos ombros com braços levemente flexionados.', common_mistakes: 'Elevar acima dos ombros, usar impulso.', precautions: 'Inicie com carga leve para aprender o movimento.', is_compound: false, is_unilateral: false },
    { name: 'Rosca Direta com Barra', description: 'Exercício clássico para bíceps com barra reta.', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: ['forearms'], equipment: 'barbell', difficulty: 'beginner', instructions: 'Em pé, flexione os cotovelos trazendo a barra até os ombros.', common_mistakes: 'Balançar o corpo, mover os cotovelos.', precautions: 'Mantenha os cotovelos fixos ao lado do corpo.', is_compound: false, is_unilateral: false },
    { name: 'Rosca Alternada com Halteres', description: 'Rosca bíceps alternando os braços para foco unilateral.', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: ['forearms'], equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Em pé, flexione um braço por vez, supinando durante o movimento.', common_mistakes: 'Balançar, usar impulso.', precautions: 'Controle a fase excêntrica.', is_compound: false, is_unilateral: true },
    { name: 'Tríceps Pulley', description: 'Extensão de tríceps na polia alta com barra reta ou V.', category: 'triceps', primary_muscle: 'triceps', equipment: 'cable', difficulty: 'beginner', instructions: 'Em pé, estenda os cotovelos empurrando a barra para baixo.', common_mistakes: 'Afastar os cotovelos do corpo.', precautions: 'Mantenha os cotovelos fixos.', is_compound: false, is_unilateral: false },
    { name: 'Tríceps Testa', description: 'Extensão de tríceps deitado com barra EZ.', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: ['shoulders'], equipment: 'barbell', difficulty: 'intermediate', instructions: 'Deitado no banco, desça a barra até a testa e estenda.', common_mistakes: 'Abrir os cotovelos.', precautions: 'Controle o peso e proteja os cotovelos.', is_compound: false, is_unilateral: false },
    { name: 'Agachamento Livre', description: 'Exercício fundamental para membros inferiores.', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: ['glutes', 'hamstrings'], stabilizer_muscles: ['abs', 'lower_back'], equipment: 'barbell', difficulty: 'advanced', instructions: 'Com barra nas costas, desça até as coxas ficarem paralelas ao chão.', common_mistakes: 'Joelhos para dentro, arredondar as costas.', precautions: 'Aqueça bem e use cinto se necessário.', is_compound: true, is_unilateral: false },
    { name: 'Leg Press 45°', description: 'Exercício de empurrar na máquina para quadríceps e glúteos.', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: ['glutes', 'hamstrings'], equipment: 'machine', difficulty: 'beginner', instructions: 'Sente-se na máquina, empurre a plataforma estendendo as pernas.', common_mistakes: 'Travar os joelhos, tirar o quadril do banco.', precautions: 'Não trave completamente os joelhos.', is_compound: true, is_unilateral: false },
    { name: 'Cadeira Extensora', description: 'Isolamento do quadríceps na máquina extensora.', category: 'quadriceps', primary_muscle: 'quadriceps', equipment: 'machine', difficulty: 'beginner', instructions: 'Sentado, estenda as pernas até a extensão completa.', common_mistakes: 'Hiperextensão, usar impulso.', precautions: 'Cuidado com sobrecarga em joelhos sensíveis.', is_compound: false, is_unilateral: false },
    { name: 'Mesa Flexora', description: 'Isolamento da posterior de coxa na máquina flexora.', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: ['calves'], equipment: 'machine', difficulty: 'beginner', instructions: 'Deitado na máquina, flexione as pernas trazendo o peso até os glúteos.', common_mistakes: 'Levantar o quadril.', precautions: 'Controle o retorno do peso.', is_compound: false, is_unilateral: false },
    { name: 'Stiff com Barra', description: 'Exercício para posterior de coxa e glúteos com ênfase no alongamento.', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: ['glutes', 'lower_back'], equipment: 'barbell', difficulty: 'intermediate', instructions: 'Com pernas semi-estendidas, desça a barra mantendo as costas retas.', common_mistakes: 'Arredondar as costas, flexionar demais os joelhos.', precautions: 'Mantenha a coluna neutra, sinta o alongamento na posterior.', is_compound: true, is_unilateral: false },
    { name: 'Panturrilha em Pé', description: 'Elevação de panturrilha na máquina em pé.', category: 'calves', primary_muscle: 'calves', equipment: 'machine', difficulty: 'beginner', instructions: 'Na máquina, eleve os calcanhares o máximo possível e desça controlando.', common_mistakes: 'Movimento parcial, velocidade excessiva.', precautions: 'Amplitude completa para melhor resultado.', is_compound: false, is_unilateral: false },
    { name: 'Abdominal Crunch', description: 'Exercício básico de abdômen.', category: 'abs', primary_muscle: 'abs', equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Deitado, flexione o tronco contraindo o abdômen.', common_mistakes: 'Puxar o pescoço, usar impulso.', precautions: 'Foco na contração abdominal, não no pescoço.', is_compound: false, is_unilateral: false },
    { name: 'Prancha Isométrica', description: 'Exercício isométrico para core e estabilidade.', category: 'abs', primary_muscle: 'abs', secondary_muscles: ['shoulders', 'lower_back', 'glutes'], equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Apoie antebraços e pés, mantenha o corpo reto por tempo determinado.', common_mistakes: 'Quadril muito alto ou muito baixo.', precautions: 'Mantenha o alinhamento do corpo.', is_compound: false, is_unilateral: false },
    { name: 'Hip Thrust', description: 'Exercício principal para desenvolvimento de glúteos.', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: ['hamstrings', 'quadriceps'], equipment: 'barbell', difficulty: 'intermediate', instructions: 'Costas apoiadas no banco, barra sobre o quadril, estenda o quadril até o alinhamento.', common_mistakes: 'Hiperextensão lombar no topo.', precautions: 'Use proteção na barra para conforto.', is_compound: true, is_unilateral: false },
    { name: 'Búlgaro', description: 'Agachamento unilateral com pé elevado atrás para glúteos e quadríceps.', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: ['quadriceps', 'hamstrings'], equipment: 'dumbbell', difficulty: 'intermediate', instructions: 'Pé atrás no banco, desça controladamente e suba.', common_mistakes: 'Inclinar o tronco à frente, joelho passando demais do pé.', precautions: 'Mantenha equilíbrio e core ativado.', is_compound: true, is_unilateral: true },
  ];

  for (const e of exerciseData) {
    const id = uuid();
    exercises.set(id, {
      id,
      ...e,
      created_at: daysAgo(365),
    });
  }

  // --- Workout Plans (3 plans for first 3 students) ---
  const exerciseArr = Array.from(exercises.values());

  for (let i = 0; i < 3; i++) {
    const planId = uuid();
    const studentId = studentIds[i];

    workoutPlans.set(planId, {
      id: planId,
      student_id: studentId,
      trainer_id: trainerId,
      name: `Ficha ${['Hipertrofia', 'Emagrecimento', 'Força'][i]}`,
      goal: studentData[i].goal,
      start_date: daysAgo(30).split('T')[0],
      end_date: daysAgo(-30).split('T')[0],
      level: studentData[i].level,
      status: 'active',
      notes: 'Ficha de treino personalizada',
      estimated_duration_minutes: 60,
      days_per_week: 4,
      created_at: daysAgo(30),
      updated_at: new Date().toISOString(),
    });

    // Create 3 workout days per plan
    const dayNames = ['Treino A - Peito/Tríceps', 'Treino B - Costas/Bíceps', 'Treino C - Pernas'];
    for (let d = 0; d < 3; d++) {
      const dayId = uuid();
      workoutDays.set(dayId, {
        id: dayId,
        workout_plan_id: planId,
        name: dayNames[d],
        label: `Treino ${String.fromCharCode(65 + d)}`,
        weekday: d + 1,
        position: d,
        muscle_groups: [
          ['chest', 'triceps'],
          ['back', 'biceps'],
          ['quadriceps', 'hamstrings', 'glutes'],
        ][d] as string[],
        estimated_duration_minutes: 55 + d * 5,
      });

      // Add exercises per day
      const dayExercises = d === 0
        ? exerciseArr.filter(e => ['chest', 'triceps'].includes(e.category)).slice(0, 5)
        : d === 1
          ? exerciseArr.filter(e => ['back', 'biceps'].includes(e.category)).slice(0, 5)
          : exerciseArr.filter(e => ['quadriceps', 'hamstrings', 'glutes', 'calves'].includes(e.category)).slice(0, 5);

      dayExercises.forEach((ex, pos) => {
        const weId = uuid();
        workoutExercises.set(weId, {
          id: weId,
          workout_day_id: dayId,
          exercise_id: ex.id,
          position: pos,
          sets: 3 + Math.floor(Math.random() * 2),
          repetitions: `${10 + Math.floor(Math.random() * 3)}`,
          suggested_load: 20 + Math.floor(Math.random() * 40),
          rest_seconds: 60 + Math.floor(Math.random() * 3) * 30,
          training_method: 'standard' as const,
          notes: '',
        });
      });
    }
  }

  // --- Workout Sessions (history) ---
  for (let i = 0; i < 3; i++) {
    const studentId = studentIds[i];
    const plan = Array.from(workoutPlans.values()).find(p => p.student_id === studentId);
    if (!plan) continue;

    const days = Array.from(workoutDays.values()).filter(d => d.workout_plan_id === plan.id);

    // Create 10 sessions per student over past 30 days
    for (let s = 0; s < 10; s++) {
      const dayIndex = s % days.length;
      const day = days[dayIndex];
      const sessionId = uuid();
      const daysBack = 30 - s * 3;
      const completion = 70 + Math.floor(Math.random() * 31);

      workoutSessions.set(sessionId, {
        id: sessionId,
        student_id: studentId,
        workout_day_id: day.id,
        workout_plan_id: plan.id,
        started_at: daysAgo(daysBack),
        completed_at: daysAgo(daysBack),
        duration_seconds: 3000 + Math.floor(Math.random() * 1800),
        completion_percentage: completion,
        total_volume: 5000 + Math.floor(Math.random() * 10000),
        status: completion >= 90 ? 'completed' : 'incomplete',
        feedback: '',
        rating: 3 + Math.floor(Math.random() * 3),
        created_at: daysAgo(daysBack),
      });

      // Exercise sessions
      const dayExercisesList = Array.from(workoutExercises.values()).filter(
        we => we.workout_day_id === day.id
      );
      for (const we of dayExercisesList) {
        const esId = uuid();
        const completed = Math.random() > 0.15;
        exerciseSessions.set(esId, {
          id: esId,
          workout_session_id: sessionId,
          workout_exercise_id: we.id,
          exercise_id: we.exercise_id,
          completed,
          skipped: !completed && Math.random() > 0.5,
          skip_reason: !completed ? 'Equipamento ocupado' : undefined,
          pain_reported: Math.random() < 0.05,
          pain_notes: Math.random() < 0.05 ? 'Leve desconforto no ombro' : undefined,
          perceived_difficulty: (['adequate', 'hard', 'easy'] as const)[Math.floor(Math.random() * 3)],
          rpe: 5 + Math.floor(Math.random() * 4),
        });

        // Set records
        for (let setNum = 1; setNum <= we.sets; setNum++) {
          const srId = uuid();
          setRecords.set(srId, {
            id: srId,
            exercise_session_id: esId,
            set_number: setNum,
            completed: completed && Math.random() > 0.1,
            planned_repetitions: parseInt(we.repetitions) || 12,
            performed_repetitions: completed ? (parseInt(we.repetitions) || 12) - Math.floor(Math.random() * 3) : undefined,
            planned_load: we.suggested_load,
            performed_load: completed ? (we.suggested_load || 20) + Math.floor(Math.random() * 10) - 5 : undefined,
            completed_at: completed ? daysAgo(daysBack) : undefined,
          });
        }
      }
    }
  }

  // --- Physical Assessments ---
  for (let i = 0; i < 3; i++) {
    const assessmentId = uuid();
    physicalAssessments.set(assessmentId, {
      id: assessmentId,
      student_id: studentIds[i],
      trainer_id: trainerId,
      assessment_date: daysAgo(15).split('T')[0],
      weight: studentData[i].weight,
      height: studentData[i].height,
      body_fat_percentage: 15 + Math.floor(Math.random() * 10),
      muscle_mass: studentData[i].weight * 0.4,
      chest: 90 + Math.floor(Math.random() * 15),
      waist: 75 + Math.floor(Math.random() * 10),
      abdomen: 80 + Math.floor(Math.random() * 10),
      hips: 95 + Math.floor(Math.random() * 10),
      right_arm: 30 + Math.floor(Math.random() * 8),
      left_arm: 30 + Math.floor(Math.random() * 8),
      right_thigh: 55 + Math.floor(Math.random() * 8),
      left_thigh: 55 + Math.floor(Math.random() * 8),
      right_calf: 35 + Math.floor(Math.random() * 5),
      left_calf: 35 + Math.floor(Math.random() * 5),
      notes: 'Avaliação de rotina',
      created_at: daysAgo(15),
    });
  }

  // --- Messages ---
  const msgData = [
    { sender: trainerId, sType: 'trainer' as const, recipient: studentIds[0], rType: 'student' as const, content: 'Ótimo treino ontem, João! Continue assim!', days: 1 },
    { sender: studentIds[0], sType: 'student' as const, recipient: trainerId, rType: 'trainer' as const, content: 'Obrigado, professor! Senti que a carga do supino pode aumentar.', days: 1 },
    { sender: trainerId, sType: 'trainer' as const, recipient: studentIds[1], rType: 'student' as const, content: 'Maria, sua nova ficha está pronta! Confira quando puder.', days: 2 },
    { sender: trainerId, sType: 'trainer' as const, recipient: studentIds[2], rType: 'student' as const, content: 'Carlos, vamos agendar sua avaliação física esta semana?', days: 3 },
  ];

  for (const m of msgData) {
    const msgId = uuid();
    messages.set(msgId, {
      id: msgId,
      sender_id: m.sender,
      sender_type: m.sType,
      recipient_id: m.recipient,
      recipient_type: m.rType,
      content: m.content,
      is_automated: false,
      read_at: m.days > 1 ? daysAgo(m.days - 1) : undefined,
      created_at: daysAgo(m.days),
    });
  }

  // --- Notifications ---
  const notifData = [
    { userId: trainerId, type: 'pain_report', title: 'Alerta de Dor', message: 'João Pedro relatou desconforto no ombro durante Supino Reto.', days: 1 },
    { userId: trainerId, type: 'absence', title: 'Aluno Ausente', message: 'Ana Beatriz não treina há 4 dias.', days: 0 },
    { userId: trainerId, type: 'record', title: 'Novo Recorde!', message: 'Carlos Santos atingiu novo recorde no Agachamento: 120kg.', days: 2 },
  ];

  for (const n of notifData) {
    const nId = uuid();
    notifications.set(nId, {
      id: nId,
      user_id: n.userId,
      user_type: 'trainer',
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.days > 1,
      created_at: daysAgo(n.days),
    });
  }

  // --- Achievements ---
  const achievementList = [
    { name: 'Primeiro Treino', description: 'Concluiu o primeiro treino!', icon: 'Trophy', criteria_type: 'first_workout' as const },
    { name: '7 Dias de Fogo', description: '7 dias consecutivos treinando!', icon: 'Flame', criteria_type: 'streak_7' as const },
    { name: '10 Treinos', description: 'Completou 10 treinos!', icon: 'Target', criteria_type: 'workouts_10' as const },
    { name: 'Recorde de Carga', description: 'Novo recorde pessoal de carga!', icon: '🥇', criteria_type: 'load_record' as const },
  ];

  const achievementIds: string[] = [];
  for (const a of achievementList) {
    const aId = uuid();
    achievementIds.push(aId);
    achievements.set(aId, {
      id: aId,
      ...a,
      created_at: daysAgo(365),
    });
  }

  // Assign achievements to students
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j <= i + 1 && j < achievementIds.length; j++) {
      const saId = uuid();
      studentAchievements.set(saId, {
        id: saId,
        student_id: studentIds[i],
        achievement_id: achievementIds[j],
        earned_at: daysAgo(20 - j * 5),
      });
    }
  }

  console.log('[FitControl] Demo data initialized successfully');
}

// ---- DATA ACCESS FUNCTIONS ----

export function getTrainers() { return Array.from(trainers.values()); }
export function addTrainer(trainer: Trainer & { password_hash: string }) {
  trainers.set(trainer.id, trainer);
}
export function getTrainerByCode(code: string) {
  return Array.from(trainers.values()).find(
    t => t.trainer_code.toLowerCase() === code.toLowerCase()
  );
}

export function getStudents() { return Array.from(students.values()); }
export function getStudentById(id: string) { return students.get(id); }
export function getStudentsByTrainerId(trainerId: string) {
  return Array.from(students.values()).filter(s => s.trainer_id === trainerId);
}
export function findStudentByNameAndTrainer(normalizedName: string, trainerId: string) {
  return Array.from(students.values()).find(
    s => s.normalized_name === normalizedName && s.trainer_id === trainerId
  );
}

export function addStudent(student: Student & { access_code_hash: string }) {
  students.set(student.id, student);
}
export function updateStudent(id: string, updates: Partial<Student & { access_code_hash: string }>) {
  const existing = students.get(id);
  if (existing) students.set(id, { ...existing, ...updates });
}

export function getExercises() { return Array.from(exercises.values()); }
export function getExerciseById(id: string) { return exercises.get(id); }
export function getExercisesByCategory(category: string) {
  return Array.from(exercises.values()).filter(e => e.category === category);
}

export function getWorkoutPlansByStudent(studentId: string) {
  return Array.from(workoutPlans.values()).filter(p => p.student_id === studentId);
}
export function getWorkoutPlansByTrainerId(trainerId: string) {
  return Array.from(workoutPlans.values()).filter(p => p.trainer_id === trainerId);
}
export function getWorkoutPlanById(id: string) { return workoutPlans.get(id); }
export function addWorkoutPlan(plan: WorkoutPlan) { workoutPlans.set(plan.id, plan); }

export function getWorkoutDaysByPlan(planId: string) {
  return Array.from(workoutDays.values())
    .filter(d => d.workout_plan_id === planId)
    .sort((a, b) => a.position - b.position);
}
export function getWorkoutDayById(id: string) { return workoutDays.get(id); }
export function addWorkoutDay(day: WorkoutDay) { workoutDays.set(day.id, day); }

export function getWorkoutExercisesByDay(dayId: string) {
  return Array.from(workoutExercises.values())
    .filter(we => we.workout_day_id === dayId)
    .sort((a, b) => a.position - b.position);
}
export function addWorkoutExercise(we: WorkoutExercise) { workoutExercises.set(we.id, we); }

export function getWorkoutSessionsByStudent(studentId: string) {
  return Array.from(workoutSessions.values())
    .filter(s => s.student_id === studentId)
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}
export function getWorkoutSessionById(id: string) { return workoutSessions.get(id); }
export function addWorkoutSession(session: WorkoutSession) { workoutSessions.set(session.id, session); }
export function updateWorkoutSession(id: string, updates: Partial<WorkoutSession>) {
  const existing = workoutSessions.get(id);
  if (existing) workoutSessions.set(id, { ...existing, ...updates });
}

export function getExerciseSessionsByWorkout(sessionId: string) {
  return Array.from(exerciseSessions.values()).filter(es => es.workout_session_id === sessionId);
}
export function addExerciseSession(es: ExerciseSession) { exerciseSessions.set(es.id, es); }
export function updateExerciseSession(id: string, updates: Partial<ExerciseSession>) {
  const existing = exerciseSessions.get(id);
  if (existing) exerciseSessions.set(id, { ...existing, ...updates });
}

export function getSetRecordsByExerciseSession(esId: string) {
  return Array.from(setRecords.values())
    .filter(sr => sr.exercise_session_id === esId)
    .sort((a, b) => a.set_number - b.set_number);
}
export function addSetRecord(sr: SetRecord) { setRecords.set(sr.id, sr); }
export function updateSetRecord(id: string, updates: Partial<SetRecord>) {
  const existing = setRecords.get(id);
  if (existing) setRecords.set(id, { ...existing, ...updates });
}

export function getAssessmentsByStudent(studentId: string) {
  return Array.from(physicalAssessments.values())
    .filter(a => a.student_id === studentId)
    .sort((a, b) => new Date(b.assessment_date).getTime() - new Date(a.assessment_date).getTime());
}

export function getMessagesByUser(userId: string) {
  return Array.from(messages.values())
    .filter(m => m.sender_id === userId || m.recipient_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getNotificationsByUser(userId: string) {
  return Array.from(notifications.values())
    .filter(n => n.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getAchievementsByStudent(studentId: string) {
  return Array.from(studentAchievements.values())
    .filter(sa => sa.student_id === studentId)
    .map(sa => ({
      ...sa,
      achievement: achievements.get(sa.achievement_id),
    }));
}

export function getAllAchievements() { return Array.from(achievements.values()); }
export function getAllExercises() { return Array.from(exercises.values()); }
export function createWorkoutPlan(data: any) { 
  // Dummy to satisfy API
  console.log('Created workout plan in demo data:', data.name);
}

// --- Dashboard Stats ---
export function getDashboardStats(trainerId: string) {
  const trainerStudents = getStudentsByTrainerId(trainerId);
  const activeStudents = trainerStudents.filter(s => s.status === 'active');
  const inactiveStudents = trainerStudents.filter(s => s.status !== 'active');

  const todayStr = today();
  const allSessions = Array.from(workoutSessions.values());

  const trainedToday = new Set(
    allSessions
      .filter(s => s.started_at.startsWith(todayStr))
      .map(s => s.student_id)
  ).size;

  const weekAgo = daysAgo(7);
  const weeklySessions = allSessions.filter(
    s => new Date(s.started_at) >= new Date(weekAgo) &&
      trainerStudents.some(st => st.id === s.student_id)
  );

  const avgCompletion = weeklySessions.length > 0
    ? Math.round(weeklySessions.reduce((sum, s) => sum + s.completion_percentage, 0) / weeklySessions.length)
    : 0;

  const painAlerts = Array.from(exerciseSessions.values()).filter(es => es.pain_reported).length;
  const unreadMessages = Array.from(notifications.values()).filter(n => !n.read && n.user_id === trainerId).length;

  // Goal Distribution
  const goalCounts = activeStudents.reduce((acc, student) => {
    const goal = student.goal || 'Não definido';
    acc[goal] = (acc[goal] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
  const goalDistribution = Object.entries(goalCounts).map(([name, value], idx) => ({
    name,
    value,
    color: colors[idx % colors.length]
  }));

  // Student Ranking
  const studentRanking = activeStudents.map(student => {
    const studentSessions = allSessions.filter(s => s.student_id === student.id);
    const avg = studentSessions.length > 0 
      ? Math.round(studentSessions.reduce((sum, s) => sum + s.completion_percentage, 0) / studentSessions.length)
      : 0;
    
    const sortedSessions = [...studentSessions].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    
    let lastWorkout = 'Nenhum';
    if (sortedSessions.length > 0) {
      const daysDiff = Math.floor((new Date().getTime() - new Date(sortedSessions[0].started_at).getTime()) / (1000 * 3600 * 24));
      if (daysDiff === 0) lastWorkout = 'Hoje';
      else if (daysDiff === 1) lastWorkout = 'Ontem';
      else lastWorkout = `Há ${daysDiff} dias`;
    }
    
    let trend = 'stable';
    if (sortedSessions.length >= 2) {
       if (sortedSessions[0].completion_percentage > sortedSessions[1].completion_percentage) trend = 'up';
       else if (sortedSessions[0].completion_percentage < sortedSessions[1].completion_percentage) trend = 'down';
    }
    
    return {
      id: student.id,
      name: student.full_name,
      goal: student.goal,
      completion: avg,
      lastWorkout,
      trend
    };
  }).sort((a, b) => b.completion - a.completion);

  return {
    total_active_students: activeStudents.length,
    total_inactive_students: inactiveStudents.length,
    trained_today: trainedToday,
    not_trained_days: [],
    weekly_completed: weeklySessions.filter(s => s.status === 'completed').length,
    avg_completion_rate: avgCompletion,
    pain_alerts: painAlerts,
    expiring_plans: 0,
    pending_assessments: 0,
    unread_messages: unreadMessages,
    goalDistribution,
    studentRanking,
  };
}
