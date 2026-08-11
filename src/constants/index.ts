// ============================================
// G KONG — Constants
// ============================================

// ---- App Config ----

export const APP_NAME = 'G KONG';
export const APP_SUBTITLE = 'Treino forte. Gestão inteligente. Evolução real.';
export const APP_VERSION = '1.0.0';

// ---- Auth ----

export const MAX_LOGIN_ATTEMPTS = 5;
export const TRAINER_LOCKOUT_MINUTES = 15;
export const STUDENT_LOCKOUT_MINUTES = 10;
export const SESSION_EXPIRY_DAYS = 7;
export const REMEMBER_ME_EXPIRY_DAYS = 30;
export const MAX_STUDENTS_PER_TRAINER = 10;

// ---- Histórico ----

/**
 * Janela das consultas de treino realizado.
 *
 * Painel, lista de alunos e relatórios liam a história inteira desde o
 * primeiro dia e recortavam 7, 14 e 30 dias em memória — uma leitura que só
 * cresce. O cálculo mais longo do produto é a série de oito semanas, então um
 * ano cobre tudo com folga e mantém a consulta com tamanho previsível.
 *
 * Efeito colateral aceito: constância, conclusão média e "dias sem treinar"
 * passam a descrever os últimos doze meses, não a vida inteira do aluno.
 */
export const WORKOUT_HISTORY_WINDOW_DAYS = 365;

export function workoutHistoryStart(now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - WORKOUT_HISTORY_WINDOW_DAYS);
  return start.toISOString();
}

// ---- Muscle Groups ----

export const MUSCLE_GROUPS = {
  chest: { id: 'chest', name: 'Peitoral', nameEn: 'Chest' },
  back: { id: 'back', name: 'Costas', nameEn: 'Back' },
  shoulders: { id: 'shoulders', name: 'Ombros', nameEn: 'Shoulders' },
  biceps: { id: 'biceps', name: 'Bíceps', nameEn: 'Biceps' },
  triceps: { id: 'triceps', name: 'Tríceps', nameEn: 'Triceps' },
  forearms: { id: 'forearms', name: 'Antebraço', nameEn: 'Forearms' },
  abs: { id: 'abs', name: 'Abdômen', nameEn: 'Abs' },
  lower_back: { id: 'lower_back', name: 'Lombar', nameEn: 'Lower Back' },
  quadriceps: { id: 'quadriceps', name: 'Quadríceps', nameEn: 'Quadriceps' },
  hamstrings: { id: 'hamstrings', name: 'Posterior de Coxa', nameEn: 'Hamstrings' },
  glutes: { id: 'glutes', name: 'Glúteos', nameEn: 'Glutes' },
  calves: { id: 'calves', name: 'Panturrilhas', nameEn: 'Calves' },
  adductors: { id: 'adductors', name: 'Adutores', nameEn: 'Adductors' },
  abductors: { id: 'abductors', name: 'Abdutores', nameEn: 'Abductors' },
  hip_flexors: { id: 'hip_flexors', name: 'Flexores do Quadril', nameEn: 'Hip Flexors' },
  traps: { id: 'traps', name: 'Trapézio', nameEn: 'Traps' },
  neck: { id: 'neck', name: 'Pescoço', nameEn: 'Neck' },
} as const;

// ---- Equipment ----

export const EQUIPMENT = {
  barbell: { id: 'barbell', name: 'Barra' },
  dumbbell: { id: 'dumbbell', name: 'Halteres' },
  plates: { id: 'plates', name: 'Anilhas' },
  machine: { id: 'machine', name: 'Máquina' },
  smith: { id: 'smith', name: 'Smith' },
  cable: { id: 'cable', name: 'Polia' },
  crossover: { id: 'crossover', name: 'Cross-over' },
  bench: { id: 'bench', name: 'Banco' },
  band: { id: 'band', name: 'Elástico' },
  bodyweight: { id: 'bodyweight', name: 'Peso Corporal' },
  kettlebell: { id: 'kettlebell', name: 'Kettlebell' },
  trx: { id: 'trx', name: 'TRX' },
  medicine_ball: { id: 'medicine_ball', name: 'Medicine Ball' },
  treadmill: { id: 'treadmill', name: 'Esteira' },
  bike: { id: 'bike', name: 'Bicicleta' },
  rower: { id: 'rower', name: 'Remo' },
  stepper: { id: 'stepper', name: 'Escada' },
  none: { id: 'none', name: 'Sem Equipamento' },
} as const;

// ---- Training Methods ----

export const TRAINING_METHODS = {
  standard: { id: 'standard', name: 'Série Simples' },
  biset: { id: 'biset', name: 'Bi-set' },
  triset: { id: 'triset', name: 'Tri-set' },
  dropset: { id: 'dropset', name: 'Drop-set' },
  rest_pause: { id: 'rest_pause', name: 'Rest-pause' },
  pyramid_ascending: { id: 'pyramid_ascending', name: 'Pirâmide Crescente' },
  pyramid_descending: { id: 'pyramid_descending', name: 'Pirâmide Decrescente' },
  superset: { id: 'superset', name: 'Supersérie' },
  circuit: { id: 'circuit', name: 'Circuito' },
  isometric: { id: 'isometric', name: 'Isometria' },
  to_failure: { id: 'to_failure', name: 'Até a Falha' },
  time_under_tension: { id: 'time_under_tension', name: 'Tempo sob Tensão' },
} as const;

