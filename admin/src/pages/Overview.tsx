import { TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BarChart } from '../components/BarChart'
import { ReportButton } from '../components/ReportButton'
import { ServiceCostChart } from '../components/ServiceCostChart'
import { Card, CardTitle, Segmented, Stat } from '../components/ui'
import type { Summary } from '../lib/api'
import { aiCostBrl, costByService, searchCostBrl, type CostSettings } from '../lib/costs'
import { int, money, PLAN_LABEL, short } from '../lib/format'

type Metric = 'search_requests' | 'ai_calls' | 'tokens' | 'active_users' | 'new_users' | 'cost'

export function Overview({ summary, costs }: { summary: Summary; costs: CostSettings }) {
  const [metric, setMetric] = useState<Metric>('cost')
  const daily = useMemo(() => summary.daily ?? [], [summary.daily])

  const totals = useMemo(() => {
    const t = { search: 0, ai: 0, input: 0, output: 0, newUsers: 0, companies: 0, messages: 0, generations: 0 }
    for (const d of daily) {
      t.search += d.search_requests
      t.ai += d.ai_calls
      t.input += d.input_tokens
      t.output += d.output_tokens
      t.newUsers += d.new_users
      t.companies += d.companies
      t.messages += d.wave_messages
      t.generations += d.site_generations
    }
    return t
  }, [daily])

  const services = costByService(totals, summary.days, costs)
  const variable = searchCostBrl(totals.search, costs) + aiCostBrl(totals.input, totals.output, costs)
  const cost = services.reduce((s, i) => s + i.value, 0)
  const fixed = cost - variable
  // Receita do período: receita mensal proporcional aos dias escolhidos.
  const revenue = (summary.mrr * summary.days) / 30
  const margin = revenue - cost

  const series = daily.map((d) => ({
    day: d.day,
    value:
      metric === 'tokens'
        ? d.input_tokens + d.output_tokens
        : metric === 'cost'
          ? searchCostBrl(d.search_requests, costs) + aiCostBrl(d.input_tokens, d.output_tokens, costs)
          : d[metric],
  }))

  const plans = (['free', 'silver', 'gold', 'diamond'] as const).map((p) => ({
    plan: p,
    n: summary.users_by_plan[p] ?? 0,
  }))
  const maxPlan = Math.max(1, ...plans.map((p) => p.n))

  return (
    <div className="space-y-4">
      {summary.billing_failures > 0 && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/[0.07] px-4 py-3 text-[13px] text-amber-100"
        >
          <TriangleAlert className="size-4 shrink-0 text-amber-300" />
          {summary.billing_failures} aviso(s) de pagamento pendente(s). Veja a aba Pagamentos.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Usuários"
          value={int(summary.users_total)}
          sub={`+${int(totals.newUsers)} nos últimos ${summary.days} dias`}
        />
        <Stat
          label="Assinantes pagantes"
          value={int(summary.paying_users)}
          sub={`Receita mensal estimada ${money(summary.mrr)}`}
        />
        <Stat
          label={`Custo estimado (${summary.days} dias)`}
          value={money(cost)}
          sub={`Por uso ${money(variable)} · fixos ${money(fixed)}`}
        />
        <Stat
          label={`Resultado estimado (${summary.days} dias)`}
          value={money(margin)}
          sub={`Receita ${money(revenue)} − custo ${money(cost)}`}
          tone={margin >= 0 ? 'good' : 'bad'}
        />
      </div>

      <Card>
        <CardTitle
          title={`Custo por serviço (${summary.days} dias)`}
          hint="Quem está gastando mais. Busca e IA são calculadas pelo uso; os demais são custos fixos da aba APIs e custos."
          action={<ReportButton />}
        />
        <div className="p-5">
          <ServiceCostChart items={services} />
        </div>
      </Card>

      <Card>
        <CardTitle
          title="Uso por dia"
          hint="Passe o mouse (ou toque) nas barras para ver o valor do dia."
          action={
            <Segmented
              label="Métrica do gráfico"
              value={metric}
              onChange={setMetric}
              options={[
                { value: 'cost', label: 'Custo (R$)' },
                { value: 'search_requests', label: 'Consultas de busca' },
                { value: 'ai_calls', label: 'Chamadas de IA' },
                { value: 'tokens', label: 'Tokens de IA' },
                { value: 'active_users', label: 'Usuários ativos' },
                { value: 'new_users', label: 'Cadastros' },
              ]}
            />
          }
        />
        <div className="p-4">
          <BarChart data={series} label="Uso por dia" format={metric === 'cost' ? money : short} />
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardTitle title="Usuários por plano" />
          <ul className="space-y-3 p-5">
            {plans.map((p) => (
              <li key={p.plan} className="grid grid-cols-[72px_1fr_48px] items-center gap-3 text-[13px]">
                <span className="text-fg-muted">{PLAN_LABEL[p.plan]}</span>
                <span className="h-2 rounded-full bg-white/[0.05]">
                  <span
                    className="block h-2 rounded-full bg-electric-400"
                    style={{ width: `${(p.n / maxPlan) * 100}%` }}
                  />
                </span>
                <span className="text-right text-fg tabular-nums">{int(p.n)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle title={`Uso dos recursos (${summary.days} dias)`} />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 p-5 text-[13px]">
            {[
              ['Empresas exibidas', totals.companies],
              ['Consultas de busca (Serper)', totals.search],
              ['Mensagens LeadIA', totals.messages],
              ['Prompts gerados', totals.generations],
              ['Tokens de IA (entrada)', totals.input],
              ['Tokens de IA (saída)', totals.output],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between gap-2 border-b border-line pb-2">
                <dt className="text-fg-muted">{k}</dt>
                <dd className="text-fg tabular-nums">{short(v as number)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  )
}
