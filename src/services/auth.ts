import type { User as SupabaseUser } from '@supabase/supabase-js'
import { dbError, must } from '@/lib/db'
import { AppError } from '@/lib/errors'
import { setRememberSession, supabase } from '@/lib/supabase'
import { loadUserData, unloadUserData } from '@/stores/data'
import { sessionStore } from '@/stores/session'
import type { AvatarId, PlanId, Preferences, User } from '@/types'

/**
 * Autenticação com o Supabase Auth. O perfil (nome, avatar, plano, preferências)
 * fica na tabela `lf_profiles`, criada automaticamente no cadastro.
 */

const defaultPreferences = (): Preferences => ({
  reduceMotion: false,
  notifications: { weeklySummary: true, productUpdates: true, tokenAlerts: true },
})

async function fetchProfile(authUser: SupabaseUser): Promise<User> {
  const row = must(await supabase.from('lf_profiles').select('*').eq('id', authUser.id).maybeSingle())
  if (!row) throw new AppError('not_found', 'Perfil não encontrado.')
  return {
    id: row.id,
    name: row.name,
    email: authUser.email ?? '',
    plan: row.plan as PlanId,
    avatar: row.avatar ?? undefined,
    createdAt: row.created_at,
    onboarding: row.onboarding ?? { completed: false },
    preferences: { ...defaultPreferences(), ...row.preferences },
  }
}

let loadedFor: string | null = null

/** Carrega perfil e dados de um usuário autenticado e marca a sessão como pronta. */
async function enterSession(authUser: SupabaseUser) {
  if (loadedFor === authUser.id && sessionStore.get().user) return
  loadedFor = authUser.id
  const [user] = await Promise.all([fetchProfile(authUser), loadUserData(authUser.id)])
  sessionStore.replace({ user, status: 'ready' })
}

function leaveSession() {
  loadedFor = null
  unloadUserData()
  sessionStore.replace({ user: null, status: 'ready' })
}

function authMessage(message: string) {
  if (/invalid login credentials/i.test(message))
    return new AppError('invalid_credentials', 'E-mail ou senha incorretos.')
  if (/email not confirmed/i.test(message))
    return new AppError(
      'invalid_credentials',
      'Confirme seu e-mail antes de entrar. Enviamos um link para a sua caixa de entrada.',
    )
  if (/already registered|already been registered/i.test(message))
    return new AppError('email_taken', 'Já existe uma conta com este e-mail.')
  if (/rate limit|too many/i.test(message))
    return new AppError('service_unavailable', 'Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.')
  if (/password/i.test(message))
    return new AppError('wrong_password', 'A senha não atende aos requisitos de segurança.')
  return new AppError('service_unavailable', 'Não foi possível concluir. Tente novamente em instantes.')
}

async function updateProfileRow(patch: Record<string, unknown>) {
  const current = sessionStore.get().user
  if (!current) throw new AppError('invalid_credentials', 'Sessão expirada. Entre novamente.')
  must(await supabase.from('lf_profiles').update(patch).eq('id', current.id).select('id'))
}

function patchUser(patch: (u: User) => User) {
  const current = sessionStore.get().user
  if (current) sessionStore.set((s) => ({ ...s, user: patch(current) }))
}

const origin = () => window.location.origin

export const authService = {
  /** Restaura a sessão salva e passa a acompanhar entradas e saídas. Chamado uma vez ao abrir o app. */
  async init() {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') leaveSession()
      else if (session?.user && event === 'SIGNED_IN') {
        // fora do callback para não bloquear o cliente do Supabase
        const authUser = session.user
        setTimeout(() => enterSession(authUser).catch(() => leaveSession()), 0)
      }
    })
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      try {
        await enterSession(data.session.user)
      } catch {
        leaveSession()
      }
    } else {
      sessionStore.replace({ user: null, status: 'ready' })
    }
  },

  /** Cadastro. Se o projeto exigir confirmação de e-mail, retorna `needsConfirmation`. */
  async signUp(input: { name: string; email: string; password: string; avatar?: AvatarId }) {
    setRememberSession(true)
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: { data: { name: input.name.trim(), avatar: input.avatar }, emailRedirectTo: `${origin()}/entrar` },
    })
    if (error) throw authMessage(error.message)
    // O Supabase devolve um usuário sem identidades quando o e-mail já existe (para não expor contas)
    if (data.user && data.user.identities?.length === 0)
      throw new AppError('email_taken', 'Já existe uma conta com este e-mail.')
    if (!data.session || !data.user) return { needsConfirmation: true as const }
    await enterSession(data.user)
    return { needsConfirmation: false as const }
  },

  async signIn(input: { email: string; password: string; remember: boolean }) {
    setRememberSession(input.remember)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    })
    if (error || !data.user) throw authMessage(error?.message ?? '')
    await enterSession(data.user)
    return sessionStore.get().user!
  },

  async signOut() {
    await supabase.auth.signOut()
    leaveSession()
  },

  /** Envia o e-mail com o link para criar uma nova senha. */
  async requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${origin()}/redefinir-senha`,
    })
    if (error) throw authMessage(error.message)
    return { sent: true }
  },

  /** Define a nova senha (usuário chegou pelo link de recuperação). */
  async setNewPassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw authMessage(error.message)
  },

  async updateProfile(input: { name: string; avatar?: AvatarId }) {
    const name = input.name.trim()
    const avatar = input.avatar ?? sessionStore.get().user?.avatar ?? null
    await updateProfileRow({ name, avatar })
    patchUser((u) => ({ ...u, name, avatar: avatar ?? undefined }))
    return sessionStore.get().user!
  },

  async changePassword(input: { current: string; next: string }) {
    const user = sessionStore.get().user
    if (!user) throw new AppError('invalid_credentials', 'Sessão expirada. Entre novamente.')
    const check = await supabase.auth.signInWithPassword({ email: user.email, password: input.current })
    if (check.error) throw new AppError('wrong_password', 'A senha atual está incorreta.')
    const { error } = await supabase.auth.updateUser({ password: input.next })
    if (error) throw authMessage(error.message)
  },

  /** Preferências são aplicadas na hora e salvas em segundo plano. */
  updatePreferences(patch: Partial<Preferences>) {
    const user = sessionStore.get().user
    if (!user) return
    const preferences = { ...user.preferences, ...patch }
    patchUser((u) => ({ ...u, preferences }))
    void updateProfileRow({ preferences }).catch(() => undefined)
  },

  async completeOnboarding(input: { goal?: string; services?: string[] }) {
    const onboarding = { completed: true, ...input }
    await updateProfileRow({ onboarding })
    patchUser((u) => ({ ...u, onboarding }))
  },

  /** Atualiza o plano em memória (após simulação ou confirmação do servidor). */
  setPlan(plan: PlanId) {
    patchUser((u) => ({ ...u, plan }))
  },

  /** Apaga os dados de prospecção da conta (mantém conta e plano). */
  async clearLocalData() {
    const user = sessionStore.get().user
    if (!user) return
    const tables = [
      'lf_leads',
      'lf_favorites',
      'lf_notes',
      'lf_searches',
      'lf_prompts',
      'lf_site_generations',
      'lf_conversations',
      'lf_sales',
      'lf_activity',
      'lf_companies',
    ]
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('user_id', user.id)
      if (error) throw dbError(error)
    }
    await loadUserData(user.id)
  },
}
