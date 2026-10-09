import { ArrowLeft, BookmarkCheck, ScanSearch, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Logo, LogoMark } from '@/components/brand/Logo'
import { ROUTES } from '@/config/routes'

interface AuthLayoutProps {
  title: string
  description: ReactNode
  children: ReactNode
  footer?: ReactNode
}

const POINTS = [
  {
    icon: ScanSearch,
    title: 'Encontre empresas',
    text: 'Pesquise por segmento e cidade e identifique quem ainda precisa de um site.',
  },
  {
    icon: Sparkles,
    title: 'Aborde com contexto',
    text: 'Use prompts e IA para escrever mensagens que falam com cada negócio.',
  },
  {
    icon: BookmarkCheck,
    title: 'Acompanhe cada lead',
    text: 'Organize status, anotações e favoritos até fechar a venda.',
  },
]

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="relative flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to={ROUTES.home} aria-label="LeadFinder, página inicial" className="rounded-lg">
            <Logo />
          </Link>
          <Link
            to={ROUTES.home}
            className="flex items-center gap-1.5 text-[13px] text-fg-subtle transition-colors hover:text-fg"
          >
            <ArrowLeft className="size-3.5" />
            Voltar ao site
          </Link>
        </div>

        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[400px]">
            <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.03em] text-fg">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{description}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-center text-sm text-fg-muted">{footer}</div>}
          </div>
        </main>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-line bg-ink-900 lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div
          aria-hidden
          className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_60%_40%,black,transparent)]"
        />
        <div
          aria-hidden
          className="absolute -top-32 right-0 h-96 w-[520px] rounded-full bg-electric-500/15 blur-[110px]"
        />
        <div className="relative max-w-md">
          <LogoMark className="size-12" />
          <p className="mt-8 text-[28px] leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-fg">
            Da empresa certa à proposta certa.
          </p>
          <ul className="mt-10 space-y-6">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-ink-800 text-electric-300">
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-sm font-medium text-fg">{title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
