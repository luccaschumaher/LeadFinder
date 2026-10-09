import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url || !key) {
  throw new Error(
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.local (veja .env.example).',
  )
}

const REMEMBER_KEY = 'lf:remember'

/** "Manter conectado": sessão no localStorage; caso contrário, só enquanto a aba estiver aberta. */
export function setRememberSession(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
  } catch {
    // ignora
  }
}

function sessionArea(): Storage | null {
  try {
    return localStorage.getItem(REMEMBER_KEY) === '0' ? sessionStorage : localStorage
  } catch {
    return null
  }
}

const authStorage = {
  getItem: (k: string) => {
    try {
      return localStorage.getItem(k) ?? sessionStorage.getItem(k)
    } catch {
      return null
    }
  },
  setItem: (k: string, v: string) => {
    try {
      localStorage.removeItem(k)
      sessionStorage.removeItem(k)
      sessionArea()?.setItem(k, v)
    } catch {
      // ignora
    }
  },
  removeItem: (k: string) => {
    try {
      localStorage.removeItem(k)
      sessionStorage.removeItem(k)
    } catch {
      // ignora
    }
  },
}

/** Cliente único do Supabase. A chave publicável é pública por design; a segurança vem das regras (RLS) no banco. */
export const supabase = createClient(url, key, {
  auth: { storage: authStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
