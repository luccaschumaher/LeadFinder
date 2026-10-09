import { DEMO_SEARCH, SEARCH_PAGE_SIZE } from '@/config/app'
import { getPlan, TOKENS_PER_COMPANY } from '@/config/plans'
import { generateDemoCompanies } from '@/data/demo/companies'
import { dbError, must, toSearch } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { delay, todayKey } from '@/lib/utils'
import { currentUserId, dataStore, type DataState } from '@/stores/data'
import { sessionStore } from '@/stores/session'
import type { Company, CompanySource, SearchQuery, SearchSession } from '@/types'
import { logActivity } from './activity'

/**
 * Busca de empresas.
 *
 * Regra de tokens: 1 token por empresa EXIBIDA, renovando todo dia sem acumular.
 * O débito acontece no servidor (função `lf_consume_tokens`), que recusa se passar
 * do limite do plano. Cada chamada à fonte traz até 20 empresas; o que o saldo não
 * cobre fica "pendente" e é exibido depois sem nova chamada paga à fonte.
 *
 * A fonte ainda é o gerador de demonstração. A busca real será uma edge function
 * que consulta o Google Places com a chave guardada no servidor.
 */

interface PageResult {
  companies: Company[]
  total: number
  hasMore: boolean
  source: CompanySource
}

/** Gatilho para testar o estado de erro: pesquise o segmento "__erro__". */
const DEMO_ERROR_TRIGGER = '__erro__'

async function fetchPage(query: SearchQuery, page: number): Promise<PageResult> {
  await delay(900)
  if (query.segment.trim() === DEMO_ERROR_TRIGGER) {
    throw new AppError(
      'network',
      'Não foi possível consultar a fonte de dados. Verifique sua conexão e tente novamente.',
    )
  }
  if (!DEMO_SEARCH) throw new AppError('service_unavailable', 'A API de busca ainda não foi configurada.')
  const all = generateDemoCompanies(query)
  const start = (page - 1) * SEARCH_PAGE_SIZE
  return {
    companies: all.slice(start, start + SEARCH_PAGE_SIZE),
    total: all.length,
    hasMore: start + SEARCH_PAGE_SIZE < all.length,
    source: 'demo',
  }
}

/** Tokens já gastos hoje. */
export function tokensUsedToday(usage: DataState['usage']) {
  return usage.tokens.day === todayKey() ? usage.tokens.used : 0
}

export function tokenBalance() {
  const user = sessionStore.get().user
  if (!user) return 0
  return Math.max(0, getPlan(user.plan).limits.tokens - tokensUsedToday(dataStore.get().usage))
}

const noTokensError = () =>
  new AppError(
    'insufficient_tokens',
    'Seus tokens de hoje acabaram. Eles renovam à meia-noite — ou faça upgrade para ver mais empresas por dia.',
  )

/** Debita no servidor e atualiza o saldo local com o valor confirmado. */
async function consumeTokens(amount: number) {
  if (amount < 1) return
  const { data, error } = await supabase.rpc('lf_consume_tokens', { p_amount: amount * TOKENS_PER_COMPANY })
  if (error) throw dbError(error)
  dataStore.set((s) => ({ ...s, usage: { ...s.usage, tokens: { day: todayKey(), used: data as number } } }))
}

/** Junta empresas (pendentes + iniciais + próximas páginas) até `want`. */
async function gather(
  want: number,
  session: Pick<SearchSession, 'query' | 'page' | 'hasMore' | 'pendingIds'>,
  initial: Company[],
) {
  const companies = dataStore.get().companies
  let pool = [...(session.pendingIds ?? []).map((id) => companies[id]).filter((c): c is Company => !!c), ...initial]
  let page = session.page
  let hasMore = session.hasMore
  while (pool.length < want && hasMore) {
    const next = await fetchPage(session.query, page + 1)
    page += 1
    hasMore = next.hasMore
    pool = [...pool, ...next.companies]
  }
  return { shown: pool.slice(0, want), pending: pool.slice(want), page, hasMore }
}

const cache = (list: Company[]) => Object.fromEntries(list.map((c) => [c.id, c]))

export const companyService = {
  tokensPerCompany: TOKENS_PER_COMPANY,

  /**
   * Nova busca. `quantity` = quantas empresas o usuário quer ver; limitado pelo saldo do dia.
   * Busca quantas páginas forem necessárias (20 empresas por chamada à fonte).
   */
  async search(query: SearchQuery, quantity: number) {
    const want = Math.min(quantity, Math.floor(tokenBalance() / TOKENS_PER_COMPANY))
    if (want < 1) throw noTokensError()

    const first = await fetchPage(query, 1)
    const result = await gather(want, { query, page: 1, hasMore: first.hasMore, pendingIds: [] }, first.companies)
    await consumeTokens(result.shown.length)

    const row = must(
      await supabase
        .from('lf_searches')
        .insert({
          user_id: currentUserId(),
          segment: query.segment.trim(),
          region: query.region.trim(),
          filters: query.filters,
          result_count: first.total,
          tokens_used: result.shown.length * TOKENS_PER_COMPANY,
          source: first.source,
        })
        .select()
        .single(),
    )

    dataStore.set((s) => ({
      ...s,
      companies: { ...s.companies, ...cache([...result.shown, ...result.pending]) },
      history: [toSearch(row), ...s.history],
      currentSearch: {
        recordId: row.id,
        query,
        companyIds: result.shown.map((c) => c.id),
        pendingIds: result.pending.map((c) => c.id),
        total: first.total,
        page: result.page,
        hasMore: result.hasMore,
      },
    }))
    logActivity('search', `Buscou "${query.segment.trim()}" em ${query.region.trim()}`, '/app/buscar')
    return { shown: result.shown.length, total: first.total }
  },

  /** Exibe mais `quantity` empresas: primeiro as pendentes (já pagas na fonte), depois novas páginas. */
  async loadMore(quantity: number) {
    const current = dataStore.get().currentSearch
    if (!current) return 0
    const want = Math.min(quantity, Math.floor(tokenBalance() / TOKENS_PER_COMPANY))
    if (want < 1) throw noTokensError()

    const result = await gather(want, current, [])
    if (result.shown.length === 0) return 0
    await consumeTokens(result.shown.length)

    const record = dataStore.get().history.find((h) => h.id === current.recordId)
    const tokensUsed = (record?.tokensUsed ?? 0) + result.shown.length * TOKENS_PER_COMPANY
    if (record) {
      const { error } = await supabase.from('lf_searches').update({ tokens_used: tokensUsed }).eq('id', record.id)
      if (error) throw dbError(error)
    }

    dataStore.set((s) => ({
      ...s,
      companies: { ...s.companies, ...cache([...result.shown, ...result.pending]) },
      history: s.history.map((h) => (h.id === current.recordId ? { ...h, tokensUsed } : h)),
      currentSearch: s.currentSearch && {
        ...s.currentSearch,
        companyIds: [...s.currentSearch.companyIds, ...result.shown.map((c) => c.id)],
        pendingIds: result.pending.map((c) => c.id),
        page: result.page,
        hasMore: result.hasMore,
      },
    }))
    return result.shown.length
  },

  clearCurrent() {
    dataStore.set((s) => ({ ...s, currentSearch: null }))
  },
}
