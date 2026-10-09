// =============================================================================
// LeadFinder — Edge Function "lf-ai"
//
// Inteligência artificial do LeadFinder (Claude Haiku 4.5, da Anthropic):
//   action "site_prompt": gera um prompt completo para criação de site (Gold+,
//                         limite diário validado por lf_register_site_generation).
//   action "wave_chat":   responde a WaveIA a partir da conversa salva no banco
//                         (Diamond, 30 mensagens/dia via lf_register_wave_message).
//
// Provedor (Supabase › Edge Functions › Secrets) — configure UM dos dois:
//   GOOGLE_VERTEX_SERVICE_ACCOUNT  JSON da conta de serviço do Google Cloud com o papel
//                                  "Vertex AI User". Cobrança pós-paga na fatura do Google.
//   ANTHROPIC_API_KEY              chave da API da Anthropic (créditos pré-pagos).
// =============================================================================

import Anthropic from 'npm:@anthropic-ai/sdk'
import { AnthropicVertex } from 'npm:@anthropic-ai/vertex-sdk'
import { createClient } from 'npm:@supabase/supabase-js@2'

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const VERTEX_SERVICE_ACCOUNT = Deno.env.get('GOOGLE_VERTEX_SERVICE_ACCOUNT')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!

// Claude Haiku 4.5: na Anthropic o id é "claude-haiku-4-5"; no Vertex AI, "claude-haiku-4-5@20251001".
const ANTHROPIC_MODEL = 'claude-haiku-4-5'
const VERTEX_MODEL = 'claude-haiku-4-5@20251001'
const VERTEX_REGION = 'global' // endpoint global: mesmo preço da Anthropic (regionais custam +10%)
const HISTORY_LIMIT = 20 // mensagens enviadas como contexto para a WaveIA

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const fail = (status: number, error: string, message: string) => json(status, { error, message })

const SITE_SYSTEM = `Você é especialista em criação de sites com plataformas de IA (como Lovable, Bolt, v0 e similares).
Sua tarefa: transformar as informações de um cliente em UM prompt completo, pronto para colar nessas plataformas.

Regras:
- Escreva em português do Brasil, em Markdown, com seções claras (objetivo, público, identidade visual, estrutura de páginas/seções, conteúdo de cada seção, funcionalidades, requisitos técnicos e de SEO local).
- Seja específico para o segmento e a cidade informados: sugira seções, chamadas para ação e textos de exemplo que façam sentido para esse tipo de negócio.
- Nunca invente depoimentos, números, prêmios, preços ou dados de contato. Onde precisar deles, deixe um marcador como [inserir telefone] ou [depoimentos reais do cliente].
- Exija layout responsivo, carregamento rápido e boas práticas de acessibilidade.
- Responda SOMENTE com o prompt, sem introdução nem comentários antes ou depois.`

const PERSONAS: Record<string, string> = {
  robot: 'Você se apresenta como Bit, um robô preciso e organizado: respostas estruturadas e objetivas.',
  dragon: 'Você se apresenta como Faísca, um dragão ousado e criativo: ideias marcantes, tom confiante.',
  alien: 'Você se apresenta como Zuni, um alienígena curioso e cheio de ideias: perguntas certeiras e ângulos novos.',
  puppy: 'Você se apresenta como Pipoca, um cachorrinho animado e parceiro: tom caloroso e encorajador.',
}

const waveSystem = (
  persona: string,
) => `Você é a WaveIA, assistente do LeadFinder para quem vende sites e serviços digitais. ${persona}

Você ajuda com: estratégias de prospecção, análise de empresas como potenciais clientes, mensagens de primeiro contato e follow-up (WhatsApp, e-mail, ligação), propostas comerciais, precificação de sites, negociação e respostas a objeções.

Regras:
- Responda em português do Brasil, de forma prática e direta. Prefira listas e passos curtos; use exemplos de mensagens prontas quando ajudar.
- Respostas enxutas: no máximo uns 250 palavras, a menos que peçam algo mais longo (como uma proposta completa).
- Não invente fatos sobre empresas específicas (avaliações, faturamento, dados de contato). Se faltar informação, diga o que verificar.
- Não prometa resultados garantidos de vendas ou de posicionamento no Google.
- Fuja de assuntos sem relação com vendas, prospecção, marketing digital ou criação de sites; nesses casos, redirecione com gentileza.`

