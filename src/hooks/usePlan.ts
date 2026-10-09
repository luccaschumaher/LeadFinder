import { FEATURE_PLAN, getPlan, hasPlanAccess } from '@/config/plans'
import { todayKey } from '@/lib/utils'
import { tokensUsedToday } from '@/services/companies'
import { useData } from '@/stores/data'
import { useCurrentUser } from '@/stores/session'

/** Plano atual, limites e consumo do usuário. */
export function usePlan() {
  const user = useCurrentUser()
  const usage = useData((s) => s.usage)
  const promptCount = useData((s) => s.prompts.length)
  const plan = getPlan(user.plan)
  const { limits } = plan

  const tokensUsed = Math.min(tokensUsedToday(usage), limits.tokens)
  const siteGenerationsToday = usage.siteGenerations.day === todayKey() ? usage.siteGenerations.count : 0

  return {
    plan,
    limits,
    tokens: { used: tokensUsed, total: limits.tokens, balance: limits.tokens - tokensUsed },
    prompts: { used: promptCount, total: limits.savedPrompts },
    siteGenerations: { used: siteGenerationsToday, total: limits.siteGenerationsPerDay },
    waveMessages: {
      used: usage.waveMessages.day === todayKey() ? usage.waveMessages.count : 0,
      total: limits.waveMessagesPerDay,
    },
    can: (feature: keyof typeof FEATURE_PLAN) => hasPlanAccess(user.plan, FEATURE_PLAN[feature]),
  }
}
