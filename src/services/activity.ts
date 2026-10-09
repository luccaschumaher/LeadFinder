import { supabase } from '@/lib/supabase'
import { now, uid } from '@/lib/utils'
import { currentUserId, dataStore } from '@/stores/data'
import type { ActivityType } from '@/types'

const MAX_ACTIVITY = 60

/** Registra uma atividade (aparece em "Atividade recente"). Gravação em segundo plano. */
export function logActivity(type: ActivityType, label: string, href?: string) {
  const entry = { id: uid('act'), type, label, href, createdAt: now() }
  dataStore.set((s) => ({ ...s, activity: [entry, ...s.activity].slice(0, MAX_ACTIVITY) }))
  void supabase
    .from('lf_activity')
    .insert({ user_id: currentUserId(), type, label, href: href ?? null })
    .then(() => undefined)
}
