import { ChevronsUpDown, Coins, Gem, LogOut, Menu as MenuIcon, Settings, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { PlanBadge } from '@/components/brand/PlanBadge'
import { ProfileAvatar } from '@/components/mascots/Mascot'
import { Badge, ProgressBar, Skeleton } from '@/components/ui/display'
import { Menu } from '@/components/ui/Menu'
import { DEMO_SEARCH } from '@/config/app'
import { APP_NAV } from '@/config/navigation'
import { FEATURE_PLAN, getPlan } from '@/config/plans'
import { ROUTES } from '@/config/routes'
import { usePlan } from '@/hooks/usePlan'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/utils'
import { authService } from '@/services/auth'
import { useCurrentUser } from '@/stores/session'

/** Estrutura do app autenticado: sidebar fixa no desktop e gaveta no celular. */
export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { pathname } = useLocation()

  // Fecha a gaveta ao navegar (ajuste de estado durante a renderização, sem efeito).
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setDrawerOpen(false)
  }

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [drawerOpen])

  return (
    <div className="min-h-dvh bg-ink-950">
      <a
        href="#app-main"
        className="fixed top-3 left-3 z-[60] -translate-y-20 rounded-lg bg-electric-500 px-4 py-2 text-sm font-medium text-white transition-transform focus:translate-y-0"
      >
        Pular para o conteúdo
      </a>

      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-ink-900/70 lg:block">
        <SidebarContent />
      </aside>

      {/* Topbar móvel */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-ink-950/95 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={drawerOpen}
          className="-ml-2 flex size-9 items-center justify-center rounded-lg text-fg-muted hover:bg-overlay/5 hover:text-fg"
        >
          <MenuIcon className="size-5" />
        </button>
        <Link to={ROUTES.dashboard} aria-label="Visão geral">
          <Logo />
        </Link>
        <TokenChip />
      </header>

      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 w-[min(18rem,86vw)] border-r border-line bg-ink-900"
            >
              <SidebarContent onClose={() => setDrawerOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <main id="app-main" className="mx-auto w-full max-w-[1240px] px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-9">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { can } = usePlan()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2 px-5">
        <Link to={ROUTES.dashboard} aria-label="Visão geral" className="rounded-lg">
          <Logo />
        </Link>
        {DEMO_SEARCH && (
          <Badge tone="amber" className="ml-auto">
            Demo
          </Badge>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="-mr-2 ml-1 rounded-lg p-1.5 text-fg-subtle hover:bg-overlay/5 hover:text-fg"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <nav aria-label="Navegação do app" className="flex-1 overflow-y-auto px-3 pb-4">
        {APP_NAV.map((group) => (
          <div key={group.title} className="mt-4 first:mt-1">
            <p className="px-2.5 pb-1.5 font-mono text-[10px] tracking-[0.16em] text-fg-subtle uppercase">
              {group.title}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const locked = item.feature ? !can(item.feature) : false
                const Icon = item.icon
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] transition-colors',
                          isActive
                            ? 'bg-overlay/[0.07] text-fg'
                            : 'text-fg-muted hover:bg-overlay/[0.04] hover:text-fg',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active"
                              className="absolute inset-y-2 -left-3 w-0.5 rounded-r bg-electric-400"
                              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            />
                          )}
                          <Icon
                            className={cn(
                              'size-4 shrink-0',
                              isActive ? 'text-electric-300' : 'text-fg-subtle group-hover:text-fg-muted',
                            )}
                            strokeWidth={1.75}
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {locked && item.feature && (
                            <span
                              className="flex shrink-0 items-center opacity-80 transition-opacity group-hover:opacity-100"
                              title={`Disponível a partir do plano ${getPlan(FEATURE_PLAN[item.feature]).name}`}
                            >
                              <PlanBadge plan={FEATURE_PLAN[item.feature]} size={18} />
                              <span className="sr-only">
                                Disponível a partir do plano {getPlan(FEATURE_PLAN[item.feature]).name}
                              </span>
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-3 border-t border-line p-3">
        <TokenMeter />
        <UserMenu />
      </div>
    </div>
  )
}

function TokenMeter() {
  const { plan, tokens } = usePlan()
  const low = tokens.balance <= Math.ceil(tokens.total * 0.2)
  return (
    <Link
      to={ROUTES.plans}
      className="block rounded-xl border border-line bg-overlay/[0.02] p-3 transition-colors hover:border-line-strong"
    >
      <div className="flex items-center justify-between text-[12px]">
        <span className="flex items-center gap-1.5 text-fg-muted">
          <Coins className="size-3.5 text-electric-300" />
          Tokens hoje
        </span>
        <span className="font-mono text-fg tabular-nums">
          {tokens.balance}
          <span className="text-fg-subtle">/{tokens.total}</span>
        </span>
      </div>
      <ProgressBar
        value={tokens.balance}
        max={tokens.total}
        tone={tokens.balance === 0 ? 'red' : low ? 'amber' : 'blue'}
        className="mt-2"
      />
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1 text-fg-subtle">
          <PlanBadge plan={plan.id} size={16} />
          Plano {plan.name}
        </span>
        {plan.id !== 'diamond' && <span className="text-electric-300">Fazer upgrade</span>}
      </div>
    </Link>
  )
}

function TokenChip() {
  const { tokens } = usePlan()
  return (
    <Link
      to={ROUTES.plans}
      aria-label={`${tokens.balance} tokens disponíveis`}
      className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 font-mono text-[12px] text-fg tabular-nums"
    >
      <Coins className="size-3.5 text-electric-300" />
      {tokens.balance}
    </Link>
  )
}

function UserMenu() {
  const user = useCurrentUser()
  const { plan } = usePlan()
  const navigate = useNavigate()

  return (
    <Menu
      align="start"
      side="top"
      className="w-full [&>[role=menu]]:w-full"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          className="flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-overlay/[0.04]"
        >
          <span className="relative shrink-0">
            <ProfileAvatar id={user.avatar} initials={initials(user.name)} size={34} />
            <PlanBadge
              plan={plan.id}
              size={15}
              className="absolute -right-1 -bottom-1 rounded-full ring-2 ring-ink-900"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-fg">{user.name}</span>
            <span className="block truncate text-[11px] text-fg-subtle">{user.email}</span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-fg-subtle" />
        </button>
      )}
      items={[
        { label: `Plano ${plan.name}`, icon: <Gem />, onSelect: () => navigate(ROUTES.plans) },
        { label: 'Configurações', icon: <Settings />, onSelect: () => navigate(ROUTES.settings) },
        'separator',
        {
          label: 'Sair da conta',
          icon: <LogOut />,
          danger: true,
          onSelect: async () => {
            await authService.signOut()
            navigate(ROUTES.signIn)
          },
        },
      ]}
    />
  )
}

function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando página">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-4 h-72 rounded-2xl" />
    </div>
  )
}
