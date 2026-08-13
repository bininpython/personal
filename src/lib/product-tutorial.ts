export const PRODUCT_TUTORIAL_VERSION = 1;
export const PRODUCT_TUTORIAL_OPEN_EVENT = 'g-kong:open-product-tutorial';

export type TutorialRole = import('@/types').UserRole;
export type TutorialStatus = 'completed' | 'dismissed' | 'started';

const TUTORIAL_STATUS_PRIORITY: Record<TutorialStatus, number> = {
  started: 1,
  dismissed: 2,
  completed: 3,
};

export type TutorialIcon =
  | 'dashboard'
  | 'user-plus'
  | 'dumbbell'
  | 'message'
  | 'chart'
  | 'home'
  | 'history'
  | 'profile'
  | 'book-open';

export interface ProductTutorialStep {
  id: string;
  title: string;
  description: string;
  tip: string;
  href: string;
  actionLabel: string;
  icon: TutorialIcon;
}

export interface ProductTutorial {
  roleLabel: string;
  title: string;
  description: string;
  startHref: string;
  startLabel: string;
  steps: readonly ProductTutorialStep[];
}

export const PRODUCT_TUTORIALS: Record<TutorialRole, ProductTutorial> = {
  trainer: {
    roleLabel: 'Personal',
    title: 'Coloque sua operação para rodar',
    description: 'Conheça o caminho mais curto entre cadastrar um aluno e acompanhar sua evolução.',
    startHref: '/students/new',
    startLabel: 'Cadastrar primeiro aluno',
    steps: [
      {
        id: 'trainer-dashboard',
        title: 'Comece pela visão geral',
        description: 'O painel reúne alunos ativos, treinos concluídos, mensagens e situações que precisam da sua atenção.',
        tip: 'Use os atalhos do painel para agir sem procurar a mesma informação em várias telas.',
        href: '/dashboard',
        actionLabel: 'Abrir visão geral',
        icon: 'dashboard',
      },
      {
        id: 'trainer-students',
        title: 'Cadastre e convide seu aluno',
        description: 'Informe os dados essenciais. O sistema gera um código individual para o aluno entrar sem e-mail e sem senha.',
        tip: 'Entregue ao aluno exatamente o nome cadastrado e o código gerado.',
        href: '/students/new',
        actionLabel: 'Cadastrar aluno',
        icon: 'user-plus',
      },
      {
        id: 'trainer-workout',
        title: 'Monte e publique a ficha',
        description: 'Escolha o aluno, organize os dias e configure exercícios, séries, repetições, carga e descanso.',
        tip: 'A ficha só aparece para o aluno depois de ser publicada.',
        href: '/exercises',
        actionLabel: 'Abrir montador',
        icon: 'dumbbell',
      },
      {
        id: 'trainer-contact',
        title: 'Mantenha o acompanhamento próximo',
        description: 'Use as mensagens para orientar, corrigir e responder sem misturar o atendimento com conversas pessoais.',
        tip: 'Alertas de dor ou dificuldade ajudam a priorizar quem precisa de contato.',
        href: '/messages',
        actionLabel: 'Abrir mensagens',
        icon: 'message',
      },
      {
        id: 'trainer-results',
        title: 'Acompanhe os resultados',
        description: 'Relatórios e perfis mostram frequência, conclusão, volume e avaliações para apoiar suas decisões.',
        tip: 'Revise os relatórios com frequência e ajuste a ficha quando a evolução pedir.',
        href: '/reports',
        actionLabel: 'Ver relatórios',
        icon: 'chart',
      },
    ],
  },
  student: {
    roleLabel: 'Aluno',
    title: 'Seu treino, passo a passo',
    description: 'Veja onde encontrar a ficha, registrar cada série e acompanhar sua evolução com o personal.',
    startHref: '/workout',
    startLabel: 'Abrir meu treino',
    steps: [
      {
        id: 'student-home',
        title: 'Confira o treino do dia',
        description: 'A tela inicial mostra a ficha ativa, o próximo treino e um resumo da sua rotina recente.',
        tip: 'Se uma ficha nova não aparecer, atualize a tela e confirme com seu personal se ela já foi publicada.',
        href: '/home',
        actionLabel: 'Abrir início',
        icon: 'home',
      },
      {
        id: 'student-workout',
        title: 'Registre cada série',
        description: 'Durante o treino, informe repetições e carga, marque as séries concluídas e use o descanso cronometrado.',
        tip: 'Se a conexão cair, o G KONG guarda a conclusão neste aparelho e sincroniza quando a internet voltar.',
        href: '/workout',
        actionLabel: 'Abrir treino',
        icon: 'dumbbell',
      },
      {
        id: 'student-history',
        title: 'Consulte o histórico',
        description: 'Treinos finalizados ficam registrados com duração, percentual concluído e volume realizado.',
        tip: 'O histórico ajuda você e seu personal a comparar treinos sem depender da memória.',
        href: '/history',
        actionLabel: 'Ver histórico',
        icon: 'history',
      },
      {
        id: 'student-progress',
        title: 'Acompanhe sua evolução',
        description: 'Veja consistência, volume e outros indicadores para entender seu ritmo ao longo das semanas.',
        tip: 'Resultado vem da tendência. Compare períodos, não apenas um treino isolado.',
        href: '/progress',
        actionLabel: 'Ver evolução',
        icon: 'chart',
      },
      {
        id: 'student-support',
        title: 'Fale com seu personal',
        description: 'Envie dúvidas e observações pelo chat. Em caso de dor, pare o exercício e relate o ocorrido.',
        tip: 'Seu perfil também permite exportar seus dados ou solicitar a exclusão da conta.',
        href: '/student-messages',
        actionLabel: 'Abrir mensagens',
        icon: 'message',
      },
    ],
  },
  individual: {
    roleLabel: 'Atleta independente',
    title: 'Monte sua própria rotina',
    description: 'Aprenda a criar fichas pessoais, consultar seus planos e manter os dados da conta em ordem.',
    startHref: '/my-exercises',
    startLabel: 'Montar minha primeira ficha',
    steps: [
      {
        id: 'individual-home',
        title: 'Use sua visão geral',
        description: 'A página inicial reúne suas fichas e os atalhos principais da área individual.',
        tip: 'Esta conta é de uso próprio e não inclui gestão de alunos ou recursos de personal.',
        href: '/my',
        actionLabel: 'Abrir visão geral',
        icon: 'dashboard',
      },
      {
        id: 'individual-builder',
        title: 'Monte sua ficha',
        description: 'Escolha os exercícios, distribua os dias e defina séries, repetições, carga e descanso.',
        tip: 'Dê nomes claros aos dias para encontrar rapidamente o treino certo.',
        href: '/my-exercises',
        actionLabel: 'Abrir montador',
        icon: 'book-open',
      },
      {
        id: 'individual-plans',
        title: 'Organize suas fichas',
        description: 'Consulte os planos criados e mantenha ativa a ficha que representa sua rotina atual.',
        tip: 'Revise sua seleção de exercícios quando objetivo, disponibilidade ou limitações mudarem.',
        href: '/my-plans',
        actionLabel: 'Ver minhas fichas',
        icon: 'dumbbell',
      },
      {
        id: 'individual-profile',
        title: 'Cuide da sua conta',
        description: 'No perfil você atualiza seus dados e encontra os controles de privacidade e acesso.',
        tip: 'Nunca compartilhe seu código. Troque-o se houver qualquer suspeita de acesso indevido.',
        href: '/my-profile',
        actionLabel: 'Abrir meu perfil',
        icon: 'profile',
      },
    ],
  },
};

