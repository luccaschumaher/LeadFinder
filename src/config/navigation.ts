import { ROUTES } from './routes'

export const SECTION_IDS = {
  features: 'funcionalidades',
  howItWorks: 'como-funciona',
  pricing: 'planos',
} as const

export const NAV_LINKS = [
  { label: 'Funcionalidades', href: `#${SECTION_IDS.features}` },
  { label: 'Como funciona', href: `#${SECTION_IDS.howItWorks}` },
  { label: 'Planos', href: `#${SECTION_IDS.pricing}` },
] as const

export const FOOTER_GROUPS = [
  {
    title: 'Produto',
    links: [
      { label: 'Funcionalidades', href: `/#${SECTION_IDS.features}` },
      { label: 'Como funciona', href: `/#${SECTION_IDS.howItWorks}` },
      { label: 'Planos', href: `/#${SECTION_IDS.pricing}` },
    ],
  },
  {
    title: 'Empresa',
    links: [{ label: 'Contato', href: ROUTES.contact }],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacidade', href: ROUTES.privacy },
      { label: 'Termos de uso', href: ROUTES.terms },
    ],
  },
] as const
