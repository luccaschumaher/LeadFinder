import { FEATURE_PLAN, getPlan } from '@/config/plans'
import { dbError, must, toGeneration } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { delay, todayKey } from '@/lib/utils'
import { currentUserId, dataStore } from '@/stores/data'
import { sessionStore } from '@/stores/session'
import type { SiteBrief, SiteGeneration } from '@/types'
import { logActivity } from './activity'

/**
 * Gerador de Prompts para Sites.
 *
 * Hoje o prompt é MONTADO LOCALMENTE a partir de um modelo estruturado (engine
 * "template"), sem chamar nenhuma IA. Para conectar a IA, implemente
 * `generateWithAI` chamando um endpoint do backend (a chave fica no servidor)
 * e troque a chamada em `generate`.
 */

export function dailyUsage() {
  const { day, count } = dataStore.get().usage.siteGenerations
  return day === todayKey() ? count : 0
}

export function dailyLimit() {
  const user = sessionStore.get().user
  return user ? getPlan(user.plan).limits.siteGenerationsPerDay : 0
}

function buildTemplatePrompt(b: SiteBrief) {
  const lines: string[] = []
  const place = b.city ? ` em ${b.city}` : ''
  lines.push(
    `Crie um site profissional e responsivo para **${b.companyName}**, uma empresa do segmento de ${b.segment.toLowerCase()}${place}.`,
  )
  lines.push('')
  lines.push('## Objetivo principal')
  lines.push(b.goal)
  lines.push('')
  lines.push('## Identidade visual')
  lines.push(`- Estilo: ${b.style}.`)
  if (b.colors) lines.push(`- Paleta de cores: ${b.colors}.`)
  lines.push('- Tipografia moderna e legível, com boa hierarquia entre títulos e textos.')
  lines.push('- Layout limpo, com espaçamento generoso e foco na conversão.')
  lines.push('')
  lines.push('## Estrutura sugerida')
  lines.push(`1. Hero com o nome ${b.companyName}, uma proposta de valor clara e um botão de ação principal.`)
  lines.push('2. Seção "Sobre" apresentando a empresa e seus diferenciais.')
  lines.push(`3. Serviços ou produtos oferecidos, em cards objetivos.`)
  lines.push('4. Prova social: espaço para depoimentos reais de clientes (não invente depoimentos).')
  lines.push(`5. Contato com localização${place} e canais de atendimento.`)
  if (b.features.length) {
    lines.push('')
    lines.push('## Funcionalidades necessárias')
    b.features.forEach((f) => lines.push(`- ${f}`))
  }
  lines.push('')
  lines.push('## Requisitos técnicos')
  lines.push('- Totalmente responsivo (celular, tablet e desktop).')
  lines.push('- Carregamento rápido e boas práticas de SEO local (título, descrição e dados da empresa).')
  lines.push('- Textos em português do Brasil, com tom adequado ao público do segmento.')
  if (b.extra) {
    lines.push('')
    lines.push('## Informações adicionais')
    lines.push(b.extra)
  }
  return lines.join('\n')
}

export const siteGeneratorService = {
  async generate(brief: SiteBrief): Promise<SiteGeneration> {
    const limit = dailyLimit()
    if (limit === 0) {
      throw new AppError(
        'plan_required',
        `O Gerador de Prompts para Sites está disponível a partir do plano ${getPlan(FEATURE_PLAN.siteGenerator).name}.`,
      )
    }
    if (dailyUsage() >= limit) {
      throw new AppError('limit_reached', `Você usou as ${limit} gerações de hoje. O limite renova amanhã.`)
    }
    // O servidor valida o plano e o limite diário e registra o uso.
    const { data: count, error } = await supabase.rpc('lf_register_site_generation')
    if (error) {
      const err = dbError(error)
      if (err.code === 'limit_reached') {
        throw new AppError('limit_reached', `Você usou as ${limit} gerações de hoje. O limite renova amanhã.`)
      }
      throw err
    }
    await delay(1200)
    const row = must(
      await supabase
        .from('lf_site_generations')
        .insert({ user_id: currentUserId(), brief, output: buildTemplatePrompt(brief), engine: 'template' })
        .select()
        .single(),
    )
    const generation = toGeneration(row)
    dataStore.set((s) => ({
      ...s,
      generations: [generation, ...s.generations].slice(0, 30),
      usage: { ...s.usage, siteGenerations: { day: todayKey(), count: count as number } },
    }))
    logActivity('site_prompt', `Gerou um prompt de site para ${brief.companyName}`, '/app/gerador')
    return generation
  },

  async removeGeneration(id: string) {
    must(await supabase.from('lf_site_generations').delete().eq('id', id))
    dataStore.set((s) => ({ ...s, generations: s.generations.filter((g) => g.id !== id) }))
  },
}
