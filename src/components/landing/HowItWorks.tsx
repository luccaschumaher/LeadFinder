import { MessageSquareText, ScanSearch, SquareKanban } from 'lucide-react'
import { motion } from 'motion/react'
import { Container, Reveal, SectionHeading } from '@/components/ui/primitives'
import { SECTION_IDS } from '@/config/navigation'

const STEPS = [
  {
    icon: ScanSearch,
    title: 'Encontre empresas com potencial para contratar um site',
    description:
      'Filtre por cidade e segmento e identifique negócios que ainda não têm presença digital ou podem melhorar a que já têm.',
  },
  {
    icon: MessageSquareText,
    title: 'Prepare abordagens personalizadas',
    description:
      'Combine seus prompts com inteligência artificial para escrever mensagens que falam da realidade de cada empresa.',
  },
  {
    icon: SquareKanban,
    title: 'Organize os contatos e acompanhe as oportunidades',
    description: 'Salve leads, marque favoritos e acompanhe cada conversa até a proposta de venda do site.',
  },
]

export function HowItWorks() {
  return (
    <section
      id={SECTION_IDS.howItWorks}
      aria-labelledby="how-title"
      className="relative border-y border-line bg-ink-900/60 py-24 sm:py-32"
    >
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black,transparent)] opacity-50"
      />
      <Container className="relative">
        <SectionHeading
          id="how-title"
          eyebrow="Como funciona"
          title="Da busca à proposta, em três etapas."
          description="Um processo simples e repetível para transformar pesquisa em conversas de venda."
        />

        <div className="relative mt-16 md:mt-20">
          {/* Linha de conexão entre as etapas (desktop) */}
          <div aria-hidden className="absolute top-6 right-[16.66%] left-[16.66%] hidden h-px bg-line md:block">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '0px 0px -120px 0px' }}
              transition={{ duration: 1.4, delay: 0.3, ease: [0.65, 0, 0.35, 1] }}
              className="h-full origin-left bg-gradient-to-r from-electric-500/0 via-electric-400 to-electric-500/0"
            />
          </div>

          <ol className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map(({ icon: Icon, title, description }, i) => (
              <li key={title} className="relative">
                <Reveal
                  delay={0.15 * i}
                  className="relative flex gap-5 md:flex-col md:items-center md:gap-0 md:text-center"
                >
                  {/* Linha vertical (mobile) */}
                  {i < STEPS.length - 1 && (
                    <span aria-hidden className="absolute top-14 bottom-[-2.5rem] left-6 w-px bg-line md:hidden" />
                  )}
                  <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl border border-line-strong bg-ink-850 text-electric-300 shadow-[0_0_0_6px_var(--color-ink-900),0_0_32px_-8px_rgb(47_107_255/0.6)]">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <div className="md:mt-7 md:max-w-xs">
                    <div className="font-mono text-[11px] tracking-[0.16em] text-fg-subtle uppercase">
                      Etapa {String(i + 1).padStart(2, '0')}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-balance text-fg">{title}</h3>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-pretty text-fg-muted">{description}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}
