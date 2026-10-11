import { Check, Coins, CreditCard, Minus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DemoNotice } from '@/components/app/notices'
import { PageHeader } from '@/components/app/PageHeader'
import { ComingSoonPlan } from '@/components/brand/ComingSoonPlan'
import { PlanBadge } from '@/components/brand/PlanBadge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Badge, Card, ProgressBar } from '@/components/ui/display'
import { Reveal } from '@/components/ui/primitives'
import { PLAN_SIMULATION } from '@/config/app'
import { comparePlans, FEATURE_PLAN, hasPlanAccess, isUnlimited, PLANS, type Plan } from '@/config/plans'
import { usePlan } from '@/hooks/usePlan'
import { cn } from '@/lib/cn'
import { errorMessage } from '@/lib/errors'
import { toast } from '@/lib/toast'
import { authService } from '@/services/auth'
import { billingService } from '@/services/billing'

const ROWS: { label: string; value: (p: Plan) => string | boolean }[] = [
  { label: 'Tokens por dia (1 token = 1 empresa)', value: (p) => `${p.limits.tokens}` },
  { label: 'Busca de empresas', value: () => true },
  { label: 'Meus Leads, Favoritos e Histórico', value: () => true },
  {
    label: 'Biblioteca de prompts',
    value: (p) =>
      p.limits.savedPrompts === 0
        ? false
        : isUnlimited(p.limits.savedPrompts)
          ? 'Ilimitada'
          : `Até ${p.limits.savedPrompts} prompts`,
  },
  { label: 'Financeiro (controle de vendas)', value: (p) => hasPlanAccess(p.id, FEATURE_PLAN.finance) },
  {
    label: 'Gerador de prompts para sites',
    value: (p) => (p.limits.siteGenerationsPerDay ? `${p.limits.siteGenerationsPerDay} por dia` : false),
  },
  { label: 'LeadIA', value: (p) => (p.limits.waveIA ? `${p.limits.waveMessagesPerDay} mensagens/dia` : false) },
]

