import { AudioWaveform, Gem, LibraryBig, ScanSearch, WandSparkles, type LucideIcon } from 'lucide-react'
import type { CSSProperties, PointerEvent, ReactNode } from 'react'
import { Container, IllustrativeTag, Reveal, SectionHeading } from '@/components/ui/primitives'
import { SECTION_IDS } from '@/config/navigation'
import { PromptsPreview } from './previews/PromptsPreview'
import { SearchPreview } from './previews/SearchPreview'
import { SitePromptPreview } from './previews/SitePromptPreview'
import { WaveIAPreview } from './previews/WaveIAPreview'

interface Module {
  index: string
  title: string
  description: string
  icon: LucideIcon
  /** Cor de acento própria do módulo. */
  accent: string
  preview: ReactNode
  /** Classes de grade no layout em mosaico. */
  span: string
  badge?: ReactNode
}

const MODULES: Module[] = [
  {
    index: '01',
    title: 'Encontrar Empresas',
    description:
      'Pesquise empresas por cidade e segmento, veja as informações disponíveis de cada uma e organize os leads que valem uma abordagem.',
    icon: ScanSearch,
    accent: 'var(--color-electric-400)',
    preview: <SearchPreview />,
    span: 'lg:col-span-7',
  },
  {
    index: '02',
    title: 'Prompts',
    description:
      'Sua biblioteca pessoal de instruções de abordagem comercial. Crie, edite e reutilize o que funciona para você.',
    icon: LibraryBig,
    accent: 'var(--color-cyan-accent)',
    preview: <PromptsPreview />,
    span: 'lg:col-span-5',
  },
  {
    index: '03',
    title: 'Gerador de Prompts para Sites',
    description:
      'Uma ferramenta independente para gerar instruções personalizadas de criação de sites, a partir do segmento e do estilo do cliente.',
    icon: WandSparkles,
    accent: 'var(--color-indigo-accent)',
    preview: <SitePromptPreview />,
    span: 'lg:col-span-5',
  },
  {
    index: '04',
    title: 'LeadIA',
    description:
      'Um assistente inteligente para apoiar sua prospecção e a venda de sites, do primeiro contato à proposta.',
    icon: AudioWaveform,
    accent: 'var(--color-ice-accent)',
    preview: <WaveIAPreview />,
    span: 'lg:col-span-7',
    badge: (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-(--accent)/30 bg-(--accent)/10 px-2.5 py-1 text-[11px] font-medium text-(--accent)">
        <Gem className="size-3" />
        Plano Diamond
      </span>
    ),
  },
]

export function Features() {
  return (
    <section id={SECTION_IDS.features} aria-labelledby="features-title" className="relative py-24 sm:py-32">
      <Container>
        <SectionHeading
          id="features-title"
          eyebrow="Funcionalidades"
          title="Quatro módulos. Um fluxo de prospecção."
          description="Da descoberta da empresa à mensagem certa, cada módulo resolve uma parte do trabalho de quem vende sites."
        />
        <Reveal delay={0.1} className="mt-6 flex justify-center">
          <IllustrativeTag />
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:mt-14 lg:grid-cols-12">
          {MODULES.map((m, i) => (
            <Reveal key={m.title} delay={(i % 2) * 0.08} className={m.span}>
              <FeatureCard module={m} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}

function FeatureCard({ module: m }: { module: Module }) {
  const Icon = m.icon

  // Brilho que acompanha o cursor, aplicado via variáveis CSS (sem re-renderizar).
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`)
  }

  return (
    <article
      onPointerMove={onPointerMove}
      style={{ '--accent': m.accent } as CSSProperties}
      className="group surface relative flex h-full flex-col overflow-hidden rounded-2xl bg-ink-900 p-6 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong sm:p-7"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(420px circle at var(--x, 50%) var(--y, 0%), color-mix(in oklab, var(--accent) 9%, transparent), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-(--accent)/50 to-transparent opacity-60"
      />

      <div className="relative flex items-start justify-between gap-4">
        <span className="flex size-11 items-center justify-center rounded-xl border border-(--accent)/25 bg-(--accent)/10 text-(--accent) shadow-[0_0_24px_-6px_var(--accent)]">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <span className="font-mono text-xs text-fg-subtle">{m.index}</span>
      </div>

      <div className="relative mt-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="text-xl font-semibold tracking-[-0.02em] text-fg">{m.title}</h3>
          {m.badge}
        </div>
        <p className="mt-2.5 max-w-lg text-[15px] leading-relaxed text-pretty text-fg-muted">{m.description}</p>
      </div>

      <div
        className="relative mt-7 flex-1 rounded-xl border border-line bg-ink-950/50 p-3.5 transition-colors duration-300 group-hover:border-(--accent)/20"
        aria-hidden
      >
        {m.preview}
      </div>
    </article>
  )
}
