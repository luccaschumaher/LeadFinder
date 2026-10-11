import { ShieldCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button, Card } from '../components/ui'
import { supabase } from '../lib/supabase'

/**
 * Verificação em duas etapas (TOTP) obrigatória para o painel.
 * Primeira vez: mostra o QR code para cadastrar no app autenticador.
 * Depois: pede o código de 6 dígitos a cada entrada.
 */
export function TwoFactor({ onVerified }: { onVerified: () => void }) {
  const [factorId, setFactorId] = useState<string | null>(null)
  const [enroll, setEnroll] = useState<{ qr: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (cancelled) return
      if (error) return setError(error.message)
      const verified = data.totp.find((f) => f.status === 'verified')
      if (verified) return setFactorId(verified.id)
      // Remove cadastros pela metade e começa um novo.
      for (const f of data.all.filter((f) => f.status === 'unverified'))
        await supabase.auth.mfa.unenroll({ factorId: f.id })
      const res = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'LeadFinder Admin' })
      if (cancelled) return
      if (res.error) return setError(res.error.message)
      setFactorId(res.data.id)
      setEnroll({ qr: res.data.totp.qr_code, secret: res.data.totp.secret })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!factorId) return
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\D/g, '') })
    setLoading(false)
    if (error) {
      setError('Código inválido ou expirado. Confira o horário do celular e tente o código atual.')
      setCode('')
      return
    }
    onVerified()
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm p-6">
        <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
          <ShieldCheck className="size-5" />
        </span>
        <h1 className="mt-4 text-lg font-semibold">Verificação em duas etapas</h1>
        {enroll ? (
          <>
            <p className="mt-1 text-[13px] text-fg-muted">
              Primeiro acesso: abra o Google Authenticator (ou outro app autenticador), toque em adicionar e escaneie o
              código abaixo.
            </p>
            <div className="mt-4 flex justify-center rounded-xl bg-white p-3">
              <img src={enroll.qr} alt="QR code para o app autenticador" className="size-44" />
            </div>
            <p className="mt-3 text-[12px] text-fg-subtle">
              Sem câmera? Digite esta chave no app:{' '}
              <code className="font-mono break-all text-fg-muted">{enroll.secret}</code>
            </p>
          </>
        ) : (
          <p className="mt-1 text-[13px] text-fg-muted">Digite o código de 6 dígitos do seu app autenticador.</p>
        )}
        <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
          <label className="text-[12px] text-fg-muted">
            Código
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line-strong bg-ink-950 px-3 py-2 text-center font-mono text-lg tracking-[0.4em] text-fg"
            />
          </label>
          {error && <p className="text-[12px] text-red-300">{error}</p>}
          <Button type="submit" disabled={loading || !factorId || code.replace(/\D/g, '').length !== 6}>
            {loading ? 'Verificando…' : 'Confirmar'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => void supabase.auth.signOut()}>
            Sair
          </Button>
        </form>
      </Card>
    </main>
  )
}
