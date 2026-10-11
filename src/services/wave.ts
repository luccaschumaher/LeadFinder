import { must, toConversation, toMessage } from '@/lib/db'
import { DEMO_AI } from '@/config/app'
import { AppError } from '@/lib/errors'
import { invokeFunction } from '@/lib/functions'
import { supabase } from '@/lib/supabase'
import { delay, now, todayKey, uid } from '@/lib/utils'
import { currentUserId, dataStore } from '@/stores/data'
import { sessionStore } from '@/stores/session'
import type { ChatMessage, Conversation } from '@/types'

/**
 * LeadIA — assistente de prospecção e vendas.
 *
 * Conversas e mensagens ficam salvas no Supabase. As respostas vêm da edge function
 * lf-ai, que valida o plano Diamond e o limite diário antes de chamar a IA e salva a
 * resposta. Enquanto DEMO_AI estiver ligado, cada envio recebe um aviso explícito
 * ("serviço não conectado"), nunca uma resposta inventada. Avisos não são salvos.
 */

export const WAVE_NOT_CONNECTED =
  'A LeadIA ainda não está conectada a um serviço de inteligência artificial. Sua mensagem foi salva nesta conversa e poderá ser respondida quando a integração for ativada.'

/** Pede a resposta à IA (edge function lf-ai), que lê a conversa do banco e salva a resposta. */
async function requestCompletion(conversationId: string): Promise<ChatMessage> {
  if (DEMO_AI) {
    await delay(1100)
    throw new AppError('service_unavailable', WAVE_NOT_CONNECTED)
  }
  const mascot = sessionStore.get().user?.preferences.mascot ?? 'robot'

  const result = await invokeFunction<{ message: Record<string, unknown>; waveMessagesToday: number }>('lf-ai', {
    action: 'wave_chat',
    conversationId,
    mascot,
  })
  dataStore.set((s) => ({
    ...s,
    usage: { ...s.usage, waveMessages: { day: todayKey(), count: result.waveMessagesToday } },
  }))
  return toMessage(result.message)
}

function updateConversation(id: string, patch: (c: Conversation) => Conversation) {
  dataStore.set((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === id ? patch(c) : c)) }))
}

async function saveMessage(conversationId: string, role: ChatMessage['role'], content: string) {
  const row = must(
    await supabase
      .from('lf_messages')
      .insert({ conversation_id: conversationId, user_id: currentUserId(), role, content })
      .select()
      .single(),
  )
  void supabase
    .from('lf_conversations')
    .update({ updated_at: row.created_at })
    .eq('id', conversationId)
    .then(() => undefined)
  return toMessage(row)
}

async function complete(conversationId: string) {
  const conversation = dataStore.get().conversations.find((c) => c.id === conversationId)
  if (!conversation) return
  try {
    const reply = await requestCompletion(conversationId)
    updateConversation(conversationId, (c) => ({ ...c, messages: [...c.messages, reply], updatedAt: reply.createdAt }))
  } catch (error) {
    const text = error instanceof AppError ? error.message : 'Não foi possível obter uma resposta. Tente novamente.'
    const notice: ChatMessage = {
      id: uid('notice'),
      role: 'assistant',
      content: text,
      kind: 'notice',
      createdAt: now(),
    }
    updateConversation(conversationId, (c) => ({ ...c, messages: [...c.messages, notice] }))
  }
}

export const waveService = {
  isConnected: !DEMO_AI,

  /** Carrega as mensagens de uma conversa (só na primeira vez que ela é aberta). */
  async loadMessages(conversationId: string) {
    const conversation = dataStore.get().conversations.find((c) => c.id === conversationId)
    if (!conversation || conversation.loaded) return
    const rows = must(
      await supabase
        .from('lf_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(200),
    )
    const loaded = (rows ?? []).reverse().map(toMessage)
    updateConversation(conversationId, (c) => ({
      ...c,
      // Mensagens enviadas enquanto carregava continuam no fim.
      messages: [...loaded, ...c.messages.filter((m) => !loaded.some((l) => l.id === m.id))],
      loaded: true,
    }))
  },

  /** Envia uma mensagem. Cria a conversa se necessário e retorna o id dela. */
  async send(conversationId: string | null, text: string) {
    let id = conversationId
    if (!id) {
      const title = text.length > 48 ? `${text.slice(0, 48).trim()}…` : text
      const row = must(
        await supabase.from('lf_conversations').insert({ user_id: currentUserId(), title }).select().single(),
      )
      const conversation = toConversation(row, [])
      id = conversation.id
      dataStore.set((s) => ({ ...s, conversations: [conversation, ...s.conversations] }))
    }
    const targetId = id
    const message = await saveMessage(targetId, 'user', text.trim())
    updateConversation(targetId, (c) => ({ ...c, messages: [...c.messages, message], updatedAt: message.createdAt }))
    void complete(targetId)
    return targetId
  },

  /** Remove o último aviso e tenta obter a resposta novamente. */
  async retry(conversationId: string) {
    updateConversation(conversationId, (c) => {
      const last = c.messages[c.messages.length - 1]
      return last?.kind === 'notice' ? { ...c, messages: c.messages.slice(0, -1) } : c
    })
    await complete(conversationId)
  },

  async remove(conversationId: string) {
    must(await supabase.from('lf_conversations').delete().eq('id', conversationId))
    dataStore.set((s) => ({ ...s, conversations: s.conversations.filter((c) => c.id !== conversationId) }))
  },
}
