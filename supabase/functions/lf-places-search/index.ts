// =============================================================================
// LeadFinder — Edge Function "lf-places-search"
//
// Busca empresas no Google Places (Text Search, API nova) com a chave guardada
// no servidor, desconta 1 token por empresa EXIBIDA e devolve só o que foi pago.
// O excedente de cada página fica em lf_search_sessions para o "carregar mais".
//
// Secret necessário (Supabase › Edge Functions › Secrets):
//   GOOGLE_PLACES_API_KEY
// SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY são fornecidos pelo Supabase.
// =============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2'

const GOOGLE_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const PAGE_SIZE = 20
const MAX_PAGES = 3 // o Google devolve no máximo 60 resultados por busca
const SESSION_TTL_MS = 24 * 60 * 60 * 1000

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.shortFormattedAddress',
  'places.addressComponents',
  'places.primaryTypeDisplayName',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'nextPageToken',
].join(',')

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const fail = (status: number, error: string, message: string) => json(status, { error, message })

interface Filters {
  onlyWithoutWebsite: boolean
  onlyWithPhone: boolean
  minRating: number
}

interface Company {
  id: string
  name: string
  category: string
  address: string
  city: string
  state?: string
  phone?: string
  website?: string
  rating?: number
  reviewCount?: number
  source: 'google_places'
}

// deno-lint-ignore no-explicit-any
type Place = Record<string, any>

function toCompany(p: Place, segment: string): Company {
  // deno-lint-ignore no-explicit-any
  const components: any[] = p.addressComponents ?? []
  const find = (type: string) => components.find((c) => (c.types ?? []).includes(type))
  return {
    id: p.id,
    name: p.displayName?.text ?? 'Empresa sem nome',
    category: p.primaryTypeDisplayName?.text ?? segment,
    address: p.shortFormattedAddress ?? p.formattedAddress ?? '',
    city: find('administrative_area_level_2')?.longText ?? find('locality')?.longText ?? '',
    state: find('administrative_area_level_1')?.shortText ?? undefined,
    phone: p.nationalPhoneNumber ?? undefined,
    website: p.websiteUri ?? undefined,
    rating: typeof p.rating === 'number' ? p.rating : undefined,
    reviewCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : undefined,
    source: 'google_places',
  }
}

/** Uma página do Text Search. Empresas fechadas definitivamente são descartadas. */
async function googlePage(textQuery: string, minRating: number, pageToken?: string) {
  const body: Record<string, unknown> = { textQuery, languageCode: 'pt-BR', regionCode: 'BR', pageSize: PAGE_SIZE }
  if (minRating > 0) body.minRating = minRating
  if (pageToken) body.pageToken = pageToken
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_KEY!, 'X-Goog-FieldMask': FIELD_MASK },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    console.error('Google Places', res.status, await res.text())
    throw new Error('places_failed')
  }
  const data = await res.json()
  const places: Place[] = (data.places ?? []).filter((p: Place) => p.businessStatus !== 'CLOSED_PERMANENTLY')
  return { places, next: data.nextPageToken as string | undefined }
}

const passes = (c: Company, f: Filters) => (!f.onlyWithoutWebsite || !c.website) && (!f.onlyWithPhone || !!c.phone)

