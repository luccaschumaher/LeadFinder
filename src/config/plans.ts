/**
 * Planos do LeadFinder.
 *
 * Os preços ainda não foram definidos e os benefícios abaixo são os PREVISTOS
 * para cada plano. Esta mesma estrutura servirá de base para o sistema de
 * planos e permissões nas próximas etapas.
 */
export type PlanId = 'free' | 'silver' | 'gold' | 'diamond'

export interface Plan {
  id: PlanId
  name: string
  description: string
  /** `null` enquanto o preço não estiver definido. */
  priceLabel: string | null
  benefits: string[]
  /** Plano destacado visualmente na tabela. */
  recommended?: boolean
  /** Já é possível assinar este plano. */
  available: boolean
}

export const PLAN_ORDER: PlanId[] = ['free', 'silver', 'gold', 'diamond']

/** Verifica se o plano atual inclui os recursos de um plano exigido. */
export function hasPlanAccess(current: PlanId, required: PlanId) {
  return PLAN_ORDER.indexOf(current) >= PLAN_ORDER.indexOf(required)
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Para conhecer o LeadFinder e fazer as primeiras pesquisas.',
    priceLabel: null,
    available: true,
    benefits: [
      'Pesquisa de empresas com limite mensal reduzido',
      'Salvar leads e marcar favoritos',
      'Biblioteca pessoal de prompts com limite de itens',
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    description: 'Para prospectar com constância e manter tudo organizado.',
    priceLabel: null,
    available: false,
    benefits: [
      'Tudo do Free',
      'Mais pesquisas de empresas por mês',
      'Histórico de pesquisas',
      'Biblioteca de prompts ampliada',
      'Acesso ao Gerador de Prompts para Sites',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    description: 'Para quem prospecta todos os dias e precisa de volume.',
    priceLabel: null,
    available: false,
    recommended: true,
    benefits: [
      'Tudo do Silver',
      'Limites de pesquisa ampliados',
      'Organização completa de leads e oportunidades',
      'Gerador de Prompts para Sites com limite ampliado',
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    description: 'Para uma operação completa, com apoio de inteligência artificial.',
    priceLabel: null,
    available: false,
    benefits: ['Tudo do Gold', 'WaveIA, assistente de prospecção e vendas', 'Os maiores limites de uso da plataforma'],
  },
]
