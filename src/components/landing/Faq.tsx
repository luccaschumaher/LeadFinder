import { Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'
import { Container, Reveal, SectionHeading } from '@/components/ui/primitives'
import { SECTION_IDS } from '@/config/navigation'
import { cn } from '@/lib/cn'

const QUESTIONS = [
  {
    q: 'O que é o LeadFinder?',
    a: 'Uma plataforma para quem vende sites e serviços digitais: você encontra empresas por segmento e cidade, organiza os leads e prepara abordagens personalizadas com apoio de inteligência artificial.',
  },
  {
    q: 'Como funcionam os tokens?',
    a: 'Cada empresa exibida na busca consome 1 token. Os tokens renovam todos os dias, à meia-noite, e não acumulam de um dia para o outro. A quantidade por dia depende do plano: 3 no Free, 40 no Silver, 70 no Gold e 120 no Diamond.',
  },
  {
    q: 'De onde vêm os dados das empresas?',
    a: 'A busca será feita a partir de uma fonte pública de dados de empresas. Exibimos apenas as informações que a fonte fornece, como telefone, site e avaliação, e indicamos quando um dado não está disponível.',
  },
  {
    q: 'Preciso de cartão de crédito para começar?',
    a: 'Não. O plano Free permite criar sua conta e fazer as primeiras buscas sem cobrança.',
  },
  {
    q: 'O que é a LeadIA?',
    a: 'É a assistente de inteligência artificial do LeadFinder, pensada para apoiar estratégias de prospecção, análise de empresas, mensagens de contato e propostas. Ela faz parte do plano Diamond.',
  },
  {
    q: 'Posso mudar de plano depois?',
    a: 'Sim. Você pode fazer upgrade ou mudar de plano a qualquer momento pela página de planos dentro da plataforma.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  const baseId = useId()

  return (
    <section id={SECTION_IDS.faq} aria-labelledby="faq-title" className="py-24 sm:py-32">
      <Container className="max-w-3xl">
        <SectionHeading id="faq-title" eyebrow="Perguntas frequentes" title="Tire suas dúvidas" />
        <Reveal delay={0.1} className="mt-12">
          <ul className="divide-y divide-line border-y border-line">
            {QUESTIONS.map((item, i) => {
              const expanded = open === i
              return (
                <li key={item.q}>
                  <h3>
                    <button
                      type="button"
                      id={`${baseId}-q${i}`}
                      aria-expanded={expanded}
                      aria-controls={`${baseId}-a${i}`}
                      onClick={() => setOpen(expanded ? null : i)}
                      className="flex w-full items-center justify-between gap-6 py-5 text-left text-[15px] font-medium text-fg transition-colors hover:text-electric-200"
                    >
                      {item.q}
                      <Plus
                        className={cn(
                          'size-4 shrink-0 text-fg-subtle transition-transform duration-300',
                          expanded && 'rotate-45 text-electric-300',
                        )}
                      />
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        id={`${baseId}-a${i}`}
                        role="region"
                        aria-labelledby={`${baseId}-q${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pr-10 pb-5 text-[15px] leading-relaxed text-fg-muted">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </Container>
    </section>
  )
}
