import { STORAGE_PREFIX } from '@/config/app'

type Area = 'local' | 'session'

function area(kind: Area): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

const k = (key: string) => `${STORAGE_PREFIX}:${key}`

/** Acesso seguro ao armazenamento do navegador (funciona mesmo quando bloqueado). */
export const storage = {
  get<T>(key: string, fallback: T, kind: Area = 'local'): T {
    try {
      const raw = area(kind)?.getItem(k(key))
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  },
  set(key: string, value: unknown, kind: Area = 'local') {
    try {
      area(kind)?.setItem(k(key), JSON.stringify(value))
    } catch {
      // Armazenamento cheio ou bloqueado: os dados continuam em memória nesta sessão.
    }
  },
  remove(key: string, kind: Area = 'local') {
    try {
      area(kind)?.removeItem(k(key))
    } catch {
      // ignora
    }
  },
}
