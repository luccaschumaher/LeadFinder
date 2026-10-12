import {
  must,
  rows,
  toActivity,
  toCompany,
  toConversation,
  toGeneration,
  toLead,
  toNote,
  toPrompt,
  toSale,
  toSearch,
} from '@/lib/db'
import { storage } from '@/lib/storage'
import { createStore, useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import type {
  Activity,
  Company,
  Conversation,
  Favorite,
  Lead,
  Note,
  Prompt,
  Sale,
  SearchRecord,
  SearchSession,
  SiteGeneration,
} from '@/types'

/**
 * Cache em memória dos dados da conta. A fonte da verdade é o Supabase: tudo é
 * carregado ao entrar e cada serviço grava no banco antes de atualizar este store.
 * Só a busca em andamento (resultados ainda não salvos) fica no navegador.
 */
export interface DataState {
  companies: Record<string, Company>
  leads: Lead[]
  favorites: Favorite[]
  notes: Record<string, Note[]>
  history: SearchRecord[]
  currentSearch: SearchSession | null
  prompts: Prompt[]
  generations: SiteGeneration[]
  conversations: Conversation[]
  activity: Activity[]
  sales: Sale[]
  usage: {
    /** Tokens gastos no dia `day` (AAAA-MM-DD, fuso de Brasília). Zera ao virar o dia. */
    tokens: { day: string; used: number }
    siteGenerations: { day: string; count: number }
    waveMessages: { day: string; count: number }
  }
}

export const emptyData = (): DataState => ({
  companies: {},
  leads: [],
  favorites: [],
  notes: {},
  history: [],
  currentSearch: null,
  prompts: [],
  generations: [],
  conversations: [],
  activity: [],
  sales: [],
  usage: { tokens: { day: '', used: 0 }, siteGenerations: { day: '', count: 0 }, waveMessages: { day: '', count: 0 } },
})

export const dataStore = createStore<DataState>(emptyData())

let activeUserId: string | null = null
let unsubscribe: (() => void) | null = null

const searchKey = (userId: string) => `search:${userId}`

interface SavedSearch {
  currentSearch: SearchSession | null
  companies: Company[]
}

/**
 * Guarda a busca em andamento (e as empresas dela) só enquanto a aba estiver aberta
 * (sessionStorage): sobrevive a recarregar a página, mas some ao fechar a aba ou sair da conta.
 */
function persistSearch() {
  if (!activeUserId) return
  const { currentSearch, companies } = dataStore.get()
  const ids = currentSearch ? [...currentSearch.companyIds, ...(currentSearch.pendingIds ?? [])] : []
  storage.set(
    searchKey(activeUserId),
    { currentSearch, companies: ids.map((id) => companies[id]).filter(Boolean) } satisfies SavedSearch,
    'session',
  )
}

/** Carrega do Supabase todos os dados do usuário. */
export async function loadUserData(userId: string) {
  unsubscribe?.()
  activeUserId = userId

  const [companies, leads, favorites, notes, searches, prompts, generations, conversations, sales, activity, usage] =
    await Promise.all([
      supabase.from('lf_companies').select('*'),
      supabase.from('lf_leads').select('*').order('created_at', { ascending: false }),
      supabase.from('lf_favorites').select('*').order('created_at', { ascending: false }),
      supabase.from('lf_notes').select('*').order('created_at', { ascending: false }),
      supabase.from('lf_searches').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('lf_prompts').select('*').order('updated_at', { ascending: false }),
      supabase.from('lf_site_generations').select('*').order('created_at', { ascending: false }).limit(30),
      // As mensagens da LeadIA não vêm no login: cada conversa carrega as suas ao ser aberta.
      supabase.from('lf_conversations').select('*').order('updated_at', { ascending: false }).limit(100),
      supabase.from('lf_sales').select('*').order('date', { ascending: false }),
      supabase.from('lf_activity').select('*').order('created_at', { ascending: false }).limit(60),
      supabase.rpc('lf_usage_today').single(),
    ])

  // Buscas antigas que ficavam salvas para sempre no navegador são apagadas.
  storage.remove(searchKey(userId))
  const saved = storage.get<SavedSearch>(searchKey(userId), { currentSearch: null, companies: [] }, 'session')
  const companyMap: Record<string, Company> = {}
  saved.companies.forEach((c) => (companyMap[c.id] = c))
  rows(companies).forEach((r) => (companyMap[r.id] = toCompany(r)))

  const notesMap: Record<string, Note[]> = {}
  rows(notes).forEach((r) => (notesMap[r.company_id] ??= []).push(toNote(r)))

  const today = must(usage) as unknown as {
    day: string
    tokens_used: number
    site_generations: number
    wave_messages?: number
  }

  dataStore.replace({
    companies: companyMap,
    leads: rows(leads).map(toLead),
    favorites: rows(favorites).map((r) => ({ companyId: r.company_id, createdAt: r.created_at })),
    notes: notesMap,
    history: rows(searches).map(toSearch),
    currentSearch: saved.currentSearch,
    prompts: rows(prompts).map(toPrompt),
    generations: rows(generations).map(toGeneration),
    conversations: rows(conversations).map((r) => toConversation(r, [], false)),
    activity: rows(activity).map(toActivity),
    sales: rows(sales).map(toSale),
    usage: {
      tokens: { day: today.day, used: today.tokens_used },
      siteGenerations: { day: today.day, count: today.site_generations },
      waveMessages: { day: today.day, count: today.wave_messages ?? 0 },
    },
  })

  let lastSearch = dataStore.get().currentSearch
  unsubscribe = dataStore.subscribe(() => {
    const next = dataStore.get().currentSearch
    if (next !== lastSearch) {
      lastSearch = next
      persistSearch()
    }
  })
}

export function unloadUserData() {
  unsubscribe?.()
  unsubscribe = null
  // Ao sair da conta, a última busca não fica no aparelho.
  if (activeUserId) {
    storage.remove(searchKey(activeUserId), 'session')
    storage.remove(searchKey(activeUserId))
  }
  activeUserId = null
  dataStore.replace(emptyData())
}

/** Id do usuário dono dos dados carregados (usado pelos serviços nas gravações). */
export function currentUserId() {
  if (!activeUserId) throw new Error('Nenhum usuário carregado.')
  return activeUserId
}

export const useData = <S>(selector: (s: DataState) => S) => useStore(dataStore, selector)
