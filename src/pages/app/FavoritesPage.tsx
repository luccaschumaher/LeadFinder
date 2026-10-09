import { ArrowRight, MapPin, Phone, ScanSearch, Search, Star, StarOff } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CompanyAvatar, SaveLeadButton, SourceBadge, WebsiteButton } from '@/components/app/company'
import { locationLabel } from '@/lib/company'
import { PageHeader } from '@/components/app/PageHeader'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Badge, Card, EmptyState, Segmented } from '@/components/ui/display'
import { Input } from '@/components/ui/Field'
import { ROUTES } from '@/config/routes'
import { toast } from '@/lib/toast'
import { formatDate, normalize } from '@/lib/utils'
import { leadService } from '@/services/leads'
import { useData } from '@/stores/data'

type Filter = 'all' | 'not-lead' | 'no-website'

export function FavoritesPage() {
  const favorites = useData((s) => s.favorites)
  const companies = useData((s) => s.companies)
  const leads = useData((s) => s.leads)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const items = useMemo(() => {
    const leadSet = new Set(leads.map((l) => l.companyId))
    return favorites
      .filter((f) => companies[f.companyId])
      .map((f) => ({ ...f, company: companies[f.companyId], isLead: leadSet.has(f.companyId) }))
  }, [favorites, companies, leads])

  const visible = useMemo(() => {
    const q = normalize(query)
    return items.filter(
      (i) =>
        (filter === 'all' || (filter === 'not-lead' && !i.isLead) || (filter === 'no-website' && !i.company.website)) &&
        (!q || normalize(`${i.company.name} ${i.company.category} ${i.company.city}`).includes(q)),
    )
  }, [items, query, filter])

  const remove = async (companyId: string) => {
    await leadService.toggleFavorite(companyId)
    toast.success('Removido dos favoritos')
  }

  return (
    <>
      <PageHeader title="Favoritos" description="Empresas que você marcou para voltar depois." />

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Star />}
            title="Nenhuma empresa favoritada"
            description="Use a estrela nos resultados da busca para guardar empresas interessantes e decidir depois."
            action={
              <ButtonLink to={ROUTES.search} size="xs">
                <ScanSearch />
                Buscar empresas
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              aria-label="Buscar favoritos"
              placeholder="Buscar favoritos"
              icon={<Search />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 sm:w-72"
            />
            <Segmented
              label="Filtro"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'Todos', count: items.length },
                { value: 'not-lead', label: 'Não salvos como lead', count: items.filter((i) => !i.isLead).length },
                { value: 'no-website', label: 'Sem site', count: items.filter((i) => !i.company.website).length },
              ]}
            />
          </div>

          {visible.length === 0 ? (
            <Card className="mt-4">
              <EmptyState
                icon={<Search />}
                title="Nenhum favorito encontrado"
                description="Ajuste a busca ou o filtro."
              />
            </Card>
          ) : (
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              <AnimatePresence initial={false}>
                {visible.map((i) => (
                  <motion.li
                    key={i.companyId}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                  >
                    <Card className="flex h-full flex-col p-4">
                      <div className="flex items-start gap-3">
                        <CompanyAvatar name={i.company.name} />
                        <div className="min-w-0 flex-1">
                          <Link
                            to={ROUTES.company(i.companyId)}
                            className="block truncate text-sm font-medium text-fg hover:text-electric-200"
                          >
                            {i.company.name}
                          </Link>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-fg-subtle">
                            {i.company.category} <SourceBadge company={i.company} />
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remover dos favoritos"
                          title="Remover dos favoritos"
                          onClick={() => remove(i.companyId)}
                        >
                          <StarOff />
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-fg-muted">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-fg-subtle" />
                          {locationLabel(i.company)}
                        </span>
                        {i.company.phone && (
                          <span className="flex items-center gap-1.5 font-mono">
                            <Phone className="size-3.5 text-fg-subtle" />
                            {i.company.phone}
                          </span>
                        )}
                        {!i.company.website && <Badge tone="blue">Sem site</Badge>}
                      </div>
                      <div className="mt-4 flex items-center gap-1 border-t border-line pt-3">
                        <SaveLeadButton companyId={i.companyId} />
                        <WebsiteButton company={i.company} />
                        <span className="ml-auto hidden text-[11px] text-fg-subtle sm:inline">
                          Favoritado em {formatDate(i.createdAt)}
                        </span>
                        <ButtonLink to={ROUTES.company(i.companyId)} variant="ghost" size="xs" className="sm:ml-1">
                          Detalhes
                          <ArrowRight />
                        </ButtonLink>
                      </div>
                    </Card>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </>
      )}
    </>
  )
}
