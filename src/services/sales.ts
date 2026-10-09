import { FEATURE_PLAN, getPlan, hasPlanAccess } from '@/config/plans'
import { must, toSale } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { formatBRL } from '@/lib/money'
import { supabase } from '@/lib/supabase'
import { currentUserId, dataStore } from '@/stores/data'
import { sessionStore } from '@/stores/session'
import type { Sale } from '@/types'
import { logActivity } from './activity'

export type SaleInput = Omit<Sale, 'id' | 'createdAt'>

function ensureAccess() {
  const user = sessionStore.get().user
  if (!user || !hasPlanAccess(user.plan, FEATURE_PLAN.finance)) {
    throw new AppError(
      'plan_required',
      `O Financeiro está disponível a partir do plano ${getPlan(FEATURE_PLAN.finance).name}.`,
    )
  }
}

const toRow = (input: SaleInput) => ({
  client: input.client.trim(),
  company_id: input.companyId ?? null,
  service: input.service.trim(),
  amount: input.amount,
  date: input.date,
  status: input.status,
  notes: input.notes?.trim() || null,
})

/** Controle de vendas (registro manual). O plano também é validado no banco (RLS de lf_sales). */
export const salesService = {
  async create(input: SaleInput) {
    ensureAccess()
    const row = must(
      await supabase
        .from('lf_sales')
        .insert({ user_id: currentUserId(), ...toRow(input) })
        .select()
        .single(),
    )
    const sale = toSale(row)
    dataStore.set((s) => ({ ...s, sales: [sale, ...s.sales] }))
    logActivity('sale_added', `Registrou uma venda de ${formatBRL(sale.amount)} para ${sale.client}`, '/app/financeiro')
    return sale
  },

  async update(id: string, input: SaleInput) {
    ensureAccess()
    const row = must(await supabase.from('lf_sales').update(toRow(input)).eq('id', id).select().single())
    dataStore.set((s) => ({ ...s, sales: s.sales.map((x) => (x.id === id ? toSale(row) : x)) }))
  },

  async setStatus(id: string, status: Sale['status']) {
    must(await supabase.from('lf_sales').update({ status }).eq('id', id))
    dataStore.set((s) => ({ ...s, sales: s.sales.map((x) => (x.id === id ? { ...x, status } : x)) }))
  },

  async remove(id: string) {
    must(await supabase.from('lf_sales').delete().eq('id', id))
    dataStore.set((s) => ({ ...s, sales: s.sales.filter((x) => x.id !== id) }))
  },
}
