# LeadFinder

SaaS para prospecção de empresas e venda de sites com inteligência artificial.

**Etapa 1:** estrutura do projeto, identidade visual e landing page.

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Motion (`motion/react`) · Lucide React · React Router · Geist (self-hosted via Fontsource)

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + build de produção
npm run lint     # oxlint
```

## Estrutura

```
src/
├── App.tsx                  # Router + MotionConfig (respeita redução de movimento)
├── index.css                # Tokens de design (@theme), base e utilitários
├── components/
│   ├── brand/Logo.tsx       # Símbolo SVG + logotipo
│   ├── ui/                  # Button, Container, Reveal, SectionHeading, Eyebrow…
│   └── landing/             # Navbar, Hero, HeroDashboard, Features, HowItWorks,
│       └── previews/        # Pricing, FinalCta, Footer + prévias dos módulos
├── config/
│   ├── routes.ts            # Todas as rotas da aplicação
│   ├── navigation.ts        # Links da navbar e do rodapé
│   └── plans.ts             # Planos, ordem e hasPlanAccess() (base de permissões)
├── hooks/useScrolled.ts
├── lib/cn.ts
├── pages/                   # LandingPage, UpcomingPage (rotas da próxima etapa)
└── routes/                  # AppRoutes, ScrollManager
```

## Identidade visual

- **Superfícies:** `ink-950` → `ink-600` (preto a grafite)
- **Destaque:** `electric-200` → `electric-700` (azul elétrico, base `#2F6BFF`)
- **Acentos dos módulos:** Encontrar Empresas (azul elétrico), Prompts (ciano), Gerador de Prompts para Sites (índigo), WaveIA (azul gelo)
- **Tipografia:** Geist Variable (texto) e Geist Mono (rótulos técnicos e números)
- **Símbolo:** eixo em "L" (a base de empresas), arco de radar (a busca) e ponto luminoso (a oportunidade encontrada)

## Próximas etapas

A estrutura já prevê, mas **não implementa**:

| Recurso | Onde vai entrar |
| --- | --- |
| Autenticação Supabase | `src/lib/supabase.ts`, `src/features/auth/`, rotas `ROUTES.signIn` / `ROUTES.signUp` |
| Dashboard protegida | `ROUTES.dashboard` + `<ProtectedRoute>` em `src/routes/` |
| Planos e permissões | `src/config/plans.ts` (`PlanId`, `PLAN_ORDER`, `hasPlanAccess`) |
| Busca via Google Places | `src/features/companies/` (chamadas por backend / edge function) |
| Histórico, favoritos e leads | `src/features/leads/` |
| Biblioteca de prompts | `src/features/prompts/` |
| Gerador de prompts com IA | `src/features/site-prompt-generator/` |
| WaveIA | `src/features/waveia/` |
| Pagamentos Cakto | Webhooks no backend; checkout a partir de `PLANS` |

As variáveis de ambiente previstas estão em `.env.example`.

## Conteúdo

- Os dados do painel do hero e das prévias dos módulos são **fictícios** e estão identificados como "Exemplo ilustrativo".
- Os planos mostram **"Preço a definir"** e apenas os benefícios **previstos** (editáveis em `src/config/plans.ts`).
- Não há depoimentos, avaliações, endereço, CNPJ ou resultados comerciais.
