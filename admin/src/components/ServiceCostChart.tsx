import { useState } from 'react'
import { money } from '../lib/format'

interface Item {
  id: string
  label: string
  value: number
}

/**
 * Custo de cada serviço no período: barras horizontais de UMA medida (R$), ordenadas da
 * maior para a menor, com valor e participação escritos em cada linha.
 */
export function ServiceCostChart({ items }: { items: Item[] }) {
  const [hover, setHover] = useState<string | null>(null)
  const total = items.reduce((s, i) => s + i.value, 0)
  const max = Math.max(...items.map((i) => i.value), 0.0001)

  return (
    <div>
      <ul className="space-y-2.5" aria-label="Custo por serviço">
        {items.map((i) => {
          const pct = total > 0 ? (i.value / total) * 100 : 0
          const dim = hover !== null && hover !== i.id
          return (
            <li
              key={i.id}
              onMouseEnter={() => setHover(i.id)}
              onMouseLeave={() => setHover(null)}
              className="grid grid-cols-[130px_1fr_auto] items-center gap-3 text-[13px] sm:grid-cols-[150px_1fr_150px]"
            >
              <span className={dim ? 'text-fg-subtle' : 'text-fg-muted'}>{i.label}</span>
              <span className="h-2.5 rounded-full bg-white/[0.05]">
                {i.value > 0 && (
                  <span
                    className={`block h-2.5 min-w-1 rounded-full transition-opacity ${dim ? 'bg-electric-400/40' : 'bg-electric-400'}`}
                    style={{ width: `${(i.value / max) * 100}%` }}
                  />
                )}
              </span>
              <span className="text-right text-fg tabular-nums">
                {money(i.value)}
                <span className="ml-1.5 text-[11px] text-fg-subtle">
                  {i.value > 0 ? `${pct.toFixed(0)}%` : 'grátis'}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 flex justify-between border-t border-line pt-3 text-[13px]">
        <span className="text-fg-muted">Total no período</span>
        <span className="font-semibold text-fg tabular-nums">{money(total)}</span>
      </p>
    </div>
  )
}