// deno-lint-ignore no-explicit-any
function briefToText(b: any) {
  const features = Array.isArray(b?.features) && b.features.length ? b.features.join(', ') : 'não informado'
  return [
    `Nome da empresa: ${b?.companyName ?? ''}`,
    `Segmento: ${b?.segment ?? ''}`,
    `Cidade: ${b?.city || 'não informada'}`,
    `Objetivo do site: ${b?.goal ?? ''}`,
    `Estilo visual: ${b?.style ?? ''}`,
    `Cores desejadas: ${b?.colors || 'livre'}`,
    `Funcionalidades necessárias: ${features}`,
    `Informações adicionais: ${b?.extra || 'nenhuma'}`,
  ].join('\n')
}

function textOf(message: Anthropic.Message) {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()
}

/* ---------------- Autenticação no Google (Vertex AI) ---------------- */

interface ServiceAccount {
  client_email: string
  private_key: string
  project_id: string
}

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
const b64urlText = (text: string) => b64url(new TextEncoder().encode(text))

function pemToDer(pem: string) {
  const base64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

let cachedToken: { value: string; expiresAt: number } | null = null

/** Token de acesso OAuth da conta de serviço (JWT assinado com RS256), reaproveitado até expirar. */
async function googleAccessToken(sa: ServiceAccount) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value
  const now = Math.floor(Date.now() / 1000)
  const header = b64urlText(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64urlText(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  )
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`)),
  )
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${b64url(signature)}`,
    }),
  })
  if (!res.ok) {
    console.error('Google OAuth', res.status, await res.text())
    throw new Error('google_auth_failed')
  }
  const data = await res.json()
  cachedToken = { value: data.access_token, expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000 }
  return cachedToken.value
}

/** Cliente do Claude: Vertex AI (pós-pago no Google) ou API direta da Anthropic. */
async function claude(): Promise<{ client: Anthropic | AnthropicVertex; model: string }> {
  if (VERTEX_SERVICE_ACCOUNT) {
    const sa = JSON.parse(VERTEX_SERVICE_ACCOUNT) as ServiceAccount
    const client = new AnthropicVertex({
      projectId: sa.project_id,
      region: VERTEX_REGION,
      accessToken: await googleAccessToken(sa),
    })
    return { client, model: VERTEX_MODEL }
  }
  return { client: new Anthropic({ apiKey: ANTHROPIC_KEY }), model: ANTHROPIC_MODEL }
}

