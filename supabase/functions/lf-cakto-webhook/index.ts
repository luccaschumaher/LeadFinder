// =============================================================================
// LeadFinder — Edge Function "lf-cakto-webhook"
//
// Recebe os eventos da Cakto, valida a origem e ativa/cancela o plano do usuário
// (a regra de negócio está em lf_billing_event, no banco).
//
// Secret necessário (Supabase › Edge Functions › Secrets):
//   CAKTO_WEBHOOK_SECRET  — o mesmo texto do campo "Chave secreta do webhook" na Cakto
// Publicar SEM verificação de JWT (a Cakto não envia login do Supabase):
//   npx supabase functions deploy lf-cakto-webhook --no-verify-jwt
// =============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2'

const SECRET = Deno.env.get('CAKTO_WEBHOOK_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/** Ofertas da Cakto → plano (o código é o início do link do checkout). */
const OFFERS: Record<string, string> = {
  buiqzt9: 'silver',
  db4r8g9: 'gold',
  asgfhan: 'diamond',
}

const KIND: Record<string, 'activate' | 'cancel' | 'revoke'> = {
  purchase_approved: 'activate',
  subscription_created: 'activate',
  subscription_renewed: 'activate',
  subscription_resumed: 'activate',
  subscription_late_recovered: 'activate',
  subscription_canceled: 'cancel',
  refund: 'revoke',
  chargeback: 'revoke',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const encoder = new TextEncoder()

function safeEqual(a: string, b: string) {
  const x = encoder.encode(a)
  const y = encoder.encode(b)
  if (x.length !== y.length) return false
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}

async function hmacHex(key: string, message: string) {
  const k = await crypto.subtle.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, encoder.encode(message)))
  return Array.from(sig, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Aceita a assinatura do cabeçalho (recomendada pela Cakto) OU o campo "secret" do corpo.
 * Os dois exigem a mesma chave secreta; aceitar qualquer um evita perder um pagamento
 * se o formato da assinatura mudar.
 */
async function isAuthentic(req: Request, raw: string, body: Record<string, unknown>) {
  const signature = req.headers.get('x-cakto-signature')
  const timestamp = req.headers.get('x-cakto-timestamp')
  if (signature && timestamp) {
    const expected = `v1=${await hmacHex(SECRET!, `${timestamp}.${raw}`)}`
    if (signature.split(',').some((s) => safeEqual(s.trim(), expected))) return true
  }
  return typeof body.secret === 'string' && safeEqual(body.secret, SECRET!)
}

function planFrom(data: Record<string, any>) {
  const ids = [data.offer?.id, data.checkoutUrl, data.product?.short_id].filter(Boolean).join(' ')
  for (const [code, plan] of Object.entries(OFFERS)) if (ids.includes(code)) return plan
  const names = `${data.offer?.name ?? ''} ${data.product?.name ?? ''}`.toLowerCase()
  if (/diamond|diamante/.test(names)) return 'diamond'
  if (/gold|ouro/.test(names)) return 'gold'
  if (/silver|prata/.test(names)) return 'silver'
  return null
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })
  if (!SECRET) {
    console.error('CAKTO_WEBHOOK_SECRET não configurado')
    return json(500, { error: 'not_configured' })
  }

  const raw = await req.text()
  let body: Record<string, any>
  try {
    body = JSON.parse(raw)
  } catch {
    return json(400, { error: 'invalid_json' })
  }
  if (!(await isAuthentic(req, raw, body))) return json(401, { error: 'invalid_signature' })

  const event = String(body.event ?? '')
  const data = (body.data ?? {}) as Record<string, any>
  const kind = KIND[event]
  // Eventos que não mudam o plano (pix gerado, carrinho abandonado...) só são confirmados.
  if (!kind) return json(200, { ok: true, ignored: event })

  const plan = planFrom(data)
  const email = typeof data.customer?.email === 'string' ? data.customer.email : null
  const callback = typeof data.callback === 'string' && UUID.test(data.callback) ? data.callback : null
  const eventId = `${event}:${data.id ?? data.subscription?.id ?? crypto.randomUUID()}`
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  /** Guarda o aviso para reprocessar depois (a Cakto não reenvia quando há erro). */
  async function keepForLater(reason: string) {
    console.error('Aviso da Cakto guardado para reprocessar', { eventId, reason })
    const { error } = await admin.from('lf_billing_failures').upsert(
      {
        event_id: eventId,
        event,
        kind,
        plan,
        email,
        user_id: callback,
        reason,
        offer: data.offer?.id ?? null,
        product: data.product?.name ?? null,
      },
      { onConflict: 'event_id' },
    )
    // Se nem guardar foi possível, responde erro para aparecer como falha no painel da Cakto.
    return error ? json(500, { error: 'processing_failed' }) : json(200, { ok: false, queued: true })
  }

  if (!plan) return keepForLater('plano não reconhecido')
  if (!email) return keepForLater('aviso sem e-mail do cliente')

  const { data: result, error } = await admin.rpc('lf_billing_event', {
    p_event_id: eventId,
    p_event: event,
    p_kind: kind,
    p_plan: plan,
    p_email: email,
    p_user: callback,
  })
  if (error) return keepForLater(error.message)
  return json(200, { ok: true, ...result })
})
