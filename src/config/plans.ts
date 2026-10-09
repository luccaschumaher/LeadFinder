import type { PlanId } from '@/types'

export type { PlanId }

/**
 * Planos do LeadFinder.
 *
 * Preços e links de checkout da Cakto definidos. A ativação do plano após o pagamento
 * depende do webhook da Cakto no backend (próxima etapa).
 */
export interface PlanLimits {
  /** Tokens por dia. 1 token = 1 empresa exibida (ver TOKENS_PER_COMPANY). Renovam diariamente, sem acumular. */
  tokens: number
  /** Prompts personalizados na biblioteca. 0 = sem acesso; UNLIMITED = ilimitado. */
  savedPrompts: number
  /** Gerações diárias no Gerador de Prompts para Sites. 0 = sem acesso. */
  siteGenerationsPerDay: number
  waveIA: boolean
  /** Mensagens por dia para a WaveIA (validado no banco por lf_register_wave_message). */
  waveMessagesPerDay: number
}

export interface Plan {
  id: PlanId
  name: string
  description: string
  limits: PlanLimits
  priceLabel: string | null
  checkoutUrl: string | null
  recommended?: boolean
}

/** Valor usado para limites ilimitados. */
export const UNLIMITED = Number.POSITIVE_INFINITY

export const isUnlimited = (value: number) => value === UNLIMITED

export const PLAN_ORDER: PlanId[] = ['free', 'silver', 'gold', 'diamond']

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Para conhecer o LeadFinder e fazer as primeiras buscas.',
    limits: { tokens: 3, savedPrompts: 0, siteGenerationsPerDay: 0, waveIA: false, waveMessagesPerDay: 0 },
    priceLabel: 'Grátis',
    checkoutUrl: null,
  },
  {
    id: 'silver',
    name: 'Silver',
    description: 'Para prospectar com constância e montar sua biblioteca.',
    limits: { tokens: 40, savedPrompts: 5, siteGenerationsPerDay: 0, waveIA: false, waveMessagesPerDay: 0 },
    priceLabel: 'R$ 29,90/mês',
    checkoutUrl: 'https://pay.cakto.com.br/buiqzt9_1167071',
  },
  {
    id: 'gold',
    name: 'Gold',
    description: 'Para quem prospecta todos os dias e entrega sites com IA.',
    limits: { tokens: 70, savedPrompts: 10, siteGenerationsPerDay: 10, waveIA: false, waveMessagesPerDay: 0 },
    priceLabel: 'R$ 49,90/mês',
    checkoutUrl: 'https://pay.cakto.com.br/db4r8g9_1167090',
    recommended: true,
  },
  {
    id: 'diamond',
    name: 'Diamond',
    description: 'Para uma operação completa, com a assistente WaveIA.',
    limits: { tokens: 120, savedPrompts: UNLIMITED, siteGenerationsPerDay: 20, waveIA: true, waveMessagesPerDay: 30 },
    priceLabel: 'R$ 99,90/mês',
    checkoutUrl: 'https://pay.cakto.com.br/asgfhan_1167097',
  },
]

/** Tokens consumidos por empresa exibida na busca. */
export const TOKENS_PER_COMPANY = 1

/** Plano mínimo exigido por cada recurso bloqueável. */
export const FEATURE_PLAN: Record<'promptLibrary' | 'finance' | 'siteGenerator' | 'waveIA', PlanId> = {
  promptLibrary: 'silver',
  finance: 'silver',
  siteGenerator: 'gold',
  waveIA: 'diamond',
}

export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]
}

/** Verifica se o plano atual inclui os recursos de um plano exigido. */
export function hasPlanAccess(current: PlanId, required: PlanId) {
  return PLAN_ORDER.indexOf(current) >= PLAN_ORDER.indexOf(required)
}

export function comparePlans(a: PlanId, b: PlanId) {
  return PLAN_ORDER.indexOf(a) - PLAN_ORDER.indexOf(b)
}

/** Lista legível dos recursos de um plano (usada na landing e na página de planos). */
export function planFeatureList(plan: Plan): { label: string; included: boolean }[] {
  const { limits } = plan
  return [
    { label: `${limits.tokens} tokens por dia (1 token = 1 empresa)`, included: true },
    { label: 'Busca de empresas, Meus Leads, Favoritos e Histórico', included: true },
    {
      label:
        limits.savedPrompts === 0
          ? 'Sem biblioteca de prompts'
          : isUnlimited(limits.savedPrompts)
            ? 'Biblioteca de prompts ilimitada'
            : `Biblioteca com até ${limits.savedPrompts} prompts`,
      included: limits.savedPrompts > 0,
    },
    {
      label: hasPlanAccess(plan.id, FEATURE_PLAN.finance)
        ? 'Financeiro: controle de vendas por semana'
        : 'Sem área Financeiro',
      included: hasPlanAccess(plan.id, FEATURE_PLAN.finance),
    },
    {
      label:
        limits.siteGenerationsPerDay > 0
          ? `Até ${limits.siteGenerationsPerDay} gerações de prompts para sites por dia`
          : 'Sem Gerador de Prompts para Sites',
      included: limits.siteGenerationsPerDay > 0,
    },
    {
      label: limits.waveIA ? `WaveIA: até ${limits.waveMessagesPerDay} mensagens por dia` : 'Sem acesso à WaveIA',
      included: limits.waveIA,
    },
  ]
}
