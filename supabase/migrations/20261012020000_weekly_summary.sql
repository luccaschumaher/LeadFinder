-- =============================================================================
-- LeadFinder — Resumo semanal por e-mail
--
-- Toda segunda às 9h (Brasília) o banco chama a edge function lf-weekly-summary, que
-- envia pelo Resend um e-mail personalizado para quem deixou "Resumo semanal" ligado
-- nas Configurações E usou o LeadFinder na semana (ninguém recebe e-mail vazio).
-- Só funciona depois de configurar o Resend (segredo RESEND_API_KEY na edge function).
-- Rode no Supabase: SQL Editor › New query › Run.
-- =============================================================================

-- Configurações internas (só o servidor lê). Guarda o segredo que autoriza o agendamento.
create table if not exists public.lf_private_settings (
  key text primary key,
  value text not null
);
alter table public.lf_private_settings enable row level security;
insert into public.lf_private_settings (key, value)
values ('cron_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

-- Quem já recebeu o resumo de cada semana (evita envio duplicado).
create table if not exists public.lf_weekly_sent (
  user_id uuid not null references auth.users (id) on delete cascade,
  week date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, week)
);
alter table public.lf_weekly_sent enable row level security;

-- Destinatários da semana com os números de cada um.
create or replace function public.lf_weekly_summary_data(p_week date)
returns table (
  user_id uuid, email text, name text, plan text,
  companies bigint, searches bigint, site_generations bigint, wave_messages bigint,
  new_leads bigint, converted_leads bigint, sales_count bigint, sales_cents bigint
) language sql stable security definer set search_path = public as $$
  with week_usage as (
    select d.user_id, sum(d.tokens_used) as companies, sum(d.searches) as searches,
           sum(d.site_generations) as site_generations, sum(d.wave_messages) as wave_messages
    from lf_daily_usage d where d.day >= p_week - 7 and d.day < p_week
    group by d.user_id
  )
  select p.id, u.email::text, p.name, p.plan,
         coalesce(w.companies, 0)::bigint, coalesce(w.searches, 0)::bigint,
         coalesce(w.site_generations, 0)::bigint, coalesce(w.wave_messages, 0)::bigint,
         (select count(*) from lf_leads l where l.user_id = p.id and l.created_at > now() - interval '7 days'),
         (select count(*) from lf_leads l where l.user_id = p.id and l.status = 'converted' and l.updated_at > now() - interval '7 days'),
         (select count(*) from lf_sales s where s.user_id = p.id and s.created_at > now() - interval '7 days'),
         (select coalesce(sum(s.amount), 0) from lf_sales s where s.user_id = p.id and s.created_at > now() - interval '7 days')
  from lf_profiles p
  join auth.users u on u.id = p.id and u.email_confirmed_at is not null
  join week_usage w on w.user_id = p.id
  where coalesce(p.preferences -> 'notifications' ->> 'weeklySummary', 'true') <> 'false'
    and (w.companies + w.searches + w.site_generations + w.wave_messages) > 0
    and not exists (select 1 from lf_weekly_sent ws where ws.user_id = p.id and ws.week = p_week)
  order by (w.companies + w.searches + w.site_generations + w.wave_messages) desc
$$;

revoke all on function public.lf_weekly_summary_data(date) from public, anon, authenticated;
grant execute on function public.lf_weekly_summary_data(date) to service_role;

-- Agendamento: segunda-feira 12:00 UTC = 9:00 em Brasília.
do $$
begin
  create extension if not exists pg_net;
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'lf_weekly_summary';
  perform cron.schedule(
    'lf_weekly_summary',
    '0 12 * * 1',
    $job$
      select net.http_post(
        url := 'https://dygmobvhmknshvgeyuqs.supabase.co/functions/v1/lf-weekly-summary',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select value from public.lf_private_settings where key = 'cron_secret')
        ),
        body := '{}'::jsonb
      )
    $job$
  );
exception when others then
  raise notice 'Agendamento não criado (%). Ative pg_cron e pg_net em Database › Extensions e rode de novo.', sqlerrm;
end $$;

select case when to_regclass('cron.job') is null then 'pg_cron NÃO instalado — ative em Database › Extensions'
  else 'Resumo semanal agendado para segunda às 9h' end as resultado;
