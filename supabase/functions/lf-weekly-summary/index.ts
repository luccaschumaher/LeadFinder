// =============================================================================
// LeadFinder — Edge Function "lf-weekly-summary"
//
// Chamada toda segunda às 9h pelo pg_cron (veja 20261012020000_weekly_summary.sql).
// Envia pelo Resend o resumo semanal personalizado de cada usuário que deixou a opção
// ligada e usou o LeadFinder na semana.
//
// Secrets (Supabase › Edge Functions › Secrets):
//   RESEND_API_KEY   — chave do Resend (sem ela, a função não envia nada)
//   RESEND_FROM      — opcional, ex.: "LeadFinder <resumo@leadfinder.app.br>"
//   SITE_URL         — opcional, ex.: "https://leadfinder.app.br"
//   WEEKLY_MAX       — opcional, máximo de e-mails por envio (padrão 80; o Resend grátis manda 100/dia)
// Publicar SEM verificação de JWT (quem chama é o banco, autorizado pelo x-cron-secret):
//   npx supabase functions deploy lf-weekly-summary --no-verify-jwt
// =============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
const FROM = Deno.env.get('RESEND_FROM') ?? 'LeadFinder <resumo@leadfinder.app.br>'
const SITE = (Deno.env.get('SITE_URL') ?? 'https://leadfinder.app.br').replace(/\/$/, '')
const MAX = Number(Deno.env.get('WEEKLY_MAX') ?? 80)

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

interface Row {
  user_id: string
  email: string
  name: string
  plan: string
  companies: number
  searches: number
  site_generations: number
  wave_messages: number
  new_leads: number
  converted_leads: number
  sales_count: number
  sales_cents: number
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const brl = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const n = (v: number) => Number(v).toLocaleString('pt-BR')

/** Uma dica curta escolhida a partir do que a pessoa fez na semana. */
function tip(r: Row) {
  if (Number(r.converted_leads) > 0)
    return `Parabéns pelos ${n(r.converted_leads)} cliente(s) fechado(s)! 🎉 Peça um depoimento e indicações enquanto a experiência está fresca.`
  if (Number(r.new_leads) > 0 && r.plan === 'diamond')
    return 'Você tem leads novos esperando contato. Peça à LeadIA um script personalizado para cada um. 💬'
  if (Number(r.new_leads) > 0)
    return 'Você tem leads novos esperando contato. A primeira mensagem nas primeiras 48 horas faz toda a diferença. ⏱️'
  if (Number(r.companies) > 0)
    return 'Você encontrou empresas esta semana: salve as melhores em Meus Leads para não perder nenhuma oportunidade. ⭐'
  return 'Uma busca por dia já enche o seu funil. Experimente o filtro "só empresas sem site". 🔎'
}

function emailHtml(r: Row) {
  const first = esc((r.name || '').trim().split(/\s+/)[0] || 'tudo bem')
  const stats: [string, string][] = [
    ['Empresas encontradas', n(r.companies)],
    ['Buscas', n(r.searches)],
    ['Leads novos', n(r.new_leads)],
    ['Vendas registradas', Number(r.sales_count) > 0 ? brl(Number(r.sales_cents)) : '—'],
  ]
  const cells = stats
    .map(
      ([label, value]) => `
        <td width="50%" style="padding:6px">
          <div style="background:#f4f7ff;border-radius:12px;padding:14px 16px">
            <div style="font-size:12px;color:#5b6478">${label}</div>
            <div style="font-size:22px;font-weight:700;color:#0d1017;margin-top:4px">${value}</div>
          </div>
        </td>`,
    )
    .reduce(
      (rows, cell, i) => (i % 2 === 0 ? [...rows, cell] : [...rows.slice(0, -1), rows[rows.length - 1] + cell]),
      [] as string[],
    )
    .map((row) => `<tr>${row}</tr>`)
    .join('')
  const extras = [
    Number(r.site_generations) > 0 ? `${n(r.site_generations)} prompt(s) de site gerado(s)` : '',
    Number(r.wave_messages) > 0 ? `${n(r.wave_messages)} conversa(s) com a LeadIA` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#eef1f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden">
      <tr><td style="background:#05060a;padding:20px 24px">
        <span style="font-size:18px;font-weight:700;color:#ffffff">Lead<span style="color:#5b91ff">Finder</span></span>
      </td></tr>
      <tr><td style="padding:28px 24px 8px">
        <h1 style="margin:0;font-size:22px;color:#0d1017">Oi, ${first}! 👋</h1>
        <p style="margin:8px 0 0;font-size:15px;line-height:1.5;color:#3d4556">Aqui está o resumo da sua prospecção nos últimos 7 dias.</p>
      </td></tr>
      <tr><td style="padding:12px 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cells}</table></td></tr>
      ${extras ? `<tr><td style="padding:0 24px 8px;font-size:13px;color:#5b6478">${extras}</td></tr>` : ''}
      <tr><td style="padding:12px 24px">
        <div style="border-left:3px solid #2f6bff;background:#f4f7ff;border-radius:8px;padding:12px 14px;font-size:14px;line-height:1.5;color:#1d2330">${tip(r)}</div>
      </td></tr>
      <tr><td style="padding:16px 24px 28px">
        <a href="${SITE}/app" style="display:inline-block;background:#2f6bff;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px">Abrir o LeadFinder</a>
      </td></tr>
      <tr><td style="padding:16px 24px;border-top:1px solid #e6e9f0;font-size:12px;line-height:1.5;color:#8a93a6">
        Você recebe este resumo porque ele está ligado nas suas Configurações.
        <a href="${SITE}/app/configuracoes" style="color:#2f6bff">Desativar o resumo semanal</a>.
      </td></tr>
    </table>
  </td></tr></table></body></html>`
}

/** Segunda-feira da semana atual em Brasília (identifica a semana do envio). */
function weekKey() {
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const diff = (today.getDay() + 6) % 7
  today.setDate(today.getDate() - diff)
  return today.toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  const { data: secret } = await admin.from('lf_private_settings').select('value').eq('key', 'cron_secret').single()
  if (!secret?.value || req.headers.get('x-cron-secret') !== secret.value) return json(401, { error: 'unauthorized' })
  if (!RESEND_KEY) return json(200, { ok: false, skipped: 'RESEND_API_KEY não configurada' })

  const week = weekKey()
  const { data, error } = await admin.rpc('lf_weekly_summary_data', { p_week: week })
  if (error) {
    console.error('lf_weekly_summary_data', error.message)
    return json(500, { error: 'query_failed' })
  }
  const rows = ((data ?? []) as Row[]).slice(0, MAX)
  let sent = 0

  // O Resend aceita até 100 e-mails por chamada em lote.
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100)
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(
        batch.map((r) => ({
          from: FROM,
          to: [r.email],
          subject: `📊 Sua semana no LeadFinder: ${n(r.companies)} empresas encontradas`,
          html: emailHtml(r),
        })),
      ),
    })
    if (!res.ok) {
      console.error('Resend', res.status, await res.text())
      break
    }
    await admin.from('lf_weekly_sent').insert(batch.map((r) => ({ user_id: r.user_id, week })))
    sent += batch.length
  }

  return json(200, { ok: true, week, sent, pending: Math.max(0, ((data ?? []) as Row[]).length - sent) })
})
