import type { PostgrestError } from '@supabase/supabase-js'
import { AppError } from '@/lib/errors'
import type {
  Activity,
  ActivityType,
  ChatMessage,
  Company,
  Conversation,
  Lead,
  Note,
  Prompt,
  Sale,
  SearchRecord,
  SiteGeneration,
} from '@/types'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>

/** Traduz erros do banco (inclusive os levantados pelas funções do LeadFinder) para mensagens do app. */
export function dbError(error: PostgrestError | { message: string } | null): AppError {
  const msg = error?.message ?? ''
  if (msg.includes('insufficient_tokens'))
    return new AppError(
      'insufficient_tokens',
      'Seus tokens de hoje acabaram. Eles renovam à meia-noite — ou faça upgrade para ver mais empresas por dia.',
    )
  if (msg.includes('limit_reached')) return new AppError('limit_reached', 'Você atingiu o limite do seu plano.')
  if (msg.includes('plan_required') || msg.includes('row-level security'))
    return new AppError('plan_required', 'Este recurso não está incluído no seu plano.')
  if (msg.includes('plan_simulation_disabled'))
    return new AppError('service_unavailable', 'A troca de plano sem pagamento foi desativada. Assine pelo checkout.')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new AppError('network', 'Sem conexão com o servidor. Verifique sua internet e tente novamente.')
  return new AppError('service_unavailable', 'Não foi possível concluir a operação. Tente novamente.')
}

/** Lança AppError se a resposta do Supabase trouxer erro; caso contrário devolve os dados. */
export function must<T>(res: { data: T; error: PostgrestError | null }): T {
  if (res.error) throw dbError(res.error)
  return res.data
}

/** Lista de linhas (nunca nula); lança AppError se houver erro. */
export function rows<T>(res: { data: T[] | null; error: PostgrestError | null }): T[] {
  if (res.error) throw dbError(res.error)
  return res.data ?? []
}

/* ---------- Linhas do banco → modelos do app ---------- */

export const toCompany = (r: Row): Company => ({
  id: r.id,
  name: r.name,
  category: r.category,
  address: r.address,
  city: r.city,
  state: r.state ?? undefined,
  phone: r.phone ?? undefined,
  website: r.website ?? undefined,
  rating: r.rating === null || r.rating === undefined ? undefined : Number(r.rating),
  reviewCount: r.review_count ?? undefined,
  source: r.source,
})

export const fromCompany = (c: Company, userId: string): Row => ({
  user_id: userId,
  id: c.id,
  name: c.name,
  category: c.category,
  address: c.address,
  city: c.city,
  state: c.state ?? null,
  phone: c.phone ?? null,
  website: c.website ?? null,
  rating: c.rating ?? null,
  review_count: c.reviewCount ?? null,
  source: c.source,
})

export const toLead = (r: Row): Lead => ({
  id: r.id,
  companyId: r.company_id,
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

export const toNote = (r: Row): Note => ({ id: r.id, text: r.text, createdAt: r.created_at })

export const toSearch = (r: Row): SearchRecord => ({
  id: r.id,
  segment: r.segment,
  region: r.region,
  filters: { onlyWithoutWebsite: false, onlyWithPhone: false, minRating: 0, ...r.filters },
  resultCount: r.result_count,
  tokensUsed: r.tokens_used,
  createdAt: r.created_at,
  source: r.source,
})

export const toPrompt = (r: Row): Prompt => ({
  id: r.id,
  title: r.title,
  content: r.content,
  category: r.category,
  favorite: r.favorite,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

export const toGeneration = (r: Row): SiteGeneration => ({
  id: r.id,
  brief: r.brief,
  output: r.output,
  engine: r.engine,
  createdAt: r.created_at,
})

export const toMessage = (r: Row): ChatMessage => ({
  id: r.id,
  role: r.role,
  content: r.content,
  kind: r.kind,
  createdAt: r.created_at,
})

export const toConversation = (r: Row, messages: ChatMessage[], loaded = true): Conversation => ({
  id: r.id,
  title: r.title,
  messages,
  loaded,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

export const toSale = (r: Row): Sale => ({
  id: r.id,
  client: r.client,
  companyId: r.company_id ?? undefined,
  service: r.service,
  amount: r.amount,
  date: r.date,
  status: r.status,
  notes: r.notes ?? undefined,
  createdAt: r.created_at,
})

export const toActivity = (r: Row): Activity => ({
  id: r.id,
  type: r.type as ActivityType,
  label: r.label,
  href: r.href ?? undefined,
  createdAt: r.created_at,
})
