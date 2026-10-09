import { Pencil } from 'lucide-react'
import { cn } from '@/lib/cn'

const ITEMS = [
  { title: 'Primeiro contato', tag: 'WhatsApp', active: true },
  { title: 'Retorno após 3 dias', tag: 'Follow-up' },
  { title: 'Proposta para restaurante', tag: 'E-mail' },
]

/** Prévia ilustrativa do módulo Prompts. */
export function PromptsPreview() {
  return (
    <div className="flex flex-col gap-2.5">
      <ul className="flex flex-col gap-1">
        {ITEMS.map((it) => (
          <li
            key={it.title}
            className={cn(
              'flex items-center justify-between rounded-md px-2.5 py-1.5 text-[12px]',
              it.active ? 'bg-(--accent)/10 text-fg ring-1 ring-(--accent)/25' : 'text-fg-muted',
            )}
          >
            <span className="truncate">{it.title}</span>
            <span className="ml-2 shrink-0 font-mono text-[10px] text-fg-subtle">{it.tag}</span>
          </li>
        ))}
      </ul>

      <div className="rounded-lg border border-line bg-ink-950/70 p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] text-fg-subtle">
          <span className="font-mono uppercase tracking-wider">Editor</span>
          <Pencil className="size-3" />
        </div>
        <p className="font-mono text-[11px] leading-relaxed text-fg-muted">
          Escreva uma mensagem curta para <Var>{'{{empresa}}'}</Var>, do segmento <Var>{'{{segmento}}'}</Var>, em{' '}
          <Var>{'{{cidade}}'}</Var>. Destaque como um site pode atrair novos clientes.
        </p>
      </div>
    </div>
  )
}

function Var({ children }: { children: string }) {
  return <span className="rounded bg-(--accent)/12 px-1 text-(--accent)">{children}</span>
}
