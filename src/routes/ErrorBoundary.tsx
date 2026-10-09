import { RotateCcw, TriangleAlert } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ROUTES } from '@/config/routes'
import { StatusPage } from '@/pages/system/StatusPage'

interface State {
  error: Error | null
}

/** Captura erros inesperados de renderização e exibe uma tela de recuperação. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Ponto de integração com um serviço de monitoramento (ex.: Sentry).
    console.error('Erro inesperado:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <StatusPage
        icon={TriangleAlert}
        eyebrow="Erro inesperado"
        title="Algo deu errado"
        description="Ocorreu um erro ao exibir esta página. Seus dados estão preservados. Tente recarregar ou volte para o início."
        actions={
          <>
            <Button onClick={() => window.location.reload()}>
              <RotateCcw />
              Recarregar página
            </Button>
            <ButtonLink to={ROUTES.home} variant="secondary" onClick={() => this.setState({ error: null })}>
              Ir para o início
            </ButtonLink>
          </>
        }
      />
    )
  }
}
