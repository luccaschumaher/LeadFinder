import { fromCompany, must, toLead, toNote } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { currentUserId, dataStore } from '@/stores/data'
import type { LeadStatus } from '@/types'
import { logActivity } from './activity'

export const LEAD_STATUSES: { id: LeadStatus; label: string }[] = [
  { id: 'new', label: 'Novo' },
  { id: 'contacted', label: 'Contatado' },
  { id: 'negotiating', label: 'Em negociação' },
  { id: 'converted', label: 'Convertido' },
  { id: 'lost', label: 'Perdido' },
]

export const statusLabel = (status: LeadStatus) => LEAD_STATUSES.find((s) => s.id === status)?.label ?? status

const companyName = (id: string) => dataStore.get().companies[id]?.name ?? 'Empresa'

/** Garante que a empresa (vinda da busca) esteja salva no banco antes de virar lead, favorito ou nota. */
async function ensureCompany(companyId: string) {
  const company = dataStore.get().companies[companyId]
  if (!company) throw new AppError('not_found', 'Empresa não encontrada.')
  must(
    await supabase
      .from('lf_companies')
      .upsert(fromCompany(company, currentUserId()), { onConflict: 'user_id,id', ignoreDuplicates: true }),
  )
}

/** Leads, favoritos e anotações, gravados no Supabase. */
export const leadService = {
  async save(companyId: string) {
    if (dataStore.get().leads.some((l) => l.companyId === companyId)) return
    await ensureCompany(companyId)
    const row = must(
      await supabase.from('lf_leads').insert({ user_id: currentUserId(), company_id: companyId }).select().single(),
    )
    dataStore.set((s) => ({ ...s, leads: [toLead(row), ...s.leads] }))
    logActivity('lead_saved', `Salvou ${companyName(companyId)} nos leads`, `/app/empresas/${companyId}`)
  },

  async setStatus(leadIds: string[], status: LeadStatus) {
    must(await supabase.from('lf_leads').update({ status }).in('id', leadIds))
    const ids = new Set(leadIds)
    const stamp = new Date().toISOString()
    dataStore.set((s) => ({
      ...s,
      leads: s.leads.map((l) => (ids.has(l.id) ? { ...l, status, updatedAt: stamp } : l)),
    }))
    const first = dataStore.get().leads.find((l) => ids.has(l.id))
    const label =
      leadIds.length === 1 && first
        ? `Moveu ${companyName(first.companyId)} para "${statusLabel(status)}"`
        : `Moveu ${leadIds.length} leads para "${statusLabel(status)}"`
    logActivity('lead_status', label, '/app/leads')
  },

  async remove(leadIds: string[]) {
    must(await supabase.from('lf_leads').delete().in('id', leadIds))
    const ids = new Set(leadIds)
    dataStore.set((s) => ({ ...s, leads: s.leads.filter((l) => !ids.has(l.id)) }))
    logActivity('lead_removed', leadIds.length === 1 ? 'Removeu um lead' : `Removeu ${leadIds.length} leads`)
  },

  async toggleFavorite(companyId: string) {
    const exists = dataStore.get().favorites.some((f) => f.companyId === companyId)
    if (exists) {
      must(await supabase.from('lf_favorites').delete().eq('company_id', companyId))
      dataStore.set((s) => ({ ...s, favorites: s.favorites.filter((f) => f.companyId !== companyId) }))
      return false
    }
    await ensureCompany(companyId)
    const row = must(
      await supabase.from('lf_favorites').insert({ user_id: currentUserId(), company_id: companyId }).select().single(),
    )
    dataStore.set((s) => ({ ...s, favorites: [{ companyId, createdAt: row.created_at }, ...s.favorites] }))
    logActivity('favorite_added', `Favoritou ${companyName(companyId)}`, `/app/empresas/${companyId}`)
    return true
  },

  async removeFavorites(companyIds: string[]) {
    must(await supabase.from('lf_favorites').delete().in('company_id', companyIds))
    const ids = new Set(companyIds)
    dataStore.set((s) => ({ ...s, favorites: s.favorites.filter((f) => !ids.has(f.companyId)) }))
  },

  async addNote(companyId: string, text: string) {
    await ensureCompany(companyId)
    const row = must(
      await supabase
        .from('lf_notes')
        .insert({ user_id: currentUserId(), company_id: companyId, text: text.trim() })
        .select()
        .single(),
    )
    dataStore.set((s) => ({ ...s, notes: { ...s.notes, [companyId]: [toNote(row), ...(s.notes[companyId] ?? [])] } }))
  },

  async deleteNote(companyId: string, noteId: string) {
    must(await supabase.from('lf_notes').delete().eq('id', noteId))
    dataStore.set((s) => ({
      ...s,
      notes: { ...s.notes, [companyId]: (s.notes[companyId] ?? []).filter((n) => n.id !== noteId) },
    }))
  },
}

export const historyService = {
  async remove(recordId: string) {
    must(await supabase.from('lf_searches').delete().eq('id', recordId))
    dataStore.set((s) => ({ ...s, history: s.history.filter((h) => h.id !== recordId) }))
  },
  async clear() {
    must(await supabase.from('lf_searches').delete().eq('user_id', currentUserId()))
    dataStore.set((s) => ({ ...s, history: [] }))
  },
}
