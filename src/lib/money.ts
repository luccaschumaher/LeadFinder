const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** Formata centavos como reais: 150000 → "R$ 1.500,00". */
export const formatBRL = (cents: number) => brl.format(cents / 100)

/** Versão curta para eixos de gráfico: 150000 → "R$ 1,5 mil". */
export const formatBRLCompact = (cents: number) => brlCompact.format(cents / 100)

/** Converte o texto digitado ("1.500,90", "1500.9", "R$ 80") em centavos. Retorna NaN se inválido. */
export function parseBRL(input: string) {
  let s = input.replace(/[^\d.,-]/g, '')
  if (!s) return NaN
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  else if ((s.match(/\./g) ?? []).length > 1 || /\.\d{3}$/.test(s)) s = s.replace(/\./g, '')
  const value = Number(s)
  return Number.isFinite(value) ? Math.round(value * 100) : NaN
}

/** Segunda-feira (00:00, horário local) da semana de uma data. */
export function startOfWeek(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

/** Data local a partir de "AAAA-MM-DD" (sem deslocamento de fuso). */
export function fromDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
export const formatShortDate = (date: Date) => shortDate.format(date)

/** Início (timestamp) da semana atual e do mês atual, no horário local. */
export function currentPeriods() {
  const today = new Date()
  return {
    weekStart: startOfWeek(today).getTime(),
    monthStart: new Date(today.getFullYear(), today.getMonth(), 1).getTime(),
  }
}
