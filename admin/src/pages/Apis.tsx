import type { Dispatch, SetStateAction } from 'react'
import { Card, CardTitle } from '../components/ui'
import type { Summary } from '../lib/api'
import { aiCostBrl, DEFAULT_COSTS, searchCostBrl, type CostSettings } from '../lib/costs'
import { int, money, short } from '../lib/format'

export function Apis({
  summary,
  costs,
  setCosts,
}: {
  summary: Summary
  costs: CostSettings
  setCosts: Dispatch<SetStateAction<CostSettings>>
}) {
  const daily = summary.daily ?? []
  const search = daily.reduce((s, d) => s + d.search_requests, 0)
  const aiCalls = daily.reduce((s, d) => s + d.ai_calls, 0)
  const input = daily.reduce((s, d) => s + d.input_tokens, 0)
  const output = daily.reduce((s, d) => s + d.output_tokens, 0)

  const creditsUsed = summary.serper_requests_all_time * costs.serperCreditsPerRequest
  const creditsLeft = Math.max(0, costs.serperCreditsPurchased - creditsUsed)
  const perDay = (search * costs.serperCreditsPerRequest) / Math.max(1, summary.days)
  const daysLeft = perDay > 0 ? Math.floor(creditsLeft / perDay) : null
  const usedPct = Math.min(100, (creditsUsed / Math.max(1, costs.serperCreditsPurchased)) * 100)

  const field = (key: keyof CostSettings, label: string, step = 0.01) => (
    <label className="text-[12px] text-fg-muted">
      {label}
      <input
        type="number"
        min={0}
        step={step}
        value={costs[key]}
        onChange={(e) => setCosts((c) => ({ ...c, [key]: Number(e.target.value) || 0 }))}
        className="mt-1 w-full rounded-lg border border-line-strong bg-ink-950 px-3 py-1.5 text-[13px] text-fg tabular-nums"
      />
    </label>
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardTitle
            title="Serper (busca de empresas)"
            hint="Pré-pago: nunca gasta mais do que os créditos comprados."
          />
          <div className="space-y-4 p-5 text-[13px]">
            <div>
              <div className="flex justify-between">
                <span className="text-fg-muted">Créditos usados (desde o início)</span>
                <span className="text-fg tabular-nums">
                  {int(creditsUsed)} / {int(costs.serperCreditsPurchased)}
                </span>
              </div>
              <div
                className="mt-2 h-2 rounded-full bg-white/[0.05]"
                role="progressbar"
                aria-valuenow={Math.round(usedPct)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-2 rounded-full ${usedPct > 85 ? 'bg-red-400' : 'bg-electric-400'}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-fg-subtle">Saldo estimado</dt>
                <dd className="text-lg font-semibold tabular-nums">{int(creditsLeft)}</dd>
              </div>
              <div>
                <dt className="text-fg-subtle">Dura mais ou menos</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {daysLeft === null ? '—' : `${int(daysLeft)} dias`}
                </dd>
              </div>
              <div>
                <dt className="text-fg-subtle">Consultas ({summary.days} dias)</dt>
                <dd className="tabular-nums">{int(search)}</dd>
              </div>
              <div>
                <dt className="text-fg-subtle">Custo ({summary.days} dias)</dt>
                <dd className="tabular-nums">{money(searchCostBrl(search, costs))}</dd>
              </div>
            </dl>
            <p className="text-[12px] text-fg-subtle">
              Confira o saldo exato no painel da Serper e ajuste os valores abaixo.
            </p>
          </div>
        </Card>

        <Card>
          <CardTitle title="Gemini (LeadIA e Gerador)" hint="Pós-pago: crie alerta e limite de uso no Google Cloud." />
          <dl className="grid grid-cols-2 gap-3 p-5 text-[13px]">
            <div>
              <dt className="text-fg-subtle">Chamadas ({summary.days} dias)</dt>
              <dd className="text-lg font-semibold tabular-nums">{int(aiCalls)}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Custo estimado</dt>
              <dd className="text-lg font-semibold tabular-nums">{money(aiCostBrl(input, output, costs))}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Tokens de entrada</dt>
              <dd className="tabular-nums">{short(input)}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Tokens de saída</dt>
              <dd className="tabular-nums">{short(output)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-fg-subtle">Custo médio por chamada</dt>
              <dd className="tabular-nums">{aiCalls ? money(aiCostBrl(input, output, costs) / aiCalls) : '—'}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card>
        <CardTitle
          title="Preços usados nas estimativas"
          hint="Salvos só neste navegador. Atualize com os valores reais da Serper e do Google AI Studio."
          action={
            <button
              type="button"
              onClick={() => setCosts(DEFAULT_COSTS)}
              className="text-[12px] text-electric-300 hover:underline"
            >
              Restaurar padrão
            </button>
          }
        />
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          {field('usdBrl', 'Dólar (R$ por US$)')}
          {field('serperCreditsPurchased', 'Créditos Serper comprados (total)', 1)}
          {field('serperCreditsPerRequest', 'Créditos Serper por consulta', 1)}
          {field('serperUsdPer1k', 'Serper: US$ por 1.000 créditos')}
          {field('aiInputUsdPerM', 'Gemini: US$ por 1M tokens de entrada')}
          {field('aiOutputUsdPerM', 'Gemini: US$ por 1M tokens de saída')}
        </div>
      </Card>
    </div>
  )
}
