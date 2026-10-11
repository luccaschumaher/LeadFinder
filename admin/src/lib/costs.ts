import { useEffect, useState } from 'react'

/**
 * Preços usados para ESTIMAR os gastos. Ficam salvos só neste navegador e podem ser
 * ajustados na aba APIs. Confira os valores reais nos painéis da Serper e do Google AI Studio.
 */
export interface CostSettings {
  usdBrl: number
  /** Créditos da Serper gastos por consulta (página de resultados). */
  serperCreditsPerRequest: number
  /** Preço do pacote da Serper em US$ por 1.000 créditos. */
  serperUsdPer1k: number
  /** Total de créditos já comprados/ganhos na Serper (para calcular o saldo). */
  serperCreditsPurchased: number
  /** Gemini: US$ por 1 milhão de tokens. */
  aiInputUsdPerM: number
  aiOutputUsdPerM: number
  /** Custos fixos mensais (US$). Plano grátis = 0. */
  resendUsdPerMonth: number
  cloudflareUsdPerMonth: number
  supabaseUsdPerMonth: number
  /** Domínio (R$ por ano). */
  domainBrlPerYear: number
  /** Limites do plano do Resend (grátis: 3.000/mês e 100/dia). */
  resendMonthlyLimit: number
  resendDailyLimit: number
}

export const DEFAULT_COSTS: CostSettings = {
  usdBrl: 5.5,
  serperCreditsPerRequest: 1,
  serperUsdPer1k: 1,
  serperCreditsPurchased: 2500,
  aiInputUsdPerM: 0.3,
  aiOutputUsdPerM: 2.5,
  resendUsdPerMonth: 0,
  cloudflareUsdPerMonth: 0,
  supabaseUsdPerMonth: 0,
  domainBrlPerYear: 40,
  resendMonthlyLimit: 3000,
  resendDailyLimit: 100,
}

const KEY = 'lf-admin-costs'

function load(): CostSettings {
  try {
    return { ...DEFAULT_COSTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return DEFAULT_COSTS
  }
}

export function useCostSettings() {
  const [settings, setSettings] = useState<CostSettings>(load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {
      /* armazenamento indisponível: segue com os valores em memória */
    }
  }, [settings])
  return [settings, setSettings] as const
}

/** Custo em R$ das consultas de busca. */
export const searchCostBrl = (requests: number, c: CostSettings) =>
  ((requests * c.serperCreditsPerRequest) / 1000) * c.serperUsdPer1k * c.usdBrl

/** Custo em R$ dos tokens de IA. */
export const aiCostBrl = (input: number, output: number, c: CostSettings) =>
  ((input / 1e6) * c.aiInputUsdPerM + (output / 1e6) * c.aiOutputUsdPerM) * c.usdBrl

/** Custos fixos proporcionais ao período (dias). */
export function fixedCostsBrl(days: number, c: CostSettings) {
  const month = (usd: number) => ((usd * c.usdBrl) / 30) * days
  return {
    resend: month(c.resendUsdPerMonth),
    cloudflare: month(c.cloudflareUsdPerMonth),
    supabase: month(c.supabaseUsdPerMonth),
    domain: (c.domainBrlPerYear / 365) * days,
  }
}

/** Custo de cada serviço no período, do maior para o menor. */
export function costByService(t: { search: number; input: number; output: number }, days: number, c: CostSettings) {
  const f = fixedCostsBrl(days, c)
  return [
    { id: 'serper', label: 'Serper (busca)', value: searchCostBrl(t.search, c) },
    { id: 'gemini', label: 'Gemini (IA)', value: aiCostBrl(t.input, t.output, c) },
    { id: 'resend', label: 'Resend (e-mails)', value: f.resend },
    { id: 'cloudflare', label: 'Cloudflare (site)', value: f.cloudflare },
    { id: 'supabase', label: 'Supabase (banco)', value: f.supabase },
    { id: 'domain', label: 'Domínio', value: f.domain },
  ].sort((a, b) => b.value - a.value)
}
