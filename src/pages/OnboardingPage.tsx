import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Briefcase,
  Check,
  Coins,
  Rocket,
  ScanSearch,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/config/routes'
import { getPlan } from '@/config/plans'
import { cn } from '@/lib/cn'
import { toast } from '@/lib/toast'
import { authService } from '@/services/auth'
import { useCurrentUser } from '@/stores/session'

const GOALS = [
  {
    id: 'first-clients',
    icon: Rocket,
    label: 'Conseguir meus primeiros clientes',
    text: 'Estou começando a vender sites.',
  },
  { id: 'scale', icon: TrendingUp, label: 'Aumentar o volume de vendas', text: 'Já vendo e quero prospectar mais.' },
  { id: 'organize', icon: Bookmark, label: 'Organizar minha prospecção', text: 'Quero controlar leads e contatos.' },
  { id: 'agency', icon: Users, label: 'Abastecer o time da agência', text: 'Prospecção para uma equipe.' },
]

const SERVICES = [
  'Sites institucionais',
  'Landing pages',
  'Lojas virtuais',
  'Sites com IA',
  'Manutenção de sites',
  'SEO local',
  'Tráfego pago',
  'Gestão de redes sociais',
  'Identidade visual',
]

const STEPS = ['Boas-vindas', 'Objetivo', 'Serviços', 'Primeiros passos']

