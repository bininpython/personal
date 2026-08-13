// ============================================
// G KONG — Zod Validators
// ============================================

import { z } from 'zod';
import { normalizeAuthCode } from '@/lib/auth/credentials';

// ---- Trainer Registration ----

export const trainerRegisterSchema = z.object({
  full_name: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  city: z.string().trim().min(2, 'Informe sua cidade').max(100, 'Cidade muito longa'),
  nickname: z.string().trim().max(50, 'Apelido muito longo').optional(),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres').max(72, 'Senha muito longa'),
  age: z.number().int('Informe uma idade válida').min(18, 'Você deve ter pelo menos 18 anos').max(100, 'Informe uma idade válida'),
  terms_accepted: z.boolean().refine((value) => value, 'Aceite os Termos e a Política de Privacidade.'),
}).strict();

export type TrainerRegisterInput = z.infer<typeof trainerRegisterSchema>;

// ---- Trainer Login ----

export const trainerLoginSchema = z.object({
  name: z.string().trim().min(3, 'Informe seu nome profissional').max(160),
  access_code: z.string().trim().refine(
    (code) => {
      const normalized = normalizeAuthCode(code);
      return /^\d{6}$/.test(normalized) || /^[a-z0-9]{8}$/.test(normalized);
    },
    'Use o código de 6 números',
  ),
  remember: z.boolean().optional(),
}).strict();

export type TrainerLoginInput = z.infer<typeof trainerLoginSchema>;

// ---- Student Login ----

export const studentLoginSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome'),
  access_code: z.string().trim().refine(
    (code) => {
      const normalized = normalizeAuthCode(code);
      return /^\d{6}$/.test(normalized) || /^[a-z0-9]{8}$/.test(normalized);
    },
    'Use o código de 6 números enviado pelo seu personal',
  ),
  remember: z.boolean().optional(),
}).strict();

export type StudentLoginInput = z.infer<typeof studentLoginSchema>;

// ---- Individual account ----

export const individualRegisterSchema = z.object({
  full_name: z.string().trim().min(3, 'Informe seu nome completo').max(160),
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido').max(254),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres').max(72, 'Senha muito longa'),
  goal: z.string().trim().max(200).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  terms_accepted: z.boolean().refine((value) => value, 'Aceite os Termos e a Política de Privacidade.'),
}).strict();

export const individualLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido').max(254),
  password: z.string().min(8).max(72),
  remember: z.boolean().optional(),
}).strict();

export const individualProfileSchema = z.object({
  full_name: z.string().trim().min(3).max(160),
  city: z.string().trim().max(100).optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  height: z.number().positive().max(300).optional(),
  weight: z.number().positive().max(1000).optional(),
  goal: z.string().trim().max(200).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  available_days: z.array(z.string().trim().min(2).max(20)).max(7).optional(),
  restrictions: z.string().trim().max(2000).optional(),
  biography: z.string().trim().max(1000).optional(),
}).strict();

export type IndividualRegisterInput = z.infer<typeof individualRegisterSchema>;
export type IndividualLoginInput = z.infer<typeof individualLoginSchema>;
export type IndividualProfileInput = z.infer<typeof individualProfileSchema>;

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
  privacy_consent: z.boolean().refine(
    (value) => value,
    'Confirme que o aluno autorizou o tratamento dos dados.',
  ),
}).strict();

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
  injuries: z.string().trim().max(5000).optional(),
  medical_notes: z.string().trim().max(5000).optional(),
  privacy_consent: z.boolean().optional(),
  terms_accepted: z.boolean().optional(),
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
  days_per_week: z.number().min(1).max(30).optional(),
});

export type WorkoutPlanInput = z.infer<typeof workoutPlanSchema>;

// ---- Workout Builder (trainer anatomy screen) ----

export const workoutBuilderExerciseSchema = z.object({
  exerciseKey: z.string().trim().min(3).max(180),
  sets: z.number().int().min(1, 'Mínimo de 1 série').max(20, 'Máximo de 20 séries'),
  reps: z.string().trim().min(1, 'Informe as repetições').max(50),
  restTime: z.number().int().min(0).max(900),
  method: z.string().trim().max(100).optional(),
}).strict();

