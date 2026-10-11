import { LockKeyhole } from 'lucide-react'
import { useCallback, useState, type FormEvent } from 'react'
import { Button, Card } from '../components/ui'
import { Turnstile } from '../components/Turnstile'
import { supabase, TURNSTILE_SITE_KEY } from '../lib/supabase'

export function Login({ notice }: { notice?: string | null }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const [error, setError] = useState<string | null>(notice ?? null)
  const [loading, setLoading] = useState(false)
  const onToken = useCallback((t: string | null) => setToken(t), [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (TURNSTILE_SITE_KEY && !token) return setError('Confirme a verificação de segurança.')
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
      options: { captchaToken: token ?? undefined },
    })
    if (error) {
      setError(/invalid/i.test(error.message) ? 'E-mail ou senha incorretos.' : error.message)
      setToken(null)
      setRound((r) => r + 1)
    }
    setLoading(false)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6">
        <span className="flex size-10 items-center justify-center rounded-xl bg-electric-500/15 text-electric-300">
          <LockKeyhole className="size-5" />
        </span>
        <h1 className="mt-4 text-lg font-semibold">LeadFinder Admin</h1>
        <p className="mt-1 text-[13px] text-fg-muted">Entre com a sua conta de administrador do LeadFinder.</p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <label className="text-[12px] text-fg-muted">
            E-mail
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line-strong bg-ink-950 px-3 py-2 text-sm text-fg"
            />
          </label>
          <label className="text-[12px] text-fg-muted">
            Senha
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line-strong bg-ink-950 px-3 py-2 text-sm text-fg"
            />
          </label>
          {TURNSTILE_SITE_KEY && <Turnstile key={round} onToken={onToken} />}
          {error && <p className="text-[12px] text-red-300">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