export function OnboardingPage() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState<string>()
  const [services, setServices] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [direction, setDirection] = useState(1)

  if (user.onboarding.completed && !saving) return <Navigate to={ROUTES.dashboard} replace />

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  const finish = async (to: string) => {
    setSaving(true)
    await authService.completeOnboarding({ goal, services })
    toast.success('Tudo pronto!', 'Sua conta está configurada.')
    navigate(to, { replace: true })
  }

  const canContinue = step === 0 || (step === 1 && !!goal) || (step === 2 && services.length > 0) || step === 3
  const firstName = user.name.split(' ')[0]

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-40 left-1/2 h-96 w-[700px] -translate-x-1/2 rounded-full bg-electric-500/15 blur-[120px]" />
      </div>

      <header className="relative flex items-center justify-between px-4 py-5 sm:px-8">
        <Logo />
        <button
          type="button"
          onClick={() => finish(ROUTES.dashboard)}
          className="text-[13px] text-fg-subtle transition-colors hover:text-fg"
          disabled={saving}
        >
          Pular por agora
        </button>
      </header>

      <main className="relative flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-xl">
          {/* Progresso */}
          <ol className="mb-10 flex items-center gap-2" aria-label="Etapas">
            {STEPS.map((label, i) => (
              <li key={label} className="flex flex-1 flex-col gap-2">
                <span
                  className={cn(
                    'h-1 rounded-full transition-colors duration-300',
                    i <= step ? 'bg-electric-400' : 'bg-overlay/10',
                  )}
                />
                <span
                  className={cn('hidden text-[11px] sm:block', i === step ? 'text-fg' : 'text-fg-subtle')}
                  aria-current={i === step ? 'step' : undefined}
                >
                  {label}
                </span>
              </li>
            ))}
          </ol>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: 24 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 * direction }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <section>
                  <span className="flex size-12 items-center justify-center rounded-2xl border border-electric-500/30 bg-electric-500/10 text-electric-300">
                    <Sparkles className="size-5" />
                  </span>
                  <h1 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-fg">Boas-vindas, {firstName}.</h1>
                  <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
                    O LeadFinder ajuda você a encontrar empresas com potencial para contratar um site, preparar
                    abordagens personalizadas e acompanhar cada oportunidade. Leva menos de um minuto para configurar.
                  </p>
                  <div className="mt-6 flex items-center gap-3 rounded-xl border border-line bg-ink-900/70 p-4 text-sm">
                    <Coins className="size-4 text-electric-300" />
                    <span className="text-fg-muted">
                      Você está no plano <span className="font-medium text-fg">{getPlan(user.plan).name}</span>, com{' '}
                      <span className="font-medium text-fg">{getPlan(user.plan).limits.tokens} tokens por dia</span>{' '}
                      para ver empresas.
                    </span>
                  </div>
                </section>
              )}

              {step === 1 && (
                <section>
                  <h1 className="text-2xl font-semibold tracking-[-0.03em] text-fg">Qual é seu principal objetivo?</h1>
                  <p className="mt-2 text-sm text-fg-muted">Usaremos isso para sugerir os próximos passos.</p>
                  <div role="radiogroup" aria-label="Objetivo" className="mt-6 grid gap-2.5 sm:grid-cols-2">
                    {GOALS.map(({ id, icon: Icon, label, text }) => {
                      const selected = goal === id
                      return (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setGoal(id)}
                          className={cn(
                            'flex items-start gap-3 rounded-xl border p-4 text-left transition-[border-color,background-color]',
                            selected
                              ? 'border-electric-400/60 bg-electric-500/[0.08]'
                              : 'border-line-strong bg-ink-900/60 hover:border-overlay/20',
                          )}
                        >
                          <Icon
                            className={cn('mt-0.5 size-4 shrink-0', selected ? 'text-electric-300' : 'text-fg-subtle')}
                          />
                          <span>
                            <span className="block text-sm font-medium text-fg">{label}</span>
                            <span className="mt-0.5 block text-[12px] text-fg-subtle">{text}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {step === 2 && (
                <section>
                  <h1 className="text-2xl font-semibold tracking-[-0.03em] text-fg">Que serviços você oferece?</h1>
                  <p className="mt-2 text-sm text-fg-muted">Selecione um ou mais. Você pode alterar depois.</p>
                  <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Serviços oferecidos">
                    {SERVICES.map((s) => {
                      const selected = services.includes(s)
                      return (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setServices((list) => (selected ? list.filter((x) => x !== s) : [...list, s]))}
                          className={cn(
                            'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] transition-colors',
                            selected
                              ? 'border-electric-400/60 bg-electric-500/10 text-fg'
                              : 'border-line-strong text-fg-muted hover:border-overlay/20 hover:text-fg',
                          )}
                        >
                          {selected ? (
                            <Check className="size-3.5 text-electric-300" />
                          ) : (
                            <Briefcase className="size-3.5 text-fg-subtle" />
                          )}
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {step === 3 && (
                <section>
                  <h1 className="text-2xl font-semibold tracking-[-0.03em] text-fg">
                    Como encontrar suas primeiras empresas
                  </h1>
                  <ol className="mt-6 space-y-3">
                    {[
                      {
                        icon: Target,
                        title: 'Escolha um segmento e uma cidade',
                        text: 'Ex.: "barbearias" em "Curitiba, PR". Segmentos locais costumam ter muitas empresas sem site.',
                      },
                      {
                        icon: Coins,
                        title: 'Cada empresa exibida consome 1 token',
                        text: 'O custo aparece antes de você pesquisar. Carregar mais resultados da mesma busca não consome tokens.',
                      },
                      {
                        icon: Bookmark,
                        title: 'Salve e acompanhe',
                        text: 'Favorite empresas interessantes e salve as melhores em Meus Leads para acompanhar o status.',
                      },
                    ].map(({ icon: Icon, title, text }, i) => (
                      <li key={title} className="flex gap-4 rounded-xl border border-line bg-ink-900/60 p-4">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-electric-500/12 font-mono text-xs text-electric-300">
                          {i + 1}
                        </span>
                        <div>
                          <p className="flex items-center gap-2 text-sm font-medium text-fg">
                            <Icon className="size-3.5 text-fg-subtle" />
                            {title}
                          </p>
                          <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{text}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => go(step - 1)} disabled={saving}>
                <ArrowLeft />
                Voltar
              </Button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={() => go(step + 1)} disabled={!canContinue}>
                Continuar
                <ArrowRight />
              </Button>
            ) : (
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => finish(ROUTES.dashboard)} disabled={saving}>
                  Ir para o painel
                </Button>
                <Button size="sm" onClick={() => finish(ROUTES.search)} loading={saving}>
                  {!saving && <ScanSearch />}
                  Fazer minha primeira busca
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
