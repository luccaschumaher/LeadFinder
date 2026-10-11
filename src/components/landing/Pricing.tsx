import { Check, Minus } from 'lucide-react'
import { PlanBadge } from '@/components/brand/PlanBadge'
import { ButtonLink } from '@/components/ui/Button'
import { Container, Reveal, SectionHeading } from '@/components/ui/primitives'
import { SECTION_IDS } from '@/config/navigation'
import { PLANS, planFeatureList, type Plan } from '@/config/plans'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/cn'
import { ComingSoonPlan } from '@/components/brand/ComingSoonPlan'

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
          description="Quatro planos para cada momento da sua prospecção. Todos incluem busca de empresas, Meus Leads, Favoritos e Histórico."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.id} delay={0.06 * i} className="h-full">
              <PlanCard plan={plan} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15}>
          <ComingSoonPlan className="mt-4" />
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-fg-subtle">
            Assinatura mensal, cancele quando quiser. Pagamento processado pela Cakto.
          </p>
        </Reveal>
      </Container>
    </section>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  const isDiamond = plan.id === 'diamond'

  return (
    <div
      className={cn(
        'relative h-full rounded-2xl p-px transition-transform duration-300 hover:-translate-y-1',
        plan.recommended
          ? 'bg-gradient-to-b from-electric-400/80 via-electric-500/25 to-overlay/[0.06] shadow-[0_24px_64px_-24px_rgb(47_107_255/0.55)]'
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
          <div className="flex items-center gap-3">
            <PlanBadge plan={plan.id} size={44} />
            <h3 id={`plan-${plan.id}`} className="text-lg font-semibold tracking-[-0.02em] text-fg">
              {plan.name}
            </h3>
          </div>
          {plan.recommended && (
            <span className="rounded-full bg-electric-500/15 px-2.5 py-1 text-[11px] font-medium text-electric-300 ring-1 ring-electric-500/30">
              Recomendado
            </span>
          )}
        </div>

        <p className="mt-2 min-h-[3rem] text-sm leading-relaxed text-fg-muted">{plan.description}</p>

        <div className="mt-6 border-t border-line pt-6">
          <div className="text-2xl font-semibold tracking-[-0.03em] text-fg">
            {plan.priceLabel ?? 'Preço a definir'}
          </div>
          <div className="mt-1 font-mono text-xs text-electric-300">{plan.limits.tokens} tokens por dia</div>
        </div>

        <ButtonLink to={ROUTES.signUp} className="mt-6 w-full" variant={plan.id === 'free' ? 'primary' : 'secondary'}>
          {plan.id === 'free' ? 'Começar gratuitamente' : 'Criar conta'}
        </ButtonLink>

        <ul className="mt-7 flex flex-col gap-3">
          {planFeatureList(plan).map((f) => (
            <li
              key={f.label}
              className={cn('flex gap-2.5 text-sm leading-snug', f.included ? 'text-fg-muted' : 'text-fg-subtle')}
            >
              {f.included ? (
                <Check
                  className={cn(
                    'mt-0.5 size-4 shrink-0',
                    isDiamond && f.label.includes('LeadIA') ? 'text-ice-accent' : 'text-electric-400',
                  )}
                  strokeWidth={2}
                  aria-hidden
                />
              ) : (
                <Minus className="mt-0.5 size-4 shrink-0" aria-hidden />
              )}
              <span>
                <span className="sr-only">{f.included ? 'Incluído: ' : 'Não incluído: '}</span>
                {f.label}
              </span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  )
}
