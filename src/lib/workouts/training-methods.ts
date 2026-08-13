export const TRAINING_METHODS = {
  standard: {
    label: 'Série tradicional',
    group: 'Fundamentos',
    summary: 'Execute todas as séries com o descanso programado.',
    instruction: 'Faça as repetições prescritas, descanse o tempo indicado e repita até completar as séries.',
    notePlaceholder: 'Ex.: manter 2 repetições na reserva e controlar a descida.',
  },
  dropset: {
    label: 'Drop-set',
    group: 'Intensidade',
    summary: 'Continue a série após reduzir a carga.',
    instruction: 'Ao terminar a faixa prevista, reduza a carga conforme a orientação e continue com pouca ou nenhuma pausa.',
    notePlaceholder: 'Ex.: na última série, fazer 2 reduções de 20% da carga.',
  },
  rest_pause: {
    label: 'Rest-pause',
    group: 'Intensidade',
    summary: 'Divida a série com pausas muito curtas.',
    instruction: 'Execute o bloco inicial, faça a pausa curta definida pelo personal e complete os miniblocos prescritos.',
    notePlaceholder: 'Ex.: 10 reps + 15s + 3 reps + 15s + 3 reps.',
  },
  to_failure: {
    label: 'Até a falha técnica',
    group: 'Intensidade',
    summary: 'Encerre quando não conseguir repetir com técnica segura.',
    instruction: 'Continue somente enquanto mantiver a execução indicada; pare na falha técnica ou antes, conforme a orientação do personal.',
    notePlaceholder: 'Ex.: somente a última série; interromper ao perder a amplitude.',
  },
  myo_reps: {
    label: 'Myo-reps',
    group: 'Intensidade',
    summary: 'Faça uma série de ativação seguida de miniblocos.',
    instruction: 'Complete a série de ativação e depois faça pequenos blocos com pausas curtas, respeitando o limite definido.',
    notePlaceholder: 'Ex.: 15 reps + 4 miniblocos de 4 reps, com 15s.',
  },
  cluster_set: {
    label: 'Cluster set',
    group: 'Intensidade',
    summary: 'Use micropausas dentro da mesma série.',
    instruction: 'Divida a série em blocos menores e faça a micropausa indicada entre eles antes do descanso principal.',
    notePlaceholder: 'Ex.: 4 blocos de 2 reps, com 20s entre blocos.',
  },
  biset: {
    label: 'Bi-set',
    group: 'Combinações',
    summary: 'Combine dois exercícios em sequência.',
    instruction: 'Execute este exercício e o exercício combinado na ordem indicada, descansando somente após completar os dois.',
    notePlaceholder: 'Ex.: combinar com o próximo exercício; descansar 60s ao final.',
  },
  triset: {
    label: 'Tri-set',
    group: 'Combinações',
    summary: 'Combine três exercícios em sequência.',
    instruction: 'Execute os três exercícios indicados em sequência e descanse somente ao final do bloco.',
    notePlaceholder: 'Ex.: exercícios 2, 3 e 4 em sequência; 90s ao final.',
  },
  superset: {
    label: 'Supersérie',
    group: 'Combinações',
    summary: 'Alterne dois exercícios definidos pelo personal.',
    instruction: 'Faça este exercício e o exercício pareado sem descanso entre eles; descanse após completar o par.',
    notePlaceholder: 'Ex.: alternar com remada; 60s após completar o par.',
  },
  giant_set: {
    label: 'Giant set',
    group: 'Combinações',
    summary: 'Agrupe quatro ou mais exercícios em sequência.',
    instruction: 'Execute todos os exercícios do bloco na ordem indicada e descanse somente ao concluir a rodada.',
    notePlaceholder: 'Ex.: exercícios 1 a 4 em circuito; 2min ao final.',
  },
  circuit: {
    label: 'Circuito',
    group: 'Combinações',
    summary: 'Execute uma rodada de exercícios em sequência.',
    instruction: 'Siga a ordem do circuito, respeite o intervalo entre estações e descanse ao final de cada rodada.',
    notePlaceholder: 'Ex.: 3 voltas; 20s entre exercícios e 2min entre voltas.',
  },
  pre_exhaustion: {
    label: 'Pré-exaustão',
    group: 'Combinações',
    summary: 'Faça um exercício isolado antes do composto.',
    instruction: 'Execute o exercício isolado indicado e siga para o exercício composto com o intervalo prescrito.',
    notePlaceholder: 'Ex.: combinar com o próximo exercício composto, sem descanso.',
  },
  post_exhaustion: {
    label: 'Pós-exaustão',
    group: 'Combinações',
    summary: 'Faça um exercício isolado depois do composto.',
    instruction: 'Execute o exercício composto e depois o exercício isolado indicado, seguindo o intervalo prescrito.',
    notePlaceholder: 'Ex.: após o exercício anterior, fazer 12–15 reps.',
  },
  pyramid_ascending: {
    label: 'Pirâmide crescente',
    group: 'Carga e repetições',
    summary: 'Aumente a carga e reduza as repetições entre séries.',
    instruction: 'Siga a progressão de carga e repetições informada pelo personal em cada série.',
    notePlaceholder: 'Ex.: 12/10/8 reps aumentando a carga a cada série.',
  },
  pyramid_descending: {
    label: 'Pirâmide decrescente',
    group: 'Carga e repetições',
    summary: 'Reduza a carga e aumente as repetições entre séries.',
    instruction: 'Siga a redução de carga e o aumento de repetições informados para cada série.',
    notePlaceholder: 'Ex.: 6/8/10 reps reduzindo a carga a cada série.',
  },
  wave_loading: {
    label: 'Carga em ondas',
    group: 'Carga e repetições',
    summary: 'Alterne blocos de carga e repetições em ondas.',
    instruction: 'Execute cada série com a combinação de carga e repetições definida e reinicie a progressão na onda seguinte.',
    notePlaceholder: 'Ex.: 6/4/2 reps; repetir a onda com pequena progressão de carga.',
  },
  isometric: {
    label: 'Isometria',
    group: 'Execução',
    summary: 'Sustente a posição pelo tempo prescrito.',
    instruction: 'Mantenha a posição indicada com controle e respiração, encerrando ao atingir o tempo ou perder a postura.',
    notePlaceholder: 'Ex.: sustentar 20s no ponto de maior tensão.',
  },
  time_under_tension: {
    label: 'Tempo sob tensão',
    group: 'Execução',
    summary: 'Controle a duração de cada fase do movimento.',
    instruction: 'Siga o tempo indicado para descida, pausa, subida e transição em cada repetição.',
    notePlaceholder: 'Ex.: cadência 3-1-1-0 (descida-pausa-subida-transição).',
  },
  paused_reps: {
    label: 'Repetições pausadas',
    group: 'Execução',
    summary: 'Faça uma pausa em um ponto específico do movimento.',
    instruction: 'Interrompa o movimento no ponto indicado, sustente pelo tempo prescrito e conclua a repetição com controle.',
    notePlaceholder: 'Ex.: pausar 2s no ponto mais baixo de cada repetição.',
  },
  eccentric: {
    label: 'Ênfase excêntrica',
    group: 'Execução',
    summary: 'Prolongue a fase de descida ou retorno.',
    instruction: 'Controle a fase excêntrica pelo tempo definido e complete a fase seguinte sem perder a postura.',
    notePlaceholder: 'Ex.: descida em 4s e subida controlada em 1s.',
  },
  partial_reps: {
    label: 'Repetições parciais',
    group: 'Execução',
    summary: 'Use a amplitude parcial definida pelo personal.',
    instruction: 'Execute somente o trecho de movimento indicado e mantenha o controle dentro dessa amplitude.',
    notePlaceholder: 'Ex.: após 10 reps completas, fazer 5 parciais na metade final.',
  },
  amrap: {
    label: 'AMRAP',
    group: 'Por tempo',
    summary: 'Faça o máximo de repetições ou rodadas com técnica no tempo.',
    instruction: 'Trabalhe durante o período definido, conte repetições ou rodadas válidas e preserve a execução segura.',
    notePlaceholder: 'Ex.: máximo de rodadas em 8min, mantendo 2 reps na reserva.',
  },
  emom: {
    label: 'EMOM',
    group: 'Por tempo',
    summary: 'Inicie o bloco programado a cada minuto.',
    instruction: 'Comece as repetições no início de cada minuto e use o tempo restante para descansar.',
    notePlaceholder: 'Ex.: 8 reps no início de cada minuto, durante 10min.',
  },
} as const;

export type TrainingMethodId = keyof typeof TRAINING_METHODS;
export type TrainingMethodGroup = typeof TRAINING_METHODS[TrainingMethodId]['group'];

export const TRAINING_METHOD_IDS = Object.keys(TRAINING_METHODS) as TrainingMethodId[];

export const TRAINING_METHOD_GROUPS = [
  'Fundamentos',
  'Intensidade',
  'Combinações',
  'Carga e repetições',
  'Execução',
  'Por tempo',
] as const satisfies readonly TrainingMethodGroup[];

export function isTrainingMethodId(value: unknown): value is TrainingMethodId {
  return typeof value === 'string' && value in TRAINING_METHODS;
}

export function normalizeTrainingMethod(method?: string | null, methodNotes?: string | null) {
  const value = method?.trim() || '';
  const notes = methodNotes?.trim() || '';
  if (isTrainingMethodId(value)) return { method: value, methodNotes: notes };
  return {
    method: 'standard' as const,
    methodNotes: [value, notes].filter(Boolean).join(' · '),
  };
}

export function trainingMethodDetails(method?: string | null) {
  const normalized = normalizeTrainingMethod(method);
  return { id: normalized.method, ...TRAINING_METHODS[normalized.method] };
}