export const workoutBuilderDaySchema = z.object({
  label: z.string().trim().min(1).max(4),
  name: z.string().trim().min(2, 'Informe o nome do treino').max(100),
  exercises: z.array(workoutBuilderExerciseSchema).min(1, 'Adicione pelo menos um exercício').max(100),
}).strict();

const workoutPlanBuilderFields = {
  name: z.string().trim().min(2, 'Informe o nome da ficha').max(120),
  goal: z.string().trim().max(200).optional(),
  daysPerWeek: z.number().int().min(1).max(30),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Prazo inválido'),
  days: z.array(workoutBuilderDaySchema).min(1, 'Adicione pelo menos um treino').max(30),
};

export const workoutPlanCreateSchema = z.object({
  studentId: z.string().uuid('Aluno inválido'),
  ...workoutPlanBuilderFields,
}).strict();

export const workoutPlanUpdateSchema = z.object({
  ...workoutPlanBuilderFields,
}).strict();

export const workoutPlanCopySchema = z.object({
  studentId: z.string().uuid('Aluno inválido'),
}).strict();

export type WorkoutPlanCreateInput = z.infer<typeof workoutPlanCreateSchema>;
export type WorkoutPlanUpdateInput = z.infer<typeof workoutPlanUpdateSchema>;
export type WorkoutPlanCopyInput = z.infer<typeof workoutPlanCopySchema>;

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

export const completeWorkoutSchema = z.object({
  clientSessionId: z.string().uuid(),
  workoutDayId: z.string().uuid(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  durationSeconds: z.number().int().min(0).max(21_600),
  rating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().trim().max(1000).optional(),
  exercises: z.array(z.object({
    workoutExerciseId: z.string().uuid(),
    sets: z.array(z.object({
      setNumber: z.number().int().min(1).max(100),
      completed: z.boolean(),
      performedRepetitions: z.number().int().min(0).max(10_000).optional(),
      performedLoad: z.number().min(0).max(100_000).optional(),
      rpe: z.number().int().min(1).max(10).optional(),
    }).strict()).max(100),
  }).strict()).max(200),
}).strict();

export const trainerRecoverySchema = z.object({
  name: z.string().trim().min(3).max(160),
  password: z.string().min(6).max(72),
  age: z.number().int().min(18).max(100),
}).strict();

export const individualWorkoutPlanSchema = z.object({
  ...workoutPlanBuilderFields,
}).strict().superRefine((value, context) => {
  const totalExercises = value.days.reduce((total, day) => total + day.exercises.length, 0);
  if (totalExercises > 300) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['days'],
      message: 'Uma ficha pode ter no máximo 300 exercícios.',
    });
  }
});

export type IndividualWorkoutPlanInput = z.infer<typeof individualWorkoutPlanSchema>;

// ---- Physical Assessment ----

const emptyNumberToUndefined = (value: unknown) => (
  value === '' || (typeof value === 'number' && Number.isNaN(value)) ? undefined : value
);

const optionalPositiveNumber = z.preprocess(
  emptyNumberToUndefined,
  z.number().positive().optional(),
);

const optionalPercentage = z.preprocess(
  emptyNumberToUndefined,
  z.number().min(0).max(100).optional(),
);

export const physicalAssessmentSchema = z.object({
  student_id: z.string().uuid(),
  assessment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data da avaliação'),
  weight: optionalPositiveNumber,
  height: optionalPositiveNumber,
  body_fat_percentage: optionalPercentage,
  muscle_mass: optionalPositiveNumber,
  chest: optionalPositiveNumber,
  waist: optionalPositiveNumber,
  abdomen: optionalPositiveNumber,
  hips: optionalPositiveNumber,
  right_arm: optionalPositiveNumber,
  left_arm: optionalPositiveNumber,
  right_forearm: optionalPositiveNumber,
  left_forearm: optionalPositiveNumber,
  right_thigh: optionalPositiveNumber,
  left_thigh: optionalPositiveNumber,
  right_calf: optionalPositiveNumber,
  left_calf: optionalPositiveNumber,
  skinfold_sum: optionalPositiveNumber,
  blood_pressure_systolic: optionalPositiveNumber,
  blood_pressure_diastolic: optionalPositiveNumber,
  resting_heart_rate: optionalPositiveNumber,
  notes: z.string().optional(),
});

export type PhysicalAssessmentInput = z.infer<typeof physicalAssessmentSchema>;
export type PhysicalAssessmentFormInput = z.input<typeof physicalAssessmentSchema>;
