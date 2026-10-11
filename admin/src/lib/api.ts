import { supabase } from './supabase'

/** Dados do painel. Todas as funções conferem no banco se a conta é administradora. */

export type PlanId = 'free' | 'silver' | 'gold' | 'diamond'

export interface DailyRow {
  day: string
  search_requests: number
  ai_calls: number
  input_tokens: number
  output_tokens: number
  searches: number
  companies: number
  site_generations: number
  wave_messages: number
  active_users: number
  new_users: number
}

export interface Summary {
  days: number
  users_total: number
  users_by_plan: Partial<Record<PlanId, number>>
  paying_users: number
  mrr: number
  serper_requests_all_time: number
  billing_failures: number
  daily: DailyRow[]
}

export interface UserRow {
  id: string
  email: string
  name: string
  plan: PlanId
  created_at: string
  last_sign_in_at: string | null
  billing_plan: PlanId | null
  billing_status: 'active' | 'canceled' | 'revoked' | 'expired' | null
  expires_at: string | null
  companies: number
  searches: number
  site_generations: number
  wave_messages: number
  active_days: number
  search_requests: number
  ai_calls: number
  input_tokens: number
  output_tokens: number
  /** Conta de teste ou de administrador (fora dos números do painel). */
  internal: boolean
}

export interface PaymentEvent {
  id: string
  event: string
  email: string | null
  plan: string | null
  result: string | null
  created_at: string
  account_email: string | null
}

export interface PaymentFailure {
  event_id: string
  event: string
  email: string | null
  plan: string | null
  reason: string
  attempts: number
  created_at: string
}

function fail(message: string): never {
  if (message.includes('forbidden')) throw new Error('Esta conta não tem acesso ao painel.')
  if (message.includes('mfa_required')) throw new Error('Confirme a verificação em duas etapas para ver os dados.')
  throw new Error(message)
}

export async function isAdmin() {
  const { data, error } = await supabase.rpc('lf_is_admin')
  if (error) fail(error.message)
  return data === true
}

export async function fetchSummary(days: number) {
  const { data, error } = await supabase.rpc('lf_admin_summary', { p_days: days })
  if (error) fail(error.message)
  return data as Summary
}

export async function fetchUsers(days: number) {
  const { data, error } = await supabase.rpc('lf_admin_users', { p_days: days })
  if (error) fail(error.message)
  return (data ?? []).map((r: Record<string, unknown>) => {
    const row = { ...r } as Record<string, unknown>
    for (const k of [
      'companies',
      'searches',
      'site_generations',
      'wave_messages',
      'active_days',
      'search_requests',
      'ai_calls',
      'input_tokens',
      'output_tokens',
    ])
      row[k] = Number(row[k] ?? 0)
    row.internal = row.internal === true
    return row as unknown as UserRow
  }) as UserRow[]
}

export async function fetchPayments() {
  const { data, error } = await supabase.rpc('lf_admin_payments', { p_limit: 200 })
  if (error) fail(error.message)
  return data as { events: PaymentEvent[]; failures: PaymentFailure[] }
}
