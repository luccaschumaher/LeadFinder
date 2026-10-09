import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/primitives'
import { ROUTES } from '@/config/routes'

interface UpcomingPageProps {
  title: string
  description: string
  eyebrow?: string
}

/**
 * Página provisória para rotas que serão implementadas nas próximas etapas
 * (autenticação, páginas legais, contato). Não simula nenhuma funcionalidade.
 */
export function UpcomingPage({ title, description, eyebrow = 'Em construção' }: UpcomingPageProps) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)]" />
        <div className="absolute top-1/3 left-1/2 h-80 w-[600px] -translate-x-1/2 rounded-full bg-electric-500/15 blur-[120px]" />
      </div>

      <header className="relative px-4 py-6 sm:px-8">
        <Link to={ROUTES.home} aria-label="LeadFinder, página inicial" className="inline-flex rounded-lg">
          <Logo />
        </Link>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 pb-24">
        <div className="flex max-w-md flex-col items-center text-center">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="text-gradient mt-5 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 leading-relaxed text-pretty text-fg-muted">{description}</p>
          <ButtonLink to={ROUTES.home} variant="secondary" className="mt-9">
            <ArrowLeft className="size-4" />
            Voltar para o início
          </ButtonLink>
        </div>
      </main>
    </div>
  )
}
