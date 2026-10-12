-- =============================================================================
-- LeadFinder — Limite de consultas do plano Free
--
-- Cada página de resultados é uma consulta paga à Serper (uma busca com filtros pode
-- usar até 3). O Free tem só 3 tokens por dia, então 6 consultas bastam para usá-los
-- mesmo com filtros, e evitam que contas grátis gastem muitos créditos.
-- Planos pagos continuam com 150 consultas por dia.
-- Rode no Supabase: SQL Editor › New query › Run.
-- =============================================================================

create or replace function public.lf_register_search()
returns int language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_day date := lf_today_br();
  v_plan text;
  v_limit int;
  v_row lf_daily_usage%rowtype;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select plan into v_plan from lf_profiles where id = v_uid;
  v_limit := case when v_plan = 'free' then 6 else 150 end;
  insert into lf_daily_usage (user_id, day) values (v_uid, v_day) on conflict do nothing;
  select * into v_row from lf_daily_usage where user_id = v_uid and day = v_day for update;
  if v_row.searches >= v_limit then raise exception 'search_limit'; end if;
  if v_row.last_search_at > now() - interval '2 seconds' then raise exception 'too_fast'; end if;
  update lf_daily_usage set searches = searches + 1, last_search_at = now() where user_id = v_uid and day = v_day;
  return v_row.searches + 1;
end $$;

revoke all on function public.lf_register_search() from public, anon;
grant execute on function public.lf_register_search() to authenticated;

select 'Free limitado a 6 consultas por dia' as resultado;
