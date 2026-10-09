import {
  ArrowRight,
  Building2,
  CircleAlert,
  Coins,
  Globe,
  LayoutGrid,
  ListFilter,
  MapPin,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  ScanSearch,
  Search,
  Star,
  TableProperties,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { CompanyAvatar, FavoriteButton, SaveLeadButton, SourceBadge, WebsiteButton } from '@/components/app/company'
import { locationLabel } from '@/lib/company'
import { DemoNotice } from '@/components/app/notices'
import { PageHeader } from '@/components/app/PageHeader'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Card, EmptyState, Segmented, Skeleton } from '@/components/ui/display'
import { Checkbox, Field, Input, Select } from '@/components/ui/Field'
import { MAX_RESULTS_PER_SEARCH } from '@/config/app'
import { ROUTES } from '@/config/routes'
import { usePlan } from '@/hooks/usePlan'
import { cn } from '@/lib/cn'
import { AppError, errorMessage } from '@/lib/errors'
import { storage } from '@/lib/storage'
import { toast } from '@/lib/toast'
import { formatRating, normalize, plural } from '@/lib/utils'
import { companyService } from '@/services/companies'
import { useData } from '@/stores/data'
import type { Company, SearchFilters } from '@/types'

const SUGGESTIONS = [
  'Barbearias',
  'Clínicas odontológicas',
  'Restaurantes',
  'Academias',
  'Pet shops',
  'Escritórios de advocacia',
]

const DEFAULT_FILTERS: SearchFilters = { onlyWithoutWebsite: false, onlyWithPhone: false, minRating: 0 }

type Sort = 'relevance' | 'rating' | 'name'
type View = 'cards' | 'table'

