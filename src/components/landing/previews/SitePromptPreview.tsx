import { ArrowDown, Copy } from 'lucide-react'

const FIELDS = [
  { label: 'Segmento', value: 'Clínica odontológica' },
  { label: 'Estilo', value: 'Minimalista, tons claros' },
]

const SECTIONS = ['Hero', 'Serviços', 'Equipe', 'Contato']

/** Prévia ilustrativa do Gerador de Prompts para Sites. */
export function SitePromptPreview() {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-1.5">
        {FIELDS.map((f) => (
          <div key={f.label} className="rounded-md border border-line bg-white/[0.02] px-2.5 py-1.5">
            <div className="text-[9px] text-fg-subtle">{f.label}</div>
            <div className="truncate text-[11px] text-fg">{f.value}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {SECTIONS.map((s) => (
          <span
            key={s}
            className="rounded border border-(--accent)/25 bg-(--accent)/[0.08] px-1.5 py-px text-[10px] text-(--accent)"
          >
            {s}
          </span>
        ))}
      </div>

      <div aria-hidden className="flex justify-center py-0.5 text-fg-subtle">
        <ArrowDown className="size-3.5" />
      </div>

      <div className="relative rounded-lg border border-line bg-ink-950/70 p-3">
        <Copy className="absolute top-2.5 right-2.5 size-3 text-fg-subtle" />
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-(--accent)">prompt.md</div>
        <p className="pr-4 font-mono text-[11px] leading-relaxed text-fg-muted">
          Crie um site de página única para uma clínica odontológica, com visual minimalista em tons claros, seções de
          serviços, equipe e contato
          <span className="text-fg-subtle"> …</span>
        </p>
      </div>
    </div>
  )
}
