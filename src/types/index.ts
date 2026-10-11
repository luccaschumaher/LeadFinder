/**
 * Tipos de domínio do LeadFinder.
 * Espelham o formato esperado das futuras APIs (Supabase, Google Places, IA, Cakto).
 */

export type PlanId = 'free' | 'silver' | 'gold' | 'diamond'

/** Personagens do LeadFinder: usados como foto de perfil e como mascote da LeadIA. */
export type CharacterId = 'robot' | 'dragon' | 'alien' | 'puppy'
export type AvatarId = CharacterId
export type MascotId = CharacterId

export interface User {
  id: string
  name: string
  email: string
  plan: PlanId
  /** Avatar escolhido no cadastro (contas antigas podem não ter). */
  avatar?: AvatarId
  createdAt: string
  onboarding: OnboardingState
  preferences: Preferences
}

export interface OnboardingState {
  completed: boolean
  goal?: string
  services?: string[]
}

export interface Preferences {
  reduceMotion: boolean
  /** Personagem da LeadIA. */
  mascot?: MascotId
  notifications: {
    weeklySummary: boolean
    productUpdates: boolean
    tokenAlerts: boolean
  }
}

/** Origem dos dados de uma empresa. `demo` = gerado localmente, não é uma empresa real. */
export type CompanySource = 'demo' | 'google_places'

export interface Company {
  id: string
  name: string
  category: string
  address: string
  city: string
  state?: string
  /** Campos opcionais: só existem quando a fonte os fornece. */
  phone?: string
  website?: string
  rating?: number
  reviewCount?: number
  source: CompanySource
}

export type LeadStatus = 'new' | 'contacted' | 'negotiating' | 'converted' | 'lost'

export interface Lead {
  id: string
  companyId: string
  status: LeadStatus
  createdAt: string
  updatedAt: string
}

export interface Favorite {
  companyId: string
  createdAt: string
}

export interface Note {
  id: string
  text: string
  createdAt: string
}

export interface SearchFilters {
  onlyWithoutWebsite: boolean
  onlyWithPhone: boolean
  minRating: number
}

export interface SearchQuery {
  segment: string
  region: string
  filters: SearchFilters
}

export interface SearchRecord {
  id: string
  segment: string
  region: string
  filters: SearchFilters
  /** Empresas encontradas na fonte. */
  resultCount: number
  /** Empresas exibidas = tokens consumidos. */
  tokensUsed: number
  createdAt: string
  source: CompanySource
}

export interface SearchSession {
  recordId: string
  query: SearchQuery
  companyIds: string[]
  /** Já buscadas na fonte, aguardando tokens para serem exibidas. */
  pendingIds: string[]
  total: number
  page: number
  hasMore: boolean
  /** Busca real: o total é "até agora" (o Google não informa o total). */
  approximate?: boolean
}

export type PromptCategory = 'first-contact' | 'follow-up' | 'proposal' | 'objections' | 'sites' | 'other'

export interface Prompt {
  id: string
  title: string
  content: string
  category: PromptCategory
  favorite: boolean
  createdAt: string
  updatedAt: string
}

export interface SiteBrief {
  companyName: string
  segment: string
  city: string
  goal: string
  style: string
  colors: string
  features: string[]
  extra: string
}

export interface SiteGeneration {
  id: string
  brief: SiteBrief
  output: string
  /** `template` = montado localmente; `ai` = gerado pelo serviço de IA (futuro). */
  engine: 'template' | 'ai'
  createdAt: string
}

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  /** `notice` = aviso do sistema (ex.: serviço não conectado), não uma resposta da IA. */
  kind?: 'message' | 'notice'
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export type SaleStatus = 'paid' | 'pending'

export interface Sale {
  id: string
  client: string
  /** Empresa dos leads ligada à venda (opcional). */
  companyId?: string
  service: string
  /** Valor em centavos. */
  amount: number
  /** Data da venda (AAAA-MM-DD). */
  date: string
  status: SaleStatus
  notes?: string
  createdAt: string
}

export type ActivityType =
  | 'sale_added'
  | 'search'
  | 'lead_saved'
  | 'lead_status'
  | 'lead_removed'
  | 'favorite_added'
  | 'prompt_created'
  | 'site_prompt'
  | 'plan_changed'

export interface Activity {
  id: string
  type: ActivityType
  label: string
  createdAt: string
  href?: string
}
