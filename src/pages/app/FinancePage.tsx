import {
  CalendarDays,
  CircleCheck,
  Clock,
  Ellipsis,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState, type FormEvent } from 'react'
import { LockedFeature } from '@/components/app/notices'
import { PageHeader } from '@/components/app/PageHeader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog'
import { Badge, Card, CardHeader, EmptyState, Segmented } from '@/components/ui/display'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Menu } from '@/components/ui/Menu'
import { usePlan } from '@/hooks/usePlan'
import { cn } from '@/lib/cn'
import { errorMessage } from '@/lib/errors'
import {
  currentPeriods,
  formatBRL,
  formatBRLCompact,
  formatShortDate,
  fromDateKey,
  parseBRL,
  startOfWeek,
} from '@/lib/money'
import { toast } from '@/lib/toast'
import { normalize, plural, todayKey } from '@/lib/utils'
import { salesService, type SaleInput } from '@/services/sales'
import { useData } from '@/stores/data'
import type { Sale, SaleStatus } from '@/types'

const SERVICES = [
  'Site institucional',
  'Landing page',
  'Loja virtual',
  'Site com IA',
  'Manutenção de site',
  'SEO local',
  'Outro',
]
type Period = 'weeks' | 'month' | 'all'
const WEEKS_IN_CHART = 8
const DAY = 86_400_000

export function FinancePage() {
  const { can } = usePlan()
  if (!can('finance')) {
    return (
      <>
        <PageHeader title="Financeiro" description="Registre suas vendas e acompanhe quanto você fatura por semana." />
        <LockedFeature
          feature="finance"
          icon={Wallet}
          title="Controle das suas vendas, semana a semana"
          description="Registre cada site vendido e veja seu faturamento organizado por semana, com o que já recebeu e o que ainda está a receber."
          benefits={[
            'Registro rápido de vendas com cliente, serviço e valor',
            'Faturamento separado por semana, com gráfico',
            'Controle do que já foi pago e do que está a receber',
            'Ticket médio e totais do mês',
          ]}
          preview={<WeeklyChart sales={DEMO_PREVIEW} />}
        />
      </>
    )
  }
  return <Finance />
}

/** Vendas fictícias usadas só na prévia esmaecida da tela bloqueada. */
const DEMO_PREVIEW: Sale[] = [3, 5, 2, 6, 4, 7, 5, 8].map((v, i) => ({
  id: `p${i}`,
  client: '',
  service: '',
  amount: v * 45000,
  date: todayKey(new Date(Date.now() - (7 - i) * 7 * DAY)),
  status: 'paid',
  createdAt: '',
}))

