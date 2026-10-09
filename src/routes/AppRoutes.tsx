import { Route, Routes } from 'react-router'
import { ROUTES } from '@/config/routes'
import { LandingPage } from '@/pages/LandingPage'
import { UpcomingPage } from '@/pages/UpcomingPage'

/*
 * Mapa de rotas. Próximas etapas:
 * - ROUTES.signIn / ROUTES.signUp → telas de autenticação (Supabase)
 * - ROUTES.dashboard → layout protegido (<ProtectedRoute>) com os módulos:
 *   empresas, leads, favoritos, histórico, prompts, gerador e WaveIA
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<LandingPage />} />
      <Route
        path={ROUTES.signIn}
        element={
          <UpcomingPage
            title="Acesso em breve"
            description="O login será liberado assim que a autenticação estiver pronta. Volte em breve para entrar na sua conta."
          />
        }
      />
      <Route
        path={ROUTES.signUp}
        element={
          <UpcomingPage
            title="Criação de conta em breve"
            description="Estamos preparando o cadastro do LeadFinder. Em breve você poderá criar sua conta gratuita."
          />
        }
      />
      <Route
        path={ROUTES.contact}
        element={
          <UpcomingPage
            eyebrow="Contato"
            title="Canais de contato em breve"
            description="Os canais oficiais de atendimento do LeadFinder serão publicados nesta página."
          />
        }
      />
      <Route
        path={ROUTES.privacy}
        element={
          <UpcomingPage
            eyebrow="Privacidade"
            title="Política de Privacidade"
            description="A Política de Privacidade do LeadFinder está sendo elaborada e será publicada antes do lançamento."
          />
        }
      />
      <Route
        path={ROUTES.terms}
        element={
          <UpcomingPage
            eyebrow="Termos"
            title="Termos de Uso"
            description="Os Termos de Uso do LeadFinder estão sendo elaborados e serão publicados antes do lançamento."
          />
        }
      />
      <Route
        path="*"
        element={
          <UpcomingPage
            eyebrow="Erro 404"
            title="Página não encontrada"
            description="O endereço acessado não existe ou foi movido."
          />
        }
      />
    </Routes>
  )
}
