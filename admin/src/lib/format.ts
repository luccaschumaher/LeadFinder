const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const num = new Intl.NumberFormat('pt-BR')
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

export const money = (v: number) => brl.format(v)
export const int = (v: number) => num.format(Math.round(v))
export const short = (v: number) => (Math.abs(v) >= 10000 ? compact.format(v) : num.format(Math.round(v)))

export function date(iso: string | null | undefined, withTime = false) {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : { year: '2-digit' }),
  })
}

export function relative(iso: string | null | undefined, now: number) {
  if (!iso) return 'nunca'
  const days = Math.floor((now - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 30) return `há ${days} dias`
  return date(iso)
}

export const PLAN_LABEL: Record<string, string> = { free: 'Free', silver: 'Silver', gold: 'Gold', diamond: 'Diamond' }