export function PlansPage() {
  const { plan: current, tokens, prompts, siteGenerations } = usePlan()
  const [target, setTarget] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)
  // Voltando do checkout da Cakto (página de obrigado), já fica conferindo se o plano ativou.
  const [awaitingPayment, setAwaitingPayment] = useState(() => /cakto/i.test(document.referrer))

  // Depois de abrir o checkout, confere o plano sempre que a pessoa volta para esta aba.
  useEffect(() => {
    if (!awaitingPayment) return
    const before = current.id
    const check = () => {
      if (document.visibilityState !== 'visible') return
      authService
        .refreshPlan()
        .then((plan) => {
          if (plan && comparePlans(plan, before) > 0) {
            setAwaitingPayment(false)
            toast.success('Pagamento confirmado', 'Seu novo plano já está ativo. Bom proveito!')
          }
        })
        .catch(() => undefined)
    }
    const timer = window.setInterval(check, 15000)
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [awaitingPayment, current.id])

  const goToCheckout = () => {
    if (!target) return
    try {
      billingService.openCheckout(target.id)
      toast.info(
        'Checkout aberto em uma nova aba',
        'Conclua o pagamento na Cakto. Assim que for aprovado, o plano é ativado sozinho, sem precisar sair da conta.',
      )
      setAwaitingPayment(true)
      setTarget(null)
    } catch (err) {
      toast.error('Não foi possível abrir o checkout', errorMessage(err))
    }
  }

  const simulate = async () => {
    if (!target) return
    setLoading(true)
    try {
      await billingService.simulateChange(target.id)
      toast.success(`Plano ${target.name} ativado`, 'Teste sem pagamento: nenhuma cobrança foi realizada.')
      setTarget(null)
    } catch (err) {
      toast.error('Não foi possível trocar de plano', errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const downgradeWarnings = (p: Plan) => {
    const list: string[] = []
    if (current.limits.savedPrompts > 0 && p.limits.savedPrompts === 0)
      list.push(
        'A Biblioteca de prompts deixará de estar disponível. Seus prompts continuam salvos e voltam a aparecer se você retornar a um plano com a biblioteca.',
      )
    else if (prompts.used > p.limits.savedPrompts)
      list.push(
        `Você tem ${prompts.used} prompts salvos; o plano ${p.name} permite ${p.limits.savedPrompts}. Os existentes continuam acessíveis, mas não será possível criar novos.`,
      )
    if (current.limits.siteGenerationsPerDay > 0 && p.limits.siteGenerationsPerDay === 0)
      list.push('O Gerador de prompts para sites deixará de estar disponível.')
    if (current.limits.waveIA && !p.limits.waveIA) list.push('Você perderá o acesso à LeadIA.')
    if (tokens.used > p.limits.tokens)
      list.push('Você já usou hoje mais tokens do que o novo plano permite por dia; o saldo volta amanhã.')
    return list
  }

  const isUpgrade = target ? comparePlans(target.id, current.id) > 0 : false

  return (
    <>
      <PageHeader
        title="Planos e tokens"
        description="Compare os planos e escolha o que combina com o seu ritmo de prospecção."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-[13px] text-fg-subtle">Plano atual</p>
          <p className="mt-2 flex items-center gap-2 text-xl font-semibold tracking-tight text-fg">
            <PlanBadge plan={current.id} size={28} />
            {current.name}
          </p>
          <p className="mt-1 text-[12px] text-fg-subtle">{current.priceLabel ?? 'Preço a definir'}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-1.5 text-fg-subtle">
              <Coins className="size-3.5 text-electric-300" />
              Tokens hoje
            </span>
            <span className="font-mono text-fg tabular-nums">
              {tokens.balance}/{tokens.total}
            </span>
          </div>
          <ProgressBar
            value={tokens.balance}
            max={tokens.total}
            className="mt-3"
            tone={tokens.balance === 0 ? 'red' : 'blue'}
          />
          <p className="mt-2 text-[12px] text-fg-subtle">Cada empresa exibida consome 1 token. Renovam à meia-noite.</p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-fg-subtle">Uso dos recursos</p>
          <dl className="mt-3 space-y-1.5 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-fg-muted">Prompts salvos</dt>
              <dd className="font-mono text-fg tabular-nums">
                {prompts.total === 0
                  ? '—'
                  : isUnlimited(prompts.total)
                    ? `${prompts.used} · ilimitado`
                    : `${prompts.used}/${prompts.total}`}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-muted">Gerações hoje</dt>
              <dd className="font-mono text-fg tabular-nums">
                {siteGenerations.total ? `${siteGenerations.used}/${siteGenerations.total}` : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-muted">LeadIA</dt>
              <dd className="text-fg">{current.limits.waveIA ? 'Incluída' : 'Não incluída'}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {PLAN_SIMULATION && (
        <DemoNotice className="mt-4">
          Os botões de assinatura já levam ao checkout da Cakto. A ativação automática do plano após o pagamento chega
          com o backend; até lá, use “Testar sem pagar” para experimentar cada plano.
        </DemoNotice>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p, i) => {
          const isCurrent = p.id === current.id
          const diff = comparePlans(p.id, current.id)
          return (
            <Reveal key={p.id} delay={i * 0.05} className="h-full">
              <Card
                className={cn(
                  'relative flex h-full flex-col p-5',
                  isCurrent &&
                    'border-electric-400/60 shadow-[0_0_0_1px_rgb(91_145_255/0.3),0_20px_48px_-24px_rgb(47_107_255/0.6)]',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5">
                    <PlanBadge plan={p.id} size={36} />
                    <h2 className="text-base font-semibold tracking-tight text-fg">{p.name}</h2>
                  </span>
                  {isCurrent ? (
                    <Badge tone="blue">Plano atual</Badge>
                  ) : p.recommended ? (
                    <Badge>Recomendado</Badge>
                  ) : null}
                </div>
                <p className="mt-1.5 min-h-10 text-[13px] leading-snug text-fg-muted">{p.description}</p>
                <p className="mt-5 text-xl font-semibold tracking-tight text-fg">{p.priceLabel ?? 'Preço a definir'}</p>
                <p className="mt-0.5 font-mono text-[12px] text-electric-300">{p.limits.tokens} tokens por dia</p>
                <Button
                  className="mt-5 w-full"
                  size="sm"
                  variant={isCurrent ? 'secondary' : diff > 0 ? 'primary' : 'secondary'}
                  disabled={isCurrent}
                  onClick={() => setTarget(p)}
                >
                  {isCurrent ? 'Plano atual' : diff > 0 ? `Fazer upgrade para ${p.name}` : `Mudar para ${p.name}`}
                </Button>
                <ul className="mt-5 space-y-2.5 border-t border-line pt-5">
                  {ROWS.map((row) => {
                    const v = row.value(p)
                    return (
                      <li
                        key={row.label}
                        className={cn('flex gap-2 text-[13px] leading-snug', v ? 'text-fg-muted' : 'text-fg-subtle')}
                      >
                        {v ? (
                          <Check className="mt-0.5 size-3.5 shrink-0 text-electric-400" />
                        ) : (
                          <Minus className="mt-0.5 size-3.5 shrink-0" />
                        )}
                        <span>
                          {row.label}
                          {typeof v === 'string' && <span className="text-fg">: {v}</span>}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            </Reveal>
          )
        })}
      </div>

      <ComingSoonPlan className="mt-3" />

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <caption className="px-5 pt-5 pb-3 text-left text-sm font-semibold text-fg">
              Comparação dos recursos
            </caption>
            <thead className="border-y border-line bg-overlay/[0.015] text-[11px] tracking-wide text-fg-subtle uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">
                  Recurso
                </th>
                {PLANS.map((p) => (
                  <th
                    key={p.id}
                    scope="col"
                    className={cn('px-4 py-3 text-center font-medium', p.id === current.id && 'text-electric-300')}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="px-5 py-3 font-normal text-fg-muted">
                    {row.label}
                  </th>
                  {PLANS.map((p) => {
                    const v = row.value(p)
                    return (
                      <td
                        key={p.id}
                        className={cn('px-4 py-3 text-center', p.id === current.id && 'bg-electric-500/[0.04]')}
                      >
                        {v === true ? (
                          <Check className="mx-auto size-4 text-electric-400" aria-label="Incluído" />
                        ) : v === false ? (
                          <Minus className="mx-auto size-4 text-fg-subtle" aria-label="Não incluído" />
                        ) : (
                          <span className="text-fg">{v}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 flex items-center gap-2 text-[12px] text-fg-subtle">
        <CreditCard className="size-3.5" />
        Assinaturas mensais processadas pela Cakto.
      </p>

      <Dialog
        open={!!target}
        onClose={() => setTarget(null)}
        locked={loading}
        size="sm"
        title={target ? (isUpgrade ? `Assinar o plano ${target.name}` : `Mudar para o plano ${target.name}?`) : ''}
        description={
          target && (
            <span className="block space-y-2">
              <span className="block">
                {isUpgrade
                  ? `${target.priceLabel} · ${target.limits.tokens} tokens por dia e todos os recursos do plano ${target.name}. O pagamento é feito com segurança pela Cakto.`
                  : `Seus limites passarão a ser os do plano ${target.name}.`}
              </span>
              {isUpgrade && current.checkoutUrl && (
                <span className="block text-amber-200/90">
                  {`Depois de assinar, cancele a assinatura do plano ${current.name} pelo link que a Cakto enviou no seu e-mail de compra, para não pagar os dois planos.`}
                </span>
              )}
              {!isUpgrade && !PLAN_SIMULATION && (
                <span className="block text-fg-subtle">
                  {target.checkoutUrl
                    ? `Para mudar, assine o plano ${target.name} e depois cancele a assinatura do plano ${current.name} pelo link que a Cakto enviou no seu e-mail de compra.`
                    : `Para voltar ao Free, cancele sua assinatura pelo link que a Cakto enviou no seu e-mail de compra. Você continua com o plano ${current.name} até o fim do período já pago.`}
                </span>
              )}
              {!isUpgrade &&
                downgradeWarnings(target).map((w) => (
                  <span key={w} className="block text-amber-200/90">
                    • {w}
                  </span>
                ))}
              {PLAN_SIMULATION && (
                <span className="block text-fg-subtle">
                  {isUpgrade
                    ? 'Durante os testes, você também pode ativar o plano sem pagar.'
                    : 'Durante os testes, a mudança é aplicada sem cobrança.'}
                </span>
              )}
            </span>
          )
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setTarget(null)} disabled={loading}>
              Cancelar
            </Button>
            {PLAN_SIMULATION && isUpgrade && (
              <Button variant="ghost" size="sm" onClick={simulate} loading={loading}>
                Testar sem pagar
              </Button>
            )}
            {isUpgrade || (!PLAN_SIMULATION && target?.checkoutUrl) ? (
              <Button size="sm" onClick={goToCheckout} disabled={loading || !target?.checkoutUrl} data-autofocus>
                <CreditCard />
                Ir para o pagamento
              </Button>
            ) : !PLAN_SIMULATION ? null : (
              <Button
                variant={target && downgradeWarnings(target).length > 0 ? 'danger' : 'primary'}
                size="sm"
                onClick={simulate}
                loading={loading}
                disabled={!PLAN_SIMULATION}
                data-autofocus
              >
                Confirmar mudança
              </Button>
            )}
          </>
        }
      />
    </>
  )
}
