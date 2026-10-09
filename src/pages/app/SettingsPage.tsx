import {
  Bell,
  Download,
  ExternalLink,
  Eye,
  Gem,
  HelpCircle,
  KeyRound,
  LogOut,
  Shield,
  Trash2,
  User,
  type LucideIcon,
} from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { PageHeader } from '@/components/app/PageHeader'
import { AvatarPicker, MascotPicker } from '@/components/mascots/pickers'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Card } from '@/components/ui/display'
import { Field, Input, PasswordInput, Switch } from '@/components/ui/Field'
import { DEFAULT_AVATAR, DEFAULT_MASCOT } from '@/data/characters'
import { SECTION_IDS } from '@/config/navigation'
import { ROUTES } from '@/config/routes'
import { usePlan } from '@/hooks/usePlan'
import { cn } from '@/lib/cn'
import { errorMessage } from '@/lib/errors'
import { toast } from '@/lib/toast'
import { downloadFile, formatDate } from '@/lib/utils'
import { validateConfirm, validateName, validatePassword } from '@/lib/validation'
import { authService } from '@/services/auth'
import { dataStore } from '@/stores/data'
import { useCurrentUser } from '@/stores/session'

const TABS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'seguranca', label: 'Segurança', icon: KeyRound },
  { id: 'aparencia', label: 'Aparência', icon: Eye },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'privacidade', label: 'Privacidade', icon: Shield },
  { id: 'conta', label: 'Conta', icon: Gem },
  { id: 'ajuda', label: 'Ajuda e suporte', icon: HelpCircle },
]

export function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.id === params.get('aba')) ? params.get('aba')! : 'perfil'

  return (
    <>
      <PageHeader title="Configurações" description="Gerencie seus dados, preferências e sua conta." />
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Seções das configurações" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <ul className="flex gap-1 lg:flex-col">
            {TABS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setParams({ aba: t.id }, { replace: true })}
                  aria-current={tab === t.id ? 'page' : undefined}
                  className={cn(
                    'flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[13px] whitespace-nowrap transition-colors',
                    tab === t.id ? 'bg-white/[0.07] text-fg' : 'text-fg-muted hover:bg-white/[0.04] hover:text-fg',
                  )}
                >
                  <t.icon
                    className={cn('size-4', tab === t.id ? 'text-electric-300' : 'text-fg-subtle')}
                    strokeWidth={1.75}
                  />
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0">
          {tab === 'perfil' && <ProfileSection />}
          {tab === 'seguranca' && <SecuritySection />}
          {tab === 'aparencia' && <AppearanceSection />}
          {tab === 'notificacoes' && <NotificationsSection />}
          {tab === 'privacidade' && <PrivacySection />}
          {tab === 'conta' && <AccountSection />}
          {tab === 'ajuda' && <HelpSection />}
        </div>
      </div>
    </>
  )
}

function Section({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-fg-subtle">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-line bg-ink-950/30 px-5 py-3">{footer}</div>}
    </Card>
  )
}

function ProfileSection() {
  const user = useCurrentUser()
  const [name, setName] = useState(user.name)
  const [avatar, setAvatar] = useState(user.avatar ?? DEFAULT_AVATAR)
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const err = validateName(name)
    setError(err)
    if (err) return
    setSaving(true)
    await authService.updateProfile({ name, avatar })
    setSaving(false)
    toast.success('Perfil atualizado')
  }

  return (
    <form onSubmit={save}>
      <Section
        title="Perfil"
        description="Como você aparece no LeadFinder."
        footer={
          <Button
            type="submit"
            size="sm"
            loading={saving}
            disabled={name.trim() === user.name && avatar === user.avatar}
          >
            Salvar alterações
          </Button>
        }
      >
        <div className="mb-6">
          <p className="mb-3 text-[13px] font-medium text-fg">Avatar</p>
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" error={error}>
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(undefined)
                }}
                error={error}
                autoComplete="name"
              />
            )}
          </Field>
          <Field
            label="E-mail"
            hint="A alteração de e-mail exigirá confirmação e será liberada com a autenticação real."
          >
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} value={user.email} disabled readOnly />
            )}
          </Field>
        </div>
      </Section>
    </form>
  )
}

