type ClassValue = string | false | null | undefined

/** Junta classes condicionais sem dependências externas. */
export function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(' ')
}
