/**
 * Paleta categórica dos gráficos.
 *
 * As cores são atribuídas na ordem fixa abaixo — nunca cicladas, nunca geradas.
 * Cada tema tem seus próprios passos: o claro e o escuro foram escolhidos
 * separadamente para caber na faixa de luminosidade de cada superfície, e não
 * são um a inversão do outro.
 *
 * Ambos os conjuntos passam nas verificações de faixa de luminosidade, piso de
 * croma, separação para daltonismo e contraste contra a superfície. A separação
 * para deuteranopia fica na faixa mínima (ΔE 7,0–7,6), o que exige codificação
 * secundária: por isso todo gráfico que usa esta paleta acompanha legenda com
 * nome e valor, e as fatias são separadas por um vão.
 */
export const CATEGORICAL_LIGHT = ['#0072B2', '#E69F00', '#009E73', '#CC79A7'] as const;
export const CATEGORICAL_DARK = ['#2E86C4', '#BF8410', '#159B72', '#C43F9B'] as const;

/** Cor neutra do agrupamento "Outros" — nunca é um slot categórico. */
export const OTHER_LIGHT = '#6b7280';
export const OTHER_DARK = '#8b8f7d';

export const MAX_CATEGORIES = CATEGORICAL_LIGHT.length;

export function categoricalPalette(isDark: boolean) {
  return isDark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
}

export function otherColor(isDark: boolean) {
  return isDark ? OTHER_DARK : OTHER_LIGHT;
}

/**
 * Mantém os maiores grupos com identidade própria e reúne a cauda em "Outros",
 * em vez de inventar uma quinta, sexta e sétima cor.
 */
export function groupIntoCategories<T extends { name: string; value: number }>(
  items: T[],
  isDark: boolean,
): Array<{ name: string; value: number; color: string }> {
  const sorted = [...items].sort((left, right) => right.value - left.value);
  const palette = categoricalPalette(isDark);
  const head = sorted.slice(0, MAX_CATEGORIES).map((item, index) => ({
    name: item.name,
    value: item.value,
    color: palette[index],
  }));
  const tail = sorted.slice(MAX_CATEGORIES);
  if (tail.length === 0) return head;
  return [
    ...head,
    {
      name: 'Outros',
      value: tail.reduce((total, item) => total + item.value, 0),
      color: otherColor(isDark),
    },
  ];
}
