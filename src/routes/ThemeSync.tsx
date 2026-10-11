import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { applyTheme, saveTheme, storedTheme, themedPath } from '@/lib/theme'
import { useUser } from '@/stores/session'

/** Mantém o tema da página igual à preferência da conta (só na área logada). */
export function ThemeSync() {
  const { pathname } = useLocation()
  const preference = useUser()?.preferences.theme

  useEffect(() => {
    if (preference) saveTheme(preference)
    applyTheme(themedPath(pathname) ? (preference ?? storedTheme()) : 'dark')
  }, [pathname, preference])

  return null
}
