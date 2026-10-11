import { Mail } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui'

/** Envia agora, para todos os administradores, o relatório do mês atual (parcial). */
export function ReportButton() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const send = async () => {
    setState('sending')
    const { data, error } = await supabase.functions.invoke('lf-monthly-report', { body: { month: 'current' } })
    if (error) {
      let text = 'Não foi possível enviar o relatório.'
      try {
        const payload = await (error as { context?: Response }).context?.json()
        if (payload?.message) text = payload.message
      } catch {
        /* resposta sem corpo */
      }
      setMessage(text)
      setState('error')
      return
    }
    setMessage(`Relatório enviado para ${data?.sent ?? 0} administrador(es).`)
    setState('sent')
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="ghost" onClick={() => void send()} disabled={state === 'sending'}>
        <Mail />
        {state === 'sending' ? 'Enviando…' : 'Enviar relatório agora'}
      </Button>
      {message && (
        <p role="status" className={`text-[11px] ${state === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
