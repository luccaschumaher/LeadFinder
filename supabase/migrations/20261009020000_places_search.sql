-- =============================================================================
-- LeadFinder — busca real com Google Places
-- Guarda, por algumas horas, as empresas que o Google já devolveu mas que o
-- usuário ainda não pagou para ver (saldo de tokens insuficiente). Assim o
-- "carregar mais" não paga uma nova consulta ao Google.
-- Sem políticas de RLS: só a edge function lf-places-search (service role) acessa.
-- Rode no Supabase: SQL Editor › New query › Run.
-- =============================================================================

create table if not exists public.lf_search_sessions (
  id uuid primary key references public.lf_searches (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  query jsonb not null,
  pending jsonb not null default '[]'::jsonb,
  next_page_token text,
  pages_fetched int not null default 0,
  total_found int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists lf_search_sessions_user_idx on public.lf_search_sessions (user_id, updated_at);

alter table public.lf_search_sessions enable row level security;

-- Conferência
select 'lf_search_sessions criada' as resultado
where exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'lf_search_sessions');
