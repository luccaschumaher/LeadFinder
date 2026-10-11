import { Card, CardTitle, Td, Th } from '../components/ui'
import type { PaymentEvent, PaymentFailure } from '../lib/api'
import { date, PLAN_LABEL } from '../lib/format'

const EVENT_LABEL: Record<string, string> = {
  purchase_approved: 'Compra aprovada',
  subscription_created: 'Assinatura criada',
  subscription_renewed: 'Renovação',
  subscription_resumed: 'Assinatura retomada',
  subscription_late_recovered: 'Atraso recuperado',
  subscription_canceled: 'Cancelamento',
  refund: 'Reembolso',
  chargeback: 'Chargeback',
}

export function Payments({ events, failures }: { events: PaymentEvent[]; failures: PaymentFailure[] }) {
  return (
    <div className="space-y-4">
      {failures.length > 0 && (
        <Card className="border-amber-400/30">
          <CardTitle
            title={`Avisos pendentes (${failures.length})`}
            hint="Pagamentos que não puderam ser aplicados. Para reprocessar, rode no SQL Editor do Supabase: select * from lf_billing_retry_failures();"
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className="border-b border-line text-[11px] tracking-wide text-fg-subtle uppercase">
                <tr>
                  <Th>Data</Th>
                  <Th>Evento</Th>
                  <Th>E-mail</Th>
                  <Th>Plano</Th>
                  <Th>Motivo</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {failures.map((f) => (
                  <tr key={f.event_id}>
                    <Td className="text-fg-muted">{date(f.created_at, true)}</Td>
                    <Td>{EVENT_LABEL[f.event] ?? f.event}</Td>
                    <Td>{f.email ?? '—'}</Td>
                    <Td>{f.plan ? PLAN_LABEL[f.plan] : '—'}</Td>
                    <Td className="text-amber-200">{f.reason}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle title="Avisos da Cakto" hint="Últimos 200 eventos recebidos pelo webhook." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-line bg-white/[0.015] text-[11px] tracking-wide text-fg-subtle uppercase">
              <tr>
                <Th>Data</Th>
                <Th>Evento</Th>
                <Th>E-mail da compra</Th>
                <Th>Conta vinculada</Th>
                <Th>Plano</Th>
                <Th>Resultado</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-white/[0.02]">
                  <Td className="text-fg-muted">{date(e.created_at, true)}</Td>
                  <Td>{EVENT_LABEL[e.event] ?? e.event}</Td>
                  <Td>{e.email ?? '—'}</Td>
                  <Td className={e.account_email ? '' : 'text-amber-200'}>{e.account_email ?? 'sem conta ainda'}</Td>
                  <Td>{e.plan ? PLAN_LABEL[e.plan] : '—'}</Td>
                  <Td className="text-fg-muted">
                    {e.result === 'pending' ? 'aguardando cadastro' : (PLAN_LABEL[e.result ?? ''] ?? e.result ?? '—')}
                  </Td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-fg-subtle">
                    Nenhum pagamento recebido ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
