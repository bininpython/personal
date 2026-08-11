/**
 * O símbolo da marca.
 *
 * Trocar a identidade visual do produto é substituir este arquivo — nenhum
 * outro componente conhece o desenho. Ele é vetorial de propósito: escala do
 * favicon ao painel sem perder nitidez, herda a cor de destaque das variáveis
 * `--brand-*` e pesa alguns bytes, no lugar dos 158 KB do JPG anterior.
 *
 * O desenho atual é neutro por escolha: um anel de progresso partido em torno
 * de um núcleo — evolução em volta de uma pessoa —, sem iconografia de força
 * bruta que enderece um único público.
 */
export function BrandLogo({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="none"
    >
      {/* Anel de evolução: aberto em cima, porque progresso não fecha. */}
      <path
        d="M24 5.5a18.5 18.5 0 1 1-13.08 5.42"
        stroke="var(--brand-accent)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Marca do avanço no ponto de abertura. */}
      <circle cx="24" cy="5.5" r="3.6" fill="var(--brand-accent)" />
      {/* Núcleo: as três barras de uma sequência que cresce. */}
      <g fill="currentColor">
        <rect x="15.5" y="26" width="4.6" height="7.5" rx="2.3" />
        <rect x="21.7" y="21.5" width="4.6" height="12" rx="2.3" />
        <rect x="27.9" y="17" width="4.6" height="16.5" rx="2.3" />
      </g>
    </svg>
  );
}
