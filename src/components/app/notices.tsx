import { ArrowRight, FlaskConical, Lock, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { PlanBadge } from '@/components/brand/PlanBadge'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/display'
import { FEATURE_PLAN, getPlan, planFeatureList } from '@/config/plans'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/cn'

/** Aviso discreto de que os dados exibidos são de demonstração. */
export function DemoNotice({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="note"
      className={cn(
        'flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-3.5 py-2.5 text-[13px] leading-relaxed text-amber-100/80',
        className,
      )}
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-amber-300" />
      <div>{children}</div>
    </div>
  )
}

interface LockedFeatureProps {
  feature: keyof typeof FEATURE_PLAN
  icon: LucideIcon
  title: string
  description: string
  benefits: string[]
  /** Prévia (desabilitada) da interface, exibida abaixo do convite. */
  preview?: ReactNode
  /** `clear` exibe a prévia nítida (vitrine); `faded` a mostra esmaecida (padrão). */
  previewStyle?: 'faded' | 'clear'
}

/** Tela de recurso bloqueado: apresenta as vantagens sem permitir o uso. */
export function LockedFeature({
  feature,
  icon: Icon,
  title,
  description,
  benefits,
  preview,
  previewStyle = 'faded',
}: LockedFeatureProps) {
  const plan = getPlan(FEATURE_PLAN[feature])
  return (
    <div className="relative">
      <Card className="relative overflow-hidden p-6 sm:p-10">
        <div aria-hidden className="absolute -top-24 right-0 h-64 w-96 rounded-full bg-electric-500/10 blur-[90px]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-white/[0.03] px-2.5 py-1 text-[12px] text-fg-muted">
              <PlanBadge plan={plan.id} size={16} />
              Disponível a partir do plano {plan.name}
            </span>
            <div className="mt-5 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl border border-electric-500/25 bg-electric-500/10 text-electric-300">
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <h2 className="text-xl font-semibold tracking-tight text-fg">{title}</h2>
            </div>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-fg-muted">{description}</p>
            <ul className="mt-5 space-y-2">
              {benefits.map((b) => (
                <li key={b} className="flex gap-2 text-sm text-fg-muted">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-electric-400" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-2">
              <ButtonLink to={ROUTES.plans} size="sm">
                Conhecer o plano {plan.name}
                <ArrowRight />
              </ButtonLink>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-ink-950/50 p-4">
            <p className="font-mono text-[10px] tracking-[0.16em] text-fg-subtle uppercase">Plano {plan.name} inclui</p>
            <ul className="mt-3 space-y-2">
              {planFeatureList(plan)
                .filter((f) => f.included)
                .map((f) => (
                  <li key={f.label} className="text-[13px] text-fg-muted">
                    {f.label}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </Card>
      {preview &&
        (previewStyle === 'clear' ? (
          <div className="mt-4">{preview}</div>
        ) : (
          <div aria-hidden className="pointer-events-none relative mt-4 select-none">
            <div className="opacity-40 blur-[1px]">{preview}</div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink-950" />
          </div>
        ))}
    </div>
  )
}

/** Faixa de limite atingido, com convite para conhecer os planos. */
export function LimitBanner({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-electric-500/25 bg-electric-500/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <Lock className="mt-0.5 size-4 shrink-0 text-electric-300" />
        <div>
          <p className="text-sm font-medium text-fg">{title}</p>
          <p className="mt-0.5 text-[13px] text-fg-muted">{description}</p>
        </div>
      </div>
      <ButtonLink to={ROUTES.plans} size="xs" variant="secondary" className="self-start sm:self-auto">
        Ver planos
      </ButtonLink>
    </div>
  )
}
