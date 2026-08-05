export const MUSCLE_REGIONS = {
  chest: 'Peito',
  'upper-back': 'Costas',
  'lower-back': 'Lombar',
  trapezius: 'Trapézio',
  'front-deltoids': 'Ombros (frontal e lateral)',
  'back-deltoids': 'Ombros (posterior)',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearm: 'Antebraços',
  abs: 'Abdômen',
  obliques: 'Oblíquos',
  neck: 'Pescoço',
  quadriceps: 'Quadríceps',
  hamstring: 'Posterior de coxa',
  adductor: 'Adutores',
  abductors: 'Abdutores',
  gluteal: 'Glúteos',
  calves: 'Panturrilhas',
} as const;

export type MuscleRegion = keyof typeof MUSCLE_REGIONS;
export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ExerciseCatalogItem {
  key: string;
  name: string;
  primaryMuscle: MuscleRegion;
  secondaryMuscles: MuscleRegion[];
  equipment: string;
  difficulty: ExerciseDifficulty;
  instructions: string;
  videoUrl: string | null;
}

interface ExerciseDefinition {
  name: string;
  equipment: string;
  instructions: string;
  secondary?: MuscleRegion[];
  difficulty?: ExerciseDifficulty;
  video?: string;
}

const x = (
  name: string,
  equipment: string,
  instructions: string,
  secondary: MuscleRegion[] = [],
  difficulty: ExerciseDifficulty = 'intermediate',
  video?: string,
): ExerciseDefinition => ({ name, equipment, instructions, secondary, difficulty, video });

