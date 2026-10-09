import {
  Bookmark,
  Building2,
  ChevronRight,
  Globe,
  LayoutGrid,
  MapPin,
  MessageSquareText,
  Phone,
  Search,
  Sparkles,
  Star,
  Wand2,
} from 'lucide-react'
import { motion, type Variants } from 'motion/react'
import { LogoMark } from '@/components/brand/Logo'
import { IllustrativeTag } from '@/components/ui/primitives'
import { cn } from '@/lib/cn'

/*
 * Composição ilustrativa de um painel de prospecção.
 * Empresas, números e textos são fictícios e servem apenas para apresentar a interface.
 */

const COMPANIES = [
  { initials: 'NC', name: 'Barbearia Navalha & Co.', area: 'Centro', rating: '4,8', noSite: true, selected: true },
  { initials: 'CF', name: 'Studio Corte Fino', area: 'Trindade', rating: '4,6', noSite: true },
  { initials: 'BN', name: 'Barba Negra Club', area: 'Itacorubi', rating: '4,9', noSite: false },
  { initials: 'DB', name: 'Dom Bigode Barbearia', area: 'Estreito', rating: '4,5', noSite: true },
]

const STATS = [
  { label: 'Empresas', value: '48' },
  { label: 'Sem site', value: '17', accent: true },
  { label: 'Salvos', value: '9' },
]

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const SIDEBAR = [Search, Bookmark, MessageSquareText, Wand2, LayoutGrid]

export function HeroDashboard() {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[640px] lg:mr-0"
      aria-label="Ilustração da interface do LeadFinder com dados fictícios"
    >
      {/* Halo atrás do painel */}
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[32px] bg-electric-500/10 blur-3xl" />

      <div className="surface relative overflow-hidden rounded-2xl bg-ink-900/90 backdrop-blur">
        {/* Barra superior */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 text-[13px]">
            <LogoMark className="size-5" />
            <span className="text-fg-subtle">LeadFinder</span>
            <ChevronRight className="size-3.5 text-fg-subtle" />
            <span className="truncate text-fg">Encontrar empresas</span>
          </div>
          <IllustrativeTag className="shrink-0" />
        </div>

        <div className="flex">
          {/* Barra lateral */}
          <div aria-hidden className="hidden flex-col items-center gap-1.5 border-r border-line p-2.5 sm:flex">
            {SIDEBAR.map((Icon, i) => (
              <span
                key={i}
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg',
                  i === 0 ? 'bg-electric-500/15 text-electric-300 ring-1 ring-electric-500/30' : 'text-fg-subtle',
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
              </span>
            ))}
          </div>

          <motion.div variants={container} initial="hidden" animate="show" className="min-w-0 flex-1 p-4 sm:p-5">
            {/* Pesquisa */}
            <motion.div variants={item} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <FakeInput icon={Building2} label="Segmento" value="Barbearias" />
              <FakeInput icon={MapPin} label="Cidade" value="Florianópolis, SC" className="hidden sm:flex" />
              <span className="flex items-center gap-1.5 rounded-lg bg-electric-500 px-3 text-[13px] font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]">
                <Search className="size-3.5" />
                <span className="hidden sm:inline">Buscar</span>
              </span>
            </motion.div>

            {/* Indicadores */}
            <motion.div variants={item} className="mt-4 grid grid-cols-3 gap-2">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-lg border border-line bg-white/[0.02] px-3 py-2.5">
                  <div className="text-[11px] text-fg-subtle">{s.label}</div>
                  <div
                    className={cn(
                      'mt-0.5 font-mono text-lg font-medium tracking-tight tabular-nums',
                      s.accent ? 'text-electric-300' : 'text-fg',
                    )}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Lista de empresas */}
            <div className="relative mt-4 overflow-hidden rounded-xl border border-line">
              <div
                aria-hidden
                className="animate-scan pointer-events-none absolute inset-x-0 top-0 z-10 h-full bg-gradient-to-b from-transparent via-electric-500/[0.07] to-transparent"
              />
              <ul className="divide-y divide-line">
                {COMPANIES.map((c) => (
                  <motion.li
                    key={c.name}
                    variants={item}
                    className={cn(
                      'relative flex items-center gap-3 px-3 py-2.5',
                      c.selected && 'bg-electric-500/[0.06]',
                    )}
                  >
                    {c.selected && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-electric-400" />}
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink-700 font-mono text-[11px] text-fg-muted ring-1 ring-line">
                      {c.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-fg">{c.name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-fg-subtle">
                        <span className="truncate">{c.area}</span>
                        <span className="flex items-center gap-0.5">
                          <Star className="size-3 fill-current text-fg-muted" />
                          {c.rating}
                        </span>
                      </div>
                    </div>
                    {c.noSite ? (
                      <span className="rounded-md border border-electric-500/30 bg-electric-500/10 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-electric-300">
                        Sem site
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] whitespace-nowrap text-fg-subtle">
                        <Globe className="size-3" />
                        Com site
                      </span>
                    )}
                    <span className="hidden items-center gap-1 text-fg-subtle sm:flex">
                      <Phone className="size-3.5" />
                      <Bookmark className={cn('size-3.5', c.selected && 'fill-electric-400 text-electric-400')} />
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Card flutuante: abordagem personalizada */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -bottom-16 -left-8 hidden w-64 lg:block xl:-left-14"
      >
        <div className="surface animate-float rounded-xl bg-ink-850/95 p-3.5 backdrop-blur">
          <div className="flex items-center gap-2 text-[11px] font-medium text-fg-muted">
            <span className="flex size-5 items-center justify-center rounded-md bg-electric-500/15 text-electric-300">
              <Sparkles className="size-3" />
            </span>
            Abordagem personalizada
          </div>
          <p className="mt-2.5 text-[12px] leading-relaxed text-fg-muted">
            Olá, equipe da <span className="text-fg">Navalha &amp; Co.</span>! Vi que vocês têm ótimas avaliações, mas
            ainda não têm um site para receber agendamentos
            <span className="animate-caret ml-0.5 inline-block h-3 w-px translate-y-0.5 bg-electric-300" />
          </p>
        </div>
      </motion.div>

      {/* Card flutuante: funil de oportunidades */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 1.25, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -right-6 -bottom-12 hidden w-48 lg:block xl:-right-10"
      >
        <div className="surface animate-float rounded-xl bg-ink-850/95 p-3.5 backdrop-blur [animation-delay:-3.5s]">
          <div className="text-[11px] font-medium text-fg-muted">Oportunidades</div>
          <div className="mt-3 space-y-2">
            {[
              { label: 'Novos', value: 6, width: '100%' },
              { label: 'Em contato', value: 3, width: '55%' },
              { label: 'Proposta', value: 2, width: '35%' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-[10px] text-fg-subtle">
                  <span>{row.label}</span>
                  <span className="font-mono tabular-nums">{row.value}</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-electric-600 to-electric-400"
                    style={{ width: row.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.figure>
  )
}

function FakeInput({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Search
  label: string
  value: string
  className?: string
}) {
  return (
    <div
      className={cn('flex min-w-0 items-center gap-2 rounded-lg border border-line bg-ink-950/60 px-3 py-2', className)}
    >
      <Icon className="size-3.5 shrink-0 text-fg-subtle" />
      <div className="min-w-0">
        <div className="text-[10px] leading-none text-fg-subtle">{label}</div>
        <div className="mt-1 truncate text-[13px] leading-none text-fg">{value}</div>
      </div>
    </div>
  )
}
