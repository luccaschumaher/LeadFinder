import { useEffect, useRef } from 'react'
import { TURNSTILE_SITE_KEY } from '../lib/supabase'

declare global {
  interface Window {
    turnstile?: { render(el: HTMLElement, o: Record<string, unknown>): string; remove(id: string): void }
  }
}

let loading: Promise<void> | null = null
function load() {
  if (window.turnstile) return Promise.resolve()
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => {
      loading = null
      reject(new Error('turnstile'))
    }
    document.head.appendChild(s)
  })
  return loading
}

/** Verificação anti-robô exigida pelo login do Supabase (CAPTCHA ligado). */
export function Turnstile({ onToken }: { onToken: (t: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    let id: string | undefined
    let cancelled = false
    load()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return
        id = window.turnstile.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'dark',
          language: 'pt-br',
          callback: (t: string) => onToken(t),
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null),
        })
      })
      .catch(() => onToken(null))
    return () => {
      cancelled = true
      if (id && window.turnstile) window.turnstile.remove(id)
    }
  }, [onToken])
  return <div ref={ref} className="min-h-[65px]" />
}
