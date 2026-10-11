import { SendHorizontal } from 'lucide-react'

// Alturas fixas para a forma de onda (evita valores aleatórios a cada renderização).
const BARS = [6, 10, 16, 24, 14, 30, 20, 36, 26, 18, 32, 22, 12, 28, 18, 10, 22, 14, 8, 16, 26, 12, 6, 10]

/** Prévia ilustrativa da LeadIA. */
export function WaveIAPreview() {
  return (
    <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-stretch">
      {/* Forma de onda */}
      <div
        aria-hidden
        className="relative hidden w-40 items-center justify-center overflow-hidden rounded-lg border border-line bg-ink-950 sm:flex"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent),transparent_65%)] opacity-[0.12]" />
        <div className="relative flex h-12 items-center gap-[3px]">
          {BARS.map((h, i) => (
            <span
              key={i}
              className="w-[3px] origin-center rounded-full bg-(--accent) animate-wave"
              style={{ height: h, opacity: 0.35 + (h / 36) * 0.65, animationDelay: `${i * -0.075}s` }}
            />
          ))}
        </div>
      </div>

      {/* Conversa */}
      <div className="flex flex-col gap-2">
        <div className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-overlay/[0.06] px-3 py-2 text-[12px] text-fg">
          Como apresento o valor de um site para uma padaria de bairro?
        </div>
        <div className="max-w-[92%] rounded-lg rounded-bl-sm border border-(--accent)/20 bg-(--accent)/[0.06] px-3 py-2 text-[12px] leading-relaxed text-fg-muted">
          Comece pelo que o dono já sente no dia a dia: clientes que procuram o horário de funcionamento e o cardápio no
          Google
          <span className="animate-caret ml-0.5 inline-block h-3 w-px translate-y-0.5 bg-(--accent)" />
        </div>
        <div className="mt-auto flex items-center justify-between rounded-lg border border-line bg-ink-950/70 px-3 py-2 text-[11px] text-fg-subtle">
          Pergunte à LeadIA
          <SendHorizontal className="size-3.5" />
        </div>
      </div>
    </div>
  )
}
