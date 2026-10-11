import { ArrowLeft, Mail, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { ROUTES } from '@/config/routes'
import { useCaptcha } from '@/hooks/useCaptcha'
import { CAPTCHA_REQUIRED_MESSAGE } from '@/lib/captcha'
import { errorMessage } from '@/lib/errors'
import { validateEmail } from '@/lib/validation'
import { authService } from '@/services/auth'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const captcha = useCaptcha()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const err = validateEmail(email)
    setError(err)
    if (err) return
    if (!captcha.ready) return setError(CAPTCHA_REQUIRED_MESSAGE)
    setStatus('loading')
    try {
      await authService.requestPasswordReset(email, captcha.token)
      setStatus('done')
    } catch (e) {
      setError(errorMessage(e))
      setStatus('idle')
      captcha.reset()
    }
  }

  const back = (
    <Link
      to={ROUTES.signIn}
      className="inline-flex items-center gap-1.5 font-medium text-electric-300 hover:text-electric-200"
    >
      <ArrowLeft className="size-3.5" />
      Voltar para o login
    </Link>
  )

  if (status === 'done') {
    return (
      <AuthLayout
        title="Verifique seu e-mail"
        description="Se houver uma conta com este endereço, você receberá as instruções para criar uma nova senha."
        footer={back}
      >
        <div role="status" className="rounded-xl border border-line-strong bg-ink-900 p-5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-electric-500/12 text-electric-300">
            <MailCheck className="size-5" />
          </span>
          <p className="mt-4 text-sm text-fg">
            Solicitação registrada para <span className="font-medium">{email}</span>.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-fg-subtle">
            Não chegou? Confira a caixa de spam. O link vale por pouco tempo.
          </p>
          <Button variant="secondary" size="sm" className="mt-5" onClick={() => setStatus('idle')}>
            Usar outro e-mail
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      description="Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha."
      footer={back}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field label="E-mail" error={error}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              icon={<Mail />}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(undefined)
              }}
              error={error}
              autoFocus
            />
          )}
        </Field>
        {captcha.widget}
        <Button type="submit" loading={status === 'loading'} className="w-full">
          Enviar link de recuperação
        </Button>
      </form>
    </AuthLayout>
  )
}
