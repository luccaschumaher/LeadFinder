# LeadFinder

SaaS para prospecção de empresas e venda de sites com inteligência artificial.

**Estado atual:** autenticação, dados, tokens e limites no Supabase. Ainda simulados: a busca de empresas (dados fictícios até a integração com o Google Places), a IA (Gerador e WaveIA) e a ativação automática do plano após o pagamento (webhook da Cakto).

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Motion (`motion/react`) · Lucide React · React Router · Geist (Fontsource)

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + build de produção
npm run lint     # oxlint
```

Crie uma conta em `/criar-conta` (a conta fica no Supabase).

## Back-end (Supabase)

1. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
2. No Supabase, abra **SQL Editor › New query**, cole o conteúdo de `supabase/migrations/20261009000000_init.sql` e clique em **Run**.
3. Em **Authentication › URL Configuration**, defina o *Site URL* (ex.: `http://localhost:5173`) e adicione `http://localhost:5173/**` em *Redirect URLs*.

Todas as tabelas e funções usam o prefixo `lf_`. Cada usuário só acessa os próprios dados (RLS). Tokens diários, limites de prompts, gerações diárias e o acesso ao Financeiro são validados no banco. O usuário não consegue alterar o próprio plano; a troca sem pagamento usa `lf_simulate_plan` e é desligada com `update lf_app_settings set allow_plan_simulation = false;` antes do lançamento.

## Páginas

| Rota | Página |
| --- | --- |
| `/` | Landing page (hero, funcionalidades, como funciona, planos, perguntas frequentes) |
| `/criar-conta`, `/entrar`, `/recuperar-senha` | Cadastro, login e recuperação de senha |
| `/boas-vindas` | Onboarding (exibido uma única vez por conta) |
| `/app` | Visão geral (dashboard) |
| `/app/buscar` | Buscar empresas |
| `/app/empresas/:id` | Detalhes da empresa (anotações, status, análise com IA futura) |
| `/app/leads` | Meus Leads (status, filtros, ações em lote) |
| `/app/favoritos` | Favoritos |
| `/app/historico` | Histórico de buscas |
| `/app/prompts` | Biblioteca de prompts (Silver+) |
| `/app/financeiro` | Financeiro: registro de vendas e faturamento por semana (Silver+) |
| `/app/gerador` | Gerador de prompts para sites (Gold+) |
| `/app/waveia` | WaveIA (Diamond) |
| `/app/planos` | Planos e tokens |
| `/app/configuracoes` | Perfil e configurações |
| `/acesso-negado`, `*` | Acesso não autorizado e página não encontrada |

## Arquitetura

```
src/
├── config/        # app.ts (DEMO_MODE), plans.ts (limites e preços), routes.ts, navigation.ts
├── types/         # Tipos de domínio (User, Company, Lead, Prompt, Conversation…)
├── services/      # Camada de serviços: auth, companies, leads, prompts, siteGenerator, wave, billing
├── stores/        # Estado da sessão e dos dados do usuário (persistido por usuário)
├── data/          # Modelos de prompt e gerador de empresas de DEMONSTRAÇÃO
├── hooks/         # usePlan (limites, consumo e permissões), useScrolled
├── lib/           # store, storage, validação, erros, toasts, utilitários
├── components/
│   ├── ui/        # Button, Field, Dialog, Menu, Toast, Card, Badge, Skeleton…
│   ├── app/       # AppLayout (sidebar), PageHeader, avisos, ações de empresa, WaveAvatar
│   ├── auth/      # AuthLayout
│   └── landing/   # Seções da landing page
├── pages/         # Landing, auth, onboarding, app/*, system/*
└── routes/        # AppRoutes (code splitting), guards, ErrorBoundary, ScrollManager
```

Os componentes não acessam armazenamento nem regras de negócio diretamente: tudo passa por `src/services/`. Para integrar o backend, substitua a implementação de cada serviço mantendo as assinaturas.

## Planos

Definidos em `src/config/plans.ts`:

| | Free | Silver | Gold | Diamond |
| --- | --- | --- | --- | --- |
| Tokens por dia (1 token = 1 empresa exibida) | 3 | 40 | 70 | 120 |
| Biblioteca de prompts | Não | Até 5 | Até 10 | Ilimitada |
| Financeiro (controle de vendas) | Não | Sim | Sim | Sim |
| Gerações de prompts para sites/dia | 0 | 0 | 10 | 20 |
| WaveIA | Não | Não | Não | Sim |

Busca de empresas, Meus Leads, Favoritos e Histórico estão em todos os planos. A Biblioteca de prompts (incluindo os modelos do LeadFinder) começa no Silver. Cada empresa exibida consome 1 token (`TOKENS_PER_COMPANY`). Os tokens renovam todo dia à meia-noite, sem acumular. Cada chamada à fonte traz até 20 empresas; o que o saldo não cobre fica pendente e é exibido depois sem nova chamada paga.

Preços: Silver R$ 29,90/mês, Gold R$ 49,90/mês, Diamond R$ 99,90/mês. Os links de checkout da Cakto estão em `checkoutUrl`. A ativação do plano após o pagamento depende do webhook da Cakto no backend; em demonstração, "Testar sem pagar" troca o plano localmente.

## O que é demonstração

- **Busca de empresas** (`services/companies.ts` + `data/demo/companies.ts`): empresas **fictícias**, geradas a partir do termo pesquisado. Telefones com DDD 00, sites com domínio reservado `.example` e endereços marcados como demonstrativos. Todas aparecem com o selo "Demo".
- **Gerador de prompts para sites** (`services/siteGenerator.ts`): o prompt é montado por um modelo estruturado local, sem IA. A interface informa isso.
- **WaveIA** (`services/wave.ts`): nenhuma IA conectada. Cada mensagem recebe um aviso explícito de "serviço não conectado", nunca uma resposta inventada.
- **Cobrança** (`services/billing.ts`): troca de plano local, sem pagamento.

Para testar o estado de erro da busca, pesquise o segmento `__erro__`.

## Próximas integrações

| Integração | Onde |
| --- | --- |
| Google Places (via backend/edge function; chave nunca no cliente) | `services/companies.ts` → `fetchPage` |
| IA para o gerador de prompts | `services/siteGenerator.ts` |
| IA da WaveIA | `services/wave.ts` → `requestCompletion` |
| Análise de site com IA | `pages/app/CompanyPage.tsx` (card "Análise do site com IA") |
| Pagamentos Cakto + webhooks | `services/billing.ts` e `config/plans.ts` (`checkoutUrl`) |
| Personagens (avatar e mascote da WaveIA) | `components/mascots/` — robô, dragão, alienígena e cachorrinho em SVG animado |

Variáveis previstas em `.env.example`.
