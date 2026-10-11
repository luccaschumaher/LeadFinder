import { useEffect, useRef, useState } from 'react'
import { loadScript, SITE_KEY } from '@/lib/captcha'

/** Caixa de verificação do Cloudflare Turnstile. */
export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let widgetId: string | undefined
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return
        widgetId = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          theme: 'dark',
          language: 'pt-br',
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null),
        })
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [onToken])

  if (failed)
    return (
      <p className="text-[12px] text-amber-200/90">
        Não foi possível carregar a verificação de segurança. Verifique sua conexão e recarregue a página.
      </p>
    )
  return <div ref={ref} className="min-h-[65px]" />
}
