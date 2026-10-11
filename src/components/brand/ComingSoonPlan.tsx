import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Cartão do próximo plano, ainda sem nome nem preço ("em breve"). */
export function ComingSoonPlan({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-4 rounded-2xl border border-dashed border-line-strong bg-ink-900/40 p-5 sm:flex-row sm:items-center',
        className,
      )}
    >
      <span
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-fg-subtle"
      >
        <Sparkles className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
          Novo plano
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-fg-muted ring-1 ring-line-strong">
            Em breve
          </span>
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
          Estamos preparando um novo plano com mais recursos para a sua prospecção. Fique de olho!
        </p>
      </div>
    </div>
  )
}
