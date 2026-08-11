/**
 * A marca em um lugar só.
 *
 * Nome, assinatura e paleta viviam espalhados: 194 hexadecimais cravados no
 * JSX de 30 telas e o nome literal em outros 20 pontos. Trocar a marca era
 * caçar string. Agora é editar este arquivo e o bloco `--brand-*` do
 * `globals.css` — a interface inteira acompanha.
 *
 * As cores aqui existem para quem não fala CSS: gráficos, anatomia e as
 * imagens geradas no servidor. Componentes usam as classes utilitárias
 * (`bg-brand-accent`, `text-brand-accent-text`…), que saem dos mesmos valores.
 */

export const BRAND = {
  /** Como o produto se chama. Aparece em título, rodapé, e-mail e exportação. */
  name: 'D KONG',
  /** Versão curta para espaços apertados. */
  shortName: 'D KONG',
  /** Iniciais para o ícone quadrado. */
  monogram: 'DK',
  /** Sobrelinha da assinatura, abaixo do nome. */
  wordmarkSubtitle: 'Performance system',
  /** Frase de apoio. */
  tagline: 'Treino forte. Gestão inteligente. Evolução real.',
  /** Título das telas públicas e da prévia de link. */
  metaTitle: 'D KONG — Performance e Gestão de Treinos',
  /** Como o aluno é chamado dentro do produto. */
  athleteLabel: 'Atleta D KONG',
} as const;

/**
 * Paleta da marca. Não muda com o tema — identidade não é interface.
 * Precisa espelhar o bloco `--brand-*` do `globals.css`.
 */
export const BRAND_COLORS = {
  /** Cor de destaque. É a marca. */
  accent: '#c9ff32',
  /** Estado de toque sobre o destaque. */
  accentHover: '#b8ef22',
  /** Destaque em superfícies e bordas. */
  accentDeep: '#9fdb00',
  /** Destaque em gráficos e traços. */
  accentStrong: '#7cae00',
  /** Destaque legível como texto sobre fundo claro. */
  accentText: '#668f00',
  /** Variante mais escura, para texto pequeno. */
  accentTextDark: '#5c7f00',
  /** Preto da marca. Sempre escuro, nos dois temas. */
  surface: '#090a08',
} as const;
