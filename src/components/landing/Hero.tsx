import { ArrowRight, MapPinned, Sparkles, SquareKanban } from 'lucide-react'
import { motion } from 'motion/react'
import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/primitives'
import { SECTION_IDS } from '@/config/navigation'
import { ROUTES } from '@/config/routes'
import { HeroDashboard } from './HeroDashboard'

const ease = [0.22, 1, 0.36, 1] as const

const PILLARS = [
  { icon: MapPinned, label: 'Busca por cidade e segmento' },
  { icon: Sparkles, label: 'Abordagens com IA' },
  { icon: SquareKanban, label: 'Leads organizados' },
]

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden pt-32 pb-20 sm:pt-40 lg:pb-28">
      {/* Fundo: grade técnica e luz superior */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-electric-500/20 blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-line-strong to-transparent" />
      </div>

      <Container className="relative grid grid-cols-1 items-center gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
        <div className="flex max-w-[600px] flex-col items-start">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-overlay/[0.03] py-1 pr-3 pl-1.5 text-[13px] text-fg-muted"
          >
            <span className="relative flex size-5 items-center justify-center">
              <span className="animate-pulse-ring absolute inset-0 rounded-full bg-electric-500/40" />
              <span className="relative size-1.5 rounded-full bg-electric-400" />
            </span>
            Prospecção para quem vende sites
          </motion.span>

          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease }}
            className="mt-6 text-[38px] leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-[52px] xl:text-[58px]"
          >
            <span className="text-gradient">Encontre oportunidades.</span>{' '}
            <span className="text-electric-gradient">Transforme empresas em clientes.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease }}
            className="mt-6 text-base leading-relaxed text-pretty text-fg-muted sm:text-lg"
          >
            Descubra empresas, organize sua prospecção e crie abordagens personalizadas para vender sites com
            inteligência artificial.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease }}
            className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <ButtonLink to={ROUTES.signUp} size="lg">
              Começar gratuitamente
              <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
            </ButtonLink>
            <ButtonLink to={`#${SECTION_IDS.features}`} variant="secondary" size="lg">
              Conhecer funcionalidades
            </ButtonLink>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-3"
          >
            {PILLARS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[13px] text-fg-subtle">
                <Icon className="size-4 text-electric-400/80" strokeWidth={1.75} />
                {label}
              </li>
            ))}
          </motion.ul>
        </div>

        <HeroDashboard />
      </Container>
    </section>
  )
}
