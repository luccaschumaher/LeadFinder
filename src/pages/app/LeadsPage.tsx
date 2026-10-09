import {
  ArrowUpRight,
  Bookmark,
  ChevronDown,
  Ellipsis,
  NotebookPen,
  ScanSearch,
  Search,
  Star,
  StarOff,
  Trash2,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { CompanyAvatar, LeadStatusMenu, SourceBadge } from '@/components/app/company'
import { locationLabel } from '@/lib/company'
import { PageHeader } from '@/components/app/PageHeader'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Card, EmptyState, Segmented } from '@/components/ui/display'
import { Checkbox, Input, Select } from '@/components/ui/Field'
import { Menu } from '@/components/ui/Menu'
import { ROUTES } from '@/config/routes'
import { toast } from '@/lib/toast'
import { formatDate, normalize, plural } from '@/lib/utils'
import { LEAD_STATUSES, leadService, statusLabel } from '@/services/leads'
import { useData } from '@/stores/data'
import type { Company, Lead, LeadStatus } from '@/types'

type Row = { lead: Lead; company: Company; favorite: boolean; notes: number }
type Sort = 'recent' | 'oldest' | 'name'

export function LeadsPage() {
  const navigate = useNavigate()
  const leads = useData((s) => s.leads)
  const companies = useData((s) => s.companies)
  const favorites = useData((s) => s.favorites)
  const notes = useData((s) => s.notes)

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<LeadStatus | 'all'>('all')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [sort, setSort] = useState<Sort>('recent')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [toRemove, setToRemove] = useState<string[] | null>(null)
  const [removing, setRemoving] = useState(false)

  const rows = useMemo<Row[]>(() => {
    const favSet = new Set(favorites.map((f) => f.companyId))
    return leads
      .filter((l) => companies[l.companyId])
      .map((l) => ({
        lead: l,
        company: companies[l.companyId],
        favorite: favSet.has(l.companyId),
        notes: notes[l.companyId]?.length ?? 0,
      }))
  }, [leads, companies, favorites, notes])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length }
    LEAD_STATUSES.forEach((s) => (c[s.id] = rows.filter((r) => r.lead.status === s.id).length))
    return c
  }, [rows])

  const visible = useMemo(() => {
    const q = normalize(query)
    const list = rows.filter(
      (r) =>
        (status === 'all' || r.lead.status === status) &&
        (!onlyFavorites || r.favorite) &&
        (!q || normalize(`${r.company.name} ${r.company.category} ${r.company.city}`).includes(q)),
    )
    return list.sort((a, b) =>
      sort === 'name'
        ? a.company.name.localeCompare(b.company.name, 'pt-BR')
        : sort === 'oldest'
          ? a.lead.createdAt.localeCompare(b.lead.createdAt)
          : b.lead.createdAt.localeCompare(a.lead.createdAt),
    )
  }, [rows, query, status, onlyFavorites, sort])

  const visibleIds = visible.map((r) => r.lead.id)
  const selectedVisible = visibleIds.filter((id) => selected.has(id))
  const allSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(visibleIds))

  const bulkStatus = async (s: LeadStatus) => {
    await leadService.setStatus(selectedVisible, s)
    toast.success(
      'Status atualizado',
      `${plural(selectedVisible.length, 'lead movido', 'leads movidos')} para "${statusLabel(s)}".`,
    )
    setSelected(new Set())
  }

  const confirmRemove = async () => {
    if (!toRemove) return
    setRemoving(true)
    await leadService.remove(toRemove)
    toast.success(toRemove.length === 1 ? 'Lead removido' : `${toRemove.length} leads removidos`)
    setSelected((s) => new Set([...s].filter((id) => !toRemove.includes(id))))
    setRemoving(false)
    setToRemove(null)
  }

  const rowMenu = (r: Row) => [
    { label: 'Ver detalhes', icon: <ArrowUpRight />, onSelect: () => navigate(ROUTES.company(r.company.id)) },
    {
      label: r.favorite ? 'Remover dos favoritos' : 'Favoritar',
      icon: r.favorite ? <StarOff /> : <Star />,
      onSelect: async () => {
        const added = await leadService.toggleFavorite(r.company.id)
        toast.success(added ? 'Adicionado aos favoritos' : 'Removido dos favoritos')
      },
    },
    'separator' as const,
    { label: 'Remover lead', icon: <Trash2 />, danger: true, onSelect: () => setToRemove([r.lead.id]) },
  ]

  return (
    <>
      <PageHeader
        title="Meus Leads"
        description="Acompanhe as empresas salvas e o andamento de cada oportunidade."
        actions={
          <ButtonLink to={ROUTES.search} size="sm" variant="secondary">
            <ScanSearch />
            Buscar empresas
          </ButtonLink>
        }
      />

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Bookmark />}
            title="Nenhum lead salvo"
            description="Busque empresas e use “Salvar lead” para acompanhar as oportunidades com potencial de venda."
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
          <Segmented
            label="Filtrar por status"
            value={status}
            onChange={(v) => {
              setStatus(v)
              setSelected(new Set())
            }}
            options={[
              { value: 'all' as const, label: 'Todos', count: counts.all },
              ...LEAD_STATUSES.map((s) => ({ value: s.id, label: s.label, count: counts[s.id] })),
            ]}
            className="w-full sm:w-auto"
          />

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              aria-label="Buscar leads"
              placeholder="Buscar por nome, categoria ou cidade"
              icon={<Search />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 sm:w-80"
            />
            <div className="flex items-center gap-3 sm:ml-auto">
              <Checkbox
                label="Somente favoritos"
                checked={onlyFavorites}
                onChange={(e) => setOnlyFavorites(e.target.checked)}
              />
              <Select
                aria-label="Ordenar"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-9 w-40 text-[13px]"
              >
                <option value="recent">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="name">Nome (A–Z)</option>
              </Select>
            </div>
          </div>

          <AnimatePresence>
            {selectedVisible.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-electric-500/30 bg-electric-500/[0.07] px-3 py-2"
              >
                <span className="text-[13px] text-fg">
                  {plural(selectedVisible.length, 'selecionado', 'selecionados')}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <Menu
                    trigger={(props) => (
                      <Button variant="secondary" size="xs" {...props}>
                        Alterar status
                        <ChevronDown />
                      </Button>
                    )}
                    items={LEAD_STATUSES.map((s) => ({ label: s.label, onSelect: () => bulkStatus(s.id) }))}
                  />
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-red-300 hover:text-red-200"
                    onClick={() => setToRemove(selectedVisible)}
                  >
                    <Trash2 />
                    Remover
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Limpar seleção"
                    onClick={() => setSelected(new Set())}
                  >
                    <X />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {visible.length === 0 ? (
            <Card className="mt-4">
              <EmptyState
                icon={<Search />}
                title="Nenhum lead encontrado"
                description="Nenhum lead corresponde à busca ou aos filtros selecionados."
              />
            </Card>
          ) : (
            <>
              {/* Tabela (tablet e desktop) */}
              <Card className="mt-4 hidden overflow-hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-[13px]">
                    <thead className="border-b border-line bg-white/[0.015] text-[11px] tracking-wide text-fg-subtle uppercase">
                      <tr>
                        <th scope="col" className="w-10 py-3 pr-2 pl-4">
                          <Checkbox aria-label="Selecionar todos" checked={allSelected} onChange={toggleAll} />
                        </th>
                        <th scope="col" className="px-3 py-3 font-medium">
                          Empresa
                        </th>
                        <th scope="col" className="px-3 py-3 font-medium">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3 font-medium">
                          Anotações
                        </th>
                        <th scope="col" className="px-3 py-3 font-medium">
                          Criado em
                        </th>
                        <th scope="col" className="w-20 px-3 py-3">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {visible.map((r) => (
                        <tr
                          key={r.lead.id}
                          className={
                            selected.has(r.lead.id)
                              ? 'bg-electric-500/[0.04]'
                              : 'transition-colors hover:bg-white/[0.02]'
                          }
                        >
                          <td className="py-3 pr-2 pl-4">
                            <Checkbox
                              aria-label={`Selecionar ${r.company.name}`}
                              checked={selected.has(r.lead.id)}
                              onChange={() => toggle(r.lead.id)}
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <CompanyAvatar name={r.company.name} className="size-8" />
                              <div className="min-w-0">
                                <Link
                                  to={ROUTES.company(r.company.id)}
                                  className="flex max-w-[280px] items-center gap-1.5 font-medium text-fg hover:text-electric-200"
                                >
                                  <span className="truncate">{r.company.name}</span>
                                  {r.favorite && (
                                    <Star
                                      className="size-3 shrink-0 fill-amber-300 text-amber-300"
                                      aria-label="Favorito"
                                    />
                                  )}
                                </Link>
                                <span className="flex items-center gap-1.5 text-[12px] text-fg-subtle">
                                  {r.company.category} · {locationLabel(r.company)} <SourceBadge company={r.company} />
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <LeadStatusMenu leadId={r.lead.id} status={r.lead.status} />
                          </td>
                          <td className="px-3 py-3">
                            <Link
                              to={ROUTES.company(r.company.id)}
                              className="flex items-center gap-1.5 text-fg-muted hover:text-fg"
                            >
                              <NotebookPen className="size-3.5 text-fg-subtle" />
                              {r.notes}
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-fg-muted">{formatDate(r.lead.createdAt)}</td>
                          <td className="px-3 py-3 text-right">
                            <Menu
                              trigger={(props) => (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Ações de ${r.company.name}`}
                                  {...props}
                                >
                                  <Ellipsis />
                                </Button>
                              )}
                              items={rowMenu(r)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Lista (celular) */}
              <ul className="mt-4 flex flex-col gap-2 md:hidden">
                {visible.map((r) => (
                  <li key={r.lead.id}>
                    <Card className="p-3.5">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          aria-label={`Selecionar ${r.company.name}`}
                          checked={selected.has(r.lead.id)}
                          onChange={() => toggle(r.lead.id)}
                          className="mt-2"
                        />
                        <div className="min-w-0 flex-1">
                          <Link
                            to={ROUTES.company(r.company.id)}
                            className="block truncate text-sm font-medium text-fg"
                          >
                            {r.company.name}
                          </Link>
                          <p className="truncate text-[12px] text-fg-subtle">
                            {r.company.category} · {formatDate(r.lead.createdAt)}
                          </p>
                          <div className="mt-2.5 flex items-center gap-3">
                            <LeadStatusMenu leadId={r.lead.id} status={r.lead.status} />
                            <span className="flex items-center gap-1 text-[12px] text-fg-subtle">
                              <NotebookPen className="size-3" />
                              {r.notes}
                            </span>
                            {r.favorite && (
                              <Star className="size-3.5 fill-amber-300 text-amber-300" aria-label="Favorito" />
                            )}
                          </div>
                        </div>
                        <Menu
                          trigger={(props) => (
                            <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${r.company.name}`} {...props}>
                              <Ellipsis />
                            </Button>
                          )}
                          items={rowMenu(r)}
                        />
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!toRemove}
        onClose={() => setToRemove(null)}
        onConfirm={confirmRemove}
        loading={removing}
        destructive
        title={toRemove && toRemove.length > 1 ? `Remover ${toRemove.length} leads?` : 'Remover lead?'}
        description="Os leads selecionados e seus status serão removidos. As anotações e os favoritos continuam salvos."
        confirmLabel="Remover"
      />
    </>
  )
}
