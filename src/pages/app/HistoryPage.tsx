import { Coins, History, MapPin, RotateCcw, ScanSearch, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { PageHeader } from '@/components/app/PageHeader'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Badge, Card, EmptyState } from '@/components/ui/display'
import { Input } from '@/components/ui/Field'
import { ROUTES } from '@/config/routes'
import { toast } from '@/lib/toast'
import { formatDateTime, normalize, plural } from '@/lib/utils'
import { historyService } from '@/services/leads'
import { useData } from '@/stores/data'
import type { SearchRecord } from '@/types'

function filterSummary(r: SearchRecord) {
  const parts: string[] = []
  if (r.filters.onlyWithoutWebsite) parts.push('sem site')
  if (r.filters.onlyWithPhone) parts.push('com telefone')
  if (r.filters.minRating) parts.push(`nota ${r.filters.minRating.toLocaleString('pt-BR')}+`)
  return parts
}

export function HistoryPage() {
  const navigate = useNavigate()
  const history = useData((s) => s.history)
  const [query, setQuery] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  const visible = useMemo(() => {
    const q = normalize(query)
    return q ? history.filter((h) => normalize(`${h.segment} ${h.region}`).includes(q)) : history
  }, [history, query])

  const totals = useMemo(
    () => ({
      results: history.reduce((s, h) => s + h.resultCount, 0),
      tokens: history.reduce((s, h) => s + h.tokensUsed, 0),
    }),
    [history],
  )

  const repeat = (r: SearchRecord) =>
    navigate(`${ROUTES.search}?segmento=${encodeURIComponent(r.segment)}&regiao=${encodeURIComponent(r.region)}`)

  const clear = async () => {
    setClearing(true)
    await historyService.clear()
    setClearing(false)
    setConfirmClear(false)
    toast.success('Histórico limpo')
  }

  return (
    <>
      <PageHeader
        title="Histórico"
        description="Todas as buscas que você fez. Repita uma pesquisa com um clique."
        actions={
          history.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setConfirmClear(true)}>
              <Trash2 />
              Limpar histórico
            </Button>
          )
        }
      />

      {history.length === 0 ? (
        <Card>
          <EmptyState
            icon={<History />}
            title="Nenhuma busca registrada"
            description="Cada busca de empresas fica registrada aqui com a região, a quantidade de resultados e os tokens consumidos."
            action={
              <ButtonLink to={ROUTES.search} size="xs">
                <ScanSearch />
                Fazer uma busca
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Buscas', value: history.length },
              { label: 'Resultados', value: totals.results },
              { label: 'Tokens usados', value: totals.tokens },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <p className="text-[12px] text-fg-subtle">{s.label}</p>
                <p className="mt-1 font-mono text-xl text-fg tabular-nums">{s.value.toLocaleString('pt-BR')}</p>
              </Card>
            ))}
          </div>

          <Input
            aria-label="Buscar no histórico"
            placeholder="Buscar por termo ou região"
            icon={<Search />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-4 h-9 sm:max-w-xs"
          />

          <Card className="mt-3 overflow-hidden">
            {visible.length === 0 ? (
              <EmptyState
                icon={<Search />}
                title="Nada encontrado"
                description="Nenhuma busca corresponde ao termo informado."
              />
            ) : (
              <ul className="divide-y divide-line">
                {visible.map((r) => (
                  <li key={r.id} className="group flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-ink-850 text-fg-subtle">
                        <ScanSearch className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
                          {r.segment}
                          {r.source === 'demo' && <Badge tone="amber">Demo</Badge>}
                          {filterSummary(r).map((f) => (
                            <Badge key={f}>{f}</Badge>
                          ))}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12px] text-fg-subtle">
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {r.region}
                          </span>
                          <span>{formatDateTime(r.createdAt)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pl-11 sm:pl-0">
                      <span className="text-[12px] text-fg-muted">
                        {plural(r.resultCount, 'resultado', 'resultados')}
                      </span>
                      <span
                        className="flex items-center gap-1 font-mono text-[12px] text-fg-muted"
                        title="Tokens consumidos"
                      >
                        <Coins className="size-3.5 text-electric-300" />
                        {r.tokensUsed}
                      </span>
                      <div className="ml-auto flex items-center gap-1">
                        <Button variant="secondary" size="xs" onClick={() => repeat(r)}>
                          <RotateCcw />
                          Repetir
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remover do histórico"
                          onClick={async () => {
                            await historyService.remove(r.id)
                            toast.success('Busca removida do histórico')
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <p className="mt-3 text-[12px] text-fg-subtle">
            Repetir uma busca abre o formulário preenchido. Cada empresa exibida consome 1 token.
          </p>
        </>
      )}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clear}
        loading={clearing}
        destructive
        title="Limpar todo o histórico?"
        description={`${plural(history.length, 'busca será removida', 'buscas serão removidas')} permanentemente. Leads e favoritos não são afetados.`}
        confirmLabel="Limpar histórico"
      />
    </>
  )
}