const APP_PATHS: Record<TutorialRole, readonly string[]> = {
  trainer: ['/dashboard', '/students', '/workouts', '/exercises', '/assessments', '/schedule', '/messages', '/alerts', '/reports', '/settings'],
  student: ['/home', '/workout', '/history', '/progress', '/student-messages', '/profile'],
  individual: ['/my', '/my-exercises', '/my-plans', '/my-profile'],
};

interface StorageReader {
  getItem(key: string): string | null;
}

interface StorageWriter extends StorageReader {
  setItem(key: string, value: string): void;
}

interface StoredTutorialState {
  version: number;
  status: TutorialStatus;
  updatedAt: string;
}

export function productTutorialStorageKey(role: TutorialRole, userId: string) {
  return `g-kong:product-tutorial:v${PRODUCT_TUTORIAL_VERSION}:${role}:${userId}`;
}

export function isProductTutorialStatus(value: unknown): value is TutorialStatus {
  return value === 'completed' || value === 'dismissed' || value === 'started';
}

export function resolveProductTutorialStatus(
  current: TutorialStatus | null,
  incoming: TutorialStatus,
) {
  if (!current) return incoming;
  return TUTORIAL_STATUS_PRIORITY[current] >= TUTORIAL_STATUS_PRIORITY[incoming]
    ? current
    : incoming;
}

export function readProductTutorialStatus(
  storage: StorageReader,
  role: TutorialRole,
  userId: string,
): TutorialStatus | null {
  try {
    const raw = storage.getItem(productTutorialStorageKey(role, userId));
    if (!raw) return null;
    const state = JSON.parse(raw) as Partial<StoredTutorialState>;
    if (state.version !== PRODUCT_TUTORIAL_VERSION) return null;
    if (!isProductTutorialStatus(state.status)) return null;
    return state.status;
  } catch {
    return null;
  }
}

export function writeProductTutorialStatus(
  storage: StorageWriter,
  role: TutorialRole,
  userId: string,
  status: TutorialStatus,
  updatedAt = new Date().toISOString(),
) {
  const state: StoredTutorialState = {
    version: PRODUCT_TUTORIAL_VERSION,
    status,
    updatedAt,
  };
  storage.setItem(productTutorialStorageKey(role, userId), JSON.stringify(state));
}

export function isProductTutorialPath(role: TutorialRole, pathname: string) {
  if (pathname === '/help') return true;
  return APP_PATHS[role].some((basePath) => pathname === basePath || pathname.startsWith(`${basePath}/`));
}