function SecuritySection() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const [saving, setSaving] = useState(false)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const next = {
      current: form.current ? undefined : 'Informe a senha atual.',
      next: validatePassword(form.next),
      confirm: validateConfirm(form.next, form.confirm),
    }
    setErrors(next)
    if (next.current || next.next || next.confirm) return
    setSaving(true)
    try {
      await authService.changePassword({ current: form.current, next: form.next })
      setForm({ current: '', next: '', confirm: '' })
      toast.success('Senha alterada')
    } catch (err) {
      setErrors({ current: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof typeof form, label: string, autoComplete: string) => (
    <Field label={label} error={errors[key]}>
      {({ id, describedBy }) => (
        <PasswordInput
          id={id}
          aria-describedby={describedBy}
          autoComplete={autoComplete}
          value={form[key]}
          onChange={(e) => {
            setForm((f) => ({ ...f, [key]: e.target.value }))
            setErrors((er) => ({ ...er, [key]: undefined }))
          }}
          error={errors[key]}
        />
      )}
    </Field>
  )

  return (
    <form onSubmit={save}>
      <Section
        title="Alterar senha"
        description="Use uma senha forte e exclusiva."
        footer={
          <Button type="submit" size="sm" loading={saving}>
            Alterar senha
          </Button>
        }
      >
        <div className="grid max-w-md gap-4">
          {field('current', 'Senha atual', 'current-password')}
          {field('next', 'Nova senha', 'new-password')}
          {field('confirm', 'Confirmar nova senha', 'new-password')}
          <p className="text-[12px] text-fg-subtle">Mínimo de 8 caracteres, com letras e números.</p>
        </div>
      </Section>
    </form>
  )
}

function AppearanceSection() {
  const user = useCurrentUser()
  return (
    <Section title="Aparência" description="Ajuste a interface ao seu gosto.">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-fg">Personagem da WaveIA</p>
          <p className="mt-0.5 text-[13px] text-fg-subtle">
            Escolha quem vai te acompanhar nas conversas com a assistente.
          </p>
          <MascotPicker
            className="mt-3 max-w-md"
            value={user.preferences.mascot ?? DEFAULT_MASCOT}
            onChange={(id) => {
              authService.updatePreferences({ mascot: id })
              toast.success('Personagem atualizado')
            }}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-fg">Tema</p>
          <div className="mt-3 grid max-w-md grid-cols-2 gap-2">
            <div className="rounded-xl border border-electric-400/60 bg-ink-950 p-3">
              <div className="h-14 rounded-lg border border-line bg-ink-900" />
              <p className="mt-2 text-[13px] text-fg">Escuro</p>
            </div>
            <div className="rounded-xl border border-line p-3 opacity-50" aria-disabled="true">
              <div className="h-14 rounded-lg bg-white/80" />
              <p className="mt-2 text-[13px] text-fg-muted">Claro · em breve</p>
            </div>
          </div>
        </div>
        <Switch
          label="Reduzir animações"
          description="Desativa transições e movimentos da interface. Também respeitamos a preferência do sistema."
          checked={user.preferences.reduceMotion}
          onChange={(v) => {
            authService.updatePreferences({ reduceMotion: v })
            toast.success(v ? 'Animações reduzidas' : 'Animações ativadas')
          }}
        />
      </div>
    </Section>
  )
}

function NotificationsSection() {
  const user = useCurrentUser()
  const n = user.preferences.notifications
  const set = (key: keyof typeof n, value: boolean) => {
    authService.updatePreferences({ notifications: { ...n, [key]: value } })
    toast.success('Preferência salva')
  }
  return (
    <Section title="Notificações" description="Escolha o que deseja receber por e-mail.">
      <div className="space-y-5">
        <Switch
          label="Resumo semanal"
          description="Seus leads, buscas e oportunidades da semana."
          checked={n.weeklySummary}
          onChange={(v) => set('weeklySummary', v)}
        />
        <Switch
          label="Alertas de tokens"
          description="Aviso quando seus tokens estiverem acabando."
          checked={n.tokenAlerts}
          onChange={(v) => set('tokenAlerts', v)}
        />
        <Switch
          label="Novidades do produto"
          description="Novas funcionalidades e melhorias do LeadFinder."
          checked={n.productUpdates}
          onChange={(v) => set('productUpdates', v)}
        />
        <p className="text-[12px] text-fg-subtle">
          Suas preferências ficam salvas na conta. O envio dos e-mails será ativado em breve.
        </p>
      </div>
    </Section>
  )
}

function PrivacySection() {
  const user = useCurrentUser()
  const [confirm, setConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)

  const clearData = async () => {
    setClearing(true)
    try {
      await authService.clearLocalData()
      setConfirm(false)
      toast.success('Dados apagados')
    } catch (err) {
      toast.error('Não foi possível apagar os dados', errorMessage(err))
    } finally {
      setClearing(false)
    }
  }

  const exportData = () => {
    const { companies, ...rest } = dataStore.get()
    void companies
    downloadFile(
      `leadfinder-dados-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ user: { name: user.name, email: user.email, plan: user.plan }, ...rest }, null, 2),
    )
    toast.success('Exportação iniciada')
  }

  return (
    <>
      <Section title="Privacidade e dados" description="Controle os dados da sua conta.">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-fg">Exportar meus dados</p>
              <p className="mt-0.5 text-[13px] text-fg-subtle">
                Baixe leads, favoritos, histórico, prompts e conversas em JSON.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={exportData}>
              <Download />
              Exportar
            </Button>
          </div>
          <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-fg">Apagar dados de prospecção</p>
              <p className="mt-0.5 text-[13px] text-fg-subtle">
                Remove leads, favoritos, anotações, histórico, prompts e conversas. A conta é mantida.
              </p>
            </div>
            <Button variant="secondary" size="sm" className="text-red-300" onClick={() => setConfirm(true)}>
              <Trash2 />
              Apagar dados
            </Button>
          </div>
          <p className="border-t border-line pt-5 text-[13px] text-fg-subtle">
            Saiba como tratamos seus dados na{' '}
            <Link to={ROUTES.privacy} className="text-electric-300 hover:underline">
              Política de privacidade
            </Link>
            .
          </p>
        </div>
      </Section>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={clearData}
        loading={clearing}
        destructive
        title="Apagar todos os dados de prospecção?"
        description="Esta ação não pode ser desfeita. Leads, favoritos, anotações, histórico, prompts, vendas e conversas serão apagados."
        confirmLabel="Apagar dados"
      />
    </>
  )
}

function AccountSection() {
  const user = useCurrentUser()
  const { plan, tokens } = usePlan()
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      <Section title="Informações da conta">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {[
            ['Plano atual', plan.name],
            ['Tokens hoje', `${tokens.balance} de ${tokens.total}`],
            ['Conta criada em', formatDate(user.createdAt)],
            ['Identificador', user.id],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[12px] text-fg-subtle">{k}</dt>
              <dd className="mt-0.5 truncate text-fg">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
          <ButtonLink to={ROUTES.plans} size="sm" variant="secondary">
            <Gem />
            Gerenciar plano
          </ButtonLink>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-300 hover:text-red-200"
            onClick={() => setConfirm(true)}
          >
            <LogOut />
            Sair da conta
          </Button>
        </div>
      </Section>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={async () => {
          await authService.signOut()
          navigate(ROUTES.signIn)
        }}
        title="Sair da conta?"
        description="Você precisará entrar novamente para acessar o LeadFinder."
        confirmLabel="Sair"
      />
    </>
  )
}

function HelpSection() {
  const links = [
    {
      label: 'Perguntas frequentes',
      text: 'Respostas sobre tokens, planos e funcionalidades.',
      to: `/#${SECTION_IDS.faq}`,
    },
    { label: 'Fale com o suporte', text: 'Canais de atendimento do LeadFinder.', to: ROUTES.contact },
    { label: 'Termos de uso', text: 'Regras de uso da plataforma.', to: ROUTES.terms },
    { label: 'Política de privacidade', text: 'Como tratamos seus dados.', to: ROUTES.privacy },
  ]
  return (
    <Section title="Ajuda e suporte" description="Encontre respostas ou fale com a equipe.">
      <ul className="grid gap-2 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className="group flex h-full items-start justify-between gap-3 rounded-xl border border-line p-4 transition-colors hover:border-line-strong"
            >
              <span>
                <span className="block text-sm font-medium text-fg">{l.label}</span>
                <span className="mt-0.5 block text-[12px] text-fg-subtle">{l.text}</span>
              </span>
              <ExternalLink className="size-3.5 shrink-0 text-fg-subtle group-hover:text-fg" />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  )
}
