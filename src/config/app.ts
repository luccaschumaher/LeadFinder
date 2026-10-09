/**
 * Configuração geral do frontend.
 *
 * Autenticação, dados, tokens e limites já usam o Supabase. Continuam simulados:
 * - DEMO_SEARCH: a busca gera empresas fictícias até a edge function do Google Places existir;
 * - DEMO_AI: Gerador de Prompts (modelo local) e WaveIA (sem IA) até a integração com a Anthropic;
 * - PLAN_SIMULATION: mostra "Testar sem pagar" (o servidor também precisa permitir em lf_app_settings).
 */
export const DEMO_SEARCH = true
export const DEMO_AI = true
export const PLAN_SIMULATION = true

/** Empresas por chamada à fonte (máximo do Google Places Text Search). */
export const SEARCH_PAGE_SIZE = 20

/** Máximo de empresas por busca (limite do Google Places Text Search: 3 páginas de 20). */
export const MAX_RESULTS_PER_SEARCH = 60

export const STORAGE_PREFIX = 'lf'
