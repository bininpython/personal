import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Cabeçalho padrão das telas autenticadas.
 *
 * Antes desta composição cada tela escrevia o próprio título, o que gerou dez
 * variações de tamanho, peso e espaçamento. Aqui existe uma só.
 */
function PageHeader({
  kicker,
  title,
  description,
  actions,
  className,
  ...props
}: Omit<React.ComponentProps<"header">, "title"> & {
  kicker: string
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        <p className="dk-kicker text-volt-ink">{kicker}</p>
        <h1 className="dk-display mt-3 text-[clamp(2rem,4.5vw,2.75rem)]">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export { PageHeader }
