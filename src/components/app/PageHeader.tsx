import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Reveal } from '@/components/ui/primitives'

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  breadcrumbs?: { label: string; to?: string }[]
}

export function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <Reveal y={8} className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumbs && (
          <nav aria-label="Trilha de navegação" className="mb-2">
            <ol className="flex flex-wrap items-center gap-1 text-[12px] text-fg-subtle">
              {breadcrumbs.map((b, i) => (
                <li key={b.label} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="size-3" />}
                  {b.to ? (
                    <Link to={b.to} className="transition-colors hover:text-fg">
                      {b.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="max-w-[40ch] truncate text-fg-muted">
                      {b.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.03em] text-balance text-fg">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-pretty text-fg-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </Reveal>
  )
}