// ---- Exercise Categories ----

export const EXERCISE_CATEGORIES = {
  chest: { id: 'chest', name: 'Peitoral' },
  back: { id: 'back', name: 'Costas' },
  shoulders: { id: 'shoulders', name: 'Ombros' },
  biceps: { id: 'biceps', name: 'Bíceps' },
  triceps: { id: 'triceps', name: 'Tríceps' },
  forearms: { id: 'forearms', name: 'Antebraço' },
  abs: { id: 'abs', name: 'Abdômen' },
  lower_back: { id: 'lower_back', name: 'Lombar' },
  quadriceps: { id: 'quadriceps', name: 'Quadríceps' },
  hamstrings: { id: 'hamstrings', name: 'Posterior de Coxa' },
  glutes: { id: 'glutes', name: 'Glúteos' },
  calves: { id: 'calves', name: 'Panturrilhas' },
  adductors: { id: 'adductors', name: 'Adutores' },
  abductors: { id: 'abductors', name: 'Abdutores' },
  mobility: { id: 'mobility', name: 'Mobilidade' },
  stretching: { id: 'stretching', name: 'Alongamento' },
  functional: { id: 'functional', name: 'Funcional' },
  cardio: { id: 'cardio', name: 'Cardiorrespiratório' },
} as const;

// ---- Difficulty Labels ----

export const DIFFICULTY_LABELS = {
  very_easy: { label: 'Muito Leve', color: '#22c55e', value: 1 },
  easy: { label: 'Leve', color: '#84cc16', value: 2 },
  adequate: { label: 'Adequado', color: '#eab308', value: 3 },
  hard: { label: 'Difícil', color: '#f97316', value: 4 },
  very_hard: { label: 'Muito Difícil', color: '#ef4444', value: 5 },
} as const;

// ---- Experience Levels ----

export const EXPERIENCE_LEVELS = {
  beginner: { id: 'beginner', name: 'Iniciante' },
  intermediate: { id: 'intermediate', name: 'Intermediário' },
  advanced: { id: 'advanced', name: 'Avançado' },
} as const;

// ---- Student Goals ----

export const STUDENT_GOALS = [
  'Hipertrofia',
  'Emagrecimento',
  'Condicionamento Físico',
  'Força',
  'Resistência',
  'Saúde e Bem-estar',
  'Reabilitação',
  'Desempenho Esportivo',
  'Flexibilidade e Mobilidade',
  'Definição Muscular',
] as const;

// ---- Days of Week ----

export const WEEKDAYS = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
] as const;

// ---- Alert Thresholds (defaults, configurable) ----

export const DEFAULT_ALERT_THRESHOLDS = {
  days_without_training_warning: 3,
  days_without_training_danger: 5,
  days_without_training_critical: 7,
  low_completion_threshold: 50,
  plan_expiry_warning_days: 7,
  load_deviation_percentage: 30,
} as const;

// ---- Achievement Definitions ----

export const ACHIEVEMENT_DEFINITIONS = [
  { criteria_type: 'first_workout', name: 'Primeiro Treino', description: 'Concluiu o primeiro treino!', icon: 'Trophy' },
  { criteria_type: 'streak_7', name: '7 Dias de Fogo', description: '7 dias consecutivos treinando!', icon: 'Flame' },
  { criteria_type: 'streak_14', name: '14 Dias Imparável', description: '14 dias consecutivos treinando!', icon: 'Zap' },
  { criteria_type: 'streak_30', name: 'Mês de Consistência', description: '30 dias consecutivos treinando!', icon: 'Award' },
  { criteria_type: 'workouts_10', name: '10 Treinos', description: 'Completou 10 treinos!', icon: 'Target' },
  { criteria_type: 'workouts_50', name: '50 Treinos', description: 'Completou 50 treinos!', icon: 'Target' },
  { criteria_type: 'workouts_100', name: 'Centenário', description: 'Completou 100 treinos!', icon: 'Star' },
  { criteria_type: 'load_record', name: 'Recorde de Carga', description: 'Novo recorde pessoal de carga!', icon: 'ArrowUp' },
  { criteria_type: 'sets_100', name: '100 Séries', description: 'Completou 100 séries!', icon: 'Activity' },
  { criteria_type: 'sets_500', name: '500 Séries', description: 'Completou 500 séries!', icon: 'Rocket' },
  { criteria_type: 'month_consistency', name: 'Consistência Mensal', description: 'Atingiu meta de frequência no mês!', icon: 'Calendar' },
  { criteria_type: 'perfect_week', name: 'Semana Perfeita', description: 'Completou todos os treinos da semana!', icon: 'CheckCircle' },
] as const;

// ---- RPE Scale ----

export const RPE_SCALE = [
  { value: 1, label: '1 - Muito Leve' },
  { value: 2, label: '2 - Leve' },
  { value: 3, label: '3' },
  { value: 4, label: '4 - Moderado' },
  { value: 5, label: '5' },
  { value: 6, label: '6 - Moderado/Pesado' },
  { value: 7, label: '7 - Pesado' },
  { value: 8, label: '8' },
  { value: 9, label: '9 - Muito Pesado' },
  { value: 10, label: '10 - Máximo' },
] as const;
