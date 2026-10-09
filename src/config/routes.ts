/**
 * Rotas da aplicação. As rotas marcadas como "próxima etapa" ainda exibem
 * uma página provisória e serão implementadas nas etapas seguintes.
 */
export const ROUTES = {
  home: '/',
  signIn: '/entrar', // próxima etapa: autenticação Supabase
  signUp: '/criar-conta', // próxima etapa: autenticação Supabase
  dashboard: '/app', // próxima etapa: área protegida
  contact: '/contato',
  privacy: '/privacidade',
  terms: '/termos',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
