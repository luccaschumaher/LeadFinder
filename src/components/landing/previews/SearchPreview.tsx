import { Bookmark, Building2, MapPin, Phone, Star } from 'lucide-react'

const PINS = [
  { top: '28%', left: '30%', active: true },
  { top: '55%', left: '62%' },
  { top: '38%', left: '74%' },
  { top: '70%', left: '24%' },
  { top: '20%', left: '56%' },
]

const RESULTS = [
  { name: 'Cantina Bela Vista', meta: 'Savassi · 4,7', noSite: true, saved: true },
  { name: 'Empório Mineiro', meta: 'Lourdes · 4,5', noSite: true },
  { name: 'Bistrô Alameda', meta: 'Funcionários · 4,8', noSite: false },
]

/** Prévia ilustrativa do módulo Encontrar Empresas. */
export function SearchPreview() {
  return (
    <div className="grid gap-3 sm:grid-cols-[1.15fr_1fr]">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Chip icon={Building2}>Restaurantes</Chip>
          <Chip icon={MapPin}>Belo Horizonte, MG</Chip>
          <Chip active>Sem site</Chip>
        </div>
        <ul className="mt-1 flex flex-col gap-1.5">
          {RESULTS.map((r) => (
            <li
              key={r.name}
              className="flex items-center gap-2.5 rounded-lg border border-line bg-white/[0.02] px-2.5 py-2 transition-colors group-hover:border-line-strong"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-fg">{r.name}</div>
                <div className="flex items-center gap-1 text-[10px] text-fg-subtle">
                  <Star className="size-2.5 fill-current" />
                  {r.meta}
                </div>
              </div>
              {r.noSite && (
                <span className="rounded border border-(--accent)/30 bg-(--accent)/10 px-1.5 py-px text-[9px] font-medium text-(--accent)">
                  Sem site
                </span>
              )}
              <Phone className="size-3 text-fg-subtle" />
              <Bookmark className={r.saved ? 'size-3 fill-(--accent) text-(--accent)' : 'size-3 text-fg-subtle'} />
            </li>
          ))}
        </ul>
      </div>

      {/* Mapa abstrato */}
      <div className="relative hidden min-h-40 overflow-hidden rounded-lg border border-line bg-ink-950 sm:block">
        <div className="bg-grid absolute inset-0 opacity-60 [background-size:22px_22px]" />
        <svg aria-hidden className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path
            d="M0 62 C 25 55, 40 75, 60 60 S 90 40, 100 46"
            stroke="rgb(255 255 255 / 0.08)"
            strokeWidth="3"
            fill="none"
          />
          <path d="M38 0 C 42 30, 30 60, 46 100" stroke="rgb(255 255 255 / 0.06)" strokeWidth="2" fill="none" />
        </svg>
        <div
          aria-hidden
          className="absolute top-[28%] left-[30%] size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-(--accent)/25 bg-(--accent)/[0.06]"
        />
        {PINS.map((p, i) => (
          <span key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: p.top, left: p.left }}>
            {p.active && <span className="animate-pulse-ring absolute inset-0 rounded-full bg-(--accent)/50" />}
            <span
              className={
                p.active
                  ? 'relative block size-2.5 rounded-full bg-(--accent) ring-2 ring-ink-950'
                  : 'relative block size-1.5 rounded-full bg-fg-subtle'
              }
            />
          </span>
        ))}
      </div>
    </div>
  )
}

function Chip({ icon: Icon, active, children }: { icon?: typeof MapPin; active?: boolean; children: string }) {
  return (
    <span
      className={
        active
          ? 'inline-flex items-center gap-1 rounded-md border border-(--accent)/35 bg-(--accent)/10 px-2 py-1 text-[11px] text-(--accent)'
          : 'inline-flex items-center gap-1 rounded-md border border-line bg-white/[0.03] px-2 py-1 text-[11px] text-fg-muted'
      }
    >
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  )
}
