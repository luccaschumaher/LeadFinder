import { MotionConfig } from 'motion/react'
import { BrowserRouter } from 'react-router'
import { Toaster } from '@/components/ui/Toast'
import { AppRoutes } from '@/routes/AppRoutes'
import { ErrorBoundary } from '@/routes/ErrorBoundary'
import { ScrollManager } from '@/routes/ScrollManager'
import { useUser } from '@/stores/session'

export default function App() {
  const user = useUser()
  return (
    // Respeita a preferência do sistema e a opção "Reduzir animações" do usuário.
    <MotionConfig reducedMotion={user?.preferences.reduceMotion ? 'always' : 'user'}>
      <BrowserRouter>
        <ErrorBoundary>
          <ScrollManager />
          <AppRoutes />
          <Toaster />
        </ErrorBoundary>
      </BrowserRouter>
    </MotionConfig>
  )
}
