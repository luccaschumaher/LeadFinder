-- =============================================================================
-- LeadFinder — Painel admin ignora contas internas (teste e administrador)
--
-- Contas de teste (luccaschumasirius+...@gmail.com) e contas de administrador não são
-- clientes: ficam fora de todos os números do painel (usuários, planos, assinantes,
-- receita, uso e custos). Na aba Usuários elas aparecem só com "Mostrar contas internas".
-- Para marcar outra conta como teste:
--   insert into lf_test_accounts (user_id) select id from auth.users where email = '...';
-- Rode no Supabase: SQL Editor › New query › Run (depois do 20261012010000_admin_mfa.sql).
-- =============================================================================

create table if not exists public.lf_test_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.lf_test_accounts enable row level security;

insert into public.lf_test_accounts (user_id)
select id from auth.users where lower(email) like 'luccaschumasirius+%@gmail.com'
on conflict do nothing;

create or replace function public.lf_is_internal(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from lf_test_accounts where user_id = p_user)
      or exists (select 1 from lf_admins where user_id = p_user)
$$;
revoke all on function public.lf_is_internal(uuid) from public, anon, authenticated;

create or replace function public.lf_admin_summary(p_days int default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_days int := greatest(1, least(coalesce(p_days, 30), 365));
  v_from date := lf_today_br() - (v_days - 1);
  v_result jsonb;
begin
  perform lf_admin_guard();

  with customers as (
    select id, plan from lf_profiles where not lf_is_internal(id)
  ),
  paying as (
    select b.user_id, max(lf_plan_rank(b.plan)) as rank
    from lf_billing b
    where b.user_id is not null and not lf_is_internal(b.user_id)
      and b.status in ('active', 'canceled') and b.expires_at > now()
    group by b.user_id
  ),
  days as (
    select generate_series(v_from, lf_today_br(), interval '1 day')::date as day
  ),
  api as (
    select (created_at at time zone 'America/Sao_Paulo')::date as day,
           sum(requests) filter (where provider in ('serper', 'google_places')) as search_requests,
           sum(requests) filter (where provider in ('gemini', 'anthropic')) as ai_calls,
           sum(input_tokens) as input_tokens,
           sum(output_tokens) as output_tokens
    from lf_api_usage
    where created_at >= (v_from::timestamp at time zone 'America/Sao_Paulo')
      and (user_id is null or not lf_is_internal(user_id))
    group by 1
  ),
  usage as (
    select day, sum(searches) as searches, sum(tokens_used) as companies,
           sum(site_generations) as site_generations, sum(wave_messages) as wave_messages,
           count(*) filter (where tokens_used + site_generations + wave_messages + searches > 0) as active_users
    from lf_daily_usage where day >= v_from and not lf_is_internal(user_id) group by day
  ),
  signups as (
    select (created_at at time zone 'America/Sao_Paulo')::date as day, count(*) as new_users
    from auth.users
    where created_at >= (v_from::timestamp at time zone 'America/Sao_Paulo') and not lf_is_internal(id)
    group by 1
  )
  select jsonb_build_object(
    'days', v_days,
    'users_total', (select count(*) from customers),
    'users_by_plan', (select coalesce(jsonb_object_agg(plan, n), '{}'::jsonb) from (select plan, count(*) as n from customers group by plan) p),
    'paying_users', (select count(*) from paying),
    'mrr', (select coalesce(sum(lf_plan_price(case rank when 1 then 'silver' when 2 then 'gold' when 3 then 'diamond' end)), 0) from paying),
    'serper_requests_all_time', (select coalesce(sum(requests), 0) from lf_api_usage where provider = 'serper'),
    'billing_failures', (select count(*) from lf_billing_failures),
    'daily', (
      select jsonb_agg(jsonb_build_object(
        'day', d.day,
        'search_requests', coalesce(a.search_requests, 0),
        'ai_calls', coalesce(a.ai_calls, 0),
        'input_tokens', coalesce(a.input_tokens, 0),
        'output_tokens', coalesce(a.output_tokens, 0),
        'searches', coalesce(u.searches, 0),
        'companies', coalesce(u.companies, 0),
        'site_generations', coalesce(u.site_generations, 0),
        'wave_messages', coalesce(u.wave_messages, 0),
        'active_users', coalesce(u.active_users, 0),
        'new_users', coalesce(s.new_users, 0)
      ) order by d.day)
      from days d
      left join api a on a.day = d.day
      left join usage u on u.day = d.day
      left join signups s on s.day = d.day
    )
  ) into v_result;
  return v_result;
end $$;

-- A lista de usuários ganha a coluna "internal" (o painel esconde essas contas por padrão).
drop function if exists public.lf_admin_users(int);
create function public.lf_admin_users(p_days int default 30)
returns table (
  id uuid, email text, name text, plan text, created_at timestamptz, last_sign_in_at timestamptz,
  billing_plan text, billing_status text, expires_at timestamptz,
  companies bigint, searches bigint, site_generations bigint, wave_messages bigint, active_days bigint,
  search_requests bigint, ai_calls bigint, input_tokens bigint, output_tokens bigint,
  internal boolean
) language plpgsql stable security definer set search_path = public as $$
declare
  v_from date := lf_today_br() - (greatest(1, least(coalesce(p_days, 30), 365)) - 1);
begin
  perform lf_admin_guard();
  return query
  select p.id, u.email::text, p.name, p.plan, p.created_at, u.last_sign_in_at,
         b.plan, b.status, b.expires_at,
         coalesce(du.companies, 0), coalesce(du.searches, 0), coalesce(du.site_generations, 0),
         coalesce(du.wave_messages, 0), coalesce(du.active_days, 0),
         coalesce(au.search_requests, 0), coalesce(au.ai_calls, 0),
         coalesce(au.input_tokens, 0), coalesce(au.output_tokens, 0),
         lf_is_internal(p.id)
  from lf_profiles p
  join auth.users u on u.id = p.id
  left join lateral (
    select lb.plan, lb.status, lb.expires_at from lf_billing lb
    where lb.user_id = p.id order by (lb.status in ('active', 'canceled') and lb.expires_at > now()) desc,
      lf_plan_rank(lb.plan) desc, lb.expires_at desc limit 1
  ) b on true
  left join lateral (
    select sum(d.tokens_used)::bigint as companies, sum(d.searches)::bigint as searches,
           sum(d.site_generations)::bigint as site_generations, sum(d.wave_messages)::bigint as wave_messages,
           count(*) filter (where d.tokens_used + d.site_generations + d.wave_messages + d.searches > 0)::bigint as active_days
    from lf_daily_usage d where d.user_id = p.id and d.day >= v_from
  ) du on true
  left join lateral (
    select sum(a.requests) filter (where a.provider in ('serper', 'google_places'))::bigint as search_requests,
           sum(a.requests) filter (where a.provider in ('gemini', 'anthropic'))::bigint as ai_calls,
           sum(a.input_tokens)::bigint as input_tokens, sum(a.output_tokens)::bigint as output_tokens
    from lf_api_usage a where a.user_id = p.id and a.created_at >= (v_from::timestamp at time zone 'America/Sao_Paulo')
  ) au on true
  order by p.created_at desc;
end $$;

revoke all on function public.lf_admin_summary(int) from public, anon;
revoke all on function public.lf_admin_users(int) from public, anon;
grant execute on function public.lf_admin_summary(int) to authenticated;
grant execute on function public.lf_admin_users(int) to authenticated;

-- Conferência: contas que ficam fora dos números
select u.email as conta_interna,
       case when exists (select 1 from lf_admins a where a.user_id = u.id) then 'administrador' else 'teste' end as tipo
from auth.users u where public.lf_is_internal(u.id) order by 1;
