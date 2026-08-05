export interface ProgressAssessment {
  id: string;
  date: string;
  dateLabel: string;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  bloodPressure: string | null;
  restingHeartRate: number | null;
  measurements: {
    chest: number | null;
    waist: number | null;
    abdomen: number | null;
    hips: number | null;
    rightArm: number | null;
    leftArm: number | null;
    rightThigh: number | null;
    leftThigh: number | null;
    rightCalf: number | null;
    leftCalf: number | null;
  };
  notes: string;
}

export interface ProgressWorkout {
  id: string;
  date: string;
  name: string;
  planName: string;
  completion: number;
  durationMinutes: number | null;
  rating: number | null;
  feedback: string;
}

export interface ProgressTimelineItem {
  id: string;
  type: 'assessment' | 'workout';
  date: string;
  title: string;
  description: string;
}

export interface StudentProgressData {
  generatedAt: string;
  student: {
    id: string;
    name: string;
    goal: string;
    status: string;
    avatarUrl: string;
    startDate: string;
    currentWeight: number | null;
    height: number | null;
  };
  trainer: { name: string };
  performance: {
    plannedFrequency: number;
    workouts7d: number;
    workouts30d: number;
    completedWorkouts: number;
    completionAverage: number;
    consistencyScore: number;
    daysSinceLastWorkout: number | null;
    weightChange: number | null;
    bodyFatChange: number | null;
    muscleMassChange: number | null;
    risk: 'low' | 'medium' | 'high';
    recommendation: string;
  };
  assessments: ProgressAssessment[];
  workouts: ProgressWorkout[];
  weeklyWorkouts: Array<{ label: string; workouts: number }>;
  timeline: ProgressTimelineItem[];
}
