import templatesJson from './templates.generated.json';
import { EXERCISE_CATALOG, MUSCLE_REGIONS, type ExerciseCatalogItem } from '@/lib/exercises/catalog';
import type { PrintableWorkoutPlan } from '@/lib/pdf/workout-plan';
import type { IndividualWorkoutPlanInput, WorkoutPlanCreateInput } from '@/lib/validators';
import { addPlanValidity, brazilToday } from '@/lib/workouts/plan-validity';

export type WorkoutLibraryAudience = 'male' | 'female';
export type WorkoutLibraryGoal = 'hypertrophy' | 'definition' | 'general';
export type WorkoutLibraryLevel = 'beginner' | 'intermediate' | 'advanced';

export interface WorkoutLibraryExercise {
  exerciseKey: string;
  sourceName: string;
  sets: number;
  reps: string;
  restTime: number;
  method: string;
  methodNotes: string;
}

export interface WorkoutLibraryDay {
  label: string;
  name: string;
  exercises: WorkoutLibraryExercise[];
}

export interface WorkoutLibraryTemplate {
  id: string;
  version: number;
  title: string;
  audience: WorkoutLibraryAudience;
  goal: WorkoutLibraryGoal;
  level: WorkoutLibraryLevel;
  month: number | null;
  durationWeeks: number;
  daysPerWeek: number;
  description: string;
  sourceFiles: string[];
  days: WorkoutLibraryDay[];
}

export interface EnrichedWorkoutLibraryExercise extends WorkoutLibraryExercise {
  catalog: ExerciseCatalogItem;
  primaryMuscleLabel: string;
}

export interface EnrichedWorkoutLibraryDay extends Omit<WorkoutLibraryDay, 'exercises'> {
  exercises: EnrichedWorkoutLibraryExercise[];
}

export interface EnrichedWorkoutLibraryTemplate extends Omit<WorkoutLibraryTemplate, 'days'> {
  days: EnrichedWorkoutLibraryDay[];
  workoutDayCount: number;
  exerciseCount: number;
}

export const WORKOUT_LIBRARY_AUDIENCE_LABELS: Record<WorkoutLibraryAudience, string> = {
  male: 'Masculino',
  female: 'Feminino',
};

export const WORKOUT_LIBRARY_GOAL_LABELS: Record<WorkoutLibraryGoal, string> = {
  hypertrophy: 'Hipertrofia',
  definition: 'Definição e emagrecimento',
  general: 'Condicionamento geral',
};

export const WORKOUT_LIBRARY_LEVEL_LABELS: Record<WorkoutLibraryLevel, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

const TEMPLATES = templatesJson as WorkoutLibraryTemplate[];
const TEMPLATE_BY_ID = new Map(TEMPLATES.map((template) => [template.id, template]));
const CATALOG_BY_KEY = new Map(EXERCISE_CATALOG.map((exercise) => [exercise.key, exercise]));

function enrichTemplate(template: WorkoutLibraryTemplate): EnrichedWorkoutLibraryTemplate {
  const days = template.days.map((day) => ({
    ...day,
    exercises: day.exercises.map((exercise) => {
      const catalog = CATALOG_BY_KEY.get(exercise.exerciseKey);
      if (!catalog) throw new Error(`Exercício ausente no catálogo: ${exercise.exerciseKey}`);
      return {
        ...exercise,
        catalog,
        primaryMuscleLabel: MUSCLE_REGIONS[catalog.primaryMuscle],
      };
    }),
  }));
  return {
    ...template,
    days,
    workoutDayCount: days.length,
    exerciseCount: days.reduce((total, day) => total + day.exercises.length, 0),
  };
}

export function listWorkoutLibraryTemplates() {
  return TEMPLATES.map(enrichTemplate);
}

export function getWorkoutLibraryTemplate(templateId: string) {
  const template = TEMPLATE_BY_ID.get(templateId);
  return template ? enrichTemplate(template) : null;
}

export function workoutLibrarySummary(template: EnrichedWorkoutLibraryTemplate) {
  return {
    id: template.id,
    title: template.title,
    audience: template.audience,
    audienceLabel: WORKOUT_LIBRARY_AUDIENCE_LABELS[template.audience],
    goal: template.goal,
    goalLabel: WORKOUT_LIBRARY_GOAL_LABELS[template.goal],
    level: template.level,
    levelLabel: WORKOUT_LIBRARY_LEVEL_LABELS[template.level],
    month: template.month,
    durationWeeks: template.durationWeeks,
    daysPerWeek: template.daysPerWeek,
    description: template.description,
    workoutDayCount: template.workoutDayCount,
    exerciseCount: template.exerciseCount,
    previewExercises: template.days
      .flatMap((day) => day.exercises)
      .filter((exercise) => exercise.catalog.videoUrl)
      .slice(0, 3)
      .map((exercise) => ({
        name: exercise.sourceName || exercise.catalog.name,
        videoUrl: exercise.catalog.videoUrl,
      })),
  };
}

function planFields(template: EnrichedWorkoutLibraryTemplate): IndividualWorkoutPlanInput {
  const startDate = brazilToday();
  return {
    name: template.title,
    goal: WORKOUT_LIBRARY_GOAL_LABELS[template.goal],
    daysPerWeek: template.daysPerWeek,
    endDate: addPlanValidity(startDate, template.durationWeeks, 'weeks'),
    days: template.days.map((day) => ({
      label: day.label,
      name: day.name,
      exercises: day.exercises.map((exercise) => ({
        exerciseKey: exercise.exerciseKey,
        sets: exercise.sets,
        reps: exercise.reps,
        restTime: exercise.restTime,
        method: exercise.method,
        methodNotes: exercise.methodNotes,
      })),
    })),
  };
}

export function workoutLibraryToIndividualInput(template: EnrichedWorkoutLibraryTemplate) {
  return planFields(template);
}

export function workoutLibraryToTrainerInput(
  template: EnrichedWorkoutLibraryTemplate,
  studentId: string,
): WorkoutPlanCreateInput {
  return { studentId, ...planFields(template) };
}

export function workoutLibraryToPrintablePlan(template: EnrichedWorkoutLibraryTemplate): PrintableWorkoutPlan {
  const startDate = brazilToday();
  return {
    id: template.id,
    name: template.title,
    goal: WORKOUT_LIBRARY_GOAL_LABELS[template.goal],
    daysPerWeek: template.daysPerWeek,
    startDate,
    endDate: addPlanValidity(startDate, template.durationWeeks, 'weeks'),
    workoutDayCount: template.workoutDayCount,
    exerciseCount: template.exerciseCount,
    days: template.days.map((day, dayIndex) => ({
      id: `${template.id}-${day.label}`,
      label: day.label,
      name: day.name,
      exercises: day.exercises.map((exercise, exerciseIndex) => ({
        id: `${template.id}-${dayIndex}-${exerciseIndex}`,
        name: exercise.sourceName || exercise.catalog.name,
        primaryMuscleLabel: exercise.primaryMuscleLabel,
        equipment: exercise.catalog.equipment,
        instructions: exercise.catalog.instructions,
        videoUrl: exercise.catalog.videoUrl,
        sets: exercise.sets,
        reps: exercise.reps,
        restTime: exercise.restTime,
        method: exercise.method,
        methodNotes: exercise.methodNotes,
      })),
    })),
  };
}
