-- =============================================================================
-- LeadFinder — Cobrança pela Cakto
--
-- A edge function lf-cakto-webhook recebe os eventos da Cakto e chama
-- lf_billing_event. Cada compra vira uma linha em lf_billing (uma por e-mail e
-- plano), com validade. O plano do perfil é sempre o MAIOR plano válido do
-- usuário, recalculado a cada evento e de hora em hora (vencimentos).
--
-- - compra aprovada / assinatura criada ou renovada: ativa e estende a validade;
-- - assinatura cancelada: continua valendo até o fim do período já pago;
-- - reembolso / chargeback: remove o acesso na hora.
--
-- Pagamentos de quem ainda não tem conta ficam guardados pelo e-mail e são
-- aplicados automaticamente quando a pessoa se cadastra com esse e-mail.
-- =============================================================================

create table if not exists public.lf_billing (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete cascade,
  email text not null,
  plan text not null check (plan in ('silver', 'gold', 'diamond')),
  status text not null check (status in ('active', 'canceled', 'revoked', 'expired')),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  unique (email, plan)
);
create index if not exists lf_billing_user_idx on public.lf_billing (user_id);

-- Eventos já processados (a Cakto pode enviar o mesmo evento mais de uma vez).
create table if not exists public.lf_billing_events (
  id text primary key,
  event text not null,
  email text,
  plan text,
  user_id uuid,
  result text,
  created_at timestamptz not null default now()
);

-- Só o servidor (service role) lê e escreve essas tabelas.
alter table public.lf_billing enable row level security;
alter table public.lf_billing_events enable row level security;

-- Usuário vê as próprias assinaturas (somente leitura).
drop policy if exists lf_billing_select_own on public.lf_billing;
create policy lf_billing_select_own on public.lf_billing for select using (user_id = auth.uid());

-- Maior plano válido do usuário ('free' se nenhum).
create or replace function public.lf_billing_best_plan(p_user uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select plan from lf_billing
      where user_id = p_user and status in ('active', 'canceled') and expires_at > now()
      order by lf_plan_rank(plan) desc limit 1),
    'free')
$$;

-- Aplica no perfil o plano calculado a partir das assinaturas.
create or replace function public.lf_billing_sync(p_user uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_plan text := lf_billing_best_plan(p_user);
begin
  perform set_config('lf.allow_plan_change', 'on', true);
  update lf_profiles set plan = v_plan where id = p_user and plan is distinct from v_plan;
  return v_plan;
end $$;

-- Processa um evento da Cakto. p_kind: 'activate' | 'cancel' | 'revoke'.
create or replace function public.lf_billing_event(
  p_event_id text, p_event text, p_kind text, p_plan text, p_email text, p_user uuid
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(trim(p_email));
  v_user uuid;
  v_plan text;
begin
  insert into lf_billing_events (id, event, email, plan) values (p_event_id, p_event, v_email, p_plan)
    on conflict (id) do nothing;
  if not found then return jsonb_build_object('result', 'duplicate'); end if;

  if p_kind not in ('activate', 'cancel', 'revoke') or lf_plan_rank(p_plan) < 1 or coalesce(v_email, '') = '' then
    raise exception 'invalid_billing_event';
  end if;

  -- Quem pagou: pelo id enviado no link do checkout; senão, pelo e-mail da compra.
  select id into v_user from auth.users where id = p_user;
  if v_user is null then
    select id into v_user from auth.users where lower(email) = v_email limit 1;
  end if;

  if p_kind = 'activate' then
    insert into lf_billing (user_id, email, plan, status, expires_at)
      values (v_user, v_email, p_plan, 'active', now() + interval '33 days')
    on conflict (email, plan) do update set
      user_id = coalesce(excluded.user_id, lf_billing.user_id),
      status = 'active',
      expires_at = greatest(
        case when lf_billing.status = 'revoked' then now() else lf_billing.expires_at end,
        excluded.expires_at),
      updated_at = now();
  else
    update lf_billing set
      status = case when p_kind = 'revoke' then 'revoked' else 'canceled' end,
      user_id = coalesce(user_id, v_user),
      updated_at = now()
    where email = v_email and plan = p_plan and status <> 'revoked';
  end if;

  -- Um e-mail diferente do da conta ainda conta para o usuário identificado pelo link.
  select coalesce(v_user, (select user_id from lf_billing where email = v_email and plan = p_plan)) into v_user;
  if v_user is not null then v_plan := lf_billing_sync(v_user); end if;

  update lf_billing_events set user_id = v_user, result = coalesce(v_plan, 'pending') where id = p_event_id;
  return jsonb_build_object('result', 'ok', 'user', v_user, 'plan', v_plan);
end $$;

-- Vence assinaturas sem renovação e recalcula o plano dos afetados.
create or replace function public.lf_billing_expire()
returns integer language plpgsql security definer set search_path = public as $$
declare r record; n integer := 0;
begin
  for r in
    update lf_billing set status = 'expired', updated_at = now()
    where status in ('active', 'canceled') and expires_at <= now()
    returning user_id
  loop
    if r.user_id is not null then perform lf_billing_sync(r.user_id); n := n + 1; end if;
  end loop;
  return n;
end $$;

-- No cadastro: vincula pagamentos feitos antes com o mesmo e-mail e já aplica o plano.
create or replace function public.lf_billing_on_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  select lower(email) into v_email from auth.users where id = new.id;
  update lf_billing set user_id = new.id where user_id is null and email = v_email;
  if found then new.plan := lf_billing_best_plan(new.id); end if;
  return new;
end $$;

drop trigger if exists lf_profiles_billing on public.lf_profiles;
create trigger lf_profiles_billing before insert on public.lf_profiles
  for each row execute function public.lf_billing_on_profile();

revoke all on function public.lf_billing_best_plan(uuid) from public, anon, authenticated;
revoke all on function public.lf_billing_sync(uuid) from public, anon, authenticated;
revoke all on function public.lf_billing_event(text, text, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.lf_billing_expire() from public, anon, authenticated;
grant execute on function public.lf_billing_event(text, text, text, text, text, uuid) to service_role;
grant execute on function public.lf_billing_expire() to service_role;

-- Verificação de vencimentos de hora em hora (pg_cron). Se a extensão não estiver
-- disponível, ative em Database › Extensions › pg_cron e rode este bloco de novo.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'lf_billing_expire';
  perform cron.schedule('lf_billing_expire', '7 * * * *', 'select public.lf_billing_expire()');
exception when others then
  raise notice 'pg_cron indisponível: %', sqlerrm;
end $$;
