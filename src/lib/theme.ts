export type Theme = 'dark' | 'light'

/** Mesma chave lida por public/theme.js antes da página aparecer (evita piscar). */
const KEY = 'lf-theme'

/** Só a área logada muda de tema; landing, login e páginas legais ficam sempre escuras. */
export const themedPath = (pathname: string) => pathname.startsWith('/app') || pathname.startsWith('/onboarding')

export function storedTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* armazenamento indisponível: o tema ainda vem da conta */
  }
}

/** Aplica o tema na página (atributo data-theme + cor da barra do navegador). */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'light') root.dataset.theme = 'light'
  else delete root.dataset.theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f4f6fb' : '#05060a')
}
