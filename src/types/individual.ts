export interface IndividualPlanExercise {
  id: string;
  exerciseKey: string;
  name: string;
  primaryMuscle: string;
  primaryMuscleLabel: string;
  equipment: string;
  instructions: string;
  videoUrl: string | null;
  sets: number;
  reps: string;
  restTime: number;
  method: string;
  methodNotes: string;
}

export interface IndividualPlanDay {
  id: string;
  label: string;
  name: string;
  exercises: IndividualPlanExercise[];
}

export interface IndividualPlanView {
  id: string;
  name: string;
  goal: string;
  daysPerWeek: number;
  status: 'active' | 'draft' | 'archived';
  startDate: string;
  endDate: string | null;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
  workoutDayCount: number;
  exerciseCount: number;
  days: IndividualPlanDay[];
}

export interface IndividualProfileView {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  city: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  goal: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  available_days: string[];
  restrictions: string;
  biography: string;
  created_at: string;
}
