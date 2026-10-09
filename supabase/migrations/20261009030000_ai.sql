-- =============================================================================
-- LeadFinder — inteligência artificial (Gerador de Prompts e WaveIA)
-- Adiciona o contador diário de mensagens da WaveIA (limite de 30 por dia, só
-- no plano Diamond) e devolve esse uso junto com o restante em lf_usage_today.
-- Rode no Supabase: SQL Editor › New query › Run.
-- =============================================================================

alter table public.lf_daily_usage add column if not exists wave_messages int not null default 0;

-- Uso de hoje (agora com as mensagens da WaveIA)
drop function if exists public.lf_usage_today();
create function public.lf_usage_today()
returns table (day date, tokens_used int, site_generations int, wave_messages int)
language sql stable security definer set search_path = public as $$
  select lf_today_br(), coalesce(u.tokens_used, 0), coalesce(u.site_generations, 0), coalesce(u.wave_messages, 0)
  from (select 1) as one
  left join lf_daily_usage u on u.user_id = auth.uid() and u.day = lf_today_br()
$$;

-- Registra uma mensagem enviada à WaveIA (valida plano Diamond e o limite diário)
create or replace function public.lf_register_wave_message()
returns int language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_day date := lf_today_br();
  v_limit constant int := 30; -- mantenha em sincronia com src/config/plans.ts (waveMessagesPerDay)
  v_used int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if not lf_has_plan(v_uid, 'diamond') then raise exception 'plan_required'; end if;
  insert into lf_daily_usage (user_id, day) values (v_uid, v_day) on conflict do nothing;
  select wave_messages into v_used from lf_daily_usage where user_id = v_uid and day = v_day for update;
  if v_used >= v_limit then raise exception 'limit_reached'; end if;
  update lf_daily_usage set wave_messages = wave_messages + 1 where user_id = v_uid and day = v_day;
  return v_used + 1;
end $$;

revoke all on function public.lf_usage_today() from public, anon;
revoke all on function public.lf_register_wave_message() from public, anon;
grant execute on function public.lf_usage_today() to authenticated;
grant execute on function public.lf_register_wave_message() to authenticated;

-- Conferência
select * from public.lf_usage_today();
