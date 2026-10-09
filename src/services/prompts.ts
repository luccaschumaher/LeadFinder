import { FEATURE_PLAN, getPlan } from '@/config/plans'
import { categoryLabel } from '@/data/promptTemplates'
import { dbError, must, toPrompt } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { currentUserId, dataStore } from '@/stores/data'
import { sessionStore } from '@/stores/session'
import type { PromptCategory } from '@/types'
import { logActivity } from './activity'

export interface PromptInput {
  title: string
  content: string
  category: PromptCategory
}

export function promptLimit() {
  const user = sessionStore.get().user
  return user ? getPlan(user.plan).limits.savedPrompts : 0
}

/** Biblioteca de prompts. O limite do plano também é validado no banco (trigger lf_enforce_prompt_limit). */
export const promptService = {
  canCreate() {
    return dataStore.get().prompts.length < promptLimit()
  },

  async create(input: PromptInput) {
    const limit = promptLimit()
    if (limit === 0) {
      throw new AppError(
        'plan_required',
        `A Biblioteca de prompts está disponível a partir do plano ${getPlan(FEATURE_PLAN.promptLibrary).name}.`,
      )
    }
    if (dataStore.get().prompts.length >= limit) {
      throw new AppError('limit_reached', `Você atingiu o limite de ${limit} prompts do seu plano.`)
    }
    const { data, error } = await supabase
      .from('lf_prompts')
      .insert({
        user_id: currentUserId(),
        title: input.title.trim(),
        content: input.content.trim(),
        category: input.category,
      })
      .select()
      .single()
    if (error) {
      const err = dbError(error)
      if (err.code === 'limit_reached') {
        throw new AppError('limit_reached', `Você atingiu o limite de ${limit} prompts do seu plano.`)
      }
      throw err
    }
    const prompt = toPrompt(data)
    dataStore.set((s) => ({ ...s, prompts: [prompt, ...s.prompts] }))
    logActivity(
      'prompt_created',
      `Criou o prompt "${prompt.title}" (${categoryLabel(prompt.category)})`,
      '/app/prompts',
    )
    return prompt
  },

  async update(id: string, input: PromptInput) {
    const row = must(
      await supabase
        .from('lf_prompts')
        .update({ title: input.title.trim(), content: input.content.trim(), category: input.category })
        .eq('id', id)
        .select()
        .single(),
    )
    dataStore.set((s) => ({ ...s, prompts: s.prompts.map((p) => (p.id === id ? toPrompt(row) : p)) }))
  },

  async remove(id: string) {
    must(await supabase.from('lf_prompts').delete().eq('id', id))
    dataStore.set((s) => ({ ...s, prompts: s.prompts.filter((p) => p.id !== id) }))
  },

  /** Favoritar é aplicado na hora e desfeito se o servidor recusar. */
  toggleFavorite(id: string) {
    const prompt = dataStore.get().prompts.find((p) => p.id === id)
    if (!prompt) return
    const favorite = !prompt.favorite
    const apply = (value: boolean) =>
      dataStore.set((s) => ({ ...s, prompts: s.prompts.map((p) => (p.id === id ? { ...p, favorite: value } : p)) }))
    apply(favorite)
    void supabase
      .from('lf_prompts')
      .update({ favorite })
      .eq('id', id)
      .then(({ error }) => {
        if (error) apply(!favorite)
      })
  },
}