function Finance() {
  const sales = useData((s) => s.sales)
  const [period, setPeriod] = useState<Period>('weeks')
  const [query, setQuery] = useState('')
  const [editor, setEditor] = useState<{ sale?: Sale } | null>(null)
  const [toDelete, setToDelete] = useState<Sale | null>(null)
  const [deleting, setDeleting] = useState(false)

  const stats = useMemo(() => {
    const { weekStart, monthStart } = currentPeriods()
    const sum = (list: Sale[]) => list.reduce((t, s) => t + s.amount, 0)
    const paid = sales.filter((s) => s.status === 'paid')
    return {
      total: sum(paid),
      month: sum(sales.filter((s) => fromDateKey(s.date).getTime() >= monthStart)),
      week: sum(sales.filter((s) => fromDateKey(s.date).getTime() >= weekStart)),
      pending: sum(sales.filter((s) => s.status === 'pending')),
      average: sales.length ? Math.round(sum(sales) / sales.length) : 0,
      monthCount: sales.filter((s) => fromDateKey(s.date).getTime() >= monthStart).length,
    }
  }, [sales])

  const groups = useMemo(() => {
    const q = normalize(query)
    const { weekStart, monthStart } = currentPeriods()
    const from = period === 'weeks' ? weekStart - (WEEKS_IN_CHART - 1) * 7 * DAY : period === 'month' ? monthStart : 0
    const filtered = sales
      .filter((s) => fromDateKey(s.date).getTime() >= from)
      .filter((s) => !q || normalize(`${s.client} ${s.service} ${s.notes ?? ''}`).includes(q))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    const map = new Map<number, Sale[]>()
    filtered.forEach((s) => {
      const key = startOfWeek(fromDateKey(s.date)).getTime()
      map.set(key, [...(map.get(key) ?? []), s])
    })
    return [...map.entries()].map(([start, list]) => ({
      start: new Date(start),
      end: new Date(start + 6 * DAY),
      list,
      total: list.reduce((t, s) => t + s.amount, 0),
    }))
  }, [sales, period, query])

  const remove = async () => {
    if (!toDelete) return
    setDeleting(true)
    await salesService.remove(toDelete.id)
    setDeleting(false)
    setToDelete(null)
    toast.success('Venda excluída')
  }

  const toggleStatus = async (sale: Sale) => {
    const next: SaleStatus = sale.status === 'paid' ? 'pending' : 'paid'
    await salesService.setStatus(sale.id, next)
    toast.success(next === 'paid' ? 'Marcada como paga' : 'Marcada como a receber')
  }

  const STATS = [
    { label: 'Total recebido', value: formatBRL(stats.total), icon: Wallet, hint: 'vendas pagas' },
    {
      label: 'Este mês',
      value: formatBRL(stats.month),
      icon: CalendarDays,
      hint: plural(stats.monthCount, 'venda', 'vendas'),
    },
    { label: 'Esta semana', value: formatBRL(stats.week), icon: TrendingUp, hint: 'desde segunda-feira' },
    {
      label: 'A receber',
      value: formatBRL(stats.pending),
      icon: Clock,
      hint: `ticket médio ${formatBRL(stats.average)}`,
    },
  ]

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Registre suas vendas e acompanhe quanto você fatura por semana."
        actions={
          <Button size="sm" onClick={() => setEditor({})}>
            <Plus />
            Nova venda
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label} className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-fg-subtle sm:text-[13px]">{s.label}</span>
              <s.icon className="size-4 text-fg-subtle" strokeWidth={1.75} />
            </div>
            <p className="mt-3 truncate font-mono text-lg font-medium tracking-tight text-fg tabular-nums sm:text-[22px]">
              {s.value}
            </p>
            <p className="mt-1 truncate text-[12px] text-fg-subtle">{s.hint}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader title="Vendas por semana" description={`Últimas ${WEEKS_IN_CHART} semanas · pago e a receber`} />
        <div className="px-5 pt-2 pb-5">
          <WeeklyChart sales={sales} />
        </div>
      </Card>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          label="Período"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'weeks', label: `Últimas ${WEEKS_IN_CHART} semanas` },
            { value: 'month', label: 'Este mês' },
            { value: 'all', label: 'Tudo' },
          ]}
        />
        <Input
          aria-label="Buscar vendas"
          placeholder="Buscar por cliente ou serviço"
          icon={<Search />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 sm:w-72"
        />
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {sales.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Receipt />}
              title="Nenhuma venda registrada"
              description="Registre sua primeira venda para acompanhar seu faturamento semana a semana."
              action={
                <Button size="xs" onClick={() => setEditor({})}>
                  <Plus />
                  Registrar venda
                </Button>
              }
            />
          </Card>
        ) : groups.length === 0 ? (
          <Card>
            <EmptyState icon={<Search />} title="Nenhuma venda encontrada" description="Ajuste o período ou a busca." />
          </Card>
        ) : (
          groups.map((g) => (
            <Card key={g.start.getTime()} className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-white/[0.015] px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-fg">
                    Semana de {formatShortDate(g.start)} a {formatShortDate(g.end)}
                  </p>
                  <p className="text-[12px] text-fg-subtle">{plural(g.list.length, 'venda', 'vendas')}</p>
                </div>
                <p className="font-mono text-[15px] font-medium text-fg tabular-nums">{formatBRL(g.total)}</p>
              </div>
              <ul className="divide-y divide-line">
                <AnimatePresence initial={false}>
                  {g.list.map((s) => (
                    <motion.li
                      key={s.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <div className="hidden w-12 shrink-0 text-center sm:block">
                        <p className="font-mono text-sm text-fg">{formatShortDate(fromDateKey(s.date)).slice(0, 2)}</p>
                        <p className="text-[10px] text-fg-subtle uppercase">
                          {fromDateKey(s.date).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{s.client}</p>
                        <p className="truncate text-[12px] text-fg-subtle">
                          {s.service}
                          <span className="sm:hidden"> · {formatShortDate(fromDateKey(s.date))}</span>
                          {s.notes && <span> · {s.notes}</span>}
                        </p>
                      </div>
                      <Badge tone={s.status === 'paid' ? 'green' : 'amber'} dot>
                        {s.status === 'paid' ? 'Pago' : 'A receber'}
                      </Badge>
                      <p className="w-28 text-right font-mono text-sm text-fg tabular-nums">{formatBRL(s.amount)}</p>
                      <Menu
                        trigger={(props) => (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Ações da venda para ${s.client}`}
                            {...props}
                          >
                            <Ellipsis />
                          </Button>
                        )}
                        items={[
                          { label: 'Editar', icon: <Pencil />, onSelect: () => setEditor({ sale: s }) },
                          {
                            label: s.status === 'paid' ? 'Marcar como a receber' : 'Marcar como pago',
                            icon: s.status === 'paid' ? <Clock /> : <CircleCheck />,
                            onSelect: () => toggleStatus(s),
                          },
                          'separator',
                          { label: 'Excluir', icon: <Trash2 />, danger: true, onSelect: () => setToDelete(s) },
                        ]}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </Card>
          ))
        )}
      </div>

      <SaleEditor
        key={editor?.sale?.id ?? (editor ? 'new' : 'closed')}
        state={editor}
        onClose={() => setEditor(null)}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
        destructive
        title="Excluir venda?"
        description={toDelete ? `A venda de ${formatBRL(toDelete.amount)} para ${toDelete.client} será excluída.` : ''}
        confirmLabel="Excluir"
      />
    </>
  )
}

/** Barras das últimas semanas: parte paga (sólida) e a receber (clara). */
function WeeklyChart({ sales }: { sales: Sale[] }) {
  const weeks = useMemo(() => {
    const current = currentPeriods().weekStart
    const list = Array.from({ length: WEEKS_IN_CHART }, (_, i) => ({
      start: new Date(current - (WEEKS_IN_CHART - 1 - i) * 7 * DAY),
      paid: 0,
      pending: 0,
    }))
    sales.forEach((s) => {
      const key = startOfWeek(fromDateKey(s.date)).getTime()
      const slot = list.find((w) => w.start.getTime() === key)
      if (slot) slot[s.status === 'paid' ? 'paid' : 'pending'] += s.amount
    })
    return list
  }, [sales])
  const max = Math.max(1, ...weeks.map((w) => w.paid + w.pending))

  return (
    <div>
      <div className="flex h-44 items-end gap-2 sm:gap-3" role="img" aria-label="Gráfico de vendas por semana">
        {weeks.map((w, i) => {
          const total = w.paid + w.pending
          const isCurrent = i === weeks.length - 1
          return (
            <div key={w.start.getTime()} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span
                className={cn(
                  'font-mono text-[10px] tabular-nums transition-opacity',
                  total ? 'text-fg-muted' : 'text-transparent',
                  !isCurrent && 'opacity-0 group-hover:opacity-100',
                )}
              >
                {formatBRLCompact(total)}
              </span>
              <div
                className="flex w-full max-w-10 flex-col-reverse overflow-hidden rounded-t-md transition-[height] duration-700"
                style={{ height: total ? `${(total / max) * 100}%` : 4 }}
                title={`${formatBRL(w.paid)} pago · ${formatBRL(w.pending)} a receber`}
              >
                {total === 0 ? (
                  <div className="h-full bg-white/[0.06]" />
                ) : (
                  <>
                    <div
                      className={cn(
                        'bg-gradient-to-t from-electric-600 to-electric-400',
                        isCurrent && 'from-electric-500 to-electric-300',
                      )}
                      style={{ height: `${(w.paid / total) * 100}%` }}
                    />
                    <div className="bg-electric-400/30" style={{ height: `${(w.pending / total) * 100}%` }} />
                  </>
                )}
              </div>
              <span className={cn('text-[10px] tabular-nums', isCurrent ? 'text-fg' : 'text-fg-subtle')}>
                {formatShortDate(w.start)}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-[11px] text-fg-subtle">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-electric-500" /> Pago
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-electric-400/30" /> A receber
        </span>
      </div>
    </div>
  )
}

function SaleEditor({ state, onClose }: { state: { sale?: Sale } | null; onClose: () => void }) {
  const leads = useData((s) => s.leads)
  const companies = useData((s) => s.companies)
  const sale = state?.sale
  const [client, setClient] = useState(sale?.client ?? '')
  const [service, setService] = useState(sale?.service ?? SERVICES[0])
  const [amount, setAmount] = useState(
    sale ? (sale.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
  )
  const [date, setDate] = useState(sale?.date ?? todayKey())
  const [status, setStatus] = useState<SaleStatus>(sale?.status ?? 'paid')
  const [notes, setNotes] = useState(sale?.notes ?? '')
  const [errors, setErrors] = useState<{ client?: string; amount?: string; date?: string }>({})
  const [saving, setSaving] = useState(false)

  const leadNames = useMemo(
    () =>
      leads
        .map((l) => companies[l.companyId])
        .filter(Boolean)
        .map((c) => ({ id: c.id, name: c.name })),
    [leads, companies],
  )

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    const cents = parseBRL(amount)
    const next = {
      client: client.trim() ? undefined : 'Informe o cliente.',
      amount: Number.isFinite(cents) && cents > 0 ? undefined : 'Informe um valor maior que zero.',
      date: date ? undefined : 'Informe a data.',
    }
    setErrors(next)
    if (next.client || next.amount || next.date) return
    const input: SaleInput = {
      client,
      service,
      amount: cents,
      date,
      status,
      notes: notes.trim() || undefined,
      companyId: leadNames.find((l) => l.name === client.trim())?.id,
    }
    setSaving(true)
    try {
      if (sale) await salesService.update(sale.id, input)
      else await salesService.create(input)
      toast.success(sale ? 'Venda atualizada' : 'Venda registrada', `${formatBRL(cents)} · ${client.trim()}`)
      onClose()
    } catch (err) {
      toast.error('Não foi possível salvar', errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={!!state}
      onClose={onClose}
      locked={saving}
      title={sale ? 'Editar venda' : 'Nova venda'}
      description="Registre a venda para acompanhar seu faturamento."
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button size="sm" onClick={() => submit()} loading={saving}>
            {sale ? 'Salvar alterações' : 'Registrar venda'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field
          label="Cliente"
          error={errors.client}
          hint={leadNames.length ? 'Comece a digitar para escolher um dos seus leads.' : undefined}
        >
          {({ id, describedBy }) => (
            <>
              <Input
                id={id}
                aria-describedby={describedBy}
                data-autofocus
                list="sale-clients"
                placeholder="Nome da empresa ou do cliente"
                value={client}
                onChange={(e) => {
                  setClient(e.target.value)
                  setErrors((er) => ({ ...er, client: undefined }))
                }}
                error={errors.client}
              />
              <datalist id="sale-clients">
                {leadNames.map((l) => (
                  <option key={l.id} value={l.name} />
                ))}
              </datalist>
            </>
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valor (R$)" error={errors.amount}>
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setErrors((er) => ({ ...er, amount: undefined }))
                }}
                error={errors.amount}
                className="font-mono"
              />
            )}
          </Field>
          <Field label="Data" error={errors.date}>
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                type="date"
                max={todayKey()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                error={errors.date}
                className="[color-scheme:dark]"
              />
            )}
          </Field>
        </div>
        <div>
          <p className="mb-2 text-[13px] font-medium text-fg">Serviço</p>
          <div role="radiogroup" aria-label="Serviço" className="flex flex-wrap gap-1.5">
            {SERVICES.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={service === s}
                onClick={() => setService(s)}
                className={cn(
                  'rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors',
                  service === s
                    ? 'border-electric-400/60 bg-electric-500/10 text-fg'
                    : 'border-line-strong text-fg-muted hover:text-fg',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[13px] font-medium text-fg">Situação</p>
          <Segmented
            label="Situação do pagamento"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'paid', label: 'Pago' },
              { value: 'pending', label: 'A receber' },
            ]}
          />
        </div>
        <Field label="Observações">
          {({ id }) => (
            <Textarea
              id={id}
              placeholder="Opcional: forma de pagamento, parcelas, detalhes do projeto…"
              value={notes}
              maxLength={300}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-16"
            />
          )}
        </Field>
      </form>
    </Dialog>
  )
}
