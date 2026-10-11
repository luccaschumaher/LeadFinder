-- =============================================================================
-- LeadFinder — Painel administrativo (LeadFinder Admin)
--
-- 1. lf_admins: quem pode ver o painel. Troque o e-mail abaixo se a sua conta for outra.
-- 2. lf_api_usage: cada chamada às APIs pagas (Serper, Gemini...) fica anotada pelas
--    edge functions, com tokens de entrada/saída — base para o controle de gastos.
-- 3. Funções lf_admin_*: só respondem para administradores (conferido no banco), então
--    o painel não precisa de nenhuma chave secreta.
-- Rode no Supabase: SQL Editor › New query › Run.
-- =============================================================================

create table if not exists public.lf_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.lf_admins enable row level security;

-- >>> Sua conta de administrador (troque o e-mail se precisar) <<<
insert into public.lf_admins (user_id)
select id from auth.users where lower(email) = 'luccaschumasirius@gmail.com'
on conflict do nothing;

create table if not exists public.lf_api_usage (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  provider text not null,          -- 'serper' | 'google_places' | 'gemini' | 'anthropic'
  action text not null,            -- 'search' | 'site_prompt' | 'wave_chat'
  requests int not null default 1,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists lf_api_usage_created_idx on public.lf_api_usage (created_at);
create index if not exists lf_api_usage_user_idx on public.lf_api_usage (user_id, created_at);
-- Só as edge functions (service role) escrevem; ninguém lê pela API além das funções abaixo.
alter table public.lf_api_usage enable row level security;

create or replace function public.lf_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from lf_admins where user_id = auth.uid())
$$;

create or replace function public.lf_admin_guard()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not lf_is_admin() then raise exception 'forbidden'; end if;
end $$;

-- Preço mensal de cada plano (manter igual a src/config/plans.ts).
create or replace function public.lf_plan_price(p_plan text)
returns numeric language sql immutable set search_path = public as $$
  select case p_plan when 'silver' then 29.90 when 'gold' then 49.90 when 'diamond' then 99.90 else 0 end
$$;

-- Visão geral: totais, assinantes, receita mensal estimada e série diária de uso.
create or replace function public.lf_admin_summary(p_days int default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_days int := greatest(1, least(coalesce(p_days, 30), 365));
  v_from date := lf_today_br() - (v_days - 1);
  v_result jsonb;
begin
  perform lf_admin_guard();

  with paying as (
    select user_id, max(lf_plan_rank(plan)) as rank
    from lf_billing
    where user_id is not null and status in ('active', 'canceled') and expires_at > now()
    group by user_id
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
    group by 1
  ),
  usage as (
    select day, sum(searches) as searches, sum(tokens_used) as companies,
           sum(site_generations) as site_generations, sum(wave_messages) as wave_messages,
           count(*) filter (where tokens_used + site_generations + wave_messages + searches > 0) as active_users
    from lf_daily_usage where day >= v_from group by day
  ),
  signups as (
    select (created_at at time zone 'America/Sao_Paulo')::date as day, count(*) as new_users
    from auth.users where created_at >= (v_from::timestamp at time zone 'America/Sao_Paulo') group by 1
  )
  select jsonb_build_object(
    'days', v_days,
    'users_total', (select count(*) from lf_profiles),
    'users_by_plan', (select coalesce(jsonb_object_agg(plan, n), '{}'::jsonb) from (select plan, count(*) as n from lf_profiles group by plan) p),
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

-- Usuários: plano, assinatura e consumo de cada um no período.
create or replace function public.lf_admin_users(p_days int default 30)
returns table (
  id uuid, email text, name text, plan text, created_at timestamptz, last_sign_in_at timestamptz,
  billing_plan text, billing_status text, expires_at timestamptz,
  companies bigint, searches bigint, site_generations bigint, wave_messages bigint, active_days bigint,
  search_requests bigint, ai_calls bigint, input_tokens bigint, output_tokens bigint
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
         coalesce(au.input_tokens, 0), coalesce(au.output_tokens, 0)
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

-- Pagamentos: últimos avisos da Cakto e os que ficaram pendentes.
create or replace function public.lf_admin_payments(p_limit int default 100)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform lf_admin_guard();
  return jsonb_build_object(
    'events', (
      select coalesce(jsonb_agg(e order by e.created_at desc), '[]'::jsonb) from (
        select ev.id, ev.event, ev.email, ev.plan, ev.result, ev.created_at, u.email as account_email
        from lf_billing_events ev left join auth.users u on u.id = ev.user_id
        order by ev.created_at desc limit greatest(1, least(coalesce(p_limit, 100), 500))
      ) e
    ),
    'failures', (
      select coalesce(jsonb_agg(f order by f.created_at desc), '[]'::jsonb) from (
        select event_id, event, email, plan, reason, attempts, created_at from lf_billing_failures
      ) f
    )
  );
end $$;

revoke all on function public.lf_admin_guard() from public, anon, authenticated;
revoke all on function public.lf_admin_summary(int) from public, anon;
revoke all on function public.lf_admin_users(int) from public, anon;
revoke all on function public.lf_admin_payments(int) from public, anon;
revoke all on function public.lf_is_admin() from public, anon;
grant execute on function public.lf_admin_summary(int) to authenticated;
grant execute on function public.lf_admin_users(int) to authenticated;
grant execute on function public.lf_admin_payments(int) to authenticated;
grant execute on function public.lf_is_admin() to authenticated;

-- Conferência: sua conta precisa aparecer aqui.
select u.email as administrador from public.lf_admins a join auth.users u on u.id = a.user_id;
