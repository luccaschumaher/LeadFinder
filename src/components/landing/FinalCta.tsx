import { ArrowRight } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { Container, Reveal } from '@/components/ui/primitives'
import { SECTION_IDS } from '@/config/navigation'
import { ROUTES } from '@/config/routes'

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="pb-24 sm:pb-32">
      <Container>
        <Reveal>
          <div className="surface relative isolate overflow-hidden rounded-3xl bg-ink-900 px-6 py-16 text-center sm:px-12 sm:py-24">
            {/* Anéis de radar */}
            <svg
              aria-hidden
              viewBox="0 0 800 800"
              className="absolute top-1/2 left-1/2 -z-10 w-[900px] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-70"
            >
              {[120, 200, 280, 360].map((r) => (
                <circle key={r} cx="400" cy="400" r={r} fill="none" stroke="rgb(255 255 255 / 0.05)" />
              ))}
              <path d="M400 400 L400 40 A360 360 0 0 1 711.8 220 Z" fill="url(#cta-sweep)" />
              <defs>
                <linearGradient id="cta-sweep" x1="400" y1="40" x2="700" y2="300" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2F6BFF" stopOpacity=".16" />
                  <stop offset="1" stopColor="#2F6BFF" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div
              aria-hidden
              className="absolute top-0 left-1/2 -z-10 h-64 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric-500/25 blur-[100px]"
            />
            <div
              aria-hidden
              className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-electric-400/60 to-transparent"
            />

            <LogoMark className="mx-auto size-14 drop-shadow-[0_0_24px_rgb(47_107_255/0.5)]" />
            <h2
              id="cta-title"
              className="text-gradient mx-auto mt-8 max-w-2xl text-[32px] leading-[1.1] font-semibold tracking-[-0.035em] text-balance sm:text-5xl"
            >
              Sua próxima venda começa com a empresa certa.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-pretty text-fg-muted sm:text-lg">
              Crie sua conta gratuita e organize sua prospecção desde o primeiro dia.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink to={ROUTES.signUp} size="lg">
                Começar gratuitamente
                <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
              </ButtonLink>
              <ButtonLink to={`#${SECTION_IDS.pricing}`} variant="secondary" size="lg">
                Ver planos
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
