-- =============================================================================
-- LeadFinder — Painel admin: e-mails enviados (Resend)
--
-- Conta os e-mails que o LeadFinder dispara: confirmação de cadastro, redefinição
-- de senha e resumo semanal. Usado para comparar com o limite grátis do Resend
-- (3.000 por mês e 100 por dia).
-- Rode no Supabase: SQL Editor › New query › Run.
-- =============================================================================

create or replace function public.lf_admin_email_stats(p_days int default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_days int := greatest(1, least(coalesce(p_days, 30), 365));
  v_now timestamptz := now();
  v_period timestamptz := ((lf_today_br() - (v_days - 1))::timestamp at time zone 'America/Sao_Paulo');
  v_month timestamptz := (date_trunc('month', lf_today_br())::timestamp at time zone 'America/Sao_Paulo');
  v_day timestamptz := (lf_today_br()::timestamp at time zone 'America/Sao_Paulo');
  r_period bigint := 0;
  r_month bigint := 0;
  r_day bigint := 0;
begin
  perform lf_admin_guard();

  -- Pedidos de nova senha ficam no registro de auditoria do Supabase Auth (se existir).
  if to_regclass('auth.audit_log_entries') is not null then
    execute $q$
      select count(*) filter (where created_at >= $1),
             count(*) filter (where created_at >= $2),
             count(*) filter (where created_at >= $3)
      from auth.audit_log_entries
      where payload ->> 'action' = 'user_recovery_requested' and created_at >= least($1, $2)
    $q$ into r_period, r_month, r_day using v_period, v_month, v_day;
  end if;

  return jsonb_build_object(
    'period', jsonb_build_object(
      'signups', (select count(*) from auth.users where created_at >= v_period),
      'recoveries', r_period,
      'weekly', (select count(*) from lf_weekly_sent where sent_at >= v_period)
    ),
    'month_total',
      (select count(*) from auth.users where created_at >= v_month) + r_month
      + (select count(*) from lf_weekly_sent where sent_at >= v_month),
    'today_total',
      (select count(*) from auth.users where created_at >= v_day) + r_day
      + (select count(*) from lf_weekly_sent where sent_at >= v_day),
    'checked_at', v_now
  );
end $$;

revoke all on function public.lf_admin_email_stats(int) from public, anon;
grant execute on function public.lf_admin_email_stats(int) to authenticated;

select 'Estatísticas de e-mail prontas' as resultado;
