import { must, toConversation, toMessage } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { delay, now, uid } from '@/lib/utils'
import { currentUserId, dataStore } from '@/stores/data'
import type { ChatMessage, Conversation } from '@/types'

/**
 * WaveIA — assistente de prospecção e vendas.
 *
 * Conversas e mensagens do usuário ficam salvas no Supabase. NENHUM serviço de IA está
 * conectado ainda: cada envio recebe um aviso explícito ("serviço não conectado"), nunca
 * uma resposta inventada. Os avisos não são salvos. Para integrar, implemente
 * `requestCompletion` chamando uma edge function (a chave da Anthropic fica no servidor).
 */

export const WAVE_NOT_CONNECTED =
  'A WaveIA ainda não está conectada a um serviço de inteligência artificial. Sua mensagem foi salva nesta conversa e poderá ser respondida quando a integração for ativada.'

async function requestCompletion(messages: ChatMessage[]): Promise<string> {
  void messages
  await delay(1100)
  throw new AppError('service_unavailable', WAVE_NOT_CONNECTED)
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
    const text = await requestCompletion(conversation.messages.filter((m) => m.kind !== 'notice'))
    const reply = await saveMessage(conversationId, 'assistant', text)
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
  isConnected: false,

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
