import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/primitives'
import { NAV_LINKS } from '@/config/navigation'
import { ROUTES } from '@/config/routes'
import { useScrolled } from '@/hooks/useScrolled'
import { cn } from '@/lib/cn'
import { useUser } from '@/stores/session'

export function Navbar() {
  const scrolled = useScrolled()
  const user = useUser()
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Fecha com Esc, trava a rolagem e devolve o foco ao botão ao fechar.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    const onResize = () => window.innerWidth >= 768 && setOpen(false)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  const elevated = scrolled || open

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          'border-b transition-[background-color,border-color,backdrop-filter] duration-300',
          elevated ? 'border-line bg-ink-950/75 backdrop-blur-xl backdrop-saturate-150' : 'border-transparent',
        )}
      >
        <Container
          className={cn(
            'flex items-center justify-between transition-[height] duration-300',
            scrolled ? 'h-16' : 'h-[72px]',
          )}
        >
          <Link to={ROUTES.home} aria-label="LeadFinder, página inicial" className="rounded-lg">
            <Logo />
          </Link>

          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="rounded-lg px-3.5 py-2 text-sm text-fg-muted transition-colors hover:text-fg"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <ButtonLink to={ROUTES.dashboard} size="sm">
                Ir para o painel
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to={ROUTES.signIn} variant="ghost" size="sm">
                  Entrar
                </ButtonLink>
                <ButtonLink to={ROUTES.signUp} size="sm">
                  Criar conta
                </ButtonLink>
              </>
            )}
          </div>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            className="-mr-2 inline-flex size-10 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-white/5 hover:text-fg md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </Container>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="h-[calc(100dvh-72px)] overflow-y-auto border-b border-line bg-ink-950/95 backdrop-blur-xl md:hidden"
          >
            <Container className="flex flex-col gap-8 py-6">
              <nav aria-label="Principal (móvel)">
                <ul className="flex flex-col">
                  {NAV_LINKS.map((link, i) => (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i + 0.05 }}
                    >
                      <a
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between border-b border-line py-4 text-lg font-medium tracking-tight text-fg"
                      >
                        {link.label}
                        <span aria-hidden className="font-mono text-xs text-fg-subtle">
                          0{i + 1}
                        </span>
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </nav>
              <div className="flex flex-col gap-3">
                {user ? (
                  <ButtonLink to={ROUTES.dashboard} size="lg" onClick={() => setOpen(false)}>
                    Ir para o painel
                  </ButtonLink>
                ) : (
                  <>
                    <ButtonLink to={ROUTES.signUp} size="lg" onClick={() => setOpen(false)}>
                      Criar conta
                    </ButtonLink>
                    <ButtonLink to={ROUTES.signIn} variant="secondary" size="lg" onClick={() => setOpen(false)}>
                      Entrar
                    </ButtonLink>
                  </>
                )}
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
