import {
  AudioWaveform,
  Bookmark,
  Gem,
  History,
  LayoutGrid,
  LibraryBig,
  ScanSearch,
  Settings,
  Star,
  Wallet,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react'
import type { FEATURE_PLAN } from './plans'
import { ROUTES } from './routes'

export const SECTION_IDS = {
  features: 'funcionalidades',
  howItWorks: 'como-funciona',
  pricing: 'planos',
  faq: 'perguntas-frequentes',
} as const

export const NAV_LINKS = [
  { label: 'Funcionalidades', href: `#${SECTION_IDS.features}` },
  { label: 'Como funciona', href: `#${SECTION_IDS.howItWorks}` },
  { label: 'Planos', href: `#${SECTION_IDS.pricing}` },
  { label: 'Perguntas', href: `#${SECTION_IDS.faq}` },
] as const

export const FOOTER_GROUPS = [
  {
    title: 'Produto',
    links: [
      { label: 'Funcionalidades', href: `/#${SECTION_IDS.features}` },
      { label: 'Como funciona', href: `/#${SECTION_IDS.howItWorks}` },
      { label: 'Planos', href: `/#${SECTION_IDS.pricing}` },
      { label: 'Perguntas frequentes', href: `/#${SECTION_IDS.faq}` },
    ],
  },
  {
    title: 'Conta',
    links: [
      { label: 'Entrar', href: ROUTES.signIn },
      { label: 'Criar conta', href: ROUTES.signUp },
      { label: 'Contato', href: ROUTES.contact },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacidade', href: ROUTES.privacy },
      { label: 'Termos de uso', href: ROUTES.terms },
    ],
  },
] as const

export interface AppNavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Recurso que exige plano mínimo (exibe cadeado quando bloqueado). */
  feature?: keyof typeof FEATURE_PLAN
  end?: boolean
}

export const APP_NAV: { title: string; items: AppNavItem[] }[] = [
  {
    title: 'Prospecção',
    items: [
      { label: 'Visão geral', to: ROUTES.dashboard, icon: LayoutGrid, end: true },
      { label: 'Buscar empresas', to: ROUTES.search, icon: ScanSearch },
      { label: 'Meus Leads', to: ROUTES.leads, icon: Bookmark },
      { label: 'Favoritos', to: ROUTES.favorites, icon: Star },
      { label: 'Histórico', to: ROUTES.history, icon: History },
    ],
  },
  {
    title: 'Ferramentas',
    items: [
      { label: 'Biblioteca de prompts', to: ROUTES.prompts, icon: LibraryBig, feature: 'promptLibrary' },
      { label: 'Financeiro', to: ROUTES.finance, icon: Wallet, feature: 'finance' },
      { label: 'Gerador de prompts', to: ROUTES.siteGenerator, icon: WandSparkles, feature: 'siteGenerator' },
      { label: 'LeadIA', to: ROUTES.waveIA, icon: AudioWaveform, feature: 'waveIA' },
    ],
  },
  {
    title: 'Conta',
    items: [
      { label: 'Planos', to: ROUTES.plans, icon: Gem },
      { label: 'Configurações', to: ROUTES.settings, icon: Settings },
    ],
  },
]
