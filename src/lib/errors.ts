export type AppErrorCode =
  | 'invalid_credentials'
  | 'email_taken'
  | 'wrong_password'
  | 'insufficient_tokens'
  | 'limit_reached'
  | 'plan_required'
  | 'service_unavailable'
  | 'network'
  | 'not_found'

/** Erro de domínio com código estável, usado pelos serviços e tratado pela interface. */
export class AppError extends Error {
  code: AppErrorCode
  constructor(code: AppErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'AppError'
  }
}

export function errorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.') {
  if (error instanceof AppError) return error.message
  return fallback
}
