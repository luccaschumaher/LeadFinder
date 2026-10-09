import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { LogoMark } from '@/components/brand/Logo'
import { ROUTES } from '@/config/routes'
import { useSessionStatus, useUser } from '@/stores/session'

/** Tela exibida enquanto a sessão é restaurada e os dados carregam. */
export function AppLoading() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ink-950"
      aria-busy="true"
      aria-live="polite"
    >
      <LogoMark className="size-12 animate-pulse" />
      <p className="text-sm text-fg-subtle">Carregando sua conta…</p>
    </div>
  )
}

/** Exige sessão ativa; caso contrário, envia ao login e volta depois. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useUser()
  const status = useSessionStatus()
  const location = useLocation()
  if (status === 'loading') return <AppLoading />
  if (!user) return <Navigate to={ROUTES.signIn} replace state={{ from: location.pathname + location.search }} />
  return children
}

/** Exige onboarding concluído (mostrado apenas uma vez por conta). */
export function RequireOnboarding({ children }: { children: ReactNode }) {
  const user = useUser()
  if (user && !user.onboarding.completed) return <Navigate to={ROUTES.onboarding} replace />
  return children
}

/** Páginas de visitante (login, cadastro): quem já entrou vai para o app. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const user = useUser()
  const status = useSessionStatus()
  if (status === 'loading') return <AppLoading />
  if (user) return <Navigate to={user.onboarding.completed ? ROUTES.dashboard : ROUTES.onboarding} replace />
  return children
}
