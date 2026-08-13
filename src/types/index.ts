// ============================================
// G KONG — Type Definitions
// ============================================

// ---- Auth & Users ----

export type UserRole = 'trainer' | 'student' | 'individual';

export type TrainerStatus = 'active' | 'inactive' | 'suspended';
export type StudentStatus = 'active' | 'inactive' | 'blocked' | 'archived';

export interface Trainer {
  id: string;
  full_name: string;
  trainer_code: string;
  professional_name?: string;
  cref?: string;
  avatar_url?: string;
  biography?: string;
  specialties?: string[];
  gym_name?: string;
  city?: string;
  state?: string;
  phone?: string;
  social_links?: Record<string, string>;
  status: TrainerStatus;
  failed_login_attempts: number;
  locked_until?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  trainer_id: string;
  full_name: string;
  normalized_name: string;
  nickname?: string;
  access_code_hint: string;
  avatar_url?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  current_weight?: number;
  goal?: string;
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  restrictions?: string;
  injuries?: string;
  medical_notes?: string;
  available_days?: string[];
  start_date?: string;
  notes?: string;
  status: StudentStatus;
  failed_login_attempts: number;
  locked_until?: string;
  last_login_at?: string;
  access_code_changed_at?: string;
  created_at: string;
  updated_at: string;
}

// ---- Sessions ----

export interface UserSession {
  id: string;
  trainer_id?: string;
  student_id?: string;
  user_type: UserRole;
  session_token_hash: string;
  device_information?: string;
  ip_address?: string;
  expires_at: string;
  revoked_at?: string;
  created_at: string;
}

export interface LoginAttempt {
  id: string;
  user_type: UserRole;
  trainer_id?: string;
  student_id?: string;
  identifier_hash?: string;
  ip_address?: string;
  device_information?: string;
  success: boolean;
  failure_reason?: string;
  created_at: string;
}

// ---- Workout Plans ----

export type WorkoutPlanStatus = 'active' | 'inactive' | 'expired';
export type WorkoutLevel = 'beginner' | 'intermediate' | 'advanced';

export interface WorkoutPlan {
  id: string;
  student_id: string;
  trainer_id: string;
  name: string;
  goal?: string;
  start_date: string;
  end_date?: string;
  level?: WorkoutLevel;
  status: WorkoutPlanStatus;
  notes?: string;
  estimated_duration_minutes?: number;
  days_per_week?: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutDay {
  id: string;
  workout_plan_id: string;
  name: string;
  label?: string;
  weekday?: number;
  position: number;
  muscle_groups?: string[];
  estimated_duration_minutes?: number;
}

// ---- Exercises ----

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'forearms' | 'abs' | 'lower_back' | 'quadriceps'
  | 'hamstrings' | 'glutes' | 'calves' | 'adductors'
  | 'abductors' | 'hip_flexors' | 'traps' | 'neck';

export type Equipment =
  | 'barbell' | 'dumbbell' | 'plates' | 'machine' | 'smith'
  | 'cable' | 'crossover' | 'bench' | 'band' | 'bodyweight'
  | 'kettlebell' | 'trx' | 'medicine_ball' | 'treadmill'
  | 'bike' | 'rower' | 'stepper' | 'none';

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseCategory =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'forearms' | 'abs' | 'lower_back' | 'quadriceps'
  | 'hamstrings' | 'glutes' | 'calves' | 'adductors'
  | 'abductors' | 'mobility' | 'stretching' | 'functional'
  | 'cardio';

export type TrainingMethod =
  | 'standard' | 'biset' | 'triset' | 'dropset' | 'rest_pause'
  | 'pyramid_ascending' | 'pyramid_descending' | 'superset'
  | 'circuit' | 'isometric' | 'to_failure' | 'time_under_tension';

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  category: ExerciseCategory;
  primary_muscle: MuscleGroup;
  secondary_muscles?: MuscleGroup[];
  stabilizer_muscles?: MuscleGroup[];
  equipment?: Equipment;
  difficulty: ExerciseDifficulty;
  instructions?: string;
  common_mistakes?: string;
  precautions?: string;
  variations?: string;
  alternatives?: string;
  image_url?: string;
  video_url?: string;
  anatomy_image_url?: string;
  is_compound?: boolean;
  is_unilateral?: boolean;
  created_by?: string;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_day_id: string;
  exercise_id: string;
  exercise?: Exercise;
  position: number;
  sets: number;
  repetitions: string;
  suggested_load?: number;
  rest_seconds?: number;
  cadence?: string;
  training_method: TrainingMethod;
  notes?: string;
  alternative_exercise_id?: string;
  home_alternative_id?: string;
}

