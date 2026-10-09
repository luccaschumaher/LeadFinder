import { Check, CircleAlert, CircleCheck, Mail, MailCheck, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AvatarPicker } from '@/components/mascots/pickers'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, PasswordInput } from '@/components/ui/Field'
import { ROUTES } from '@/config/routes'
import { DEFAULT_AVATAR } from '@/data/characters'
import { cn } from '@/lib/cn'
import { errorMessage } from '@/lib/errors'
import { delay } from '@/lib/utils'
import {
  hasErrors,
  passwordChecks,
  validateConfirm,
  validateEmail,
  validateName,
  validatePassword,
  type Errors,
} from '@/lib/validation'
import { authService } from '@/services/auth'
import type { AvatarId } from '@/types'

interface Form {
  name: string
  email: string
  password: string
  confirm: string
  terms: string
}

export function SignUpPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [avatar, setAvatar] = useState<AvatarId>(DEFAULT_AVATAR)
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<Errors<Form>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'confirm'>('idle')

  const update = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
    setFormError(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Errors<Form> = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirm: validateConfirm(form.password, form.confirm),
      terms: terms ? undefined : 'Aceite os termos para continuar.',
    }
    setErrors(next)
    if (hasErrors(next)) return
    setStatus('loading')
    try {
      const result = await authService.signUp({ ...form, avatar })
      if (result.needsConfirmation) {
        setStatus('confirm')
        return
      }
      setStatus('success')
      await delay(900)
      navigate(ROUTES.onboarding, { replace: true })
    } catch (err) {
      setFormError(errorMessage(err))
      setStatus('idle')
    }
  }

  if (status === 'confirm') {
    return (
      <AuthLayout
        title="Confirme seu e-mail"
        description="Falta pouco. Enviamos um link de confirmação para o seu e-mail."
        footer={
          <Link to={ROUTES.signIn} className="font-medium text-electric-300 hover:text-electric-200">
            Já confirmei, quero entrar
          </Link>
        }
      >
        <div role="status" className="rounded-xl border border-line-strong bg-ink-900 p-5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-electric-500/12 text-electric-300">
            <MailCheck className="size-5" />
          </span>
          <p className="mt-4 text-sm text-fg">
            Abra o e-mail enviado para <span className="font-medium">{form.email.trim().toLowerCase()}</span> e clique
            no link para ativar sua conta.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-fg-subtle">
            Não chegou em alguns minutos? Confira a caixa de spam.
          </p>
        </div>
      </AuthLayout>
    )
  }

  if (status === 'success') {
    return (
      <AuthLayout title="Conta criada" description="Tudo pronto. Vamos configurar sua experiência em poucos passos.">
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4 text-sm text-emerald-100"
        >
          <CircleCheck className="size-5 text-emerald-400" />
          Redirecionando para as boas-vindas…
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Crie sua conta"
      description="Comece grátis com 3 tokens por dia para encontrar suas primeiras oportunidades."
      footer={
        <>
          Já tem uma conta?{' '}
          <Link to={ROUTES.signIn} className="font-medium text-electric-300 hover:text-electric-200">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/[0.07] px-3 py-2.5 text-[13px] text-red-200"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-400" />
            <span>
              {formError}{' '}
              {formError.includes('Já existe') && (
                <Link to={ROUTES.signIn} className="font-medium text-red-100 underline underline-offset-2">
                  Entrar
                </Link>
              )}
            </span>
          </div>
        )}
        <div>
          <p className="mb-2.5 text-[13px] font-medium text-fg">Escolha seu avatar</p>
          <AvatarPicker value={avatar} onChange={setAvatar} size={52} className="gap-3" />
        </div>
        <Field label="Nome" error={errors.name}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              autoComplete="name"
              placeholder="Como devemos te chamar?"
              icon={<User />}
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              error={errors.name}
              autoFocus
            />
          )}
        </Field>
        <Field label="E-mail" error={errors.email}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              icon={<Mail />}
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              error={errors.email}
            />
          )}
        </Field>
        <Field label="Senha" error={errors.password}>
          {({ id, describedBy }) => (
            <PasswordInput
              id={id}
              aria-describedby={describedBy}
              autoComplete="new-password"
              placeholder="Crie uma senha"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              error={errors.password}
            />
          )}
        </Field>
        {form.password && (
          <ul className="-mt-2 flex flex-wrap gap-x-4 gap-y-1" aria-label="Requisitos da senha">
            {passwordChecks(form.password).map((c) => (
              <li
                key={c.label}
                className={cn(
                  'flex items-center gap-1 text-[12px] transition-colors',
                  c.ok ? 'text-emerald-300' : 'text-fg-subtle',
                )}
              >
                <Check className={cn('size-3', !c.ok && 'opacity-30')} />
                {c.label}
              </li>
            ))}
          </ul>
        )}
        <Field label="Confirmar senha" error={errors.confirm}>
          {({ id, describedBy }) => (
            <PasswordInput
              id={id}
              aria-describedby={describedBy}
              autoComplete="new-password"
              placeholder="Repita a senha"
              value={form.confirm}
              onChange={(e) => update('confirm', e.target.value)}
              error={errors.confirm}
            />
          )}
        </Field>
        <div>
          <Checkbox
            checked={terms}
            onChange={(e) => {
              setTerms(e.target.checked)
              setErrors((er) => ({ ...er, terms: undefined }))
            }}
            label={
              <>
                Li e aceito os{' '}
                <Link to={ROUTES.terms} target="_blank" className="text-electric-300 hover:underline">
                  Termos de uso
                </Link>{' '}
                e a{' '}
                <Link to={ROUTES.privacy} target="_blank" className="text-electric-300 hover:underline">
                  Política de privacidade
                </Link>
                .
              </>
            }
          />
          {errors.terms && <p className="mt-1.5 text-[12px] text-red-400">{errors.terms}</p>}
        </div>
        <Button type="submit" loading={status === 'loading'} className="mt-1 w-full">
          {status === 'loading' ? 'Criando conta…' : 'Criar conta gratuita'}
        </Button>
      </form>
    </AuthLayout>
  )
}
