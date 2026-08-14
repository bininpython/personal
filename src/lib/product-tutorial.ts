export const PRODUCT_TUTORIAL_VERSION = 5;
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
  | 'book-open'
  | 'download'
  | 'send'
  | 'clipboard-check'
  | 'shield';

export interface ProductTutorialStep {
  id: string;
  title: string;
  description: string;
  checklist: readonly string[];
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
    description: 'Do primeiro aluno ao acompanhamento: siga as ações na ordem e deixe o app pronto para sua rotina.',
    startHref: '/students/new',
    startLabel: 'Cadastrar primeiro aluno',
    steps: [
      {
        id: 'trainer-dashboard',
        title: 'Comece pela visão geral',
        description: 'O painel reúne alunos ativos, treinos concluídos, mensagens e situações que precisam da sua atenção.',
        checklist: [
          'Confira os números e avisos do dia.',
          'Use os atalhos para abrir rapidamente a tarefa prioritária.',
        ],
        tip: 'Comece o atendimento diário pelo painel para não deixar alertas importantes para trás.',
        href: '/dashboard',
        actionLabel: 'Abrir visão geral',
        icon: 'dashboard',
      },
      {
        id: 'trainer-students',
        title: 'Cadastre e convide seu aluno',
        description: 'Informe apenas os dados necessários. O sistema gera um código individual para o aluno entrar sem e-mail e sem senha.',
        checklist: [
          'Abra Alunos e escolha Novo aluno.',
          'Confirme a autorização para realizar o cadastro.',
          'Entregue ao aluno o nome cadastrado e o código gerado.',
        ],
        tip: 'No primeiro acesso, o próprio aluno confirma os Termos e a Política de Privacidade.',
        href: '/students/new',
        actionLabel: 'Cadastrar aluno',
        icon: 'user-plus',
      },
      {
        id: 'trainer-library',
        title: 'Publique uma ficha da Biblioteca',
        description: 'Escolha um programa profissional já estruturado, confira os exercícios e envie diretamente para o aluno.',
        checklist: [
          'Abra Biblioteca de fichas e use os filtros de público, objetivo, mês e nível.',
          'Confira as fichas A, B, C e os métodos de cada exercício.',
          'Escolha o aluno e publique o ciclo de 8 semanas.',
        ],
        tip: 'Ao publicar um modelo, a ficha anterior do aluno vai para o histórico e a nova fica ativa imediatamente.',
        href: '/library',
        actionLabel: 'Abrir Biblioteca',
        icon: 'book-open',
      },
      {
        id: 'trainer-workout',
        title: 'Monte e publique a ficha',
        description: 'Escolha o aluno, organize os dias e configure exercícios, séries, repetições, carga, descanso e o método de treino.',
        checklist: [
          'Abra Montar ficha e selecione o aluno.',
          'Adicione os dias e exercícios na ordem desejada.',
          'Escolha o método de cada exercício e registre uma orientação personalizada quando necessário.',
          'Revise a validade e publique a ficha.',
        ],
        tip: 'A ficha só aparece para o aluno depois de ser publicada.',
        href: '/exercises',
        actionLabel: 'Abrir montador',
        icon: 'dumbbell',
      },
      {
        id: 'trainer-pdf',
        title: 'Baixe a ficha completa em PDF',
        description: 'Gere uma versão pronta para imprimir ou compartilhar quando o aluno precisar consultar a rotina fora do app.',
        checklist: [
          'Abra Gerenciar fichas e localize o plano.',
          'Use a opção Baixar PDF no cartão da ficha.',
          'Confira aluno, dias, exercícios e orientações no arquivo.',
        ],
        tip: 'Baixe novamente após alterações para garantir que o PDF represente a versão mais recente.',
        href: '/workouts',
        actionLabel: 'Gerenciar fichas',
        icon: 'download',
      },
      {
        id: 'trainer-share',
        title: 'Reutilize a ficha com outro aluno',
        description: 'Envie uma cópia de uma ficha pronta para outro aluno e ajuste somente o que for individual, sem começar do zero.',
        checklist: [
          'Em Gerenciar fichas, escolha Enviar para outro aluno.',
          'Selecione o aluno que receberá a cópia.',
          'Confirme o envio e revise a nova ficha antes de usar.',
        ],
        tip: 'A cópia fica separada da original: mudanças posteriores não alteram a ficha do primeiro aluno.',
        href: '/workouts',
        actionLabel: 'Reutilizar uma ficha',
        icon: 'send',
      },
      {
        id: 'trainer-assessments',
        title: 'Registre avaliações com contexto',
        description: 'Centralize medidas e observações para comparar períodos e apoiar ajustes de treino com informação organizada.',
        checklist: [
          'Abra Avaliações e escolha o aluno.',
          'Registre somente as informações realmente coletadas.',
          'Compare a evolução antes de alterar o planejamento.',
        ],
        tip: 'Dados de saúde são sensíveis. Evite anotações desnecessárias e mantenha apenas o que ajuda no acompanhamento.',
        href: '/assessments',
        actionLabel: 'Abrir avaliações',
        icon: 'clipboard-check',
      },
      {
        id: 'trainer-contact',
        title: 'Mantenha o acompanhamento próximo',
        description: 'Use mensagens e alertas para orientar, responder dúvidas e identificar alunos que precisam de atenção.',
        checklist: [
          'Confira mensagens não lidas.',
          'Priorize relatos de dor ou dificuldade.',
          'Registre a orientação no próprio atendimento do app.',
        ],
        tip: 'Em caso de relato de dor, oriente o aluno a interromper o exercício e avalie a conduta adequada.',
        href: '/messages',
        actionLabel: 'Abrir mensagens',
        icon: 'message',
      },
      {
        id: 'trainer-results',
        title: 'Acompanhe os resultados',
        description: 'Relatórios e perfis mostram frequência, conclusão, volume e avaliações para apoiar suas decisões.',
        checklist: [
          'Compare frequência e conclusão ao longo das semanas.',
          'Observe volume, avaliações e alertas em conjunto.',
          'Ajuste a ficha quando a evolução ou a dificuldade pedir.',
        ],
        tip: 'Use tendências de várias semanas; um treino isolado raramente conta toda a história.',
        href: '/reports',
        actionLabel: 'Ver relatórios',
        icon: 'chart',
      },
    ],
  },
  student: {
    roleLabel: 'Aluno',
    title: 'Sua ficha, passo a passo',
    description: 'Do primeiro acesso à evolução: veja exatamente onde tocar e o que registrar em cada momento.',
    startHref: '/workout',
    startLabel: 'Abrir ficha do dia',
    steps: [
      {
        id: 'student-access',
        title: 'Conclua seu primeiro acesso',
        description: 'Entre com o nome e o código enviados pelo personal. Na primeira vez, confirme os documentos e complete somente os dados necessários.',
        checklist: [
          'Digite seu nome da mesma forma usada no cadastro.',
          'Informe o código individual recebido do personal.',
          'Leia e confirme os Termos e a Política de Privacidade.',
        ],
        tip: 'Seu código é pessoal. Se perdê-lo, peça ao personal para gerar outro.',
        href: '/profile',
        actionLabel: 'Abrir meu perfil',
        icon: 'shield',
      },
      {
        id: 'student-home',
        title: 'Confira a ficha do dia',
        description: 'A tela inicial mostra a ficha ativa, a próxima ficha do dia e um resumo da sua rotina recente.',
        checklist: [
          'Confirme o nome da ficha ativa.',
          'Veja qual ficha A, B, C ou D será executada.',
          'Abra a ficha quando estiver pronto para começar.',
        ],
        tip: 'Se uma ficha nova não aparecer, atualize a tela e confirme com seu personal se ela já foi publicada.',
        href: '/home',
        actionLabel: 'Abrir início',
        icon: 'home',
      },
      {
        id: 'student-library',
        title: 'Veja o que seu personal enviou',
        description: 'Sua Biblioteca é privada e mostra somente fichas que o personal publicou especificamente para você.',
        checklist: [
          'Abra Biblioteca para conferir o programa recebido.',
          'Veja a quantidade de fichas e exercícios.',
          'Inicie o treino ou baixe o PDF personalizado.',
        ],
        tip: 'O catálogo geral não fica disponível para alunos; fale com o personal para receber outro programa.',
        href: '/student-library',
        actionLabel: 'Abrir Biblioteca',
        icon: 'book-open',
      },
      {
        id: 'student-workout',
        title: 'Registre cada série',
        description: 'Durante o treino, confira o método orientado, informe repetições e carga, marque as séries concluídas e use o descanso cronometrado.',
        checklist: [
          'Abra o exercício e confira o método e as orientações do personal.',
          'Preencha repetições, carga e esforço percebido.',
          'Marque cada série concluída antes de avançar.',
        ],
        tip: 'A sequência é semanal: siga A, B, C e os demais dias configurados. Na semana seguinte, a ficha começa novamente em A.',
        href: '/workout',
        actionLabel: 'Abrir ficha do dia',
        icon: 'dumbbell',
      },
      {
        id: 'student-pdf',
        title: 'Leve sua ficha em PDF',
        description: 'Baixe a ficha completa para consultar os dias, exercícios e orientações mesmo quando preferir usar um arquivo.',
        checklist: [
          'Abra seu treino ativo.',
          'Toque em Baixar ficha em PDF.',
          'Guarde apenas a versão mais recente da ficha.',
        ],
        tip: 'O app continua sendo o melhor lugar para registrar séries e conclusão; o PDF serve como consulta.',
        href: '/workout',
        actionLabel: 'Abrir ficha ativa',
        icon: 'download',
      },
      {
        id: 'student-history',
        title: 'Finalize e consulte o histórico',
        description: 'Ao concluir, avalie o treino. A sessão fica registrada com duração, percentual concluído e volume realizado.',
        checklist: [
          'Revise se as séries realizadas foram marcadas.',
          'Conclua o treino e informe sua avaliação.',
          'Abra o Histórico para consultar a sessão salva.',
        ],
        tip: 'O histórico ajuda você e seu personal a comparar treinos sem depender da memória.',
        href: '/history',
        actionLabel: 'Ver histórico',
        icon: 'history',
      },
      {
        id: 'student-progress',
        title: 'Acompanhe sua evolução',
        description: 'Veja consistência, volume e outros indicadores para entender seu ritmo ao longo das semanas.',
        checklist: [
          'Abra Evolução após acumular alguns treinos.',
          'Compare semanas e observe sua constância.',
          'Converse com o personal antes de mudar a ficha por conta própria.',
        ],
        tip: 'Resultado vem da tendência. Compare períodos, não apenas um treino isolado.',
        href: '/progress',
        actionLabel: 'Ver evolução',
        icon: 'chart',
      },
      {
        id: 'student-support',
        title: 'Fale com seu personal',
        description: 'Envie dúvidas e observações pelo chat. O histórico da conversa fica junto da sua rotina de acompanhamento.',
        checklist: [
          'Abra Mensagens e escolha a conversa com o personal.',
          'Explique a dúvida com detalhes objetivos.',
          'Em caso de dor, pare o exercício e relate o ocorrido.',
        ],
        tip: 'Informe qual exercício, região e momento causaram desconforto para facilitar a orientação.',
        href: '/student-messages',
        actionLabel: 'Abrir mensagens',
        icon: 'message',
      },
      {
        id: 'student-data',
        title: 'Controle seus dados',
        description: 'No perfil você revisa seus dados, exporta uma cópia das informações e pode solicitar a exclusão da conta.',
        checklist: [
          'Mantenha somente os dados úteis ao acompanhamento.',
          'Use Exportar meus dados quando quiser uma cópia.',
          'Leia os avisos antes de confirmar uma exclusão permanente.',
        ],
        tip: 'Para trocar o código individual, peça ao personal para gerar um novo acesso.',
        href: '/profile',
        actionLabel: 'Abrir meu perfil',
        icon: 'profile',
      },
    ],
  },
  individual: {
    roleLabel: 'Atleta independente',
    title: 'Monte sua própria rotina',
    description: 'Crie, organize e baixe suas fichas pessoais com um caminho simples do início ao controle da conta.',
    startHref: '/my-exercises',
    startLabel: 'Montar minha primeira ficha',
    steps: [
      {
        id: 'individual-home',
        title: 'Use sua visão geral',
        description: 'A página inicial reúne suas fichas e os atalhos principais da área individual.',
        checklist: [
          'Confira qual ficha representa sua rotina atual.',
          'Use os atalhos para montar ou consultar um plano.',
        ],
        tip: 'Esta conta é de uso próprio e não inclui gestão de alunos ou recursos de personal.',
        href: '/my',
        actionLabel: 'Abrir visão geral',
        icon: 'dashboard',
      },
      {
        id: 'individual-library',
        title: 'Escolha um programa na Biblioteca',
        description: 'Use um dos programas G KONG já estruturados e comece sem montar a ficha do zero.',
        checklist: [
          'Filtre por público, objetivo, mês e nível.',
          'Confira cada ficha e a demonstração dos exercícios.',
          'Baixe o PDF ou ative o ciclo de 8 semanas.',
        ],
        tip: 'Ao ativar um modelo, sua ficha atual permanece guardada no histórico de planos.',
        href: '/my-library',
        actionLabel: 'Abrir Biblioteca',
        icon: 'book-open',
      },
      {
        id: 'individual-builder',
        title: 'Monte sua ficha',
        description: 'Escolha os exercícios, distribua os dias e defina séries, repetições, carga, descanso e o método de treino.',
        checklist: [
          'Abra Montar ficha e dê um nome ao plano.',
          'Crie os dias e adicione os exercícios na ordem desejada.',
          'Escolha o método de cada exercício e ajuste a orientação personalizada.',
          'Revise os dados antes de salvar.',
        ],
        tip: 'Dê nomes claros às fichas A, B, C e D para encontrar rapidamente a ficha do dia.',
        href: '/my-exercises',
        actionLabel: 'Abrir montador',
        icon: 'book-open',
      },
      {
        id: 'individual-workout',
        title: 'Execute a ficha do dia',
        description: 'Inicie a ficha indicada para o dia, marque cada série e use a contagem regressiva automática do descanso.',
        checklist: [
          'Abra Ficha do dia e confirme a ficha destacada.',
          'Registre repetições, carga e RPE em cada série.',
          'Conclua e salve para liberar a próxima ficha da sequência.',
        ],
        tip: 'A sequência reinicia toda semana. Exemplo com quatro dias: A → B → C → D; na semana seguinte começa em A.',
        href: '/my-workout',
        actionLabel: 'Iniciar ficha do dia',
        icon: 'dumbbell',
      },
      {
        id: 'individual-history',
        title: 'Acompanhe sua evolução',
        description: 'O histórico reúne duração, conclusão, volume, avaliação e observações de cada treino salvo.',
        checklist: [
          'Abra Histórico depois de concluir o primeiro treino.',
          'Compare a constância e o volume registrado.',
          'Use a execução anterior como referência de carga e repetições.',
        ],
        tip: 'Aumente carga ou repetições gradualmente e preserve a técnica do movimento.',
        href: '/my-history',
        actionLabel: 'Abrir histórico',
        icon: 'history',
      },
      {
        id: 'individual-plans',
        title: 'Organize suas fichas',
        description: 'Consulte os planos criados e mantenha ativa a ficha que representa sua rotina atual.',
        checklist: [
          'Abra Minhas fichas e localize o plano desejado.',
          'Confira os dias, a validade e o conteúdo.',
          'Atualize a rotina quando seu objetivo ou disponibilidade mudar.',
        ],
        tip: 'Faça ajustes graduais e procure orientação profissional quando tiver dúvidas ou limitações.',
        href: '/my-plans',
        actionLabel: 'Ver minhas fichas',
        icon: 'dumbbell',
      },
      {
        id: 'individual-pdf',
        title: 'Baixe sua ficha em PDF',
        description: 'Gere um arquivo completo com os dias, exercícios e orientações da ficha para consultar ou imprimir.',
        checklist: [
          'Abra Minhas fichas e escolha o plano.',
          'Use a opção Baixar PDF.',
          'Baixe outra vez sempre que atualizar a ficha.',
        ],
        tip: 'Evite acumular versões antigas para não seguir orientações desatualizadas.',
        href: '/my-plans',
        actionLabel: 'Baixar uma ficha',
        icon: 'download',
      },
      {
        id: 'individual-profile',
        title: 'Cuide da sua conta',
        description: 'No perfil você atualiza seus dados e encontra os controles de privacidade, exportação e acesso.',
        checklist: [
          'Mantenha o nome da conta atualizado.',
          'Exporte seus dados quando quiser uma cópia.',
          'Troque o código se houver suspeita de acesso indevido.',
        ],
        tip: 'Nunca compartilhe seu código pessoal com terceiros.',
        href: '/my-profile',
        actionLabel: 'Abrir meu perfil',
        icon: 'profile',
      },
    ],
  },
};

const APP_PATHS: Record<TutorialRole, readonly string[]> = {
  trainer: ['/dashboard', '/students', '/workouts', '/library', '/exercises', '/assessments', '/schedule', '/messages', '/alerts', '/reports', '/settings'],
  student: ['/home', '/workout', '/student-library', '/history', '/progress', '/student-messages', '/profile'],
  individual: ['/my', '/my-workout', '/my-library', '/my-history', '/my-exercises', '/my-plans', '/my-profile'],
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
