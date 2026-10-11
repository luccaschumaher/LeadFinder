import type { Session } from '@supabase/supabase-js'
import { BarChart3, CreditCard, Gauge, LogOut, RefreshCw, Users as UsersIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button, Segmented } from './components/ui'
import { cx } from './lib/cx'
import {
  fetchPayments,
  fetchSummary,
  fetchUsers,
  isAdmin,
  type PaymentEvent,
  type PaymentFailure,
  type Summary,
  type UserRow,
} from './lib/api'
import { useCostSettings } from './lib/costs'
import { supabase } from './lib/supabase'
import { Apis } from './pages/Apis'
import { Login } from './pages/Login'
import { Overview } from './pages/Overview'
import { Payments } from './pages/Payments'
import { Users } from './pages/Users'

type Tab = 'overview' | 'users' | 'payments' | 'apis'

const TABS: { id: Tab; label: string; icon: typeof Gauge }[] = [
  { id: 'overview', label: 'Visão geral', icon: Gauge },
  { id: 'users', label: 'Usuários', icon: UsersIcon },
  { id: 'payments', label: 'Pagamentos', icon: CreditCard },
  { id: 'apis', label: 'APIs e custos', icon: BarChart3 },
]

interface Data {
  summary: Summary
  users: UserRow[]
  payments: { events: PaymentEvent[]; failures: PaymentFailure[] }
}

export function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    isAdmin()
      .then(async (ok) => {
        if (cancelled) return
        if (!ok) {
          setNotice('Esta conta não tem acesso ao painel.')
          await supabase.auth.signOut()
        }
        setAllowed(ok)
      })
      .catch((e: Error) => !cancelled && setNotice(e.message))
    return () => {
      cancelled = true
    }
  }, [session])

  if (session === undefined) return <div className="min-h-dvh" aria-busy="true" />
  if (!session || allowed === false) return <Login notice={notice} />
  if (allowed === null) return <div className="min-h-dvh" aria-busy="true" />
  return <Dashboard email={session.user.email ?? ''} />
}

function Dashboard({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>('overview')
  const [days, setDays] = useState(30)
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [round, setRound] = useState(0)
  const [costs, setCosts] = useCostSettings()

  // Recarrega ao trocar o período ou ao clicar em Atualizar.
  useEffect(() => {
    let cancelled = false
    Promise.all([fetchSummary(days), fetchUsers(days), fetchPayments()])
      .then(([summary, users, payments]) => {
        if (cancelled) return
        setData({ summary, users, payments })
        setError(null)
      })
      .catch(
        (e: unknown) => !cancelled && setError(e instanceof Error ? e.message : 'Não foi possível carregar os dados.'),
      )
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [days, round])

  const reload = useCallback(() => {
    setLoading(true)
    setRound((r) => r + 1)
  }, [])
  const changeDays = (d: number) => {
    setLoading(true)
    setDays(d)
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-line bg-ink-950/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <p className="font-semibold">
            LeadFinder <span className="text-electric-300">Admin</span>
          </p>
          <nav
            className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:ml-6 sm:w-auto"
            aria-label="Seções"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={cx(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] whitespace-nowrap transition-colors',
                  tab === t.id ? 'bg-white/[0.07] text-fg' : 'text-fg-muted hover:text-fg',
                )}
              >
                <t.icon className="size-4" />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Segmented
              label="Período"
              value={days}
              onChange={changeDays}
              options={[
                { value: 7, label: '7 dias' },
                { value: 30, label: '30 dias' },
                { value: 90, label: '90 dias' },
              ]}
            />
            <Button variant="ghost" onClick={reload} disabled={loading} aria-label="Atualizar" title="Atualizar">
              <RefreshCw className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button
              variant="ghost"
              onClick={() => void supabase.auth.signOut()}
              title={`Sair (${email})`}
              aria-label="Sair"
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-red-400/30 bg-red-400/[0.07] px-4 py-3 text-[13px] text-red-200"
          >
            {error}
          </p>
        )}
        {!data ? (
          <div className="grid gap-3 sm:grid-cols-4" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
        ) : tab === 'overview' ? (
          <Overview summary={data.summary} costs={costs} />
        ) : tab === 'users' ? (
          <Users users={data.users} costs={costs} days={days} />
        ) : tab === 'payments' ? (
          <Payments events={data.payments.events} failures={data.payments.failures} />
        ) : (
          <Apis summary={data.summary} costs={costs} setCosts={setCosts} />
        )}
      </main>
    </div>
  )
}
