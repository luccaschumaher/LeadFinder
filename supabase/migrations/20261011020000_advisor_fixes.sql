-- =============================================================================
-- LeadFinder — Correções do Security Advisor do Supabase
-- Rode no Supabase: SQL Editor › New query › Run.
-- =============================================================================

-- 1. search_path fixo em todas as funções (evita que alguém troque o schema usado por elas).
alter function public.lf_plan_rank(text) set search_path = public;
alter function public.lf_plan_limits(text) set search_path = public;
alter function public.lf_today_br() set search_path = public;
alter function public.lf_protect_plan() set search_path = public;
alter function public.lf_touch_updated_at() set search_path = public;

-- 2. Funções de gatilho não precisam ser chamadas por ninguém pela API
--    (os gatilhos continuam funcionando normalmente).
revoke all on function public.lf_billing_on_profile() from public, anon, authenticated;
revoke all on function public.lf_enforce_prompt_limit() from public, anon, authenticated;
revoke all on function public.lf_handle_new_user() from public, anon, authenticated;
revoke all on function public.lf_protect_plan() from public, anon, authenticated;
revoke all on function public.lf_touch_updated_at() from public, anon, authenticated;

-- 3. lf_has_plan é usada pelas regras de acesso de usuários logados; visitantes não precisam dela.
revoke all on function public.lf_has_plan(uuid, text) from public, anon;
grant execute on function public.lf_has_plan(uuid, text) to authenticated;

-- 4. "Testar sem pagar" desligado de vez em produção: ninguém mais pode chamar a função.
--    (Para voltar a testar localmente: grant execute on function public.lf_simulate_plan(text) to authenticated;)
revoke all on function public.lf_simulate_plan(text) from public, anon, authenticated;

-- 5. rls_auto_enable é uma função automática do Supabase (liga RLS em tabelas novas).
--    Ela não precisa ser chamada pela API.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

select 'Correções aplicadas' as resultado;