// ---- Workout Sessions ----

export type SessionStatus = 'in_progress' | 'completed' | 'incomplete' | 'cancelled';
export type PerceivedDifficulty = 'very_easy' | 'easy' | 'adequate' | 'hard' | 'very_hard';

export interface WorkoutSession {
  id: string;
  student_id: string;
  workout_day_id: string;
  workout_plan_id: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  completion_percentage: number;
  total_volume: number;
  status: SessionStatus;
  feedback?: string;
  rating?: number;
  notes?: string;
  created_at: string;
}

export interface ExerciseSession {
  id: string;
  workout_session_id: string;
  workout_exercise_id: string;
  exercise_id: string;
  completed: boolean;
  skipped: boolean;
  skip_reason?: string;
  pain_reported: boolean;
  pain_notes?: string;
  perceived_difficulty?: PerceivedDifficulty;
  rpe?: number;
  notes?: string;
}

export interface SetRecord {
  id: string;
  exercise_session_id: string;
  set_number: number;
  completed: boolean;
  planned_repetitions: number;
  performed_repetitions?: number;
  planned_load?: number;
  performed_load?: number;
  perceived_difficulty?: PerceivedDifficulty;
  rpe?: number;
  completed_at?: string;
}

// ---- Physical Assessment ----

export interface PhysicalAssessment {
  id: string;
  student_id: string;
  trainer_id: string;
  assessment_date: string;
  weight?: number;
  height?: number;
  bmi?: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  chest?: number;
  waist?: number;
  abdomen?: number;
  hips?: number;
  right_arm?: number;
  left_arm?: number;
  right_forearm?: number;
  left_forearm?: number;
  right_thigh?: number;
  left_thigh?: number;
  right_calf?: number;
  left_calf?: number;
  skinfold_sum?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  resting_heart_rate?: number;
  notes?: string;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  student_id: string;
  assessment_id?: string;
  photo_type: 'front' | 'back' | 'right_side' | 'left_side';
  image_url: string;
  created_at: string;
}

// ---- Communication ----

export interface Message {
  id: string;
  sender_id: string;
  sender_type: UserRole;
  recipient_id: string;
  recipient_type: UserRole;
  content: string;
  attachment_url?: string;
  attachment_type?: string;
  is_automated: boolean;
  read_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  user_type: UserRole;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ---- Appointments ----

export type AppointmentType = 'training' | 'assessment' | 'online_consultation';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Appointment {
  id: string;
  trainer_id: string;
  student_id: string;
  appointment_type: AppointmentType;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  created_at: string;
}

// ---- Gamification ----

export type AchievementCriteria =
  | 'first_workout'
  | 'streak_7' | 'streak_14' | 'streak_30'
  | 'workouts_10' | 'workouts_50' | 'workouts_100'
  | 'load_record'
  | 'sets_100' | 'sets_500'
  | 'month_consistency'
  | 'perfect_week';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria_type: AchievementCriteria;
  criteria_value?: number;
  created_at: string;
}

export interface StudentAchievement {
  id: string;
  student_id: string;
  achievement_id: string;
  achievement?: Achievement;
  earned_at: string;
}

// ---- Audit ----

export interface AuditLog {
  id: string;
  trainer_id: string;
  actor_type: UserRole;
  actor_id: string;
  action: string;
  entity: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ---- UI / Dashboard ----

export interface DashboardStats {
  total_active_students: number;
  total_inactive_students: number;
  trained_today: number;
  not_trained_days: { student_id: string; student_name: string; days: number }[];
  weekly_completed: number;
  avg_completion_rate: number;
  pain_alerts: number;
  expiring_plans: number;
  pending_assessments: number;
  unread_messages: number;
}

// ---- Auth Context ----

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  trainer_id: string;
  trainer_code?: string;
  avatar_url?: string;
  background_url?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
