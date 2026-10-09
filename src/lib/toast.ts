import { createStore } from '@/lib/store'
import { uid } from '@/lib/utils'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  tone: ToastTone
  title: string
  description?: string
}

export const toastStore = createStore<ToastItem[]>([])

function push(tone: ToastTone, title: string, description?: string) {
  const id = uid('t')
  toastStore.set((list) => [...list.slice(-3), { id, tone, title, description }])
  setTimeout(() => dismissToast(id), tone === 'error' ? 6000 : 3800)
}

export function dismissToast(id: string) {
  toastStore.set((list) => list.filter((t) => t.id !== id))
}

/** Notificações temporárias. Pode ser chamado de qualquer lugar. */
export const toast = {
  success: (title: string, description?: string) => push('success', title, description),
  error: (title: string, description?: string) => push('error', title, description),
  info: (title: string, description?: string) => push('info', title, description),
}
