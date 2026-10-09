import { Check, CircleAlert, CircleCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Field, PasswordInput } from '@/components/ui/Field'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/cn'
import { errorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { passwordChecks, validateConfirm, validatePassword } from '@/lib/validation'
import { authService } from '@/services/auth'

/** Destino do link de recuperação enviado por e-mail: define a nova senha. */
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  // O link do e-mail abre uma sessão temporária de recuperação.
  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => active && setHasSession(!!data.session))
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setHasSession(true)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next = { password: validatePassword(password), confirm: validateConfirm(password, confirm) }
    setErrors(next)
    if (next.password || next.confirm) return
    setStatus('loading')
    try {
      await authService.setNewPassword(password)
      setStatus('done')
      setTimeout(() => navigate(ROUTES.dashboard, { replace: true }), 1200)
    } catch (err) {
      setFormError(errorMessage(err))
      setStatus('idle')
    }
  }

  if (hasSession === false) {
    return (
      <AuthLayout
        title="Link inválido ou expirado"
        description="Peça um novo link de recuperação para criar sua senha."
        footer={
          <Link to={ROUTES.forgotPassword} className="font-medium text-electric-300 hover:text-electric-200">
            Pedir novo link
          </Link>
        }
      >
        <span />
      </AuthLayout>
    )
  }

  if (status === 'done') {
    return (
      <AuthLayout title="Senha alterada" description="Tudo certo. Levando você para o painel…">
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4 text-sm text-emerald-100"
        >
          <CircleCheck className="size-5 text-emerald-400" />
          Sua nova senha já está valendo.
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Crie uma nova senha"
      description="Escolha uma senha forte que você ainda não use em outros sites."
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
        <Field label="Nova senha" error={errors.password}>
          {({ id, describedBy }) => (
            <PasswordInput
              id={id}
              aria-describedby={describedBy}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors((er) => ({ ...er, password: undefined }))
              }}
              error={errors.password}
              autoFocus
            />
          )}
        </Field>
        {password && (
          <ul className="-mt-2 flex flex-wrap gap-x-4 gap-y-1" aria-label="Requisitos da senha">
            {passwordChecks(password).map((c) => (
              <li
                key={c.label}
                className={cn('flex items-center gap-1 text-[12px]', c.ok ? 'text-emerald-300' : 'text-fg-subtle')}
              >
                <Check className={cn('size-3', !c.ok && 'opacity-30')} />
                {c.label}
              </li>
            ))}
          </ul>
        )}
        <Field label="Confirmar nova senha" error={errors.confirm}>
          {({ id, describedBy }) => (
            <PasswordInput
              id={id}
              aria-describedby={describedBy}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                setErrors((er) => ({ ...er, confirm: undefined }))
              }}
              error={errors.confirm}
            />
          )}
        </Field>
        <Button type="submit" loading={status === 'loading'} disabled={hasSession === null} className="w-full">
          Salvar nova senha
        </Button>
      </form>
    </AuthLayout>
  )
}
