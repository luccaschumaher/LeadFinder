import { toast } from '@/lib/toast'
import { useData } from '@/stores/data'
import type { Company } from '@/types'

export const locationLabel = (c: Company) => [c.city, c.state].filter(Boolean).join(' · ')

/** Estado de lead/favorito de uma empresa. */
export function useCompanyState(companyId: string) {
  const lead = useData((s) => s.leads.find((l) => l.companyId === companyId))
  const favorite = useData((s) => s.favorites.some((f) => f.companyId === companyId))
  return { lead, favorite }
}

/** Abre o site. Para empresas de demonstração, explica que o site é fictício. */
export function openCompanyWebsite(company: Company) {
  if (!company.website) return
  if (company.source === 'demo') {
    toast.info(
      'Site de demonstração',
      'Este endereço é fictício (domínio .example). Com dados reais, o site abrirá em uma nova aba.',
    )
    return
  }
  window.open(company.website, '_blank', 'noopener,noreferrer')
}
