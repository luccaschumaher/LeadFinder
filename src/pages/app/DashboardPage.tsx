import {
  ArrowRight,
  ArrowUpRight,
  AudioWaveform,
  Bookmark,
  Building2,
  Check,
  Coins,
  History,
  LibraryBig,
  ScanSearch,
  Star,
  Wallet,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { LeadStatusBadge } from '@/components/app/company'
import { PageHeader } from '@/components/app/PageHeader'
import { PlanBadge } from '@/components/brand/PlanBadge'
import { ButtonLink } from '@/components/ui/Button'
import { Card, CardHeader, EmptyState, ProgressBar } from '@/components/ui/display'
import { Reveal } from '@/components/ui/primitives'
import { FEATURE_PLAN, getPlan } from '@/config/plans'
import { ROUTES } from '@/config/routes'
import { usePlan } from '@/hooks/usePlan'
import { cn } from '@/lib/cn'
import { formatRelative, plural } from '@/lib/utils'
import { LEAD_STATUSES } from '@/services/leads'
import { useData } from '@/stores/data'
import { useCurrentUser } from '@/stores/session'

function greeting() {
  const h = new Date().getHours()
  return h >= 5 && h < 12 ? 'Bom dia' : h >= 12 && h < 18 ? 'Boa tarde' : 'Boa noite'
}

export function DashboardPage() {
  const user = useCurrentUser()
  const { plan, tokens, can } = usePlan()
  const history = useData((s) => s.history)
  const leads = useData((s) => s.leads)
  const favorites = useData((s) => s.favorites)
  const activity = useData((s) => s.activity)
  const prompts = useData((s) => s.prompts)

  const companiesFound = useMemo(() => history.reduce((sum, h) => sum + h.resultCount, 0), [history])
  const isNew = history.length === 0 && leads.length === 0 && favorites.length === 0

  const stats: { label: string; value: number; icon: LucideIcon; to: string; hint: string }[] = [
    {
      label: 'Empresas encontradas',
      value: companiesFound,
      icon: Building2,
      to: ROUTES.history,
      hint: `em ${plural(history.length, 'busca', 'buscas')}`,
    },
    {
      label: 'Leads salvos',
      value: leads.length,
      icon: Bookmark,
      to: ROUTES.leads,
      hint: `${leads.filter((l) => l.status === 'converted').length} convertidos`,
    },
    { label: 'Favoritos', value: favorites.length, icon: Star, to: ROUTES.favorites, hint: 'empresas marcadas' },
    {
      label: 'Tokens disponíveis',
      value: tokens.balance,
      icon: Coins,
      to: ROUTES.plans,
      hint: `de ${tokens.total} hoje · renova à meia-noite`,
    },
  ]

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user.name.split(' ')[0]}`}
        description={
          isNew
            ? 'Sua conta está pronta. Comece encontrando as primeiras empresas.'
            : 'Aqui está o resumo da sua prospecção.'
        }
        actions={
          <ButtonLink to={ROUTES.search} size="sm">
            <ScanSearch />
            Buscar empresas
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.04} y={10}>
            <Link to={s.to} className="group block h-full">
              <Card className="h-full p-4 transition-colors group-hover:border-line-strong sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-fg-subtle sm:text-[13px]">{s.label}</span>
                  <s.icon
                    className="size-4 text-fg-subtle transition-colors group-hover:text-electric-300"
                    strokeWidth={1.75}
                  />
                </div>
                <p className="mt-3 font-mono text-2xl font-medium tracking-tight text-fg tabular-nums sm:text-[28px]">
                  {s.value.toLocaleString('pt-BR')}
                </p>
                <p className="mt-1 truncate text-[12px] text-fg-subtle">{s.hint}</p>
              </Card>
            </Link>
          </Reveal>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          {isNew ? (
            <GettingStarted done={{ search: history.length > 0, lead: leads.length > 0, prompt: prompts.length > 0 }} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <SearchesChart />
              <LeadsByStatus />
            </div>
          )}
          <RecentSearches />
        </div>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-fg-subtle">Plano atual</span>
              <Link to={ROUTES.plans} className="text-[12px] text-electric-300 hover:text-electric-200">
                {plan.id === 'diamond' ? 'Ver detalhes' : 'Fazer upgrade'}
              </Link>
            </div>
            <p className="mt-3 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-fg">
              <PlanBadge plan={plan.id} size={32} />
              {plan.name}
            </p>
            <div className="mt-4 flex items-center justify-between text-[12px]">
              <span className="text-fg-muted">Tokens</span>
              <span className="font-mono text-fg tabular-nums">
                {tokens.balance}/{tokens.total}
              </span>
            </div>
            <ProgressBar
              value={tokens.balance}
              max={tokens.total}
              className="mt-2"
              tone={tokens.balance === 0 ? 'red' : 'blue'}
            />
            <p className="mt-2 text-[12px] text-fg-subtle">
              Cada empresa exibida consome 1 token. Os tokens renovam todo dia.
            </p>
          </Card>

          <Card className="p-2">
            <CardHeader title="Atalhos" className="px-3 pt-3 pb-1" />
            <ul className="p-1">
              {[
                {
                  label: 'Biblioteca de prompts',
                  icon: LibraryBig,
                  to: ROUTES.prompts,
                  locked: !can('promptLibrary'),
                  required: FEATURE_PLAN.promptLibrary,
                },
                {
                  label: 'Financeiro',
                  icon: Wallet,
                  to: ROUTES.finance,
                  locked: !can('finance'),
                  required: FEATURE_PLAN.finance,
                },
                {
                  label: 'Gerador de prompts para sites',
                  icon: WandSparkles,
                  to: ROUTES.siteGenerator,
                  locked: !can('siteGenerator'),
                  required: FEATURE_PLAN.siteGenerator,
                },
                {
                  label: 'WaveIA',
                  icon: AudioWaveform,
                  to: ROUTES.waveIA,
                  locked: !can('waveIA'),
                  required: FEATURE_PLAN.waveIA,
                },
                {
                  label: 'Histórico de buscas',
                  icon: History,
                  to: ROUTES.history,
                  locked: false,
                  required: 'free' as const,
                },
              ].map((s) => (
                <li key={s.to}>
                  <Link
                    to={s.to}
                    className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-ink-850 text-fg-muted group-hover:text-electric-300">
                      <s.icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="flex-1 text-[13px] text-fg">{s.label}</span>
                    {s.locked ? (
                      <span title={`Disponível a partir do plano ${getPlan(s.required).name}`}>
                        <PlanBadge plan={s.required} size={18} />
                      </span>
                    ) : (
                      <ArrowUpRight className="size-3.5 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Atividade recente" />
            {activity.length === 0 ? (
              <p className="px-5 pt-3 pb-5 text-[13px] text-fg-subtle">Suas ações aparecerão aqui.</p>
            ) : (
              <ol className="px-5 pt-4 pb-5">
                {activity.slice(0, 7).map((a, i) => {
                  const content = (
                    <>
                      <span className="text-[13px] leading-snug text-fg-muted group-hover:text-fg">{a.label}</span>
                      <span className="mt-0.5 block text-[11px] text-fg-subtle">{formatRelative(a.createdAt)}</span>
                    </>
                  )
                  return (
                    <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
                      {i < Math.min(activity.length, 7) - 1 && (
                        <span aria-hidden className="absolute top-3 bottom-0 left-[3px] w-px bg-line" />
                      )}
                      <span
                        aria-hidden
                        className="relative mt-1.5 size-[7px] shrink-0 rounded-full border border-electric-400/60 bg-ink-900"
                      />
                      <div className="min-w-0">
                        {a.href ? (
                          <Link to={a.href} className="group block">
                            {content}
                          </Link>
                        ) : (
                          content
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}

function GettingStarted({ done }: { done: { search: boolean; lead: boolean; prompt: boolean } }) {
  const steps = [
    {
      key: 'search',
      title: 'Faça sua primeira busca',
      text: 'Escolha um segmento e uma cidade.',
      to: ROUTES.search,
      done: done.search,
    },
    {
      key: 'lead',
      title: 'Salve um lead',
      text: 'Guarde as empresas com mais potencial.',
      to: ROUTES.search,
      done: done.lead,
    },
    {
      key: 'prompt',
      title: 'Prepare sua abordagem',
      text: 'Copie um modelo da biblioteca de prompts.',
      to: ROUTES.prompts,
      done: done.prompt,
    },
  ]
  const completed = steps.filter((s) => s.done).length
  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div aria-hidden className="absolute -top-20 -right-10 h-56 w-80 rounded-full bg-electric-500/10 blur-[80px]" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">Primeiros passos</h2>
          <p className="mt-0.5 text-[13px] text-fg-subtle">
            {completed} de {steps.length} concluídos
          </p>
        </div>
        <ProgressBar value={completed} max={steps.length} className="w-28" />
      </div>
      <ol className="relative mt-5 grid gap-2.5 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.key}>
            <Link
              to={s.to}
              className={cn(
                'group flex h-full flex-col rounded-xl border p-4 transition-colors',
                s.done
                  ? 'border-emerald-400/25 bg-emerald-400/[0.04]'
                  : 'border-line-strong bg-ink-850/60 hover:border-electric-400/40',
              )}
            >
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-lg font-mono text-xs',
                  s.done ? 'bg-emerald-400/15 text-emerald-300' : 'bg-electric-500/12 text-electric-300',
                )}
              >
                {s.done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className="mt-3 text-sm font-medium text-fg">{s.title}</span>
              <span className="mt-1 text-[12px] leading-relaxed text-fg-subtle">{s.text}</span>
              {!s.done && (
                <span className="mt-3 flex items-center gap-1 text-[12px] text-electric-300">
                  Começar <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  )
}

/** Os últimos 7 dias (incluindo hoje), à meia-noite local. */
function lastSevenDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - i))
    return { date, count: 0 }
  })
}

function SearchesChart() {
  const history = useData((s) => s.history)
  const days = useMemo(() => {
    const list = lastSevenDays()
    history.forEach((h) => {
      const d = new Date(h.createdAt)
      d.setHours(0, 0, 0, 0)
      const slot = list.find((x) => x.date.getTime() === d.getTime())
      if (slot) slot.count++
    })
    return list
  }, [history])
  const max = Math.max(1, ...days.map((d) => d.count))
  const total = days.reduce((s, d) => s + d.count, 0)

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-fg">Buscas nos últimos 7 dias</h2>
        <span className="font-mono text-[13px] text-fg-muted tabular-nums">{total}</span>
      </div>
      <div
        className="mt-6 flex h-32 items-end gap-2"
        role="img"
        aria-label={`Total de ${total} buscas nos últimos 7 dias`}
      >
        {days.map((d, i) => (
          <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span className="font-mono text-[10px] text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100">
              {d.count}
            </span>
            <div
              className={cn(
                'w-full max-w-7 rounded-t-md transition-[height] duration-700',
                d.count ? 'bg-gradient-to-t from-electric-600 to-electric-400' : 'bg-white/[0.06]',
              )}
              style={{ height: d.count ? `${(d.count / max) * 100}%` : 4 }}
            />
            <span className="text-[10px] text-fg-subtle capitalize">
              {d.date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function LeadsByStatus() {
  const leads = useData((s) => s.leads)
  const counts = LEAD_STATUSES.map((s) => ({ ...s, count: leads.filter((l) => l.status === s.id).length }))
  const max = Math.max(1, ...counts.map((c) => c.count))

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-fg">Leads por status</h2>
        <Link to={ROUTES.leads} className="text-[12px] text-electric-300 hover:text-electric-200">
          Ver leads
        </Link>
      </div>
      {leads.length === 0 ? (
        <p className="mt-6 text-[13px] leading-relaxed text-fg-subtle">
          Salve empresas como lead para acompanhar o funil de vendas aqui.
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-3">
          {counts.map((c) => (
            <li key={c.id} className="contents">
              <LeadStatusBadge status={c.id} />
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-electric-400/80 transition-[width] duration-700"
                  style={{ width: `${(c.count / max) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right font-mono text-[12px] text-fg-muted tabular-nums">{c.count}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function RecentSearches() {
  const history = useData((s) => s.history)
  return (
    <Card>
      <CardHeader
        title="Pesquisas recentes"
        action={
          history.length > 0 && (
            <Link to={ROUTES.history} className="text-[12px] text-electric-300 hover:text-electric-200">
              Ver histórico
            </Link>
          )
        }
      />
      {history.length === 0 ? (
        <EmptyState
          icon={<ScanSearch />}
          title="Nenhuma pesquisa ainda"
          description="Suas buscas por empresas aparecerão aqui para você repetir quando quiser."
          action={
            <ButtonLink to={ROUTES.search} size="xs">
              Fazer primeira busca
            </ButtonLink>
          }
          className="py-10"
        />
      ) : (
        <ul className="mt-3 divide-y divide-line border-t border-line">
          {history.slice(0, 5).map((h) => (
            <li key={h.id}>
              <Link
                to={`${ROUTES.search}?segmento=${encodeURIComponent(h.segment)}&regiao=${encodeURIComponent(h.region)}`}
                className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02]"
              >
                <ScanSearch className="size-4 shrink-0 text-fg-subtle" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-fg">{h.segment}</p>
                  <p className="truncate text-[12px] text-fg-subtle">{h.region}</p>
                </div>
                <span className="hidden font-mono text-[12px] text-fg-muted tabular-nums sm:block">
                  {plural(h.resultCount, 'resultado', 'resultados')}
                </span>
                <span className="w-24 text-right text-[12px] text-fg-subtle">{formatRelative(h.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
