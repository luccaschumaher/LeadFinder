export type Errors<T> = Partial<Record<keyof T, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(value: string) {
  if (!value.trim()) return 'Informe seu e-mail.'
  if (!EMAIL_RE.test(value.trim())) return 'Informe um e-mail válido.'
  return undefined
}

export function validateName(value: string) {
  if (!value.trim()) return 'Informe seu nome.'
  if (value.trim().length < 2) return 'O nome precisa ter pelo menos 2 caracteres.'
  return undefined
}

export function passwordChecks(value: string) {
  return [
    { label: 'Pelo menos 8 caracteres', ok: value.length >= 8 },
    { label: 'Uma letra', ok: /[a-zA-Z]/.test(value) },
    { label: 'Um número', ok: /\d/.test(value) },
  ]
}

export function validatePassword(value: string) {
  if (!value) return 'Crie uma senha.'
  if (!passwordChecks(value).every((c) => c.ok)) return 'A senha não atende aos requisitos.'
  return undefined
}

export function validateConfirm(password: string, confirm: string) {
  if (!confirm) return 'Confirme sua senha.'
  if (password !== confirm) return 'As senhas não coincidem.'
  return undefined
}

export function hasErrors<T>(errors: Errors<T>) {
  return Object.values(errors).some(Boolean)
}