/** Traduz erros do banco levantados pelas funções de limite. */
function limitError(message: string) {
  if (message.includes('plan_required'))
    return fail(403, 'plan_required', 'Este recurso não está incluído no seu plano.')
  if (message.includes('limit_reached'))
    return fail(429, 'limit_reached', 'Você atingiu o limite de hoje. Ele renova à meia-noite.')
  return fail(500, 'server_error', 'Não foi possível concluir. Tente novamente.')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return fail(405, 'method_not_allowed', 'Use POST.')
  if (!ANTHROPIC_KEY && !VERTEX_SERVICE_ACCOUNT) {
    return fail(500, 'not_configured', 'A inteligência artificial ainda não foi configurada no servidor.')
  }

  const authorization = req.headers.get('Authorization')
  const apikey = req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  if (!authorization) return fail(401, 'unauthorized', 'Entre na sua conta para usar a IA.')

  const db = createClient(SUPABASE_URL, apikey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const { data: auth } = await db.auth.getUser()
  const user = auth?.user
  if (!user) return fail(401, 'unauthorized', 'Sessão expirada. Entre novamente.')

  // deno-lint-ignore no-explicit-any
  let body: any
  try {
    body = await req.json()
  } catch {
    return fail(400, 'bad_request', 'Requisição inválida.')
  }

  try {
    const { client: anthropic, model: MODEL } = await claude()

    if (body.action === 'site_prompt') {
      const brief = body.brief ?? {}
      if (!String(brief.companyName ?? '').trim() || !String(brief.segment ?? '').trim()) {
        return fail(400, 'bad_request', 'Informe o nome da empresa e o segmento.')
      }
      // Valida plano e limite e já registra o uso (antes de gastar com a IA).
      const { data: count, error: limitErr } = await db.rpc('lf_register_site_generation')
      if (limitErr) return limitError(limitErr.message)

      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4000,
        system: SITE_SYSTEM,
        messages: [{ role: 'user', content: `Informações do cliente:\n${briefToText(brief)}` }],
      })
      if (message.stop_reason === 'refusal')
        return fail(422, 'refused', 'Não foi possível gerar um prompt com essas informações.')
      const output = textOf(message)
      if (!output) return fail(502, 'empty', 'A IA não retornou conteúdo. Tente novamente.')

      const { data: row, error } = await db
        .from('lf_site_generations')
        .insert({ user_id: user.id, brief, output, engine: 'ai' })
        .select()
        .single()
      if (error) throw error
      return json(200, { generation: row, siteGenerationsToday: count })
    }

    if (body.action === 'wave_chat') {
      const conversationId = String(body.conversationId ?? '')
      const { data: conversation } = await db
        .from('lf_conversations')
        .select('id')
        .eq('id', conversationId)
        .maybeSingle()
      if (!conversation) return fail(404, 'not_found', 'Conversa não encontrada.')

      // Histórico real do banco (as mensagens do usuário já foram salvas pelo app).
      const { data: rows } = await db
        .from('lf_messages')
        .select('role, content, kind')
        .eq('conversation_id', conversationId)
        .eq('kind', 'message')
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT)
      const history = (rows ?? []).reverse()
      // A conversa precisa começar com o usuário e terminar com uma pergunta dele.
      while (history.length && history[0].role !== 'user') history.shift()
      if (!history.length || history[history.length - 1].role !== 'user') {
        return fail(400, 'bad_request', 'Envie uma mensagem para a WaveIA responder.')
      }

      const { data: count, error: limitErr } = await db.rpc('lf_register_wave_message')
      if (limitErr) return limitError(limitErr.message)

      const persona = PERSONAS[String(body.mascot ?? '')] ?? PERSONAS.robot
      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system: waveSystem(persona),
        messages: history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      })
      if (message.stop_reason === 'refusal') {
        return fail(
          422,
          'refused',
          'Não posso ajudar com esse pedido. Que tal reformular com foco em prospecção ou vendas?',
        )
      }
      const reply = textOf(message)
      if (!reply) return fail(502, 'empty', 'A WaveIA não conseguiu responder agora. Tente novamente.')

      const { data: saved, error } = await db
        .from('lf_messages')
        .insert({ conversation_id: conversationId, user_id: user.id, role: 'assistant', content: reply })
        .select()
        .single()
      if (error) throw error
      await db.from('lf_conversations').update({ updated_at: saved.created_at }).eq('id', conversationId)
      return json(200, { message: saved, waveMessagesToday: count })
    }

    return fail(400, 'bad_request', 'Ação desconhecida.')
  } catch (error) {
    console.error(error)
    const status = (error as { status?: number }).status
    if (status === 429 || status === 529) {
      return fail(429, 'busy', 'A IA está com muita demanda agora. Tente novamente em alguns segundos.')
    }
    if (status === 401 || status === 403 || (error instanceof Error && error.message === 'google_auth_failed')) {
      return fail(500, 'not_configured', 'A credencial da IA no servidor é inválida ou não tem permissão.')
    }
    if (status === 404) {
      return fail(500, 'not_configured', 'O modelo de IA não está habilitado nesta conta.')
    }
    if (status === undefined || status >= 500) {
      return fail(502, 'ai_unavailable', 'Não foi possível falar com a IA agora. Tente novamente.')
    }
    return fail(500, 'server_error', 'Não foi possível concluir. Tente novamente.')
  }
})
