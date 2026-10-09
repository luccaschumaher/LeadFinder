import { Check, Gem } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Container, Reveal, SectionHeading } from '@/components/ui/primitives'
import { SECTION_IDS } from '@/config/navigation'
import { PLAN_ORDER, PLANS, type Plan } from '@/config/plans'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/cn'

export function Pricing() {
  return (
    <section
      id={SECTION_IDS.pricing}
      aria-labelledby="pricing-title"
      className="relative overflow-hidden py-24 sm:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-electric-500/[0.07] blur-[120px]"
      />
      <Container className="relative">
        <SectionHeading
          id="pricing-title"
          eyebrow="Planos"
          title="Comece grátis. Evolua quando precisar."
          description="Quatro planos pensados para cada momento da sua prospecção. Os valores serão divulgados em breve."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.id} delay={0.06 * i} className="h-full">
              <PlanCard plan={plan} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-fg-subtle">
            Preços e benefícios ainda estão em definição e podem mudar antes do lançamento. Os benefícios listados são
            os previstos para cada plano.
          </p>
        </Reveal>
      </Container>
    </section>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  const level = PLAN_ORDER.indexOf(plan.id) + 1
  const isDiamond = plan.id === 'diamond'

  return (
    <div
      className={cn(
        'relative h-full rounded-2xl p-px transition-transform duration-300 hover:-translate-y-1',
        plan.recommended
          ? 'bg-gradient-to-b from-electric-400/80 via-electric-500/25 to-white/[0.06] shadow-[0_24px_64px_-24px_rgb(47_107_255/0.55)]'
          : 'bg-line',
      )}
    >
      <article
        aria-labelledby={`plan-${plan.id}`}
        className={cn(
          'relative flex h-full flex-col rounded-[15px] p-6',
          plan.recommended ? 'bg-ink-900' : 'bg-ink-900/80',
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 id={`plan-${plan.id}`} className="text-lg font-semibold tracking-[-0.02em] text-fg">
              {plan.name}
            </h3>
            {isDiamond && <Gem className="size-4 text-ice-accent" strokeWidth={1.75} aria-hidden />}
          </div>
          {plan.recommended ? (
            <span className="rounded-full bg-electric-500/15 px-2.5 py-1 text-[11px] font-medium text-electric-300 ring-1 ring-electric-500/30">
              Recomendado
            </span>
          ) : (
            <TierMeter level={level} />
          )}
        </div>

        <p className="mt-2 min-h-[3rem] text-sm leading-relaxed text-fg-muted">{plan.description}</p>

        <div className="mt-6 border-t border-line pt-6">
          <div className="text-2xl font-semibold tracking-[-0.03em] text-fg">
            {plan.priceLabel ?? 'Preço a definir'}
          </div>
          <div className="mt-1 text-xs text-fg-subtle">
            {plan.available ? 'Disponível no lançamento' : 'Assinatura disponível em breve'}
          </div>
        </div>

        <div className="mt-6">
          {plan.available ? (
            <ButtonLink to={ROUTES.signUp} className="w-full">
              Começar gratuitamente
            </ButtonLink>
          ) : (
            <Button variant="secondary" className="w-full" disabled>
              Em breve
            </Button>
          )}
        </div>

        <div className="mt-7">
          <div className="font-mono text-[10px] tracking-[0.16em] text-fg-subtle uppercase">Benefícios previstos</div>
          <ul className="mt-4 flex flex-col gap-3">
            {plan.benefits.map((b) => (
              <li key={b} className="flex gap-2.5 text-sm leading-snug text-fg-muted">
                <Check
                  className={cn(
                    'mt-0.5 size-4 shrink-0',
                    isDiamond && b.startsWith('WaveIA') ? 'text-ice-accent' : 'text-electric-400',
                  )}
                  strokeWidth={2}
                  aria-hidden
                />
                <span className={cn(b.startsWith('Tudo do') && 'text-fg')}>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </div>
  )
}

/** Indicador discreto do nível do plano (1 a 4). */
function TierMeter({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Nível ${level} de ${PLAN_ORDER.length}`} role="img">
      {PLAN_ORDER.map((id, i) => (
        <span key={id} className={cn('h-3 w-1 rounded-full', i < level ? 'bg-electric-400' : 'bg-white/10')} />
      ))}
    </span>
  )
}
