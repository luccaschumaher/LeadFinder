/**
 * Configuração geral do frontend.
 *
 * Autenticação, dados, tokens e limites já usam o Supabase. Continuam simulados:
 * - DEMO_SEARCH: a busca gera empresas fictícias até a edge function lf-places-search estar publicada;
 * - DEMO_AI: Gerador de Prompts (modelo local) e LeadIA (sem IA) até a edge function lf-ai estar publicada;
 * - PLAN_SIMULATION: mostra "Testar sem pagar" (o servidor também precisa permitir em lf_app_settings).
 */
/** Ligue a busca real com VITE_DEMO_SEARCH=false depois de publicar a edge function lf-places-search. */
export const DEMO_SEARCH = import.meta.env.VITE_DEMO_SEARCH !== 'false'
/** Ligue a IA real com VITE_DEMO_AI=false depois de publicar a edge function lf-ai com o segredo. */
export const DEMO_AI = import.meta.env.VITE_DEMO_AI !== 'false'
/** "Testar sem pagar": só para desenvolvimento (VITE_PLAN_SIMULATION=true). Em produção os planos vêm da Cakto. */
export const PLAN_SIMULATION = import.meta.env.VITE_PLAN_SIMULATION === 'true'

/** Empresas por chamada à fonte (máximo do Google Places Text Search). */
export const SEARCH_PAGE_SIZE = 20

/** Máximo de empresas por busca (limite do Google Places Text Search: 3 páginas de 20). */
export const MAX_RESULTS_PER_SEARCH = 60

export const STORAGE_PREFIX = 'lf'