const LOADING_STEPS = [
  'Consultando a fonte de dados',
  'Organizando as empresas encontradas',
  'Preparando os resultados',
]

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const current = useData((s) => s.currentSearch)
  const companiesById = useData((s) => s.companies)
  const { tokens } = usePlan()

  const [segment, setSegment] = useState(params.get('segmento') ?? current?.query.segment ?? '')
  const [region, setRegion] = useState(params.get('regiao') ?? current?.query.region ?? '')
  const [filters, setFilters] = useState<SearchFilters>(current?.query.filters ?? DEFAULT_FILTERS)
  const [errors, setErrors] = useState<{ segment?: string; region?: string }>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string>()
  const [loadingMore, setLoadingMore] = useState(false)
  const [noTokens, setNoTokens] = useState(false)
  const [step, setStep] = useState(0)

  const [sort, setSort] = useState<Sort>('relevance')
  const [view, setView] = useState<View>(() => storage.get<View>('search-view', 'cards'))
  const [quickFilter, setQuickFilter] = useState('')
  const [quantity, setQuantity] = useState(() => storage.get<number>('search-quantity', 10))

  // Quantidade efetiva: nunca maior que o saldo do dia nem que o limite da fonte por busca.
  const maxQuantity = Math.min(tokens.balance, MAX_RESULTS_PER_SEARCH)
  const effectiveQuantity = Math.max(0, Math.min(quantity, maxQuantity))
  const changeQuantity = (value: number) => {
    const next = Math.max(1, Math.min(MAX_RESULTS_PER_SEARCH, Math.round(value) || 1))
    setQuantity(next)
    storage.set('search-quantity', next)
  }

  useEffect(() => storage.set('search-view', view), [view])

  // Avança as etapas do indicador de progresso durante o carregamento.
  useEffect(() => {
    if (status !== 'loading') return
    const t1 = setTimeout(() => setStep(1), 350)
    const t2 = setTimeout(() => setStep(2), 700)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [status])

  const results = useMemo(() => {
    if (!current) return []
    const q = normalize(quickFilter)
    const list = current.companyIds
      .map((id) => companiesById[id])
      .filter((c): c is Company => !!c)
      .filter(
        (c) =>
          (!filters.onlyWithoutWebsite || !c.website) &&
          (!filters.onlyWithPhone || !!c.phone) &&
          (filters.minRating === 0 || (c.rating ?? 0) >= filters.minRating) &&
          (!q || normalize(`${c.name} ${c.address}`).includes(q)),
      )
    if (sort === 'rating') return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    return list
  }, [current, companiesById, filters, quickFilter, sort])

  const runSearch = async (e?: FormEvent) => {
    e?.preventDefault()
    const next = {
      segment: segment.trim() ? undefined : 'Informe o segmento ou tipo de empresa.',
      region: region.trim() ? undefined : 'Informe a cidade, o estado ou a região.',
    }
    setErrors(next)
    if (next.segment || next.region) return
    if (tokens.balance < companyService.tokensPerCompany) {
      setNoTokens(true)
      return
    }
    setStep(0)
    setStatus('loading')
    setError(undefined)
    setQuickFilter('')
    try {
      await companyService.search({ segment, region, filters }, effectiveQuantity)
      setParams({ segmento: segment.trim(), regiao: region.trim() }, { replace: true })
      setStatus('idle')
    } catch (err) {
      if (err instanceof AppError && err.code === 'insufficient_tokens') {
        setNoTokens(true)
        setStatus('idle')
        return
      }
      setError(errorMessage(err))
      setStatus('error')
    }
  }

  const loadMore = async () => {
    if (tokens.balance < companyService.tokensPerCompany) {
      setNoTokens(true)
      return
    }
    setLoadingMore(true)
    try {
      await companyService.loadMore(effectiveQuantity)
    } catch (err) {
      if (err instanceof AppError && err.code === 'insufficient_tokens') setNoTokens(true)
      else toast.error('Não foi possível carregar mais empresas', errorMessage(err))
    } finally {
      setLoadingMore(false)
    }
  }

  const activeFilterCount =
    Number(filters.onlyWithoutWebsite) + Number(filters.onlyWithPhone) + Number(filters.minRating > 0)

  return (
    <>
      <PageHeader
        title="Buscar empresas"
        description="Encontre empresas por segmento e região e salve as melhores oportunidades."
      />

      <Card className="p-4 sm:p-5">
        <form onSubmit={runSearch} noValidate>
          <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_150px_auto] md:items-start">
            <Field label="Segmento ou tipo de empresa" error={errors.segment}>
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  icon={<Building2 />}
                  placeholder="Ex.: barbearias, clínicas, restaurantes"
                  value={segment}
                  onChange={(e) => {
                    setSegment(e.target.value)
                    setErrors((er) => ({ ...er, segment: undefined }))
                  }}
                  error={errors.segment}
                />
              )}
            </Field>
            <Field label="Cidade, estado ou região" error={errors.region}>
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  icon={<MapPin />}
                  placeholder="Ex.: Curitiba, PR"
                  value={region}
                  onChange={(e) => {
                    setRegion(e.target.value)
                    setErrors((er) => ({ ...er, region: undefined }))
                  }}
                  error={errors.region}
                />
              )}
            </Field>
            <Field label="Quantidade" hint={tokens.balance > 0 ? `Máximo hoje: ${maxQuantity}` : 'Sem tokens hoje'}>
              {({ id, describedBy }) => (
                <QuantityInput
                  id={id}
                  describedBy={describedBy}
                  value={effectiveQuantity}
                  max={maxQuantity}
                  onChange={changeQuantity}
                />
              )}
            </Field>
            <div className="flex flex-col gap-1.5">
              <span className="hidden text-[13px] md:block">&nbsp;</span>
              <Button type="submit" size="sm" className="h-10 px-5" loading={status === 'loading'}>
                {status !== 'loading' && <Search />}
                Buscar
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[12px] text-fg-subtle">Sugestões:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSegment(s)}
                className={cn(
                  'rounded-md border px-2 py-0.5 text-[12px] transition-colors',
                  segment === s
                    ? 'border-electric-400/50 bg-electric-500/10 text-fg'
                    : 'border-line text-fg-muted hover:border-line-strong hover:text-fg',
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-4 border-t border-line pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-fg-muted">
                <ListFilter className="size-3.5" />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="rounded bg-electric-500/15 px-1 font-mono text-[10px] text-electric-300">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <Checkbox
                label="Somente sem site"
                checked={filters.onlyWithoutWebsite}
                onChange={(e) => setFilters((f) => ({ ...f, onlyWithoutWebsite: e.target.checked }))}
              />
              <Checkbox
                label="Com telefone"
                checked={filters.onlyWithPhone}
                onChange={(e) => setFilters((f) => ({ ...f, onlyWithPhone: e.target.checked }))}
              />
              <label className="flex items-center gap-2 text-sm text-fg-muted">
                Avaliação mínima
                <Select
                  aria-label="Avaliação mínima"
                  value={filters.minRating}
                  onChange={(e) => setFilters((f) => ({ ...f, minRating: Number(e.target.value) }))}
                  className="h-8 w-28 text-[13px]"
                >
                  <option value={0}>Qualquer</option>
                  <option value={3.5}>3,5+</option>
                  <option value={4}>4,0+</option>
                  <option value={4.5}>4,5+</option>
                </Select>
              </label>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="text-[12px] text-fg-subtle hover:text-fg"
                >
                  Limpar filtros
                </button>
              )}
            </div>
            <p
              className={cn(
                'flex items-center gap-1.5 text-[12px]',
                tokens.balance === 0 ? 'text-red-300' : 'text-fg-subtle',
              )}
            >
              <Coins className="size-3.5 text-electric-300" />
              <span>
                Esta busca vai consumir até{' '}
                <span className="font-medium text-fg">
                  {effectiveQuantity} {effectiveQuantity === 1 ? 'token' : 'tokens'}
                </span>{' '}
                (1 por empresa) · saldo hoje <span className="font-mono text-fg tabular-nums">{tokens.balance}</span> ·
                renova à meia-noite
              </span>
            </p>
          </div>
        </form>
      </Card>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {status === 'loading' ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoadingState step={step} />
            </motion.div>
          ) : status === 'error' ? (
            <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="flex flex-col items-center px-6 py-12 text-center">
                <span className="flex size-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  <CircleAlert className="size-5" />
                </span>
                <h2 className="mt-4 text-[15px] font-semibold text-fg">A busca não pôde ser concluída</h2>
                <p className="mt-1.5 max-w-md text-sm text-fg-muted">{error}</p>
                <p className="mt-1 text-[12px] text-fg-subtle">Nenhum token foi consumido.</p>
                <Button variant="secondary" size="sm" className="mt-6" onClick={() => runSearch()}>
                  <RotateCcw />
                  Tentar novamente
                </Button>
              </Card>
            </motion.div>
          ) : !current ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <EmptyState
                  icon={<ScanSearch />}
                  title="Comece uma busca"
                  description="Informe um segmento e uma região. Segmentos de comércio e serviços locais costumam ter muitas empresas sem site."
                />
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key={current.recordId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight text-fg">
                    {plural(current.total, 'empresa encontrada', 'empresas encontradas')}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-fg-subtle">
                    "{current.query.segment}" em {current.query.region} · exibindo {results.length} de{' '}
                    {current.companyIds.length} carregadas
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    aria-label="Filtrar resultados carregados"
                    placeholder="Filtrar resultados"
                    icon={<Search />}
                    value={quickFilter}
                    onChange={(e) => setQuickFilter(e.target.value)}
                    className="h-8 w-44 text-[13px]"
                  />
                  <Select
                    aria-label="Ordenar"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    className="h-8 w-40 text-[13px]"
                  >
                    <option value="relevance">Relevância</option>
                    <option value="rating">Melhor avaliação</option>
                    <option value="name">Nome (A–Z)</option>
                  </Select>
                  <Segmented
                    label="Visualização"
                    value={view}
                    onChange={setView}
                    options={[
                      { value: 'cards', label: <LayoutGrid aria-label="Cards" /> },
                      { value: 'table', label: <TableProperties aria-label="Tabela" /> },
                    ]}
                  />
                </div>
              </div>

              {current.companyIds.some((id) => companiesById[id]?.source === 'demo') && (
                <DemoNotice className="mt-4">
                  <strong className="font-medium text-amber-100">Resultados de demonstração.</strong> Estas empresas são
                  fictícias, geradas localmente para testar a interface. A busca real será feita pela integração com a
                  API de empresas.
                </DemoNotice>
              )}

              {results.length === 0 ? (
                <Card className="mt-4">
                  <EmptyState
                    icon={<ListFilter />}
                    title="Nenhuma empresa corresponde aos filtros"
                    description="Ajuste os filtros ou o texto de busca para ver mais resultados."
                    action={
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => {
                          setFilters(DEFAULT_FILTERS)
                          setQuickFilter('')
                        }}
                      >
                        <X />
                        Limpar filtros
                      </Button>
                    }
                  />
                </Card>
              ) : view === 'cards' ? (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map((c, i) => (
                    <motion.li
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i % 12, 8) * 0.03, duration: 0.3 }}
                    >
                      <CompanyCard company={c} />
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <CompanyTable companies={results} />
              )}

              <div className="mt-6 flex flex-col items-center gap-2">
                {current.hasMore || (current.pendingIds ?? []).length > 0 ? (
                  <>
                    {tokens.balance === 0 && (
                      <p className="text-center text-[13px] text-fg-muted">
                        Seus tokens de hoje acabaram. Ainda há empresas nesta busca — volte amanhã ou{' '}
                        <Link to={ROUTES.plans} className="text-electric-300 hover:text-electric-200">
                          faça upgrade
                        </Link>
                        .
                      </p>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={loadMore}
                      loading={loadingMore}
                      disabled={tokens.balance === 0}
                    >
                      {effectiveQuantity > 0
                        ? `Carregar mais ${effectiveQuantity} ${effectiveQuantity === 1 ? 'empresa' : 'empresas'}`
                        : 'Carregar mais empresas'}
                    </Button>
                    <p className="text-[12px] text-fg-subtle">
                      Cada empresa exibida consome 1 token · saldo hoje {tokens.balance}
                    </p>
                  </>
                ) : (
                  <p className="text-[12px] text-fg-subtle">Todos os resultados desta busca foram carregados.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={noTokens}
        onClose={() => setNoTokens(false)}
        onConfirm={() => {
          setNoTokens(false)
          navigate(ROUTES.plans)
        }}
        title="Seus tokens de hoje acabaram"
        description="Cada empresa exibida consome 1 token, e os tokens renovam à meia-noite. Faça upgrade para ver mais empresas por dia."
        confirmLabel="Ver planos"
      />
    </>
  )
}

function LoadingState({ step }: { step: number }) {
  return (
    <div aria-live="polite" aria-busy="true">
      <Card className="p-5">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-medium text-fg">{LOADING_STEPS[step]}…</span>
          <span className="font-mono text-fg-subtle tabular-nums">
            {Math.round(((step + 1) / LOADING_STEPS.length) * 100)}%
          </span>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-electric-600 to-electric-400"
            initial={{ width: '8%' }}
            animate={{ width: `${((step + 1) / LOADING_STEPS.length) * 92}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <ol className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
          {LOADING_STEPS.map((s, i) => (
            <li
              key={s}
              className={cn('text-[12px] transition-colors', i <= step ? 'text-fg-muted' : 'text-fg-subtle/60')}
            >
              {i + 1}. {s}
            </li>
          ))}
        </ol>
      </Card>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="p-4">
            <div className="flex gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-8" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CompanyCard({ company: c }: { company: Company }) {
  return (
    <Card className="group flex h-full flex-col p-4 transition-colors hover:border-line-strong">
      <div className="flex items-start gap-3">
        <CompanyAvatar name={c.name} />
        <div className="min-w-0 flex-1">
          <Link
            to={ROUTES.company(c.id)}
            className="block truncate text-sm font-medium text-fg hover:text-electric-200"
          >
            {c.name}
          </Link>
          <p className="mt-0.5 truncate text-[12px] text-fg-subtle">{c.category}</p>
        </div>
        <SourceBadge company={c} />
      </div>
      <dl className="mt-4 space-y-1.5 text-[12px]">
        <div className="flex items-center gap-2 text-fg-muted">
          <MapPin className="size-3.5 shrink-0 text-fg-subtle" />
          <dt className="sr-only">Localização</dt>
          <dd className="truncate">{locationLabel(c)}</dd>
        </div>
        <div className="flex items-center gap-2 text-fg-muted">
          <Phone className="size-3.5 shrink-0 text-fg-subtle" />
          <dt className="sr-only">Telefone</dt>
          <dd className={cn(!c.phone && 'text-fg-subtle')}>{c.phone ?? 'Telefone não informado'}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="size-3.5 shrink-0 text-fg-subtle" />
          <dt className="sr-only">Site</dt>
          <dd>
            {c.website ? (
              <span className="text-fg-muted">Possui site</span>
            ) : (
              <span className="font-medium text-electric-300">Sem site informado</span>
            )}
          </dd>
        </div>
        <div className="flex items-center gap-2 text-fg-muted">
          <Star className="size-3.5 shrink-0 text-fg-subtle" />
          <dt className="sr-only">Avaliação</dt>
          <dd>
            {c.rating !== undefined ? (
              <>
                {formatRating(c.rating)} <span className="text-fg-subtle">({c.reviewCount} avaliações)</span>
              </>
            ) : (
              <span className="text-fg-subtle">Sem avaliação na fonte</span>
            )}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex items-center gap-1 border-t border-line pt-3">
        <SaveLeadButton companyId={c.id} />
        <FavoriteButton companyId={c.id} />
        <WebsiteButton company={c} />
        <ButtonLink to={ROUTES.company(c.id)} variant="ghost" size="xs" className="ml-auto">
          Detalhes
          <ArrowRight />
        </ButtonLink>
      </div>
    </Card>
  )
}

function CompanyTable({ companies }: { companies: Company[] }) {
  return (
    <Card className="mt-4 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-[13px]">
          <thead className="border-b border-line bg-white/[0.015] text-[11px] tracking-wide text-fg-subtle uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Empresa
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Localização
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Telefone
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Site
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Avaliação
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {companies.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CompanyAvatar name={c.name} className="size-8" />
                    <div className="min-w-0">
                      <Link
                        to={ROUTES.company(c.id)}
                        className="block max-w-[220px] truncate font-medium text-fg hover:text-electric-200"
                      >
                        {c.name}
                      </Link>
                      <span className="flex items-center gap-1.5 text-[12px] text-fg-subtle">
                        {c.category} <SourceBadge company={c} />
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-fg-muted">{locationLabel(c)}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-fg-muted">
                  {c.phone ?? <span className="font-sans text-fg-subtle">—</span>}
                </td>
                <td className="px-4 py-3">
                  {c.website ? (
                    <span className="text-fg-muted">Possui</span>
                  ) : (
                    <span className="font-medium text-electric-300">Sem site</span>
                  )}
                </td>
                <td className="px-4 py-3 text-fg-muted">
                  {c.rating !== undefined ? (
                    <span className="flex items-center gap-1">
                      <Star className="size-3 fill-current text-amber-300" />
                      {formatRating(c.rating)}
                    </span>
                  ) : (
                    <span className="text-fg-subtle">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <SaveLeadButton companyId={c.id} size="icon-sm" />
                    <FavoriteButton companyId={c.id} />
                    <WebsiteButton company={c} />
                    <ButtonLink
                      to={ROUTES.company(c.id)}
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Detalhes de ${c.name}`}
                      title="Detalhes"
                    >
                      <ArrowRight />
                    </ButtonLink>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function QuantityInput({
  id,
  describedBy,
  value,
  max,
  onChange,
}: {
  id: string
  describedBy?: string
  value: number
  max: number
  onChange: (value: number) => void
}) {
  const disabled = max < 1
  return (
    <div className="flex h-10 items-stretch overflow-hidden rounded-lg border border-line-strong bg-ink-950/60 focus-within:border-electric-400/70 focus-within:ring-3 focus-within:ring-electric-500/15">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Diminuir quantidade"
        className="flex w-9 items-center justify-center text-fg-muted transition-colors hover:bg-white/5 hover:text-fg disabled:opacity-30"
      >
        <Minus className="size-3.5" />
      </button>
      <input
        id={id}
        aria-describedby={describedBy}
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full min-w-0 [appearance:textfield] bg-transparent text-center font-mono text-sm text-fg tabular-nums outline-none disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Aumentar quantidade"
        className="flex w-9 items-center justify-center text-fg-muted transition-colors hover:bg-white/5 hover:text-fg disabled:opacity-30"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}
