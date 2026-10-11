// =============================================================================
// LeadFinder — Edge Function "lf-monthly-report"
//
// Relatório mensal por e-mail para todos os administradores (lf_admins):
// faturamento, taxas, reembolsos, custos por serviço, lucro, assinantes e uso.
// - Agendado (pg_cron, dia 1º às 9h): relatório do mês anterior, autorizado pelo x-cron-secret.
// - Pelo painel admin ("Enviar relatório agora"): mês atual até hoje, autorizado pelo login
//   de administrador com verificação em duas etapas.
// Secrets: RESEND_API_KEY (obrigatório), REPORT_FROM e SITE_URL (opcionais).
// Publicar SEM verificação de JWT (o agendamento não tem login; a função confere sozinha):
//   npx supabase functions deploy lf-monthly-report --no-verify-jwt
// =============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
const FROM = Deno.env.get('REPORT_FROM') ?? 'LeadFinder <relatorio@leadfinder.app.br>'
const ADMIN_URL = 'https://admin.leadfinder.app.br'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

/** Mesmos padrões do painel admin (src/lib/costs.ts); o painel salva os valores reais no banco. */
const DEFAULT_COSTS = {
  usdBrl: 5.5,
  serperCreditsPerRequest: 1,
  serperUsdPer1k: 1,
  aiInputUsdPerM: 0.3,
  aiOutputUsdPerM: 2.5,
  resendUsdPerMonth: 0,
  cloudflareUsdPerMonth: 0,
  supabaseUsdPerMonth: 0,
  domainBrlPerYear: 40,
}

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

const brl = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const n = (v: number) => Number(v || 0).toLocaleString('pt-BR')
const iso = (d: Date) => d.toISOString().slice(0, 10)

/** Hoje em Brasília (só a data). */
function todayBr() {
  const s = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  return new Date(`${s}T00:00:00Z`)
}

// deno-lint-ignore no-explicit-any
function buildReport(d: any, partial: boolean, daysInPeriod: number, daysInMonth: number) {
  const c = { ...DEFAULT_COSTS, ...(d.costs ?? {}) }
  const share = partial ? daysInPeriod / daysInMonth : 1
  const api = d.api ?? {}
  const usage = d.usage ?? {}

  const costs = [
    {
      label: 'Serper (busca)',
      value: ((api.search_requests * c.serperCreditsPerRequest) / 1000) * c.serperUsdPer1k * c.usdBrl,
    },
    {
      label: 'Gemini (IA)',
      value: ((api.input_tokens / 1e6) * c.aiInputUsdPerM + (api.output_tokens / 1e6) * c.aiOutputUsdPerM) * c.usdBrl,
    },
    { label: 'Resend (e-mails)', value: c.resendUsdPerMonth * c.usdBrl * share },
    { label: 'Cloudflare (site)', value: c.cloudflareUsdPerMonth * c.usdBrl * share },
    { label: 'Supabase (banco)', value: c.supabaseUsdPerMonth * c.usdBrl * share },
    { label: 'Domínio', value: (c.domainBrlPerYear / 12) * share },
  ].sort((a, b) => b.value - a.value)
  const totalCosts = costs.reduce((s, i) => s + i.value, 0)
  const net = Number(d.gross) - Number(d.fees) - Number(d.refunds)
  const profit = net - totalCosts
  return { costs, totalCosts, net, profit, api, usage }
}

const row = (label: string, value: string, strong = false) => `
  <tr>
    <td style="padding:7px 0;font-size:14px;color:${strong ? '#0d1017' : '#3d4556'};${strong ? 'font-weight:700;' : ''}">${label}</td>
    <td style="padding:7px 0;font-size:14px;text-align:right;color:#0d1017;${strong ? 'font-weight:700;' : ''}">${value}</td>
  </tr>`

const section = (title: string, rows: string) => `
  <tr><td style="padding:18px 24px 4px">
    <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#2f6bff">${title}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e6e9f0;margin-top:6px">${rows}</table>
  </td></tr>`

