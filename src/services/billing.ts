import { PLAN_SIMULATION } from '@/config/app'
import { getPlan } from '@/config/plans'
import { dbError } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { PlanId } from '@/types'
import { logActivity } from './activity'
import { sessionStore } from '@/stores/session'
import { authService } from './auth'

/**
 * Cobrança e troca de plano.
 *
 * Upgrade: o usuário é levado ao checkout da Cakto (`checkoutUrl` do plano) com o id da
 * conta em `?callback=`. Depois do pagamento, a edge function lf-cakto-webhook ativa o
 * plano no servidor; o app só relê o plano (authService.refreshPlan).
 * A troca simulada ("Testar sem pagar") usa a função `lf_simulate_plan`, que só
 * funciona enquanto `lf_app_settings.allow_plan_simulation` estiver ligado.
 */
export const billingService = {
  /** Abre o checkout da Cakto em uma nova aba. */
  openCheckout(planId: PlanId) {
    const url = getPlan(planId).checkoutUrl
    if (!url) throw new AppError('service_unavailable', 'O checkout deste plano ainda não foi configurado.')
    const checkout = new URL(url)
    const userId = sessionStore.get().user?.id
    if (userId) checkout.searchParams.set('callback', userId)
    window.open(checkout.toString(), '_blank', 'noopener,noreferrer')
  },

  /** Troca de plano sem pagamento (testes). */
  async simulateChange(planId: PlanId) {
    if (!PLAN_SIMULATION) throw new AppError('service_unavailable', 'A troca de plano sem pagamento está desativada.')
    const { error } = await supabase.rpc('lf_simulate_plan', { p_plan: planId })
    if (error) throw dbError(error)
    authService.setPlan(planId)
    logActivity('plan_changed', `Mudou para o plano ${getPlan(planId).name} (teste sem pagamento)`, '/app/planos')
  },
}
