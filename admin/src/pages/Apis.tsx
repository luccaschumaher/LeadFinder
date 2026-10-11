import type { Dispatch, SetStateAction } from 'react'
import { Card, CardTitle } from '../components/ui'
import type { EmailStats, Summary } from '../lib/api'
import { aiCostBrl, DEFAULT_COSTS, fixedCostsBrl, searchCostBrl, type CostSettings } from '../lib/costs'
import { int, money, short } from '../lib/format'

export function Apis({
  summary,
  emails,
  costs,
  setCosts,
}: {
  summary: Summary
  emails: EmailStats | null
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

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardTitle
            title="Resend (e-mails)"
            hint={`Plano ${costs.resendUsdPerMonth > 0 ? 'pago' : 'grátis'}: até ${int(costs.resendMonthlyLimit)} por mês e ${int(costs.resendDailyLimit)} por dia.`}
          />
          {emails ? (
            <div className="space-y-4 p-5 text-[13px]">
              {[
                { label: 'Este mês', used: emails.month_total, limit: costs.resendMonthlyLimit },
                { label: 'Hoje', used: emails.today_total, limit: costs.resendDailyLimit },
              ].map((r) => {
                const pct = Math.min(100, (r.used / Math.max(1, r.limit)) * 100)
                return (
                  <div key={r.label}>
                    <div className="flex justify-between">
                      <span className="text-fg-muted">{r.label}</span>
                      <span className="text-fg tabular-nums">
                        {int(r.used)} / {int(r.limit)}
                      </span>
                    </div>
                    <div
                      className="mt-2 h-2 rounded-full bg-white/[0.05]"
                      role="progressbar"
                      aria-label={`E-mails ${r.label.toLowerCase()}`}
                      aria-valuenow={Math.round(pct)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`h-2 rounded-full ${pct > 85 ? 'bg-red-400' : 'bg-electric-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              <dl className="grid grid-cols-3 gap-3 border-t border-line pt-3">
                <div>
                  <dt className="text-fg-subtle">Cadastros</dt>
                  <dd className="tabular-nums">{int(emails.period.signups)}</dd>
                </div>
                <div>
                  <dt className="text-fg-subtle">Nova senha</dt>
                  <dd className="tabular-nums">{int(emails.period.recoveries)}</dd>
                </div>
                <div>
                  <dt className="text-fg-subtle">Resumos</dt>
                  <dd className="tabular-nums">{int(emails.period.weekly)}</dd>
                </div>
              </dl>
              <p className="text-[12px] text-fg-subtle">
                E-mails dos últimos {summary.days} dias por tipo. Custo no período:{' '}
                {money(fixedCostsBrl(summary.days, costs).resend)}.
              </p>
            </div>
          ) : (
            <p className="p-5 text-[13px] text-fg-muted">
              Rode o SQL 20261012050000_admin_email_stats.sql no Supabase para ver os e-mails enviados.
            </p>
          )}
        </Card>

        <Card>
          <CardTitle title="Custos fixos" hint="Serviços cobrados por mês (ou ano), não pelo uso." />
          <dl className="space-y-3 p-5 text-[13px]">
            {[
              {
                label: 'Cloudflare (site e painel)',
                note: costs.cloudflareUsdPerMonth > 0 ? 'plano pago' : 'plano grátis, tráfego ilimitado',
                value: fixedCostsBrl(30, costs).cloudflare,
              },
              {
                label: 'Supabase (banco e login)',
                note: costs.supabaseUsdPerMonth > 0 ? 'plano pago' : 'plano grátis (sem backup automático)',
                value: fixedCostsBrl(30, costs).supabase,
              },
              {
                label: 'Resend (e-mails)',
                note: costs.resendUsdPerMonth > 0 ? 'plano pago' : 'plano grátis',
                value: fixedCostsBrl(30, costs).resend,
              },
              { label: 'Domínio leadfinder.app.br', note: 'pago por ano', value: costs.domainBrlPerYear / 12 },
            ].map((r) => (
              <div key={r.label} className="flex items-start justify-between gap-3 border-b border-line pb-2">
                <dt>
                  <p className="text-fg">{r.label}</p>
                  <p className="text-[12px] text-fg-subtle">{r.note}</p>
                </dt>
                <dd className="text-right text-fg tabular-nums">
                  {money(r.value)}
                  <span className="block text-[11px] text-fg-subtle">por mês</span>
                </dd>
              </div>
            ))}
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
          {field('resendUsdPerMonth', 'Resend: US$ por mês (grátis = 0)')}
          {field('resendMonthlyLimit', 'Resend: e-mails por mês do plano', 1)}
          {field('resendDailyLimit', 'Resend: e-mails por dia do plano', 1)}
          {field('cloudflareUsdPerMonth', 'Cloudflare: US$ por mês (grátis = 0)')}
          {field('supabaseUsdPerMonth', 'Supabase: US$ por mês (Pro = 25)')}
          {field('domainBrlPerYear', 'Domínio: R$ por ano')}
        </div>
      </Card>
    </div>
  )
}
