import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { Eyebrow } from '@/components/ui/primitives'
import { ROUTES } from '@/config/routes'

interface LegalLayoutProps {
  eyebrow: string
  title: string
  intro?: ReactNode
  updatedAt?: string
  children: ReactNode
}

/** Página de texto institucional (Termos, Privacidade, Contato). */
export function LegalLayout({ eyebrow, title, intro, updatedAt, children }: LegalLayoutProps) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-96">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute top-0 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-electric-500/12 blur-[120px]" />
      </div>
      <header className="relative flex items-center justify-between px-4 py-6 sm:px-8">
        <Link to={ROUTES.home} aria-label="LeadFinder, página inicial" className="inline-flex rounded-lg">
          <Logo />
        </Link>
        <Link
          to={ROUTES.home}
          className="inline-flex items-center gap-1.5 text-[13px] text-fg-subtle transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-3.5" />
          Voltar ao site
        </Link>
      </header>
      <main className="relative mx-auto max-w-3xl px-4 pt-8 pb-24 sm:px-8">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="text-gradient mt-5 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
          {title}
        </h1>
        {updatedAt && <p className="mt-3 text-[13px] text-fg-subtle">Última atualização: {updatedAt}</p>}
        {intro && <div className="mt-6 leading-relaxed text-pretty text-fg-muted">{intro}</div>}
        <div className="mt-10 space-y-10">{children}</div>
      </main>
    </div>
  )
}

/** Seção numerada de um documento legal. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-fg">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-pretty text-fg-muted [&_a]:text-electric-300 [&_a:hover]:underline [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-fg [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  )
}
