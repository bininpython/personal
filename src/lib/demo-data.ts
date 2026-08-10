// ============================================
// D KONG — Demo Data Store
// In-memory store for demonstration without Supabase
// ============================================

import type {
  Trainer, Student, WorkoutPlan, WorkoutDay, Exercise,
  WorkoutExercise, WorkoutSession, ExerciseSession, SetRecord,
  PhysicalAssessment, Message, Notification, Achievement,
  StudentAchievement,
} from '@/types';
import { hashPassword, normalizeName, getCodeHint } from '@/lib/auth/hash';
import fs from 'fs';
import path from 'path';

// ---- Demo trainer password: Treino@2026Forte ----
// ---- Demo trainer code: #PRO-ABNER ----

let demoInitialized = false;

// Storage
const trainers: Map<string, Trainer & { password_hash: string }> = new Map();
const students: Map<string, Student & { access_code_hash: string }> = new Map();

const DB_FILE = path.join(process.cwd(), '.demo-db.json');

function saveDb() {
  try {
    const data = {
      trainers: Array.from(trainers.entries()),
      students: Array.from(students.entries()),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to save demo db', err);
  }
}

function loadDb(): boolean {
  try {
    if (fs.existsSync(DB_FILE)) {
      const fileData = fs.readFileSync(DB_FILE, 'utf-8');
      if (fileData) {
        const data = JSON.parse(fileData);
        if (data.trainers) {
          trainers.clear();
          for (const [k, v] of data.trainers) trainers.set(k, v);
        }
        if (data.students) {
          students.clear();
          for (const [k, v] of data.students) students.set(k, v);
        }
        return true;
      }
    }
  } catch (err) {
    console.error('Failed to load demo db', err);
  }
  return false;
}
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

  const dbLoaded = loadDb();

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

  if (!dbLoaded) {
    saveDb();
  }

  // --- Exercises (20+ exercises) ---
  const exerciseData: Array<Omit<Exercise, 'id' | 'created_at'>> = [
    { name: 'AGACHAMENTO LIVRE COM BARRA', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false, video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/Agachamento%20livre%20com%20barra.mp4' },
    { name: 'AGACHAMENTO FRONTAL COM BARRA', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false, video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/Agachamento%20frontal.mp4' },
    { name: 'AGACHAMENTO GOBLET', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false, video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/Agachamento%20goblet.mp4' },
    { name: 'AGACHAMENTO NO SMITH', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false, video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/Agachamento%20no%20Smith.mp4' },
    { name: 'AGACHAMENTO HACK', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false, video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/Agachamento%20hack.mp4' },
    { name: 'AGACHAMENTO PENDULAR', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BELT SQUAT — AGACHAMENTO COM CINTO', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false, video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/Agachamento%20com%20cinto%20-%20belt%20squat.mp4' },
    { name: 'AGACHAMENTO BÚLGARO', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false, video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/Agachamento%20b%C3%BAlgaro.mp4' },
    { name: 'AGACHAMENTO SISSY', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AGACHAMENTO ESPANHOL', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PISTOL SQUAT', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'WALL SIT — AGACHAMENTO ISOMÉTRICO NA PAREDE', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BOX SQUAT', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AGACHAMENTO COM CALCANHARES ELEVADOS', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AGACHAMENTO ZERCHER', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AGACHAMENTO LANDMINE', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'LEG PRESS 45°', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false, video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/Leg%20press%2045%20graus.mp4' },
    { name: 'LEG PRESS HORIZONTAL', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'LEG PRESS VERTICAL', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'LEG PRESS UNILATERAL', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CADEIRA EXTENSORA', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false, video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/Cadeira%20extensora.mp4' },
    { name: 'CADEIRA EXTENSORA UNILATERAL', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false, video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/Cadeira%20extensora.mp4' },
    { name: 'AVANÇO À FRENTE', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AFUNDO ESTACIONÁRIO', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AFUNDO REVERSO', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AFUNDO CAMINHANDO', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AFUNDO NO SMITH', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AFUNDO COM BARRA', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AFUNDO COM HALTERES', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'STEP-UP NO BANCO', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'STEP-DOWN', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PASSADA LATERAL', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AGACHAMENTO COSSACK', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SUBIDA DE ESCADA', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'EMPURRAR TRENÓ', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ARRASTAR TRENÓ PARA TRÁS', description: '', category: 'quadriceps', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'STIFF COM BARRA', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'STIFF COM HALTERES', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'STIFF NO SMITH', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'STIFF UNILATERAL', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'LEVANTAMENTO TERRA ROMENO COM BARRA', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TERRA ROMENO COM HALTERES', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TERRA ROMENO UNILATERAL', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'GOOD MORNING COM BARRA', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'GOOD MORNING NO SMITH', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'MESA FLEXORA DEITADA', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'MESA FLEXORA UNILATERAL', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CADEIRA FLEXORA SENTADA', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CADEIRA FLEXORA UNILATERAL', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FLEXORA EM PÉ', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FLEXÃO DE JOELHO NA POLIA', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FLEXÃO DE JOELHO COM CANELEIRA', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FLEXÃO DE JOELHO COM BOLA SUÍÇA', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'NORDIC CURL', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'GLUTE-HAM RAISE', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'HAMSTRING SLIDE CURL', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PONTE COM FLEXÃO DE JOELHOS', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'KETTLEBELL SWING', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'LEVANTAMENTO TERRA CONVENCIONAL', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'LEVANTAMENTO TERRA COM TRAP BAR', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REVERSE HYPEREXTENSION', description: '', category: 'hamstrings', primary_muscle: 'hamstrings', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO PÉLVICA COM BARRA — HIP THRUST', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO PÉLVICA NO SMITH', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO PÉLVICA NA MÁQUINA', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO PÉLVICA COM HALTER', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO PÉLVICA UNILATERAL', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PONTE DE GLÚTEOS', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PONTE UNILATERAL', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FROG PUMP', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'COICE NA POLIA', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'COICE NA MÁQUINA', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'COICE COM CANELEIRA', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'COICE COM ELÁSTICO', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'EXTENSÃO DE QUADRIL NA MÁQUINA', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'EXTENSÃO DE QUADRIL NO BANCO ROMANO', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PULL-THROUGH NA POLIA', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDUÇÃO NA MÁQUINA', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDUÇÃO DE QUADRIL NA POLIA', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDUÇÃO COM CANELEIRA', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDUÇÃO DEITADA', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDUÇÃO COM MINIBAND', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CAMINHADA LATERAL COM MINIBAND', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CAMINHADA DIAGONAL COM MINIBAND', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CLAMSHELL COM ELÁSTICO', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'STEP-UP ALTO', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AFUNDO REVERSO LONGO', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AGACHAMENTO BÚLGARO COM PASSADA LONGA', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false, video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/Agachamento%20b%C3%BAlgaro.mp4' },
    { name: 'AGACHAMENTO SUMÔ', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TERRA SUMÔ', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'STIFF SUMÔ', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REVERSE LUNGE NO SMITH', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REVERSE HYPER', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'EXTENSÃO DE QUADRIL QUADRÚPEDE', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FIRE HYDRANT', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO LATERAL DA PERNA EM PÉ', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'GLUTE BRIDGE MARCH', description: '', category: 'glutes', primary_muscle: 'glutes', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CADEIRA ADUTORA', description: '', category: 'adductors', primary_muscle: 'adductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ADUÇÃO UNILATERAL NA MÁQUINA', description: '', category: 'adductors', primary_muscle: 'adductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ADUÇÃO DE QUADRIL NA POLIA', description: '', category: 'adductors', primary_muscle: 'adductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ADUÇÃO COM CANELEIRA', description: '', category: 'adductors', primary_muscle: 'adductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ADUÇÃO DEITADA', description: '', category: 'adductors', primary_muscle: 'adductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AGACHAMENTO SUMÔ', description: '', category: 'adductors', primary_muscle: 'adductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TERRA SUMÔ', description: '', category: 'adductors', primary_muscle: 'adductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AFUNDO LATERAL', description: '', category: 'adductors', primary_muscle: 'adductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PASSADA LATERAL', description: '', category: 'adductors', primary_muscle: 'adductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AGACHAMENTO COSSACK', description: '', category: 'adductors', primary_muscle: 'adductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'COPENHAGEN PLANK', description: '', category: 'adductors', primary_muscle: 'adductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'DESLIZAMENTO LATERAL', description: '', category: 'adductors', primary_muscle: 'adductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ADUÇÃO COM BOLA ENTRE OS JOELHOS', description: '', category: 'adductors', primary_muscle: 'adductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ADUÇÃO ISOMÉTRICA', description: '', category: 'adductors', primary_muscle: 'adductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'LEG PRESS COM BASE ABERTA', description: '', category: 'adductors', primary_muscle: 'adductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CADEIRA ABDUTORA', description: '', category: 'abductors', primary_muscle: 'abductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDUÇÃO NA POLIA BAIXA', description: '', category: 'abductors', primary_muscle: 'abductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDUÇÃO COM CANELEIRA', description: '', category: 'abductors', primary_muscle: 'abductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDUÇÃO DEITADA DE LADO', description: '', category: 'abductors', primary_muscle: 'abductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CAMINHADA LATERAL COM ELÁSTICO', description: '', category: 'abductors', primary_muscle: 'abductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'MONSTER WALK', description: '', category: 'abductors', primary_muscle: 'abductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CLAMSHELL', description: '', category: 'abductors', primary_muscle: 'abductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FIRE HYDRANT', description: '', category: 'abductors', primary_muscle: 'abductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO LATERAL DA PERNA', description: '', category: 'abductors', primary_muscle: 'abductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'STEP-DOWN LATERAL', description: '', category: 'abductors', primary_muscle: 'abductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SKATER SQUAT', description: '', category: 'abductors', primary_muscle: 'abductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDUÇÃO EM QUATRO APOIOS', description: '', category: 'abductors', primary_muscle: 'abductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDUÇÃO EM PÉ NA MÁQUINA', description: '', category: 'abductors', primary_muscle: 'abductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDUÇÃO ISOMÉTRICA COM MINIBAND', description: '', category: 'abductors', primary_muscle: 'abductors', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PANTURRILHA EM PÉ NA MÁQUINA', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PANTURRILHA EM PÉ NO SMITH', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PANTURRILHA COM BARRA', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PANTURRILHA COM HALTERES', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PANTURRILHA UNILATERAL', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PANTURRILHA SENTADA', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PANTURRILHA NO LEG PRESS 45°', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false, video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/Leg%20press%2045%20graus.mp4' },
    { name: 'PANTURRILHA NO LEG PRESS HORIZONTAL', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PANTURRILHA NO HACK', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PANTURRILHA NO BELT SQUAT', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false, video_url: 'https://ozhcruzkrfldqylitgbr.supabase.co/storage/v1/object/public/exercises/Agachamento%20com%20cinto%20-%20belt%20squat.mp4' },
    { name: 'DONKEY CALF RAISE', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PANTURRILHA NO DEGRAU', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PANTURRILHA COM JOELHOS FLEXIONADOS', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PANTURRILHA NO APARELHO PENDULAR', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SALTO NA PONTA DOS PÉS', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CAMINHADA NA PONTA DOS PÉS', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TIBIALIS RAISE NA PAREDE', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TIBIALIS RAISE NA MÁQUINA', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'DORSIFLEXÃO COM ELÁSTICO', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'DORSIFLEXÃO NA POLIA', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO DA PONTA DOS PÉS SENTADO', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CAMINHADA APOIANDO OS CALCANHARES', description: '', category: 'calves', primary_muscle: 'calves', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PUXADA FRONTAL COM PEGADA ABERTA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PUXADA FRONTAL COM PEGADA FECHADA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PUXADA COM PEGADA NEUTRA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PUXADA SUPINADA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PUXADA UNILATERAL NA MÁQUINA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PUXADA UNILATERAL NA POLIA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PUXADA ARTICULADA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PUXADA CONVERGENTE', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BARRA FIXA PRONADA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BARRA FIXA SUPINADA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BARRA FIXA NEUTRA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BARRA FIXA ASSISTIDA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CHIN-UP', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PULLDOWN COM BRAÇOS ESTENDIDOS', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PULLDOWN UNILATERAL', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PULLDOWN AJOELHADO', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PUXADA ALTA COM CORDA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PUXADA NA MÁQUINA HAMMER', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PUXADA ATRÁS DA CABEÇA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA CURVADA COM BARRA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA CURVADA SUPINADA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA PENDLAY', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA CAVALINHO — T-BAR', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA LANDMINE', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA UNILATERAL COM HALTER', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA SERROTE', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA BAIXA NA POLIA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA BAIXA COM TRIÂNGULO', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA BAIXA COM BARRA ABERTA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA BAIXA UNILATERAL', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA ARTICULADA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA CONVERGENTE', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA MÁQUINA COM APOIO NO PEITO', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA HAMMER', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA NO SMITH', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA INVERTIDA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA AUSTRALIANA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA COM ELÁSTICO', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA ALTA NA POLIA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA MEADOWS', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA GORILA COM KETTLEBELLS', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA APOIADA NO BANCO INCLINADO', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SEAL ROW', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'RENEGADE ROW', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA UNILATERAL NA LANDMINE', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA SENTADO NA MÁQUINA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'EXTENSÃO LOMBAR NO BANCO ROMANO', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'HIPEREXTENSÃO 45°', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'HIPEREXTENSÃO HORIZONTAL', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'EXTENSÃO LOMBAR NA MÁQUINA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REVERSE HYPER', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'GOOD MORNING', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'LEVANTAMENTO TERRA CONVENCIONAL', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'LEVANTAMENTO TERRA ROMENO', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'RACK PULL', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TERRA COM TRAP BAR', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SUPERMAN NO CHÃO', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BIRD DOG', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'DEADLIFT ISOMÉTRICO', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BACK EXTENSION COM ANILHA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'JEFFERSON CURL', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ENCOLHIMENTO COM BARRA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ENCOLHIMENTO COM HALTERES', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ENCOLHIMENTO NO SMITH', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ENCOLHIMENTO NA MÁQUINA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ENCOLHIMENTO NA POLIA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ENCOLHIMENTO ATRÁS DO CORPO', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ENCOLHIMENTO COM TRAP BAR', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FARMER WALK', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SUITCASE CARRY', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'RACK CARRY', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA ALTA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FACE PULL', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CRUCIFIXO INVERSO', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA COM APOIO NO PEITO', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO EM Y', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PRONE Y RAISE', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PRONE T RAISE', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SCAPULAR PULL-UP', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'DEPRESSÃO ESCAPULAR NA POLIA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'RETRAÇÃO ESCAPULAR NA MÁQUINA', description: '', category: 'back', primary_muscle: 'back', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'DESENVOLVIMENTO MILITAR COM BARRA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'DESENVOLVIMENTO COM HALTERES', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'DESENVOLVIMENTO SENTADO COM HALTERES', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'DESENVOLVIMENTO NO SMITH', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'DESENVOLVIMENTO NA MÁQUINA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'DESENVOLVIMENTO ARTICULADO', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ARNOLD PRESS', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PUSH PRESS', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'LANDMINE PRESS UNILATERAL', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO FRONTAL COM HALTERES', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO FRONTAL COM BARRA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO FRONTAL COM ANILHA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO FRONTAL NA POLIA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO FRONTAL UNILATERAL', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO FRONTAL COM CORDA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO LATERAL COM HALTERES', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO LATERAL SENTADO', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO LATERAL UNILATERAL', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO LATERAL INCLINADA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO LATERAL NA POLIA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO LATERAL BILATERAL NA POLIA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO LATERAL NA MÁQUINA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO LATERAL COM ELÁSTICO', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO LATERAL APOIADA NO BANCO', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO LATERAL PARCIAL', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO LATERAL ATRÁS DO CORPO NA POLIA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA ALTA COM PEGADA ABERTA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA ALTA NA POLIA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA ALTA COM BARRA EZ', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CRUCIFIXO INVERSO NA MÁQUINA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CRUCIFIXO INVERSO COM HALTERES', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CRUCIFIXO INVERSO NO BANCO INCLINADO', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CRUCIFIXO INVERSO NA POLIA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FACE PULL COM CORDA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FACE PULL COM ELÁSTICO', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA ALTA PARA DELTOIDE POSTERIOR', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA COM COTOVELOS ABERTOS', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REAR DELT ROW', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO POSTERIOR UNILATERAL NA POLIA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO POSTERIOR DEITADO', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REVERSE FLY COM ELÁSTICO', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMADA INVERTIDA COM COTOVELOS ABERTOS', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROTAÇÃO EXTERNA NA POLIA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROTAÇÃO EXTERNA COM ELÁSTICO', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROTAÇÃO EXTERNA DEITADO', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROTAÇÃO INTERNA NA POLIA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROTAÇÃO INTERNA COM ELÁSTICO', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CUBAN ROTATION', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CUBAN PRESS', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO EM Y', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO EM T', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO EM W', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SCAPTION COM HALTERES', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'WALL SLIDE', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FACE PULL COM ROTAÇÃO EXTERNA', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BOTTOM-UP KETTLEBELL PRESS', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FARMER CARRY UNILATERAL', description: '', category: 'shoulders', primary_muscle: 'shoulders', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA DIRETA COM BARRA RETA', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA DIRETA COM BARRA EZ', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA DIRETA NA POLIA', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA DIRETA NA MÁQUINA', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA ALTERNADA COM HALTERES', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA SIMULTÂNEA COM HALTERES', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA MARTELO', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA MARTELO CRUZADA', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA MARTELO COM CORDA', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA SCOTT COM BARRA', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA SCOTT COM HALTER', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA SCOTT NA MÁQUINA', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA INCLINADA COM HALTERES', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA CONCENTRADA', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA SPIDER', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA BAYESIAN NA POLIA', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA UNILATERAL NA POLIA', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA ALTA NA POLIA DUPLA', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA 21', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA DRAG', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA ZOTTMAN', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA INVERSA', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA PRONADA NA POLIA', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA COM ELÁSTICO', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CHIN-UP COM FOCO EM BÍCEPS', description: '', category: 'biceps', primary_muscle: 'biceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRÍCEPS PULLEY COM BARRA RETA', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRÍCEPS PULLEY COM BARRA V', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRÍCEPS PULLEY COM CORDA', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRÍCEPS UNILATERAL NA POLIA', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRÍCEPS UNILATERAL COM PEGADA INVERTIDA', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRÍCEPS FRANCÊS COM HALTER', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRÍCEPS FRANCÊS UNILATERAL', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRÍCEPS FRANCÊS COM BARRA EZ', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRÍCEPS FRANCÊS NA POLIA', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRÍCEPS TESTA COM BARRA', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRÍCEPS TESTA COM HALTERES', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRÍCEPS TESTA NA POLIA', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'EXTENSÃO ACIMA DA CABEÇA COM CORDA', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'EXTENSÃO UNILATERAL ACIMA DA CABEÇA', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'COICE DE TRÍCEPS COM HALTER', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'COICE DE TRÍCEPS NA POLIA', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRÍCEPS NA MÁQUINA', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRÍCEPS MERGULHO NA MÁQUINA ASSISTIDA', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'EXTENSÃO DE TRÍCEPS CRUZADA NA POLIA', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TATE PRESS COM HALTERES', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SKULL CRUSHER', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'EXTENSÃO DE TRÍCEPS COM ELÁSTICO', description: '', category: 'triceps', primary_muscle: 'triceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA DE PUNHO COM BARRA', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA DE PUNHO COM HALTERES', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA DE PUNHO NA POLIA', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'EXTENSÃO DE PUNHO COM BARRA', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'EXTENSÃO DE PUNHO COM HALTERES', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA INVERSA', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROSCA ZOTTMAN', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PRONAÇÃO COM HALTER', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SUPINAÇÃO COM HALTER', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'DESVIO RADIAL DO PUNHO', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'DESVIO ULNAR DO PUNHO', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'HAND GRIPPER', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FARMER WALK', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PLATE PINCH', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'DEAD HANG NA BARRA', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TOALHA NA BARRA FIXA', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'WRIST ROLLER', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SUSTENTAÇÃO DE BARRA PESADA', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SUSTENTAÇÃO NA TRAP BAR', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PINÇA COM ANILHAS', description: '', category: 'forearms', primary_muscle: 'forearms', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDOMINAL TRADICIONAL', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CRUNCH NO CHÃO', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CRUNCH NA MÁQUINA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CRUNCH NA POLIA ALTA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CRUNCH AJOELHADO NA POLIA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDOMINAL NO BANCO DECLINADO', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SIT-UP', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDOMINAL COM ANILHA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDOMINAL COM BRAÇOS ESTENDIDOS', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDOMINAL NA BOLA SUÍÇA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDOMINAL REMADOR', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDOMINAL CANIVETE', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'V-UP', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TOE TOUCH', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO DE PERNAS DEITADO', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO DE PERNAS NA BARRA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO DE JOELHOS NA BARRA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELEVAÇÃO DE JOELHOS NA PARALELA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REVERSE CRUNCH', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDOMINAL INFRA NO BANCO', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AB WHEEL', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROLLOUT COM BARRA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROLLOUT NA BOLA SUÍÇA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PRANCHA LATERAL', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PRANCHA LATERAL COM ELEVAÇÃO DO QUADRIL', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDOMINAL BICICLETA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'RUSSIAN TWIST', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'WOODCHOPPER NA POLIA ALTA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'WOODCHOPPER NA POLIA BAIXA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROTAÇÃO DE TRONCO NA MÁQUINA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ROTAÇÃO NA POLIA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ABDOMINAL OBLÍQUO NO BANCO', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FLEXÃO LATERAL COM HALTER', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FLEXÃO LATERAL NA POLIA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SUITCASE CARRY', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'COPENHAGEN PLANK', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'MOUNTAIN CLIMBER CRUZADO', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'WINDSHIELD WIPER', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'LANDMINE ROTATION', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PRANCHA FRONTAL', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PRANCHA COM BRAÇOS ESTENDIDOS', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PRANCHA COM CARGA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PRANCHA COM TOQUE NOS OMBROS', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PRANCHA COM DESLOCAMENTO', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'DEAD BUG', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BIRD DOG', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'HOLLOW BODY HOLD', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PALLOF PRESS', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PALLOF PRESS AJOELHADO', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PALLOF PRESS COM ROTAÇÃO', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FARMER WALK', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SUITCASE CARRY', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'OVERHEAD CARRY', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BEAR CRAWL', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TURKISH GET-UP', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'RENEGADE ROW', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BODY SAW', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'STIR THE POT NA BOLA SUÍÇA', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'MARCHA COM KETTLEBELL', description: '', category: 'abs', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'LEVANTAMENTO TERRA', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TERRA COM TRAP BAR', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AGACHAMENTO COM DESENVOLVIMENTO', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'THRUSTER COM HALTERES', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'THRUSTER COM BARRA', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CLEAN', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'POWER CLEAN', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'HANG CLEAN', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CLEAN AND PRESS', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SNATCH COM BARRA', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SNATCH COM HALTER', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'KETTLEBELL SWING', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'KETTLEBELL CLEAN', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'KETTLEBELL SNATCH', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TURKISH GET-UP', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'FARMER WALK', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'EMPURRAR TRENÓ', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'PUXAR TRENÓ', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BATTLE ROPE', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BURPEE SEM FLEXÃO DE PEITO', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BOX JUMP', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AGACHAMENTO COM SALTO', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AVANÇO COM SALTO', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'STEP-UP EXPLOSIVO', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SALTO HORIZONTAL', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SALTO UNILATERAL', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'MEDICINE BALL SLAM', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'WALL BALL', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BEAR CRAWL', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CAMINHADA DO FAZENDEIRO', description: '', category: 'functional', primary_muscle: 'abs', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ESTEIRA — CAMINHADA', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ESTEIRA — CORRIDA', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ESTEIRA INCLINADA', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BICICLETA ERGOMÉTRICA VERTICAL', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BICICLETA HORIZONTAL', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'BICICLETA DE SPINNING', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'ELÍPTICO', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SIMULADOR DE ESCADA', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'REMO ERGOMÉTRICO', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'SKI ERG', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'AIR BIKE', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRANSPORT', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'STEPPER', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'TRENÓ MOTORIZADO', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CORDA NAVAL', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
    { name: 'CORDA DE PULAR', description: '', category: 'cardio', primary_muscle: 'quadriceps', secondary_muscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: '', common_mistakes: '', precautions: '', is_compound: false, is_unilateral: false },
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

  console.log('[D KONG] Demo data initialized successfully');
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
  saveDb();
}
export function updateStudent(id: string, updates: Partial<Student & { access_code_hash: string }>) {
  const existing = students.get(id);
  if (existing) {
    students.set(id, { ...existing, ...updates });
    saveDb();
  }
}
export function deleteStudent(id: string) {
  students.delete(id);
  saveDb();
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
export function createWorkoutPlan(data: { name?: string }) {
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
