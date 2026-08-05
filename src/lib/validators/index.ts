// ============================================
// FitControl Pro — Zod Validators
// ============================================

import { z } from 'zod';
import {
  PASSWORD_MIN_LENGTH,
  STUDENT_ACCESS_CODE_LENGTH,
} from '@/constants';
import { normalizeAuthCode } from '@/lib/auth/credentials';

// ---- Trainer Registration ----

export const trainerRegisterSchema = z.object({
  full_name: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  city: z.string().trim().min(2, 'Informe sua cidade').max(100, 'Cidade muito longa'),
  state: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, 'Use a sigla do estado com 2 letras')
    .transform((value) => value.toUpperCase()),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres`),
}).strict();

export type TrainerRegisterInput = z.infer<typeof trainerRegisterSchema>;

// ---- Trainer Login ----

export const trainerLoginSchema = z.object({
  trainer_code: z
    .string()
    .trim()
    .min(1, 'Informe seu código de personal')
    .refine((code) => normalizeAuthCode(code).length >= 4, 'Código de personal inválido'),
  password: z.string().min(1, 'Informe sua senha'),
});

export type TrainerLoginInput = z.infer<typeof trainerLoginSchema>;

// ---- Student Login ----

export const studentLoginSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome'),
  access_code: z
    .string()
    .trim()
    .regex(
      new RegExp(`^\\d{${STUDENT_ACCESS_CODE_LENGTH}}$`),
      `O código deve ter exatamente ${STUDENT_ACCESS_CODE_LENGTH} números`,
    ),
});

export type StudentLoginInput = z.infer<typeof studentLoginSchema>;

// ---- Student Registration (by trainer) ----

export const studentCreateSchema = z.object({
  full_name: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  nickname: z.string().trim().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  height: z.number().positive('Altura deve ser positiva').optional(),
  current_weight: z.number().positive('Peso deve ser positivo').optional(),
  goal: z.string().trim().optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  restrictions: z.string().trim().optional(),
  injuries: z.string().trim().optional(),
  medical_notes: z.string().trim().optional(),
  available_days: z.array(z.string()).optional(),
  start_date: z.string().optional(),
  notes: z.string().trim().optional(),
});

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;

export const studentProfileUpdateSchema = z.object({
  full_name: z.string().trim().min(2).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  goal: z.string().trim().max(200).optional(),
  height: z.number().positive().max(300).optional(),
  current_weight: z.number().positive().max(1000).optional(),
  weight: z.number().positive().max(1000).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  notes: z.string().trim().max(5000).optional(),
  restrictions: z.string().trim().max(5000).optional(),
}).strict();

export type StudentProfileUpdateInput = z.infer<typeof studentProfileUpdateSchema>;

// ---- Workout Plan ----

export const workoutPlanSchema = z.object({
  name: z.string().min(1, 'Nome da ficha é obrigatório'),
  student_id: z.string().uuid(),
  goal: z.string().optional(),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  notes: z.string().optional(),
  estimated_duration_minutes: z.number().positive().optional(),
  days_per_week: z.number().min(1).max(7).optional(),
});

export type WorkoutPlanInput = z.infer<typeof workoutPlanSchema>;

// ---- Workout Exercise ----

export const workoutExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  position: z.number().min(0),
  sets: z.number().min(1, 'Mínimo 1 série'),
  repetitions: z.string().min(1, 'Repetições são obrigatórias'),
  suggested_load: z.number().optional(),
  rest_seconds: z.number().min(0).optional(),
  cadence: z.string().optional(),
  training_method: z.string().default('standard'),
  notes: z.string().optional(),
});

export type WorkoutExerciseInput = z.infer<typeof workoutExerciseSchema>;

// ---- Set Record ----

export const setRecordSchema = z.object({
  set_number: z.number().min(1),
  completed: z.boolean(),
  performed_repetitions: z.number().min(0).optional(),
  performed_load: z.number().min(0).optional(),
  perceived_difficulty: z.enum(['very_easy', 'easy', 'adequate', 'hard', 'very_hard']).optional(),
  rpe: z.number().min(1).max(10).optional(),
});

export type SetRecordInput = z.infer<typeof setRecordSchema>;

// ---- Physical Assessment ----

export const physicalAssessmentSchema = z.object({
  student_id: z.string().uuid(),
  assessment_date: z.string(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  body_fat_percentage: z.number().min(0).max(100).optional(),
  muscle_mass: z.number().positive().optional(),
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  abdomen: z.number().positive().optional(),
  hips: z.number().positive().optional(),
  right_arm: z.number().positive().optional(),
  left_arm: z.number().positive().optional(),
  right_forearm: z.number().positive().optional(),
  left_forearm: z.number().positive().optional(),
  right_thigh: z.number().positive().optional(),
  left_thigh: z.number().positive().optional(),
  right_calf: z.number().positive().optional(),
  left_calf: z.number().positive().optional(),
  skinfold_sum: z.number().positive().optional(),
  blood_pressure_systolic: z.number().positive().optional(),
  blood_pressure_diastolic: z.number().positive().optional(),
  resting_heart_rate: z.number().positive().optional(),
  notes: z.string().optional(),
});

export type PhysicalAssessmentInput = z.infer<typeof physicalAssessmentSchema>;