/** Busca páginas até juntar `want` empresas (ou acabar). */
async function fill(
  pool: Company[],
  want: number,
  query: { segment: string; region: string; filters: Filters },
  token: string | undefined,
  pages: number,
) {
  let found = 0
  while (pool.length < want && pages < MAX_PAGES && (pages === 0 || token)) {
    const page = await googlePage(`${query.segment} em ${query.region}`, query.filters.minRating, token)
    pages += 1
    token = page.next
    const companies = page.places.map((p) => toCompany(p, query.segment)).filter((c) => passes(c, query.filters))
    found += companies.length
    pool = [...pool, ...companies]
  }
  return { pool, token: pages < MAX_PAGES ? token : undefined, pages, found }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return fail(405, 'method_not_allowed', 'Use POST.')
  if (!GOOGLE_KEY) return fail(500, 'not_configured', 'A busca ainda não foi configurada no servidor.')

  const authorization = req.headers.get('Authorization')
  const apikey = req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  if (!authorization) return fail(401, 'unauthorized', 'Entre na sua conta para buscar empresas.')

  // Cliente com a identidade do usuário (respeita RLS e auth.uid()) e cliente administrativo.
  const db = createClient(SUPABASE_URL, apikey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

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

  // Saldo do dia
  const [{ data: profile }, { data: usage }] = await Promise.all([
    db.from('lf_profiles').select('plan').eq('id', user.id).single(),
    db.rpc('lf_usage_today').single(),
  ])
  if (!profile) return fail(403, 'no_profile', 'Perfil não encontrado.')
  const { data: limits } = await db.rpc('lf_plan_limits', { p_plan: profile.plan }).single()
  // deno-lint-ignore no-explicit-any
  const usedBefore = Number((usage as any)?.tokens_used ?? 0)
  // deno-lint-ignore no-explicit-any
  const balance = Number((limits as any)?.tokens ?? 0) - usedBefore
  const quantity = Math.max(1, Math.min(60, Math.floor(Number(body.quantity) || 1)))
  const want = Math.min(quantity, balance)
  if (want < 1) {
    return fail(
      402,
      'insufficient_tokens',
      'Seus tokens de hoje acabaram. Eles renovam à meia-noite — ou faça upgrade para ver mais empresas por dia.',
    )
  }

  /** Debita no banco; devolve os tokens usados hoje ou null se o saldo acabou no meio do caminho. */
  async function charge(amount: number) {
    if (amount < 1) return usedBefore
    const { data, error } = await db.rpc('lf_consume_tokens', { p_amount: amount })
    return error ? null : (data as number)
  }

  try {
    if (body.action === 'search') {
      const segment = String(body.query?.segment ?? '')
        .trim()
        .slice(0, 120)
      const region = String(body.query?.region ?? '')
        .trim()
        .slice(0, 120)
      if (!segment || !region) return fail(400, 'bad_request', 'Informe o segmento e a região.')
      const filters: Filters = {
        onlyWithoutWebsite: !!body.query?.filters?.onlyWithoutWebsite,
        onlyWithPhone: !!body.query?.filters?.onlyWithPhone,
        minRating: [0, 3.5, 4, 4.5].includes(Number(body.query?.filters?.minRating))
          ? Number(body.query.filters.minRating)
          : 0,
      }
      const query = { segment, region, filters }

      // limpa buscas antigas deste usuário
      await admin
        .from('lf_search_sessions')
        .delete()
        .eq('user_id', user.id)
        .lt('updated_at', new Date(Date.now() - SESSION_TTL_MS).toISOString())

      const result = await fill([], want, query, undefined, 0)
      const shown = result.pool.slice(0, want)
      const pending = result.pool.slice(want)
      const used = await charge(shown.length)
      if (used === null) return fail(402, 'insufficient_tokens', 'Seus tokens de hoje acabaram.')

      const { data: record, error: recordError } = await db
        .from('lf_searches')
        .insert({
          user_id: user.id,
          segment,
          region,
          filters,
          result_count: result.found,
          tokens_used: shown.length,
          source: 'google_places',
        })
        .select()
        .single()
      if (recordError || !record) throw recordError ?? new Error('record_failed')

      await admin.from('lf_search_sessions').insert({
        id: record.id,
        user_id: user.id,
        query,
        pending,
        next_page_token: result.token ?? null,
        pages_fetched: result.pages,
        total_found: result.found,
      })

      return json(200, {
        record,
        companies: shown,
        hasMore: pending.length > 0 || !!result.token,
        totalFound: result.found,
        tokensUsedToday: used,
      })
    }

    if (body.action === 'more') {
      const { data: session } = await admin
        .from('lf_search_sessions')
        .select('*')
        .eq('id', String(body.searchId ?? ''))
        .eq('user_id', user.id)
        .maybeSingle()
      if (!session)
        return fail(404, 'search_expired', 'Esta busca expirou. Faça uma nova busca para ver mais empresas.')

      const result = await fill(
        session.pending ?? [],
        want,
        session.query,
        session.next_page_token ?? undefined,
        session.pages_fetched,
      )
      const shown = result.pool.slice(0, want)
      const pending = result.pool.slice(want)
      const used = await charge(shown.length)
      if (used === null) return fail(402, 'insufficient_tokens', 'Seus tokens de hoje acabaram.')

      const totalFound = session.total_found + result.found
      const { data: record } = await db.from('lf_searches').select('tokens_used').eq('id', session.id).single()
      const recordTokens = Number(record?.tokens_used ?? 0) + shown.length
      await db.from('lf_searches').update({ tokens_used: recordTokens, result_count: totalFound }).eq('id', session.id)
      await admin
        .from('lf_search_sessions')
        .update({
          pending,
          next_page_token: result.token ?? null,
          pages_fetched: result.pages,
          total_found: totalFound,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id)

      return json(200, {
        companies: shown,
        hasMore: pending.length > 0 || !!result.token,
        totalFound,
        tokensUsedToday: used,
        recordTokens,
      })
    }

    return fail(400, 'bad_request', 'Ação desconhecida.')
  } catch (error) {
    console.error(error)
    const message =
      error instanceof Error && error.message === 'places_failed'
        ? 'Não foi possível consultar o Google agora. Tente novamente em instantes. Nenhum token foi consumido.'
        : 'Não foi possível concluir a busca. Tente novamente.'
    return fail(502, 'search_failed', message)
  }
})
