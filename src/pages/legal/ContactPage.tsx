import { CreditCard, LifeBuoy, Mail, ShieldCheck, type LucideIcon } from 'lucide-react'
import { LegalLayout } from '@/components/legal/LegalLayout'
import { LEGAL } from '@/config/legal'

const TOPICS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: LifeBuoy,
    title: 'Suporte e dúvidas',
    text: 'Problemas para entrar, buscas, LeadIA, Gerador de prompts ou qualquer recurso da plataforma.',
  },
  {
    icon: CreditCard,
    title: 'Pagamentos e assinatura',
    text: 'Plano que não foi liberado, cancelamento, reembolso ou cobrança. Informe o e-mail usado na compra.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacidade e dados',
    text: 'Acesso, correção, exportação ou exclusão dos seus dados e da sua conta, conforme a LGPD.',
  },
]

export function ContactPage() {
  return (
    <LegalLayout
      eyebrow="Contato"
      title="Fale com a gente"
      intro={
        <p>
          O atendimento do LeadFinder é feito por e-mail. Escreva do mesmo e-mail da sua conta e conte o que aconteceu;
          respondemos em até 2 dias úteis.
        </p>
      }
    >
      <a
        href={`mailto:${LEGAL.email}`}
        className="flex items-center gap-4 rounded-2xl border border-line-strong bg-ink-900 p-5 transition-colors hover:border-electric-400/40"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-500/12 text-electric-300">
          <Mail className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] text-fg-subtle">E-mail de atendimento</span>
          <span className="block truncate text-base font-medium text-fg">{LEGAL.email}</span>
        </span>
      </a>

      <ul className="grid gap-3 sm:grid-cols-3">
        {TOPICS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-2xl border border-line bg-ink-900/60 p-5">
            <Icon className="size-5 text-electric-300" />
            <p className="mt-3 text-sm font-medium text-fg">{title}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{text}</p>
          </li>
        ))}
      </ul>

      <p className="text-[13px] text-fg-subtle">LeadFinder é operado por {LEGAL.operator}.</p>
    </LegalLayout>
  )
}
