import { MotionConfig } from 'motion/react'
import { BrowserRouter } from 'react-router'
import { AppRoutes } from '@/routes/AppRoutes'
import { ScrollManager } from '@/routes/ScrollManager'

export default function App() {
  return (
    // reducedMotion="user" respeita a preferência de redução de movimento do sistema.
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ScrollManager />
        <AppRoutes />
      </BrowserRouter>
    </MotionConfig>
  )
}