const DEFINITIONS: Record<MuscleRegion, ExerciseDefinition[]> = {
  chest: [
    x('Supino reto com barra', 'Barra e banco', 'Mantenha as escápulas apoiadas, desça a barra com controle até o peito e empurre.', ['triceps', 'front-deltoids'], 'intermediate', '/videos/chest/supino-reto-barra.mp4'),
    x('Supino reto com halteres', 'Halteres e banco', 'Desça os halteres ao lado do peito e estenda os braços sem perder a posição das escápulas.', ['triceps', 'front-deltoids'], 'intermediate', '/videos/chest/supino-reto-halteres.mp4'),
    x('Supino inclinado com barra', 'Barra e banco inclinado', 'Use inclinação moderada, desça a barra na parte superior do peito e empurre com controle.', ['triceps', 'front-deltoids'], 'intermediate', '/videos/chest/supino-inclinado-barra.mp4'),
    x('Supino inclinado 30° com halteres', 'Halteres e banco inclinado', 'Ajuste o banco a 30 graus e conduza os halteres em arco sobre a parte superior do peito.', ['triceps', 'front-deltoids'], 'intermediate', '/videos/chest/supino-inclinado-30-halteres.mp4'),
    x('Supino declinado com halteres', 'Halteres e banco declinado', 'Fixe os pés, desça os halteres com controle e empurre mantendo o tronco estável.', ['triceps', 'front-deltoids'], 'advanced', '/videos/chest/supino-declinado-halteres.mp4'),
    x('Supino sentado na máquina', 'Máquina', 'Ajuste o banco à linha do peito e empurre as alças sem elevar os ombros.', ['triceps', 'front-deltoids'], 'beginner', '/videos/chest/supino-sentado-maquina.mp4'),
    x('Crucifixo no crossover alto', 'Polia', 'Com leve flexão dos cotovelos, aproxime as mãos à frente e abaixo do peito.', ['front-deltoids'], 'intermediate', '/videos/chest/crucifixo-crossover-alto.mp4'),
    x('Voador peitoral', 'Máquina', 'Apoie as costas e aproxime os braços à frente do peito sem projetar os ombros.', ['front-deltoids'], 'beginner', '/videos/chest/voador-peitoral.mp4'),
    x('Supino declinado com barra', 'Barra e banco declinado', 'Desça a barra na linha inferior do peito e empurre mantendo as escápulas firmes.', ['triceps', 'front-deltoids'], 'advanced'),
    x('Supino com pegada fechada', 'Barra e banco', 'Use pegada pouco menor que os ombros e mantenha os cotovelos próximos ao tronco.', ['triceps', 'front-deltoids'], 'intermediate'),
    x('Chest press convergente', 'Máquina convergente', 'Ajuste o assento, empurre as alças para frente e aproxime-as no final.', ['triceps', 'front-deltoids'], 'beginner'),
    x('Crucifixo com halteres', 'Halteres e banco', 'Abra os braços com cotovelos semiflexionados e retorne em arco sobre o peito.', ['front-deltoids'], 'intermediate'),
    x('Crucifixo inclinado com halteres', 'Halteres e banco inclinado', 'Abra os braços em arco na linha superior do peito e una os halteres sem bater.', ['front-deltoids'], 'intermediate'),
    x('Crossover na polia média', 'Polia', 'Mantenha o tronco estável e una as mãos à frente do esterno.', ['front-deltoids'], 'intermediate'),
    x('Crossover na polia baixa', 'Polia', 'Puxe as alças de baixo para cima, terminando na altura do peito.', ['front-deltoids'], 'intermediate'),
    x('Flexão de braços', 'Peso corporal', 'Mantenha o corpo alinhado, desça o peito entre as mãos e empurre o chão.', ['triceps', 'front-deltoids', 'abs'], 'beginner'),
    x('Flexão inclinada', 'Banco ou apoio', 'Apoie as mãos em uma superfície elevada e execute mantendo o corpo alinhado.', ['triceps', 'front-deltoids', 'abs'], 'beginner'),
    x('Flexão declinada', 'Banco ou apoio', 'Eleve os pés e desça o peito mantendo abdômen e glúteos contraídos.', ['triceps', 'front-deltoids', 'abs'], 'advanced'),
    x('Paralelas com foco no peito', 'Barras paralelas', 'Incline levemente o tronco, desça com controle e empurre sem perder a estabilidade.', ['triceps', 'front-deltoids'], 'advanced'),
    x('Pullover com halter', 'Halter e banco', 'Leve o halter atrás da cabeça com braços semiflexionados e retorne sobre o peito.', ['upper-back', 'triceps'], 'intermediate'),
  ],
  'upper-back': [
    x('Puxada frontal aberta', 'Polia alta', 'Puxe a barra em direção à parte superior do peito, aproximando as escápulas.', ['biceps', 'back-deltoids'], 'beginner'),
    x('Puxada frontal fechada', 'Polia alta', 'Use pegada neutra ou fechada e conduza os cotovelos para baixo junto ao tronco.', ['biceps'], 'beginner'),
    x('Puxada supinada', 'Polia alta', 'Puxe com pegada supinada, mantendo o peito elevado e os cotovelos próximos.', ['biceps'], 'intermediate'),
    x('Barra fixa pronada', 'Barra fixa', 'Eleve o corpo levando o peito à barra sem balançar as pernas.', ['biceps', 'forearm'], 'advanced'),
    x('Barra fixa supinada', 'Barra fixa', 'Suba com pegada supinada e controle a descida completa.', ['biceps', 'forearm'], 'advanced'),
    x('Remada curvada com barra', 'Barra', 'Incline o tronco com coluna neutra e puxe a barra em direção ao abdômen.', ['biceps', 'back-deltoids', 'lower-back'], 'advanced'),
    x('Remada curvada supinada', 'Barra', 'Mantenha o tronco inclinado e puxe a barra ao abdômen com pegada supinada.', ['biceps', 'lower-back'], 'advanced'),
    x('Remada unilateral com halter', 'Halter e banco', 'Apoie uma mão, mantenha a coluna neutra e puxe o halter em direção ao quadril.', ['biceps', 'back-deltoids'], 'intermediate'),
    x('Remada baixa com triângulo', 'Polia baixa', 'Puxe o triângulo ao abdômen sem inclinar excessivamente o tronco.', ['biceps', 'back-deltoids'], 'beginner'),
    x('Remada baixa aberta', 'Polia baixa', 'Puxe a barra à linha inferior do peito, abrindo os cotovelos com controle.', ['biceps', 'back-deltoids'], 'intermediate'),
    x('Remada cavalinho', 'Barra T', 'Mantenha o peito apoiado ou tronco firme e puxe a carga em direção ao abdômen.', ['biceps', 'back-deltoids'], 'intermediate'),
    x('Remada máquina articulada', 'Máquina', 'Ajuste o apoio do peito e conduza os cotovelos para trás.', ['biceps', 'back-deltoids'], 'beginner'),
    x('Remada serrote', 'Halter', 'Com base estável, puxe o halter para trás e para cima junto ao corpo.', ['biceps', 'back-deltoids'], 'intermediate'),
    x('Remada invertida', 'Barra fixa baixa', 'Mantenha o corpo rígido e leve o peito até a barra.', ['biceps', 'back-deltoids', 'abs'], 'intermediate'),
    x('Pulldown com braços estendidos', 'Polia alta', 'Com braços quase estendidos, leve a barra até as coxas usando as dorsais.', ['triceps', 'abs'], 'intermediate'),
    x('Pullover na polia', 'Polia alta', 'Puxe a corda em arco até as coxas sem flexionar excessivamente os cotovelos.', ['triceps', 'abs'], 'intermediate'),
    x('Remada no TRX', 'TRX', 'Mantenha o corpo alinhado e puxe o peito em direção às alças.', ['biceps', 'back-deltoids', 'abs'], 'beginner'),
    x('Remada Meadows', 'Barra', 'Em posição lateral à barra, puxe a extremidade em direção ao quadril.', ['biceps', 'back-deltoids'], 'advanced'),
    x('Seal row', 'Barra ou halteres e banco alto', 'Deite de bruços no banco e puxe a carga sem usar impulso do tronco.', ['biceps', 'back-deltoids'], 'advanced'),
    x('Remada apoiada no banco inclinado', 'Halteres e banco', 'Apoie o peito no banco e puxe os halteres em direção ao tronco.', ['biceps', 'back-deltoids'], 'beginner'),
  ],
  'lower-back': [
    x('Extensão lombar no banco 45°', 'Banco romano', 'Desça o tronco com coluna neutra e retorne até alinhar o corpo.', ['gluteal', 'hamstring'], 'beginner'),
    x('Extensão lombar horizontal', 'Banco romano', 'Flexione o quadril e estenda até o tronco ficar alinhado, sem hiperestender.', ['gluteal', 'hamstring'], 'intermediate'),
    x('Good morning com barra', 'Barra', 'Leve o quadril para trás com joelhos semiflexionados e coluna neutra.', ['hamstring', 'gluteal'], 'advanced'),
    x('Levantamento terra convencional', 'Barra', 'Empurre o chão, mantenha a barra próxima ao corpo e estenda quadris e joelhos juntos.', ['gluteal', 'hamstring', 'upper-back', 'forearm'], 'advanced'),
    x('Levantamento terra com trap bar', 'Trap bar', 'Mantenha o tronco firme e levante estendendo joelhos e quadris.', ['quadriceps', 'gluteal', 'hamstring', 'forearm'], 'intermediate'),
    x('Superman no solo', 'Peso corporal', 'Eleve braços e pernas suavemente mantendo o pescoço alinhado.', ['gluteal'], 'beginner'),
    x('Bird dog', 'Peso corporal', 'Em quatro apoios, estenda braço e perna opostos sem girar o quadril.', ['abs', 'gluteal'], 'beginner'),
    x('Prancha reversa', 'Peso corporal', 'Eleve o quadril e mantenha uma linha dos ombros aos pés.', ['gluteal', 'hamstring', 'abs'], 'intermediate'),
    x('Rack pull', 'Barra e rack', 'Parta com a barra abaixo dos joelhos e estenda o quadril mantendo a barra próxima.', ['gluteal', 'upper-back', 'forearm'], 'advanced'),
    x('Extensão lombar na máquina', 'Máquina', 'Ajuste o apoio e estenda o tronco de forma controlada, sem hiperextensão.', [], 'beginner'),
  ],
  trapezius: [
    x('Encolhimento com barra', 'Barra', 'Eleve os ombros verticalmente, faça uma breve pausa e desça com controle.', ['forearm'], 'beginner'),
    x('Encolhimento com halteres', 'Halteres', 'Mantenha os braços ao lado do corpo e eleve os ombros sem girá-los.', ['forearm'], 'beginner'),
    x('Encolhimento no Smith', 'Smith', 'Segure a barra e eleve os ombros mantendo o tronco imóvel.', ['forearm'], 'beginner'),
    x('Encolhimento atrás do corpo', 'Barra', 'Segure a barra atrás das coxas e eleve as escápulas com controle.', ['forearm'], 'intermediate'),
    x('Encolhimento na polia baixa', 'Polia', 'Eleve os ombros contra a resistência constante da polia.', ['forearm'], 'beginner'),
    x('Farmer walk', 'Halteres ou kettlebells', 'Caminhe com postura alta, abdômen firme e cargas ao lado do corpo.', ['forearm', 'abs', 'calves'], 'intermediate'),
    x('Remada alta com barra', 'Barra', 'Puxe a barra até a linha do peito mantendo os cotovelos acima das mãos.', ['front-deltoids', 'biceps'], 'intermediate'),
    x('Remada alta na polia', 'Polia baixa', 'Puxe a barra para cima com amplitude confortável e ombros controlados.', ['front-deltoids', 'biceps'], 'intermediate'),
    x('Elevação em Y no banco inclinado', 'Halteres leves e banco', 'Eleve os braços formando um Y e aproxime suavemente as escápulas.', ['back-deltoids'], 'beginner'),
    x('Face pull', 'Polia e corda', 'Puxe a corda em direção ao rosto, abrindo as mãos e aproximando as escápulas.', ['back-deltoids', 'upper-back'], 'beginner'),
  ],
  'front-deltoids': [
    x('Desenvolvimento militar com barra', 'Barra', 'Empurre a barra acima da cabeça mantendo abdômen firme e trajetória vertical.', ['triceps', 'trapezius'], 'advanced'),
    x('Desenvolvimento com halteres sentado', 'Halteres e banco', 'Empurre os halteres acima da cabeça sem arquear a lombar.', ['triceps', 'trapezius'], 'intermediate'),
    x('Desenvolvimento Arnold', 'Halteres', 'Gire os antebraços durante a subida e termine com os braços acima da cabeça.', ['triceps'], 'intermediate'),
    x('Desenvolvimento na máquina', 'Máquina', 'Ajuste o assento e empurre as alças mantendo as costas apoiadas.', ['triceps'], 'beginner'),
    x('Desenvolvimento no Smith', 'Smith e banco', 'Posicione o banco e empurre a barra verticalmente com controle.', ['triceps'], 'intermediate'),
    x('Push press', 'Barra', 'Use uma leve impulsão das pernas e finalize a barra acima da cabeça.', ['triceps', 'quadriceps', 'gluteal'], 'advanced'),
    x('Elevação lateral com halteres', 'Halteres', 'Eleve os braços até a linha dos ombros com cotovelos suavemente flexionados.', ['trapezius'], 'beginner'),
    x('Elevação lateral unilateral na polia', 'Polia baixa', 'Eleve a alça lateralmente mantendo o tronco estável.', ['trapezius'], 'intermediate'),
    x('Elevação lateral na máquina', 'Máquina', 'Ajuste os apoios e eleve os braços sem encolher os ombros.', ['trapezius'], 'beginner'),
    x('Elevação frontal com halteres', 'Halteres', 'Eleve os halteres à frente até a altura dos ombros e desça com controle.', [], 'beginner'),
    x('Elevação frontal com barra', 'Barra', 'Eleve a barra à frente sem usar balanço do tronco.', [], 'intermediate'),
    x('Elevação frontal na polia', 'Polia baixa', 'Eleve a alça ou barra à frente mantendo o abdômen firme.', [], 'intermediate'),
    x('Landmine press unilateral', 'Barra landmine', 'Empurre a extremidade da barra para cima e à frente sem girar o tronco.', ['triceps', 'abs'], 'intermediate'),
    x('Desenvolvimento com kettlebell', 'Kettlebell', 'Mantenha o punho neutro e empurre a carga acima da cabeça.', ['triceps', 'abs'], 'intermediate'),
    x('Pike push-up', 'Peso corporal', 'Com quadril elevado, desça a cabeça entre as mãos e empurre.', ['triceps', 'trapezius'], 'advanced'),
    x('Elevação lateral inclinada', 'Halter', 'Incline o corpo com apoio e eleve o halter lateralmente.', ['trapezius'], 'intermediate'),
  ],
  'back-deltoids': [
    x('Crucifixo inverso com halteres', 'Halteres', 'Incline o tronco e abra os braços aproximando as escápulas.', ['upper-back'], 'beginner'),
    x('Crucifixo inverso no voador', 'Máquina', 'Apoie o peito e abra os braços sem elevar os ombros.', ['upper-back'], 'beginner'),
    x('Crucifixo inverso na polia', 'Polia', 'Cruze os cabos à frente e abra os braços na linha dos ombros.', ['upper-back'], 'intermediate'),
    x('Face pull com corda', 'Polia alta', 'Puxe a corda em direção aos olhos e rode os ombros para fora.', ['trapezius', 'upper-back'], 'beginner'),
    x('Remada alta para posterior', 'Polia ou barra', 'Puxe em direção ao peito com cotovelos abertos e escápulas controladas.', ['upper-back', 'biceps'], 'intermediate'),
    x('Remada posterior no banco inclinado', 'Halteres e banco', 'Apoie o peito e puxe com cotovelos abertos na linha dos ombros.', ['upper-back', 'biceps'], 'intermediate'),
    x('Elevação posterior unilateral', 'Halter', 'Incline o tronco e abra um braço por vez sem girar o corpo.', ['upper-back'], 'beginner'),
    x('Band pull-apart', 'Faixa elástica', 'Afaste as mãos esticando a faixa até aproximar as escápulas.', ['upper-back', 'trapezius'], 'beginner'),
    x('Reverse fly no TRX', 'TRX', 'Incline o corpo e abra os braços controlando a resistência.', ['upper-back', 'trapezius'], 'intermediate'),
    x('Elevação em T no banco', 'Halteres leves e banco', 'Eleve os braços lateralmente formando um T, sem compensar com a lombar.', ['upper-back'], 'beginner'),
    x('Rotação externa na polia', 'Polia', 'Mantenha o cotovelo junto ao corpo e gire o antebraço para fora.', [], 'beginner'),
    x('Rotação externa deitado', 'Halter leve', 'Deitado de lado, gire o antebraço para cima mantendo o cotovelo fixo.', [], 'beginner'),
  ],
  biceps: [
    x('Rosca direta com barra reta', 'Barra', 'Flexione os cotovelos sem deslocá-los à frente e desça completamente.', ['forearm'], 'beginner'),
    x('Rosca direta com barra W', 'Barra W', 'Mantenha os punhos confortáveis e flexione os cotovelos sem balançar.', ['forearm'], 'beginner'),
    x('Rosca alternada com halteres', 'Halteres', 'Alterne os braços girando a palma para cima durante a subida.', ['forearm'], 'beginner'),
    x('Rosca simultânea com halteres', 'Halteres', 'Eleve os dois halteres ao mesmo tempo mantendo os cotovelos fixos.', ['forearm'], 'beginner'),
    x('Rosca martelo', 'Halteres', 'Use pegada neutra e flexione os cotovelos sem mover os ombros.', ['forearm'], 'beginner'),
    x('Rosca martelo cruzada', 'Halteres', 'Leve o halter em direção ao ombro oposto com pegada neutra.', ['forearm'], 'intermediate'),
    x('Rosca Scott com barra W', 'Banco Scott e barra W', 'Apoie os braços e flexione sem retirar os cotovelos do banco.', ['forearm'], 'intermediate'),
    x('Rosca Scott unilateral', 'Halter e banco Scott', 'Controle toda a amplitude com o braço apoiado.', ['forearm'], 'intermediate'),
    x('Rosca concentrada', 'Halter', 'Apoie o cotovelo na coxa e flexione o braço sem impulso.', ['forearm'], 'beginner'),
    x('Rosca inclinada com halteres', 'Halteres e banco inclinado', 'Deixe os braços atrás do tronco e flexione mantendo os ombros apoiados.', ['forearm'], 'intermediate'),
    x('Rosca na polia baixa', 'Polia', 'Flexione os cotovelos contra a tensão contínua do cabo.', ['forearm'], 'beginner'),
    x('Rosca unilateral na polia', 'Polia', 'Mantenha o braço alinhado e flexione um cotovelo por vez.', ['forearm'], 'beginner'),
    x('Rosca bayesian', 'Polia baixa', 'De costas para a polia, mantenha o braço atrás do tronco durante a flexão.', ['forearm'], 'intermediate'),
    x('Rosca spider', 'Halteres ou barra e banco inclinado', 'Apoie o peito no banco e flexione os cotovelos com os braços pendentes.', ['forearm'], 'intermediate'),
    x('Rosca 21', 'Barra', 'Execute sete repetições em cada metade da amplitude e sete completas.', ['forearm'], 'advanced'),
    x('Rosca Zottman', 'Halteres', 'Suba com pegada supinada, gire no topo e desça com palmas para baixo.', ['forearm'], 'advanced'),
  ],
  triceps: [
    x('Tríceps pulley com barra', 'Polia alta', 'Estenda os cotovelos mantendo-os junto ao corpo e retorne com controle.', [], 'beginner'),
    x('Tríceps corda', 'Polia alta e corda', 'Estenda e afaste as pontas da corda no final sem mover os ombros.', [], 'beginner'),
    x('Tríceps barra V', 'Polia alta', 'Empurre a barra V para baixo mantendo os cotovelos fixos.', [], 'beginner'),
    x('Tríceps unilateral na polia', 'Polia', 'Estenda um cotovelo por vez sem girar o tronco.', [], 'beginner'),
    x('Tríceps francês unilateral', 'Halter', 'Com o braço acima da cabeça, flexione e estenda o cotovelo.', [], 'intermediate'),
    x('Tríceps francês bilateral', 'Halter', 'Segure um halter acima da cabeça e estenda os cotovelos mantendo-os apontados à frente.', [], 'intermediate'),
    x('Tríceps testa com barra W', 'Barra W e banco', 'Flexione os cotovelos levando a barra em direção à testa e estenda.', [], 'intermediate'),
    x('Tríceps testa com halteres', 'Halteres e banco', 'Mantenha os braços verticais e mova apenas os antebraços.', [], 'intermediate'),
    x('Tríceps coice', 'Halter', 'Com o braço paralelo ao tronco, estenda o cotovelo completamente.', [], 'beginner'),
    x('Mergulho no banco', 'Banco', 'Desça o quadril próximo ao banco e estenda os cotovelos com ombros controlados.', ['chest', 'front-deltoids'], 'intermediate'),
    x('Paralelas com foco em tríceps', 'Barras paralelas', 'Mantenha o tronco mais vertical e empurre até estender os cotovelos.', ['chest', 'front-deltoids'], 'advanced'),
    x('Supino fechado', 'Barra e banco', 'Use pegada moderadamente fechada e desça com cotovelos próximos.', ['chest', 'front-deltoids'], 'intermediate'),
    x('Extensão acima da cabeça na polia', 'Polia e corda', 'De costas para a polia, estenda os cotovelos acima da cabeça.', [], 'intermediate'),
    x('Extensão cruzada na polia', 'Polia', 'Puxe o cabo cruzando à frente do corpo e estenda o cotovelo.', [], 'intermediate'),
    x('JM press', 'Barra e banco', 'Desça a barra em direção à parte superior do peito combinando supino fechado e extensão.', ['chest'], 'advanced'),
    x('Flexão diamante', 'Peso corporal', 'Forme um apoio estreito com as mãos e mantenha o corpo alinhado.', ['chest', 'front-deltoids', 'abs'], 'advanced'),
  ],
  forearm: [
    x('Rosca de punho com barra', 'Barra', 'Apoie os antebraços e flexione os punhos para cima.', [], 'beginner'),
    x('Rosca de punho inversa', 'Barra', 'Apoie os antebraços com palmas para baixo e estenda os punhos.', [], 'beginner'),
    x('Rosca inversa com barra W', 'Barra W', 'Flexione os cotovelos com pegada pronada e punhos alinhados.', ['biceps'], 'intermediate'),
    x('Rosca martelo', 'Halteres', 'Flexione os cotovelos com as palmas voltadas uma para a outra.', ['biceps'], 'beginner'),
    x('Desvio radial com halter', 'Halter leve', 'Mova o punho em direção ao polegar mantendo o antebraço apoiado.', [], 'beginner'),
    x('Desvio ulnar com halter', 'Halter leve', 'Mova o punho em direção ao dedo mínimo com amplitude confortável.', [], 'beginner'),
    x('Pronação e supinação com halter', 'Halter leve', 'Gire o antebraço lentamente mantendo o cotovelo apoiado.', [], 'beginner'),
    x('Farmer hold', 'Halteres pesados', 'Segure as cargas ao lado do corpo com postura alta pelo tempo prescrito.', ['trapezius', 'abs'], 'intermediate'),
    x('Pinça de anilhas', 'Anilhas', 'Segure as anilhas com os dedos e polegar pelo tempo prescrito.', [], 'intermediate'),
    x('Wrist roller', 'Rolo de punho', 'Enrole e desenrole a carga usando movimentos controlados dos punhos.', [], 'intermediate'),
    x('Dead hang', 'Barra fixa', 'Permaneça pendurado com pegada firme e ombros ativos.', ['upper-back'], 'intermediate'),
    x('Extensão de dedos com elástico', 'Elástico', 'Abra os dedos contra o elástico e retorne lentamente.', [], 'beginner'),
  ],
  abs: [
    x('Abdominal tradicional', 'Peso corporal', 'Aproxime as costelas do quadril sem puxar o pescoço.', [], 'beginner'),
    x('Crunch na máquina', 'Máquina', 'Flexione o tronco usando o abdômen e retorne sem soltar a carga.', [], 'beginner'),
    x('Crunch na polia alta', 'Polia e corda', 'Ajoelhado, flexione o tronco levando as costelas em direção à pelve.', [], 'intermediate'),
    x('Abdominal infra no solo', 'Peso corporal', 'Eleve a pelve suavemente levando os joelhos em direção ao peito.', [], 'beginner'),
    x('Elevação de pernas no solo', 'Peso corporal', 'Eleve e desça as pernas mantendo a lombar apoiada.', [], 'intermediate'),
    x('Elevação de joelhos na paralela', 'Paralela', 'Eleve os joelhos em direção ao peito sem balançar o corpo.', ['forearm'], 'intermediate'),
    x('Elevação de pernas na barra', 'Barra fixa', 'Eleve as pernas com controle mantendo os ombros ativos.', ['forearm'], 'advanced'),
    x('Prancha frontal', 'Peso corporal', 'Mantenha cabeça, tronco e quadril alinhados com abdômen contraído.', ['gluteal'], 'beginner'),
    x('Prancha com braços estendidos', 'Peso corporal', 'Sustente a posição de flexão sem deixar o quadril cair.', ['front-deltoids', 'triceps', 'gluteal'], 'beginner'),
    x('Ab wheel', 'Roda abdominal', 'Projete o corpo à frente sem perder o controle da lombar e retorne.', ['upper-back', 'front-deltoids'], 'advanced'),
    x('Dead bug', 'Peso corporal', 'Estenda braço e perna opostos mantendo a lombar apoiada.', [], 'beginner'),
    x('Hollow body hold', 'Peso corporal', 'Mantenha lombar no chão e sustente braços e pernas elevados.', [], 'advanced'),
    x('V-up', 'Peso corporal', 'Eleve simultaneamente tronco e pernas tentando aproximar as mãos dos pés.', [], 'advanced'),
    x('Canivete alternado', 'Peso corporal', 'Aproxime uma mão do pé oposto alternando os lados.', ['obliques'], 'intermediate'),
    x('Mountain climber', 'Peso corporal', 'Alterne os joelhos em direção ao peito mantendo os ombros sobre as mãos.', ['front-deltoids', 'quadriceps'], 'intermediate'),
    x('Prancha na bola suíça', 'Bola suíça', 'Apoie os antebraços na bola e mantenha o corpo alinhado.', ['gluteal'], 'intermediate'),
    x('Stir the pot', 'Bola suíça', 'Em prancha na bola, faça pequenos círculos com os antebraços.', ['front-deltoids'], 'advanced'),
    x('Body saw no TRX', 'TRX', 'Em prancha, deslize o corpo para trás e para frente sem perder o alinhamento.', ['front-deltoids'], 'advanced'),
  ],
  obliques: [
    x('Prancha lateral', 'Peso corporal', 'Sustente o corpo alinhado apoiado em um antebraço e na lateral do pé.', ['abs', 'gluteal'], 'beginner'),
    x('Prancha lateral com elevação de quadril', 'Peso corporal', 'Desça e eleve o quadril mantendo o tronco lateralmente alinhado.', ['abs', 'gluteal'], 'intermediate'),
    x('Abdominal bicicleta', 'Peso corporal', 'Aproxime cotovelo e joelho opostos alternando com controle.', ['abs'], 'intermediate'),
    x('Russian twist', 'Peso corporal ou carga', 'Gire o tronco de um lado ao outro mantendo a coluna alongada.', ['abs'], 'intermediate'),
    x('Wood chop alto para baixo', 'Polia', 'Gire o tronco conduzindo o cabo diagonalmente de cima para baixo.', ['abs'], 'intermediate'),
    x('Wood chop baixo para alto', 'Polia', 'Conduza o cabo diagonalmente de baixo para cima com quadris estáveis.', ['abs'], 'intermediate'),
    x('Pallof press', 'Polia ou elástico', 'Empurre a alça à frente resistindo à rotação do tronco.', ['abs'], 'beginner'),
    x('Suitcase carry', 'Halter ou kettlebell', 'Caminhe com carga em um lado sem inclinar o tronco.', ['abs', 'forearm', 'trapezius'], 'intermediate'),
    x('Flexão lateral com halter', 'Halter', 'Incline o tronco lateralmente em amplitude controlada e retorne.', ['abs'], 'beginner'),
    x('Elevação lateral de joelhos', 'Barra fixa', 'Eleve os joelhos em direção a um lado alternando as séries.', ['abs', 'forearm'], 'advanced'),
    x('Heel touches', 'Peso corporal', 'Deitado, alcance alternadamente os calcanhares flexionando o tronco lateralmente.', ['abs'], 'beginner'),
    x('Landmine rotation', 'Barra landmine', 'Conduza a extremidade da barra de um lado ao outro com tronco firme.', ['abs', 'front-deltoids'], 'advanced'),
  ],
  neck: [
    x('Flexão cervical isométrica', 'Mão ou faixa', 'Pressione a testa contra a resistência sem mover o pescoço.', [], 'beginner'),
    x('Extensão cervical isométrica', 'Mão ou faixa', 'Pressione a parte de trás da cabeça contra a resistência sem movimento.', ['trapezius'], 'beginner'),
    x('Inclinação cervical isométrica', 'Mão ou faixa', 'Pressione a lateral da cabeça contra a mão sem inclinar.', ['trapezius'], 'beginner'),
    x('Rotação cervical isométrica', 'Mão ou faixa', 'Tente girar a cabeça contra resistência leve sem produzir movimento.', [], 'beginner'),
    x('Flexão cervical deitado', 'Peso corporal leve', 'Eleve suavemente a cabeça aproximando o queixo do peito.', [], 'intermediate'),
    x('Extensão cervical deitado', 'Peso corporal leve', 'Estenda suavemente o pescoço em amplitude confortável e controlada.', ['trapezius'], 'intermediate'),
  ],
  quadriceps: [
    x('Agachamento livre com barra', 'Barra e rack', 'Desça mantendo joelhos alinhados com os pés e suba empurrando o chão.', ['gluteal', 'hamstring', 'abs'], 'advanced', '/videos/legs/agachamento-livre-barra.mp4'),
    x('Agachamento frontal', 'Barra e rack', 'Mantenha os cotovelos altos e o tronco vertical durante toda a descida.', ['gluteal', 'abs'], 'advanced', '/videos/legs/agachamento-frontal.mp4'),
    x('Agachamento goblet', 'Halter ou kettlebell', 'Segure a carga junto ao peito e agache mantendo o tronco firme.', ['gluteal', 'abs'], 'beginner', '/videos/legs/agachamento-goblet.mp4'),
    x('Agachamento no Smith', 'Smith', 'Posicione os pés com estabilidade e agache controlando a trajetória guiada.', ['gluteal'], 'beginner', '/videos/legs/agachamento-smith.mp4'),
    x('Agachamento hack', 'Máquina hack', 'Mantenha costas apoiadas, desça com controle e empurre a plataforma.', ['gluteal'], 'intermediate', '/videos/legs/agachamento-hack.mp4'),
    x('Belt squat', 'Máquina ou cinto', 'Agache mantendo o tronco ereto e a carga presa ao quadril.', ['gluteal'], 'beginner', '/videos/legs/belt-squat.mp4'),
    x('Agachamento búlgaro', 'Banco e halteres', 'Apoie o pé traseiro e desça o joelho de trás mantendo o pé da frente firme.', ['gluteal', 'hamstring'], 'intermediate', '/videos/legs/agachamento-bulgaro.mp4'),
    x('Cadeira extensora', 'Máquina', 'Estenda os joelhos e retorne lentamente sem retirar o quadril do assento.', [], 'beginner', '/videos/legs/cadeira-extensora.mp4'),
    x('Leg press 45°', 'Leg press', 'Desça a plataforma até uma amplitude segura e empurre sem travar os joelhos.', ['gluteal', 'hamstring'], 'beginner', '/videos/legs/leg-press-45.mp4'),
    x('Leg press horizontal', 'Máquina', 'Mantenha a lombar apoiada e empurre a plataforma com os pés firmes.', ['gluteal'], 'beginner'),
    x('Agachamento sumô', 'Barra ou halter', 'Use base ampla e joelhos acompanhando a direção dos pés.', ['gluteal', 'adductor', 'hamstring'], 'intermediate'),
    x('Agachamento sissy', 'Peso corporal ou máquina', 'Mantenha o quadril estendido e flexione os joelhos em amplitude controlada.', [], 'advanced'),
    x('Passada à frente', 'Halteres ou barra', 'Dê um passo à frente e desça os dois joelhos mantendo equilíbrio.', ['gluteal', 'hamstring'], 'intermediate'),
    x('Afundo reverso', 'Halteres ou barra', 'Dê um passo para trás e desça mantendo o pé da frente totalmente apoiado.', ['gluteal', 'hamstring'], 'beginner'),
    x('Afundo no Smith', 'Smith', 'Posicione os pés em passada e desça verticalmente com controle.', ['gluteal', 'hamstring'], 'intermediate'),
    x('Step-up no banco', 'Banco e halteres', 'Suba no banco empurrando pelo pé de cima sem impulsionar com a perna de baixo.', ['gluteal', 'hamstring'], 'intermediate'),
    x('Spanish squat', 'Faixa ou cinta', 'Sente o quadril para trás contra a faixa mantendo o tronco vertical.', ['gluteal'], 'beginner'),
    x('Wall sit', 'Parede', 'Sustente a posição sentada com costas apoiadas e joelhos alinhados.', ['gluteal', 'abs'], 'beginner'),
    x('Agachamento caixa', 'Barra e caixa', 'Sente-se suavemente na caixa e levante mantendo tensão e alinhamento.', ['gluteal', 'hamstring'], 'intermediate'),
    x('Pistol squat assistido', 'Apoio', 'Agache em uma perna usando apoio para equilíbrio e controle de amplitude.', ['gluteal', 'abs'], 'advanced'),
  ],
  hamstring: [
    x('Mesa flexora', 'Máquina', 'Flexione os joelhos aproximando os calcanhares dos glúteos e retorne lentamente.', ['calves'], 'beginner'),
    x('Cadeira flexora', 'Máquina', 'Flexione os joelhos mantendo quadril e costas apoiados.', ['calves'], 'beginner'),
    x('Flexora em pé unilateral', 'Máquina', 'Flexione um joelho por vez sem movimentar o quadril.', ['calves'], 'beginner'),
    x('Stiff com barra', 'Barra', 'Leve o quadril para trás com joelhos semiflexionados e barra próxima às pernas.', ['gluteal', 'lower-back'], 'intermediate'),
    x('Stiff com halteres', 'Halteres', 'Desça os halteres junto às pernas mantendo coluna neutra e quadril para trás.', ['gluteal', 'lower-back'], 'intermediate'),
    x('Levantamento terra romeno', 'Barra', 'Controle a descida pelo quadril e suba contraindo os glúteos.', ['gluteal', 'lower-back', 'forearm'], 'advanced'),
    x('Levantamento terra sumô', 'Barra', 'Use base ampla, segure entre as pernas e estenda quadril e joelhos.', ['gluteal', 'adductor', 'lower-back', 'forearm'], 'advanced'),
    x('Nordic curl', 'Apoio para os pés', 'Desça o corpo lentamente resistindo com os posteriores e use apoio se necessário.', ['gluteal'], 'advanced'),
    x('Glute ham raise', 'Máquina GHD', 'Flexione os joelhos mantendo o tronco alinhado e controle a descida.', ['gluteal', 'lower-back'], 'advanced'),
    x('Flexão de joelhos na bola suíça', 'Bola suíça', 'Eleve o quadril e puxe a bola com os calcanhares.', ['gluteal', 'abs'], 'intermediate'),
    x('Flexão de joelhos no TRX', 'TRX', 'Em prancha com os pés suspensos, flexione os joelhos sem baixar o quadril.', ['gluteal', 'abs'], 'advanced'),
    x('Pull-through na polia', 'Polia baixa e corda', 'Leve o quadril para trás e estenda-o puxando a corda entre as pernas.', ['gluteal', 'lower-back'], 'beginner'),
    x('Good morning sentado', 'Barra e banco', 'Incline o tronco à frente mantendo coluna neutra e retorne com controle.', ['lower-back', 'gluteal'], 'advanced'),
    x('Single-leg Romanian deadlift', 'Halter ou kettlebell', 'Incline o tronco e estenda uma perna para trás mantendo o quadril nivelado.', ['gluteal', 'lower-back', 'abs'], 'advanced'),
  ],
  adductor: [
    x('Cadeira adutora', 'Máquina', 'Aproxime as pernas contra a resistência e retorne lentamente.', [], 'beginner'),
    x('Adução de quadril na polia', 'Polia baixa', 'Cruze a perna à frente do corpo mantendo o tronco estável.', ['abs'], 'beginner'),
    x('Adução de quadril com faixa', 'Faixa elástica', 'Puxe a perna para dentro contra a faixa sem inclinar o tronco.', ['abs'], 'beginner'),
    x('Agachamento sumô', 'Halter ou barra', 'Use base ampla, ponta dos pés para fora e joelhos alinhados.', ['quadriceps', 'gluteal', 'hamstring'], 'intermediate'),
    x('Levantamento terra sumô', 'Barra', 'Use base ampla e estenda quadris e joelhos mantendo a barra próxima.', ['gluteal', 'hamstring', 'lower-back'], 'advanced'),
    x('Afundo lateral', 'Peso corporal ou halter', 'Dê um passo lateral e sente o quadril sobre a perna que flexiona.', ['quadriceps', 'gluteal'], 'intermediate'),
    x('Cossack squat', 'Peso corporal ou carga', 'Desloque o peso lateralmente mantendo a outra perna estendida.', ['quadriceps', 'gluteal'], 'advanced'),
    x('Copenhagen plank', 'Banco', 'Apoie a perna de cima no banco e sustente o corpo lateralmente.', ['obliques', 'abs'], 'advanced'),
    x('Deslizamento lateral de adutores', 'Disco deslizante', 'Deslize uma perna lateralmente e retorne usando a parte interna da coxa.', ['quadriceps', 'gluteal'], 'intermediate'),
    x('Aperto de bola entre os joelhos', 'Bola', 'Comprima a bola entre os joelhos pelo tempo prescrito.', [], 'beginner'),
  ],
  abductors: [
    x('Cadeira abdutora', 'Máquina', 'Afaste as pernas contra a resistência sem retirar o quadril do assento.', ['gluteal'], 'beginner'),
    x('Abdução de quadril na polia', 'Polia baixa', 'Afaste a perna lateralmente mantendo tronco e pelve estáveis.', ['gluteal', 'abs'], 'beginner'),
    x('Abdução de quadril com faixa', 'Faixa elástica', 'Afaste a perna contra a faixa sem inclinar o corpo.', ['gluteal'], 'beginner'),
    x('Caminhada lateral com miniband', 'Miniband', 'Dê passos laterais mantendo joelhos semiflexionados e tensão na faixa.', ['gluteal', 'quadriceps'], 'beginner'),
    x('Monster walk', 'Miniband', 'Caminhe em diagonais mantendo os joelhos alinhados e a faixa tensionada.', ['gluteal', 'quadriceps'], 'beginner'),
    x('Clamshell', 'Miniband', 'Deitado de lado, abra o joelho de cima sem girar a pelve.', ['gluteal'], 'beginner'),
    x('Elevação lateral de perna', 'Peso corporal', 'Deitado de lado, eleve a perna mantendo o pé apontado à frente.', ['gluteal'], 'beginner'),
    x('Abdução lateral em pé', 'Peso corporal', 'Afaste uma perna lateralmente sem inclinar o tronco.', ['gluteal', 'abs'], 'beginner'),
    x('Step-down lateral', 'Caixa ou step', 'Desça um calcanhar em direção ao chão mantendo joelho e pelve alinhados.', ['gluteal', 'quadriceps'], 'intermediate'),
    x('Hip hike no step', 'Step', 'Eleve e abaixe um lado da pelve mantendo a perna de apoio estendida.', ['gluteal', 'obliques'], 'intermediate'),
  ],
  gluteal: [
    x('Hip thrust com barra', 'Barra e banco', 'Apoie as escápulas, eleve o quadril e contraia os glúteos no topo.', ['hamstring', 'abs'], 'intermediate'),
    x('Hip thrust na máquina', 'Máquina', 'Ajuste o apoio sobre o quadril e estenda até alinhar tronco e coxas.', ['hamstring'], 'beginner'),
    x('Ponte de glúteos', 'Peso corporal', 'Eleve o quadril pressionando os pés no chão e contraia os glúteos.', ['hamstring', 'abs'], 'beginner'),
    x('Ponte unilateral', 'Peso corporal', 'Eleve o quadril usando uma perna sem deixar a pelve girar.', ['hamstring', 'abs'], 'intermediate'),
    x('Coice na polia', 'Polia baixa', 'Estenda o quadril para trás sem arquear a lombar.', ['hamstring'], 'beginner'),
    x('Coice na máquina', 'Máquina', 'Empurre o apoio para trás usando o quadril e retorne com controle.', ['hamstring'], 'beginner'),
    x('Coice em quatro apoios', 'Peso corporal ou caneleira', 'Eleve uma perna para trás mantendo abdômen firme e pelve estável.', ['hamstring', 'abs'], 'beginner'),
    x('Abdução em quatro apoios', 'Peso corporal ou miniband', 'Eleve o joelho lateralmente sem girar o tronco.', ['abductors', 'abs'], 'beginner'),
    x('Agachamento profundo', 'Barra ou peso corporal', 'Agache em amplitude individual segura mantendo joelhos alinhados.', ['quadriceps', 'hamstring', 'abs'], 'intermediate'),
    x('Agachamento búlgaro com tronco inclinado', 'Halteres e banco', 'Incline levemente o tronco e empurre pelo calcanhar da perna da frente.', ['quadriceps', 'hamstring'], 'intermediate'),
    x('Afundo reverso longo', 'Halteres ou barra', 'Use passo mais longo e estenda o quadril da perna da frente ao subir.', ['quadriceps', 'hamstring'], 'intermediate'),
    x('Step-up alto', 'Caixa e halteres', 'Suba em uma caixa alta pressionando pelo pé de cima.', ['quadriceps', 'hamstring'], 'advanced'),
    x('Stiff', 'Barra ou halteres', 'Leve o quadril para trás e retorne contraindo os glúteos.', ['hamstring', 'lower-back'], 'intermediate'),
    x('Levantamento terra sumô', 'Barra', 'Use base ampla e finalize estendendo o quadril sem hiperextender a lombar.', ['hamstring', 'adductor', 'lower-back'], 'advanced'),
    x('Pull-through', 'Polia baixa', 'Empurre o quadril para trás e estenda-o puxando a corda entre as pernas.', ['hamstring', 'lower-back'], 'beginner'),
    x('Frog pump', 'Peso corporal ou carga', 'Una as plantas dos pés e eleve repetidamente o quadril.', ['abductors'], 'beginner'),
    x('Extensão de quadril no banco 45°', 'Banco romano', 'Arredonde levemente o tronco e estenda o quadril contraindo os glúteos.', ['hamstring', 'lower-back'], 'intermediate'),
    x('Reverse hyper', 'Máquina ou banco', 'Eleve as pernas estendendo o quadril sem hiperestender a lombar.', ['hamstring', 'lower-back'], 'advanced'),
  ],
  calves: [
    x('Panturrilha em pé na máquina', 'Máquina', 'Eleve os calcanhares ao máximo e desça lentamente até alongar.', [], 'beginner'),
    x('Panturrilha sentada', 'Máquina', 'Eleve os calcanhares com joelhos flexionados e pause no topo.', [], 'beginner'),
    x('Panturrilha no leg press', 'Leg press', 'Mova apenas os tornozelos, empurrando a plataforma com a ponta dos pés.', [], 'beginner'),
    x('Panturrilha no Smith', 'Smith e step', 'Eleve os calcanhares sobre o step e controle a amplitude completa.', [], 'beginner'),
    x('Panturrilha com halteres', 'Halteres e step', 'Eleve os calcanhares mantendo o equilíbrio e desça lentamente.', [], 'beginner'),
    x('Panturrilha unilateral em pé', 'Peso corporal ou halter', 'Execute uma perna por vez usando apoio para equilíbrio.', [], 'intermediate'),
    x('Panturrilha donkey', 'Máquina ou parceiro', 'Com quadril flexionado, eleve e desça os calcanhares em amplitude controlada.', [], 'intermediate'),
    x('Panturrilha no hack', 'Máquina hack', 'Mantenha joelhos estendidos e mova a plataforma apenas pelos tornozelos.', [], 'beginner'),
    x('Panturrilha no agachamento', 'Peso corporal', 'Em posição agachada, eleve os calcanhares mantendo joelhos flexionados.', ['quadriceps'], 'intermediate'),
    x('Soleus raise', 'Carga sobre os joelhos', 'Com joelhos a 90 graus, eleve os calcanhares enfatizando o sóleo.', [], 'beginner'),
    x('Tibial raise', 'Parede ou máquina', 'Eleve a ponta dos pés mantendo os calcanhares apoiados.', [], 'beginner'),
    x('Caminhada na ponta dos pés', 'Peso corporal ou halteres', 'Caminhe mantendo os calcanhares elevados e postura estável.', ['forearm'], 'beginner'),
    x('Pular corda', 'Corda', 'Realize saltos baixos e ritmados aterrissando suavemente sobre o antepé.', ['quadriceps'], 'intermediate'),
    x('Pogo jumps', 'Peso corporal', 'Faça saltos curtos usando principalmente os tornozelos e aterrissagem elástica.', ['quadriceps'], 'advanced'),
  ],
};

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const EXERCISE_CATALOG: ExerciseCatalogItem[] = Object.entries(DEFINITIONS)
  .flatMap(([muscle, definitions]) => definitions.map((definition) => ({
    key: `${muscle}:${slugify(definition.name)}`,
    name: definition.name,
    primaryMuscle: muscle as MuscleRegion,
    secondaryMuscles: definition.secondary || [],
    equipment: definition.equipment,
    difficulty: definition.difficulty || 'intermediate',
    instructions: definition.instructions,
    videoUrl: definition.video || null,
  })))
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

const CATALOG_BY_KEY = new Map(EXERCISE_CATALOG.map((exercise) => [exercise.key, exercise]));

export function getExercisesForMuscle(muscle: MuscleRegion): ExerciseCatalogItem[] {
  return EXERCISE_CATALOG.filter((exercise) => (
    exercise.primaryMuscle === muscle || exercise.secondaryMuscles.includes(muscle)
  ));
}

export function getCatalogExercises(keys: string[]): ExerciseCatalogItem[] {
  return keys.map((key) => CATALOG_BY_KEY.get(key)).filter((exercise): exercise is ExerciseCatalogItem => Boolean(exercise));
}

export function isMuscleRegion(value: string): value is MuscleRegion {
  return Object.hasOwn(MUSCLE_REGIONS, value);
}
