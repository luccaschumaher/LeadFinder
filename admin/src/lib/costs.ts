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
}

export const DEFAULT_COSTS: CostSettings = {
  usdBrl: 5.5,
  serperCreditsPerRequest: 1,
  serperUsdPer1k: 1,
  serperCreditsPurchased: 2500,
  aiInputUsdPerM: 0.3,
  aiOutputUsdPerM: 2.5,
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
