import type { Company, SearchQuery } from '@/types'

/**
 * GERADOR DE DADOS DE DEMONSTRAÇÃO.
 *
 * Cria empresas FICTÍCIAS a partir do segmento e da região pesquisados, apenas para
 * exercitar a interface enquanto a integração com a API de busca (Google Places)
 * não existe. Nenhum item representa uma empresa real:
 * - os nomes combinam palavras genéricas com o segmento digitado;
 * - os telefones usam o DDD inexistente "00";
 * - os sites usam o domínio reservado ".example" (RFC 2606);
 * - os endereços são marcados como demonstrativos.
 * Todos os registros têm `source: 'demo'` e aparecem identificados na interface.
 */

const NAME_WORDS = [
  'Aurora',
  'Horizonte',
  'Vértice',
  'Lumen',
  'Prisma',
  'Atlas',
  'Nobre',
  'Central',
  'Primor',
  'Essência',
  'Alameda',
  'Ponto Alto',
  'Raiz',
  'Contorno',
  'Farol',
  'Nova Era',
  'Mirante',
  'Sereno',
  'Origem',
  'Bússola',
  'Trilha',
  'Ateliê',
  'Clássico',
  'Estação',
  'Jardim',
  'Recanto',
  'Morada',
  'Sol Nascente',
  'Ipê',
  'Quintal',
]

const AREAS = ['Centro', 'Zona Norte', 'Zona Sul', 'Zona Leste', 'Zona Oeste', 'Região Central']

function hashString(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** PRNG determinístico: a mesma busca sempre gera os mesmos resultados. */
function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function singular(term: string) {
  return term
    .trim()
    .split(/\s+/)
    .map((w) => (w.length > 4 && /s$/i.test(w) && !/(ss|is|us)$/i.test(w) ? w.slice(0, -1) : w))
    .join(' ')
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function parseRegion(region: string) {
  const [city, state] = region.split(/[,/–-]/).map((p) => p.trim())
  return { city: capitalize(city || region.trim()), state: state ? state.toUpperCase().slice(0, 2) : undefined }
}

/** Gera a lista completa (já filtrada) para uma busca de demonstração. */
export function generateDemoCompanies(query: SearchQuery): Company[] {
  const segment = capitalize(singular(query.segment.toLowerCase()))
  const { city, state } = parseRegion(query.region)
  const seedKey = `${query.segment.toLowerCase().trim()}|${query.region.toLowerCase().trim()}`
  const rand = seeded(hashString(seedKey))
  const total = 18 + Math.floor(rand() * 30)
  const words = [...NAME_WORDS].sort(() => rand() - 0.5)

  const list: Company[] = []
  for (let i = 0; i < total; i++) {
    const word = words[i % words.length] + (i >= words.length ? ` ${Math.floor(i / words.length) + 1}` : '')
    const name = `${segment} ${word}`
    const hasPhone = rand() < 0.68
    const hasWebsite = rand() < 0.42
    const hasRating = rand() < 0.78
    const rating = hasRating ? Math.round((3.4 + rand() * 1.6) * 10) / 10 : undefined
    list.push({
      id: `demo_${hashString(`${seedKey}|${i}`).toString(36)}`,
      name,
      category: segment,
      address: `Endereço demonstrativo, ${100 + Math.floor(rand() * 1800)} · ${AREAS[Math.floor(rand() * AREAS.length)]}`,
      city,
      state,
      phone: hasPhone
        ? `(00) 9${String(Math.floor(rand() * 9000) + 1000)}-${String(Math.floor(rand() * 9000) + 1000)}`
        : undefined,
      website: hasWebsite ? `https://${slugify(name)}.example` : undefined,
      rating: rating !== undefined ? Math.min(rating, 5) : undefined,
      reviewCount: hasRating ? 4 + Math.floor(rand() * 380) : undefined,
      source: 'demo',
    })
  }

  const { onlyWithoutWebsite, onlyWithPhone, minRating } = query.filters
  return list.filter(
    (c) =>
      (!onlyWithoutWebsite || !c.website) &&
      (!onlyWithPhone || !!c.phone) &&
      (minRating === 0 || (c.rating ?? 0) >= minRating),
  )
}
