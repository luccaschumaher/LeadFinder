/**
 * Verificação anti-robô (Cloudflare Turnstile), exigida pelo Supabase Auth quando o
 * CAPTCHA está ligado no painel. Sem VITE_TURNSTILE_SITE_KEY nada é exibido e o login
 * funciona normalmente (útil no desenvolvimento).
 */

export const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
export const CAPTCHA_ENABLED = !!SITE_KEY

interface TurnstileApi {
  render(el: HTMLElement, options: Record<string, unknown>): string
  remove(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<void> | null = null

export function loadScript() {
  if (window.turnstile) return Promise.resolve()
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('turnstile_load_failed'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export const CAPTCHA_REQUIRED_MESSAGE = 'Confirme a verificação de segurança antes de continuar.'
