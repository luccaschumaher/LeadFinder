import { createStore, useStore } from '@/lib/store'
import type { User } from '@/types'

interface SessionState {
  user: User | null
  /** `loading` enquanto a sessão salva é restaurada e os dados carregam. */
  status: 'loading' | 'ready'
}

export const sessionStore = createStore<SessionState>({ user: null, status: 'loading' })

export const useUser = () => useStore(sessionStore, (s) => s.user)
export const useSessionStatus = () => useStore(sessionStore, (s) => s.status)

/** Usuário autenticado. Use somente dentro das rotas protegidas. */
export function useCurrentUser(): User {
  const user = useUser()
  if (!user) throw new Error('useCurrentUser usado fora de uma rota autenticada.')
  return user
}
