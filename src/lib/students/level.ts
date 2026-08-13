export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';

export const STUDENT_LEVEL_LABELS: Record<StudentLevel, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

// O rótulo precisa ser idêntico em toda a API: a tela de reaproveitamento de
// fichas compara o nível da ficha com o nível dos alunos por esse texto.
export function studentLevelLabel(level: string | null | undefined) {
  return STUDENT_LEVEL_LABELS[level as StudentLevel] ?? STUDENT_LEVEL_LABELS.advanced;
}
