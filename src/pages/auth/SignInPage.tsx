import { CircleAlert, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, PasswordInput } from '@/components/ui/Field'
import { ROUTES } from '@/config/routes'
import { errorMessage } from '@/lib/errors'
import { validateEmail, type Errors } from '@/lib/validation'
import { authService } from '@/services/auth'

interface Form {
  email: string
  password: string
}

export function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from ?? ROUTES.dashboard

  const [form, setForm] = useState<Form>({ email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<Errors<Form>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const update = (key: keyof Form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
    setFormError(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Errors<Form> = {
      email: validateEmail(form.email),
      password: form.password ? undefined : 'Informe sua senha.',
    }
    setErrors(next)
    if (next.email || next.password) return
    setLoading(true)
    try {
      const user = await authService.signIn({ ...form, remember })
      navigate(user.onboarding.completed ? redirectTo : ROUTES.onboarding, { replace: true })
    } catch (err) {
      setFormError(errorMessage(err))
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Entrar no LeadFinder"
      description="Bem-vindo de volta. Continue de onde parou na sua prospecção."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to={ROUTES.signUp} className="font-medium text-electric-300 hover:text-electric-200">
            Criar conta gratuita
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
            {formError}
          </div>
        )}
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
              autoFocus
            />
          )}
        </Field>
        <Field
          label="Senha"
          error={errors.password}
          aside={
            <Link
              to={ROUTES.forgotPassword}
              className="text-[12px] text-fg-subtle transition-colors hover:text-electric-300"
            >
              Esqueceu a senha?
            </Link>
          }
        >
          {({ id, describedBy }) => (
            <PasswordInput
              id={id}
              aria-describedby={describedBy}
              autoComplete="current-password"
              placeholder="Sua senha"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              error={errors.password}
            />
          )}
        </Field>
        <Checkbox
          label="Manter conectado neste dispositivo"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        <Button type="submit" size="md" loading={loading} className="mt-1 w-full">
          {loading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </AuthLayout>
  )
}
