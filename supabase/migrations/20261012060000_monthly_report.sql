-- =============================================================================
-- LeadFinder — Relatório mensal por e-mail para os administradores
--
-- Todo dia 1º às 9h (Brasília) a edge function lf-monthly-report envia a cada
-- administrador o resumo do mês anterior: faturamento, taxas, reembolsos, custos,
-- lucro, assinantes e uso. Também dá para mandar na hora pelo painel admin.
-- Rode no Supabase: SQL Editor › New query › Run (depois dos SQLs do painel admin).
-- =============================================================================

-- Valor pago e taxa de cada venda (preenchidos pelo webhook da Cakto daqui pra frente).
alter table public.lf_billing_events add column if not exists amount numeric;
alter table public.lf_billing_events add column if not exists fees numeric;

-- Preços usados nas estimativas de custo, compartilhados entre os administradores.
create or replace function public.lf_admin_get_costs()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform lf_admin_guard();
  return (select value::jsonb from lf_private_settings where key = 'costs');
end $$;

create or replace function public.lf_admin_set_costs(p_costs jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform lf_admin_guard();
  insert into lf_private_settings (key, value) values ('costs', p_costs::text)
  on conflict (key) do update set value = excluded.value;
end $$;

-- Usada pela edge function para confirmar que quem pediu o relatório é administrador.
create or replace function public.lf_admin_check()
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  perform lf_admin_guard();
  return true;
end $$;

-- Números do período [p_from, p_to) para o relatório.
create or replace function public.lf_monthly_report_data(p_from date, p_to date)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  t_from timestamptz := (p_from::timestamp at time zone 'America/Sao_Paulo');
  t_to timestamptz := (p_to::timestamp at time zone 'America/Sao_Paulo');
  v_recoveries bigint := 0;
  v_result jsonb;
begin
  if to_regclass('auth.audit_log_entries') is not null then
    execute $q$ select count(*) from auth.audit_log_entries
      where payload ->> 'action' = 'user_recovery_requested' and created_at >= $1 and created_at < $2 $q$
      into v_recoveries using t_from, t_to;
  end if;

  with sales as (
    -- Uma linha por pedido (a Cakto pode mandar "compra aprovada" e "assinatura criada" do mesmo pedido).
    select split_part(e.id, ':', 2) as order_id, max(e.plan) as plan,
           max(coalesce(e.amount, lf_plan_price(e.plan))) as amount, max(coalesce(e.fees, 0)) as fees,
           bool_or(e.event = 'subscription_renewed') as renewal
    from lf_billing_events e
    where e.created_at >= t_from and e.created_at < t_to
      and e.event in ('purchase_approved', 'subscription_created', 'subscription_renewed')
      and (e.user_id is null or not lf_is_internal(e.user_id))
    group by 1
  ),
  refunds as (
    select coalesce(sum(coalesce(e.amount, lf_plan_price(e.plan))), 0) as total, count(*) as n
    from lf_billing_events e
    where e.created_at >= t_from and e.created_at < t_to and e.event in ('refund', 'chargeback')
      and (e.user_id is null or not lf_is_internal(e.user_id))
  ),
  paying as (
    select b.user_id, max(lf_plan_rank(b.plan)) as rank from lf_billing b
    where b.user_id is not null and not lf_is_internal(b.user_id)
      and b.status in ('active', 'canceled') and b.expires_at > now()
    group by b.user_id
  ),
  usage as (
    select coalesce(sum(searches), 0) as searches, coalesce(sum(tokens_used), 0) as companies,
           coalesce(sum(site_generations), 0) as site_generations, coalesce(sum(wave_messages), 0) as wave_messages,
           count(distinct user_id) filter (where tokens_used + site_generations + wave_messages + searches > 0) as active_users
    from lf_daily_usage where day >= p_from and day < p_to and not lf_is_internal(user_id)
  ),
  api as (
    select coalesce(sum(requests) filter (where provider in ('serper', 'google_places')), 0) as search_requests,
           coalesce(sum(requests) filter (where provider in ('gemini', 'anthropic')), 0) as ai_calls,
           coalesce(sum(input_tokens), 0) as input_tokens, coalesce(sum(output_tokens), 0) as output_tokens
    from lf_api_usage where created_at >= t_from and created_at < t_to
  )
  select jsonb_build_object(
    'from', p_from, 'to', p_to,
    'sales_count', (select count(*) from sales),
    'new_sales', (select count(*) from sales where not renewal),
    'renewals', (select count(*) from sales where renewal),
    'gross', (select coalesce(sum(amount), 0) from sales),
    'fees', (select coalesce(sum(fees), 0) from sales),
    'refunds', (select total from refunds),
    'refunds_count', (select n from refunds),
    'cancellations', (select count(*) from lf_billing_events e where e.created_at >= t_from and e.created_at < t_to
                        and e.event = 'subscription_canceled' and (e.user_id is null or not lf_is_internal(e.user_id))),
    'paying_now', (select count(*) from paying),
    'paying_by_plan', jsonb_build_object(
      'silver', (select count(*) from paying where rank = 1),
      'gold', (select count(*) from paying where rank = 2),
      'diamond', (select count(*) from paying where rank = 3)),
    'mrr', (select coalesce(sum(lf_plan_price(case rank when 1 then 'silver' when 2 then 'gold' when 3 then 'diamond' end)), 0) from paying),
    'users_total', (select count(*) from lf_profiles where not lf_is_internal(id)),
    'new_users', (select count(*) from auth.users where created_at >= t_from and created_at < t_to and not lf_is_internal(id)),
    'usage', (select to_jsonb(u) from usage u),
    'api', (select to_jsonb(a) from api a),
    'emails', (select count(*) from auth.users where created_at >= t_from and created_at < t_to) + v_recoveries
              + (select count(*) from lf_weekly_sent where sent_at >= t_from and sent_at < t_to),
    'costs', (select value::jsonb from lf_private_settings where key = 'costs'),
    'admins', (select coalesce(jsonb_agg(u.email), '[]'::jsonb) from lf_admins a join auth.users u on u.id = a.user_id)
  ) into v_result;
  return v_result;
end $$;

revoke all on function public.lf_admin_get_costs() from public, anon;
revoke all on function public.lf_admin_set_costs(jsonb) from public, anon;
revoke all on function public.lf_admin_check() from public, anon;
revoke all on function public.lf_monthly_report_data(date, date) from public, anon, authenticated;
grant execute on function public.lf_admin_get_costs() to authenticated;
grant execute on function public.lf_admin_set_costs(jsonb) to authenticated;
grant execute on function public.lf_admin_check() to authenticated;
grant execute on function public.lf_monthly_report_data(date, date) to service_role;

-- Agendamento: dia 1º de cada mês, 12:00 UTC = 9:00 em Brasília (relatório do mês anterior).
do $$
begin
  create extension if not exists pg_net;
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'lf_monthly_report';
  perform cron.schedule(
    'lf_monthly_report',
    '0 12 1 * *',
    $job$
      select net.http_post(
        url := 'https://dygmobvhmknshvgeyuqs.supabase.co/functions/v1/lf-monthly-report',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select value from public.lf_private_settings where key = 'cron_secret')
        ),
        body := '{"month":"previous"}'::jsonb
      )
    $job$
  );
exception when others then
  raise notice 'Agendamento não criado (%). Ative pg_cron e pg_net em Database › Extensions e rode de novo.', sqlerrm;
end $$;

select case when to_regclass('cron.job') is null then 'pg_cron NÃO instalado — ative em Database › Extensions'
  else 'Relatório mensal agendado para o dia 1º às 9h' end as resultado;
