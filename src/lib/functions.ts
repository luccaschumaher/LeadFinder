import { AppError, type AppErrorCode } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

const CODES: Record<string, AppErrorCode> = {
  insufficient_tokens: 'insufficient_tokens',
  limit_reached: 'limit_reached',
  plan_required: 'plan_required',
  search_expired: 'not_found',
  not_found: 'not_found',
  unauthorized: 'invalid_credentials',
}

/**
 * Chama uma Edge Function do Supabase e traduz os erros dela (`{ error, message }`)
 * para AppError com mensagem amigável.
 */
export async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (!error) return data as T
  let payload: { error?: string; message?: string } = {}
  try {
    payload = (await (error as { context?: Response }).context?.json()) ?? {}
  } catch {
    // resposta sem corpo JSON
  }
  if (payload.message) throw new AppError(CODES[payload.error ?? ''] ?? 'service_unavailable', payload.message)
  throw new AppError('network', 'Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.')
}
