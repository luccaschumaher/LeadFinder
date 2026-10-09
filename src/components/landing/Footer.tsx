import { Link } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { Container } from '@/components/ui/primitives'
import { FOOTER_GROUPS } from '@/config/navigation'
import { ROUTES } from '@/config/routes'

const YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink-950">
      <Container className="py-14 sm:py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Link to={ROUTES.home} aria-label="LeadFinder, página inicial" className="inline-flex rounded-lg">
              <Logo />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-fg-subtle">
              Prospecção de empresas e abordagens com inteligência artificial para quem vende sites.
            </p>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="text-sm font-medium text-fg">{group.title}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-fg-subtle transition-colors hover:text-fg">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-8 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {YEAR} LeadFinder. Todos os direitos reservados.</p>
          <p className="font-mono tracking-wide">Feito para quem vende sites.</p>
        </div>
      </Container>
    </footer>
  )
}
