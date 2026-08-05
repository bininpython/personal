export const AVATAR_COUNT = 100;

export type AvatarCategory = 'people' | 'weights' | 'gear' | 'movement' | 'achievements';

const FITNESS_AVATARS: Array<{ label: string; category: Exclude<AvatarCategory, 'people'> | 'people' }> = [
  { label: 'Halter azul', category: 'weights' },
  { label: 'Barra com anilhas', category: 'weights' },
  { label: 'Halteres cruzados', category: 'weights' },
  { label: 'Anilha olímpica', category: 'weights' },
  { label: 'Pilha de anilhas', category: 'weights' },
  { label: 'Kettlebell', category: 'weights' },
  { label: 'Bola medicinal', category: 'weights' },
  { label: 'Pegador de academia', category: 'weights' },
  { label: 'Suporte de halteres', category: 'weights' },
  { label: 'Halter com energia', category: 'weights' },
  { label: 'Coqueteleira', category: 'gear' },
  { label: 'Cronômetro esportivo', category: 'gear' },
  { label: 'Tênis de treino', category: 'gear' },
  { label: 'Colchonete', category: 'gear' },
  { label: 'Corda de pular', category: 'gear' },
  { label: 'Luvas de treino', category: 'gear' },
  { label: 'Bolsa de academia', category: 'gear' },
  { label: 'Banco de supino', category: 'gear' },
  { label: 'Garrafa esportiva', category: 'gear' },
  { label: 'Fones esportivos', category: 'gear' },
  { label: 'Pessoa fazendo rosca', category: 'people' },
  { label: 'Pessoa fazendo agachamento', category: 'people' },
  { label: 'Pessoa fazendo levantamento terra', category: 'people' },
  { label: 'Pessoa fazendo flexão', category: 'people' },
  { label: 'Pessoa no desenvolvimento', category: 'people' },
  { label: 'Pessoa fazendo avanço', category: 'people' },
  { label: 'Pessoa fazendo prancha', category: 'people' },
  { label: 'Pessoa fazendo barra fixa', category: 'people' },
  { label: 'Pessoa correndo', category: 'people' },
  { label: 'Pessoa pedalando', category: 'people' },
  { label: 'Coração saudável', category: 'movement' },
  { label: 'Chama da constância', category: 'movement' },
  { label: 'Energia de treino', category: 'movement' },
  { label: 'Alvo de evolução', category: 'movement' },
  { label: 'Montanha de progresso', category: 'movement' },
  { label: 'Pulso de atividade', category: 'movement' },
  { label: 'Passos ativos', category: 'movement' },
  { label: 'Velocidade', category: 'movement' },
  { label: 'Ciclo de treino', category: 'movement' },
  { label: 'Força em movimento', category: 'movement' },
  { label: 'Troféu fitness', category: 'achievements' },
  { label: 'Medalha de evolução', category: 'achievements' },
  { label: 'Escudo da força', category: 'achievements' },
  { label: 'Coroa da disciplina', category: 'achievements' },
  { label: 'Estrela do treino', category: 'achievements' },
  { label: 'Louro da vitória', category: 'achievements' },
  { label: 'Diamante da constância', category: 'achievements' },
  { label: 'Foguete de evolução', category: 'achievements' },
  { label: 'Bandeira da meta', category: 'achievements' },
  { label: 'Selo de campeão', category: 'achievements' },
];

export const AVATAR_OPTIONS = Array.from({ length: AVATAR_COUNT }, (_, index) => {
  const id = String(index + 1).padStart(2, '0');
  const fitnessAvatar = index >= 50 ? FITNESS_AVATARS[index - 50] : null;
  return {
    id,
    url: `/avatars/${id}`,
    label: fitnessAvatar?.label ?? `Pessoa ${index + 1}`,
    category: fitnessAvatar?.category ?? 'people' as AvatarCategory,
  };
});

export function isAvatarOption(value: string) {
  return AVATAR_OPTIONS.some((avatar) => avatar.url === value);
}
