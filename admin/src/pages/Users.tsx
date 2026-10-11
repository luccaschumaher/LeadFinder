import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card, CardTitle, PlanTag, Segmented, StatusTag, Td, Th } from '../components/ui'
import type { UserRow } from '../lib/api'
import { aiCostBrl, searchCostBrl, type CostSettings } from '../lib/costs'
import { date, int, money, relative, short } from '../lib/format'

type Filter = 'all' | 'paying' | 'free'
type Sort = 'recent' | 'cost' | 'active'

export function Users({ users, costs, days }: { users: UserRow[]; costs: CostSettings; days: number }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('recent')
  const [showInternal, setShowInternal] = useState(false)
  const [now] = useState(() => Date.now())
  const internalCount = users.filter((u) => u.internal).length

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = users
      .map((u) => ({
        ...u,
        cost: searchCostBrl(u.search_requests, costs) + aiCostBrl(u.input_tokens, u.output_tokens, costs),
        paying:
          (u.billing_status === 'active' || u.billing_status === 'canceled') &&
          !!u.expires_at &&
          new Date(u.expires_at).getTime() > now,
      }))
      .filter((u) => showInternal || !u.internal)
      .filter((u) => !q || u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q))
      .filter((u) => (filter === 'paying' ? u.paying : filter === 'free' ? u.plan === 'free' : true))
    if (sort === 'cost') list.sort((a, b) => b.cost - a.cost)
    if (sort === 'active') list.sort((a, b) => b.active_days - a.active_days)
    return list
  }, [users, costs, query, filter, sort, now, showInternal])

  return (
    <Card>
      <CardTitle
        title={`Usuários (${int(rows.length)})`}
        hint={`Consumo dos últimos ${days} dias. Custo = estimativa de busca + IA com os preços da aba APIs.`}
      />
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
        <label className="relative min-w-[200px] flex-1">
          <span className="sr-only">Buscar usuário</span>
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fg-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome ou e-mail"
            className="w-full rounded-lg border border-line-strong bg-ink-950 py-1.5 pr-3 pl-8 text-[13px] text-fg"
          />
        </label>
        <Segmented
          label="Filtro"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'paying', label: 'Pagantes' },
            { value: 'free', label: 'Free' },
          ]}
        />
        <Segmented
          label="Ordenar"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'recent', label: 'Mais novos' },
            { value: 'cost', label: 'Maior custo' },
            { value: 'active', label: 'Mais ativos' },
          ]}
        />
        {internalCount > 0 && (
          <label className="flex items-center gap-2 text-[12px] text-fg-muted">
            <input
              type="checkbox"
              checked={showInternal}
              onChange={(e) => setShowInternal(e.target.checked)}
              className="size-3.5 accent-[#2f6bff]"
            />
            Mostrar contas internas ({internalCount})
          </label>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-[13px]">
          <thead className="border-b border-line bg-white/[0.015] text-[11px] tracking-wide text-fg-subtle uppercase">
            <tr>
              <Th>Usuário</Th>
              <Th>Plano</Th>
              <Th>Assinatura</Th>
              <Th>Vence em</Th>
              <Th>Último acesso</Th>
              <Th right>Dias ativos</Th>
              <Th right>Empresas</Th>
              <Th right>Buscas</Th>
              <Th right>Prompts</Th>
              <Th right>Msgs LeadIA</Th>
              <Th right>Tokens IA</Th>
              <Th right>Custo</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02]">
                <Td>
                  <p className="flex items-center gap-1.5 font-medium text-fg">
                    {u.name}
                    {u.internal && (
                      <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-fg-muted">
                        interna
                      </span>
                    )}
                  </p>
                  <p className="text-[12px] text-fg-subtle">{u.email}</p>
                </Td>
                <Td>
                  <PlanTag plan={u.plan} />
                </Td>
                <Td>
                  <StatusTag status={u.billing_status} />
                </Td>
                <Td className="text-fg-muted">{date(u.expires_at)}</Td>
                <Td className="text-fg-muted">{relative(u.last_sign_in_at, now)}</Td>
                <Td right>{int(u.active_days)}</Td>
                <Td right>{int(u.companies)}</Td>
                <Td right>{int(u.searches)}</Td>
                <Td right>{int(u.site_generations)}</Td>
                <Td right>{int(u.wave_messages)}</Td>
                <Td right>{short(u.input_tokens + u.output_tokens)}</Td>
                <Td right className="font-medium text-fg">
                  {money(u.cost)}
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} className="px-5 py-10 text-center text-fg-subtle">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
