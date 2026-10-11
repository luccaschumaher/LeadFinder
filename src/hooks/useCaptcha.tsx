import { useCallback, useState } from 'react'
import { Turnstile } from '@/components/auth/Turnstile'
import { CAPTCHA_ENABLED } from '@/lib/captcha'

/** Estado do CAPTCHA de um formulário. O token vale para uma tentativa: chame `reset` após cada envio. */
export function useCaptcha() {
  const [token, setToken] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const reset = useCallback(() => {
    setToken(null)
    setRound((r) => r + 1)
  }, [])
  return {
    token: token ?? undefined,
    ready: !CAPTCHA_ENABLED || !!token,
    reset,
    widget: CAPTCHA_ENABLED ? <Turnstile key={round} onToken={setToken} /> : null,
  }
}
