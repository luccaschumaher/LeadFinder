export function uid(prefix = '') {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 18)
  return prefix ? `${prefix}_${rand}` : rand
}

export const now = () => new Date().toISOString()

/** Espera simulada (usada pelas partes que ainda são demonstração, como a busca e a IA). */
export function delay(ms = 600) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export function todayKey(date = new Date()) {
  return date.toLocaleDateString('sv-SE') // AAAA-MM-DD no fuso local
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const relFmt = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

export const formatDate = (iso: string) => dateFmt.format(new Date(iso)).replace(/ de /g, ' ').replace('.', '')
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso)).replace(',', ' às')

export function formatRelative(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return 'agora'
  if (abs < 3600) return relFmt.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return relFmt.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 7) return relFmt.format(Math.round(diff / 86400), 'day')
  return formatDate(iso)
}

export function formatRating(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString('pt-BR')} ${n === 1 ? one : many}`
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

/** Normaliza texto para buscas locais (sem acentos, minúsculo). */
export function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Copia texto; usa um método alternativo quando a Clipboard API não está disponível. */
export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.setAttribute('readonly', '')
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      const ok = document.execCommand('copy')
      el.remove()
      return ok
    } catch {
      return false
    }
  }
}

export function downloadFile(filename: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
