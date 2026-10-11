import { MotionConfig } from 'motion/react'
import { BrowserRouter } from 'react-router'
import { Toaster } from '@/components/ui/Toast'
import { AppRoutes } from '@/routes/AppRoutes'
import { ErrorBoundary } from '@/routes/ErrorBoundary'
import { ScrollManager } from '@/routes/ScrollManager'
import { ThemeSync } from '@/routes/ThemeSync'

export default function App() {
  return (
    // Respeita a preferência de "reduzir movimento" do sistema operacional.
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ErrorBoundary>
          <ScrollManager />
          <ThemeSync />
          <AppRoutes />
          <Toaster />
        </ErrorBoundary>
      </BrowserRouter>
    </MotionConfig>
  )
}
