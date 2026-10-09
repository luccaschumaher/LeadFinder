import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { authService } from './services/auth'

// Restaura a sessão do Supabase e carrega os dados do usuário (as rotas aguardam com uma tela de carregamento).
void authService.init()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