// deno-lint-ignore no-explicit-any
function emailHtml(d: any, title: string, partial: boolean, r: ReturnType<typeof buildReport>) {
  const good = r.profit >= 0
  const plan = d.paying_by_plan ?? {}
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#eef1f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
    <tr><td style="background:#05060a;padding:20px 24px">
      <span style="font-size:18px;font-weight:700;color:#fff">Lead<span style="color:#5b91ff">Finder</span></span>
      <span style="font-size:12px;color:#9aa3b5;margin-left:8px">Relatório para administradores</span>
    </td></tr>
    <tr><td style="padding:26px 24px 6px">
      <h1 style="margin:0;font-size:21px;color:#0d1017">📊 ${title}</h1>
      ${partial ? '<p style="margin:6px 0 0;font-size:13px;color:#5b6478">Parcial: do dia 1º até hoje.</p>' : ''}
    </td></tr>
    <tr><td style="padding:14px 24px 4px">
      <div style="border-radius:14px;padding:18px;background:${good ? '#ecfdf5' : '#fef2f2'}">
        <div style="font-size:13px;color:${good ? '#047857' : '#b91c1c'}">${good ? 'Lucro estimado' : 'Prejuízo estimado'}</div>
        <div style="font-size:30px;font-weight:800;color:${good ? '#065f46' : '#991b1b'};margin-top:4px">${brl(r.profit)}</div>
        <div style="font-size:13px;color:#3d4556;margin-top:6px">Receita líquida ${brl(r.net)} − custos ${brl(r.totalCosts)}</div>
      </div>
    </td></tr>
    ${section(
      '💰 Faturamento',
      row(`Vendas (${n(d.new_sales)} novas · ${n(d.renewals)} renovações)`, brl(d.gross)) +
        row('Taxas da Cakto', `− ${brl(d.fees)}`) +
        row(`Reembolsos e chargebacks (${n(d.refunds_count)})`, `− ${brl(d.refunds)}`) +
        row('Receita líquida', brl(r.net), true),
    )}
    ${section(
      '🧾 Custos',
      r.costs.map((i) => row(i.label, i.value > 0 ? brl(i.value) : 'grátis')).join('') +
        row('Total de custos', brl(r.totalCosts), true),
    )}
    ${section(
      '👥 Clientes',
      row('Assinantes pagantes agora', n(d.paying_now), true) +
        row('Silver · Gold · Diamond', `${n(plan.silver)} · ${n(plan.gold)} · ${n(plan.diamond)}`) +
        row('Receita mensal recorrente', brl(d.mrr)) +
        row('Cancelamentos no mês', n(d.cancellations)) +
        row('Novos cadastros no mês', n(d.new_users)) +
        row('Usuários no total', n(d.users_total)),
    )}
    ${section(
      '⚡ Uso',
      row('Usuários ativos', n(r.usage.active_users)) +
        row('Buscas', n(r.usage.searches)) +
        row('Empresas exibidas', n(r.usage.companies)) +
        row('Mensagens da LeadIA', n(r.usage.wave_messages)) +
        row('Prompts gerados', n(r.usage.site_generations)) +
        row('Consultas à Serper', n(r.api.search_requests)) +
        row('Chamadas de IA', n(r.api.ai_calls)) +
        row('E-mails enviados', n(d.emails)),
    )}
    <tr><td style="padding:20px 24px 26px">
      <a href="${ADMIN_URL}" style="display:inline-block;background:#2f6bff;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px">Abrir o painel admin</a>
    </td></tr>
    <tr><td style="padding:14px 24px;border-top:1px solid #e6e9f0;font-size:12px;line-height:1.5;color:#8a93a6">
      Custos de busca e IA são estimativas com os preços da aba "APIs e custos" do painel. Contas de teste e de administrador não entram nos números de clientes.
    </td></tr>
  </table></td></tr></table></body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  // Quem pode pedir: o agendamento (segredo) ou um administrador logado com 2 etapas.
  const { data: secret } = await admin.from('lf_private_settings').select('value').eq('key', 'cron_secret').single()
  const fromCron = !!secret?.value && req.headers.get('x-cron-secret') === secret.value
  if (!fromCron) {
    const authorization = req.headers.get('Authorization')
    if (!authorization) return json(401, { error: 'unauthorized', message: 'Entre no painel para enviar o relatório.' })
    const db = createClient(SUPABASE_URL, req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const { error } = await db.rpc('lf_admin_check')
    if (error) return json(403, { error: 'forbidden', message: 'Só administradores podem enviar o relatório.' })
  }
  if (!RESEND_KEY) return json(500, { error: 'not_configured', message: 'RESEND_API_KEY não configurada.' })

  // deno-lint-ignore no-explicit-any
  let body: any = {}
  try {
    body = await req.json()
  } catch {
    /* sem corpo */
  }
  const previous = fromCron || body.month === 'previous'

  const today = todayBr()
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  const from = previous ? new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)) : monthStart
  const to = previous ? monthStart : new Date(today.getTime() + 86400000)
  const daysInMonth = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0)).getUTCDate()
  const daysInPeriod = Math.round((to.getTime() - from.getTime()) / 86400000)
  const monthKey = iso(from).slice(0, 7)

  // O agendamento manda no máximo um relatório por mês.
  if (fromCron) {
    const { data: last } = await admin
      .from('lf_private_settings')
      .select('value')
      .eq('key', 'monthly_report_last')
      .maybeSingle()
    if (last?.value === monthKey) return json(200, { ok: true, skipped: 'já enviado', month: monthKey })
  }

  const { data, error } = await admin.rpc('lf_monthly_report_data', { p_from: iso(from), p_to: iso(to) })
  if (error) {
    console.error('lf_monthly_report_data', error.message)
    return json(500, { error: 'query_failed', message: 'Não foi possível montar o relatório.' })
  }
  const admins: string[] = data.admins ?? []
  if (!admins.length) return json(200, { ok: false, message: 'Nenhum administrador cadastrado.' })

  const title = `Relatório de ${MONTHS[from.getUTCMonth()]} de ${from.getUTCFullYear()}`
  const report = buildReport(data, !previous, daysInPeriod, daysInMonth)
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(
      admins.map((to) => ({
        from: FROM,
        to: [to],
        subject: `${report.profit >= 0 ? '📈' : '📉'} ${title}: lucro ${brl(report.profit)}${previous ? '' : ' (parcial)'}`,
        html: emailHtml(data, title, !previous, report),
      })),
    ),
  })
  if (!res.ok) {
    console.error('Resend', res.status, await res.text())
    return json(502, { error: 'send_failed', message: 'O Resend não aceitou o envio. Veja os registros da função.' })
  }
  if (fromCron) {
    await admin
      .from('lf_private_settings')
      .upsert({ key: 'monthly_report_last', value: monthKey }, { onConflict: 'key' })
  }
  return json(200, { ok: true, month: monthKey, sent: admins.length })
})
