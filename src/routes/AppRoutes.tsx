import { ArrowLeft, Compass, ShieldAlert } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '@/components/app/AppLayout'
import { ButtonLink } from '@/components/ui/Button'
import { ROUTES } from '@/config/routes'
import { LandingPage } from '@/pages/LandingPage'
import { StatusPage } from '@/pages/system/StatusPage'
import { GuestOnly, RequireAuth, RequireOnboarding } from './guards'

// Páginas carregadas sob demanda (code splitting por rota).
const DashboardPage = lazy(() => import('@/pages/app/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const SearchPage = lazy(() => import('@/pages/app/SearchPage').then((m) => ({ default: m.SearchPage })))
const CompanyPage = lazy(() => import('@/pages/app/CompanyPage').then((m) => ({ default: m.CompanyPage })))
const LeadsPage = lazy(() => import('@/pages/app/LeadsPage').then((m) => ({ default: m.LeadsPage })))
const FavoritesPage = lazy(() => import('@/pages/app/FavoritesPage').then((m) => ({ default: m.FavoritesPage })))
const HistoryPage = lazy(() => import('@/pages/app/HistoryPage').then((m) => ({ default: m.HistoryPage })))
const PromptsPage = lazy(() => import('@/pages/app/PromptsPage').then((m) => ({ default: m.PromptsPage })))
const FinancePage = lazy(() => import('@/pages/app/FinancePage').then((m) => ({ default: m.FinancePage })))
const SiteGeneratorPage = lazy(() =>
  import('@/pages/app/SiteGeneratorPage').then((m) => ({ default: m.SiteGeneratorPage })),
)
const WaveIAPage = lazy(() => import('@/pages/app/WaveIAPage').then((m) => ({ default: m.WaveIAPage })))
const PlansPage = lazy(() => import('@/pages/app/PlansPage').then((m) => ({ default: m.PlansPage })))
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const SignInPage = lazy(() => import('@/pages/auth/SignInPage').then((m) => ({ default: m.SignInPage })))
const SignUpPage = lazy(() => import('@/pages/auth/SignUpPage').then((m) => ({ default: m.SignUpPage })))
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPage = lazy(() =>
  import('@/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
)
const TermsPage = lazy(() => import('@/pages/legal/TermsPage').then((m) => ({ default: m.TermsPage })))
const PrivacyPage = lazy(() => import('@/pages/legal/PrivacyPage').then((m) => ({ default: m.PrivacyPage })))
const ContactPage = lazy(() => import('@/pages/legal/ContactPage').then((m) => ({ default: m.ContactPage })))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })))

export function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-ink-950" aria-busy="true" />}>
      <Routes>
        {/* Públicas */}
        <Route path={ROUTES.home} element={<LandingPage />} />
        <Route
          path={ROUTES.signIn}
          element={
            <GuestOnly>
              <SignInPage />
            </GuestOnly>
          }
        />
        <Route
          path={ROUTES.signUp}
          element={
            <GuestOnly>
              <SignUpPage />
            </GuestOnly>
          }
        />
        <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
        <Route path={ROUTES.contact} element={<ContactPage />} />
        <Route path={ROUTES.privacy} element={<PrivacyPage />} />
        <Route path={ROUTES.terms} element={<TermsPage />} />
        <Route
          path={ROUTES.unauthorized}
          element={
            <StatusPage
              icon={ShieldAlert}
              eyebrow="Erro 403"
              title="Acesso não autorizado"
              description="Você não tem permissão para acessar esta página. Entre com uma conta autorizada ou volte para o início."
              actions={
                <>
                  <ButtonLink to={ROUTES.signIn}>Entrar</ButtonLink>
                  <ButtonLink to={ROUTES.home} variant="secondary">
                    Voltar para o início
                  </ButtonLink>
                </>
              }
            />
          }
        />

        {/* Onboarding (autenticado) */}
        <Route
          path={ROUTES.onboarding}
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />

        {/* App autenticado */}
        <Route
          path={ROUTES.dashboard}
          element={
            <RequireAuth>
              <RequireOnboarding>
                <AppLayout />
              </RequireOnboarding>
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="buscar" element={<SearchPage />} />
          <Route path="empresas/:id" element={<CompanyPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="favoritos" element={<FavoritesPage />} />
          <Route path="historico" element={<HistoryPage />} />
          <Route path="prompts" element={<PromptsPage />} />
          <Route path="financeiro" element={<FinancePage />} />
          <Route path="gerador" element={<SiteGeneratorPage />} />
          <Route path="leadia" element={<WaveIAPage />} />
          <Route path="waveia" element={<Navigate to="/app/leadia" replace />} />
          <Route path="planos" element={<PlansPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
          <Route
            path="*"
            element={
              <div className="flex flex-col items-center py-24 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl border border-line-strong bg-ink-800 text-electric-300">
                  <Compass className="size-5" />
                </span>
                <h1 className="mt-6 text-2xl font-semibold tracking-tight text-fg">Página não encontrada</h1>
                <p className="mt-2 text-sm text-fg-muted">Este endereço não existe no LeadFinder.</p>
                <ButtonLink to={ROUTES.dashboard} variant="secondary" size="sm" className="mt-6">
                  <ArrowLeft />
                  Voltar para a visão geral
                </ButtonLink>
              </div>
            }
          />
        </Route>

        <Route
          path="*"
          element={
            <StatusPage
              icon={Compass}
              eyebrow="Erro 404"
              title="Página não encontrada"
              description="O endereço acessado não existe ou foi movido."
            />
          }
        />
      </Routes>
    </Suspense>
  )
}
