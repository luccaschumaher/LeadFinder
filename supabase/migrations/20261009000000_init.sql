-- =============================================================================
-- LeadFinder — esquema inicial
-- Tudo usa o prefixo lf_ para conviver com tabelas já existentes no projeto sem tocá-las.
-- Rode este arquivo inteiro no Supabase: Dashboard › SQL Editor › New query › Run.
-- Cada usuário só acessa os próprios dados (Row Level Security em todas as tabelas).
-- Plano, tokens e limites são validados aqui no banco, não no navegador.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Planos e limites (mantenha em sincronia com src/config/plans.ts)
-- -----------------------------------------------------------------------------
create or replace function public.lf_plan_rank(p_plan text)
returns int language sql immutable as $$
  select case p_plan when 'free' then 0 when 'silver' then 1 when 'gold' then 2 when 'diamond' then 3 else -1 end
$$;

-- prompts = null significa ilimitado
create or replace function public.lf_plan_limits(p_plan text)
returns table (tokens int, prompts int, site_generations int)
language sql immutable as $$
  select t.tokens, t.prompts, t.site_generations
  from (values
    ('free',    3,   0,             0),
    ('silver',  40,  5,             0),
    ('gold',    70,  10,            10),
    ('diamond', 120, null::integer, 20)
  ) as t(plan, tokens, prompts, site_generations)
  where t.plan = p_plan
$$;

-- "Hoje" no fuso de Brasília (tokens e gerações renovam à meia-noite)
create or replace function public.lf_today_br()
returns date language sql stable as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

-- -----------------------------------------------------------------------------
-- Configurações do app
-- -----------------------------------------------------------------------------
create table if not exists public.lf_app_settings (
  id int primary key default 1 check (id = 1),
  -- Permite o botão "Testar sem pagar". DESLIGUE (false) antes do lançamento.
  allow_plan_simulation boolean not null default true
);
insert into public.lf_app_settings (id) values (1) on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Perfis
-- -----------------------------------------------------------------------------
create table if not exists public.lf_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  avatar text check (avatar in ('robot', 'dragon', 'alien', 'puppy')),
  plan text not null default 'free' check (plan in ('free', 'silver', 'gold', 'diamond')),
  onboarding jsonb not null default '{"completed": false}'::jsonb,
  preferences jsonb not null default '{"reduceMotion": false, "notifications": {"weeklySummary": true, "productUpdates": true, "tokenAlerts": true}}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.lf_has_plan(p_user uuid, p_required text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select lf_plan_rank(plan) >= lf_plan_rank(p_required) from lf_profiles where id = p_user), false)
$$;

-- Cria o perfil automaticamente no cadastro
create or replace function public.lf_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.lf_profiles (id, name, avatar)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'avatar' in ('robot', 'dragon', 'alien', 'puppy')
      then new.raw_user_meta_data ->> 'avatar' end
  );
  return new;
end $$;

drop trigger if exists lf_on_auth_user_created on auth.users;
create trigger lf_on_auth_user_created after insert on auth.users
  for each row execute function public.lf_handle_new_user();

-- O usuário não pode mudar o próprio plano. Só o servidor (webhook da Cakto, com a
-- service role) ou a função de simulação podem.
create or replace function public.lf_protect_plan()
returns trigger language plpgsql as $$
begin
  if new.plan is distinct from old.plan
     and coalesce(auth.role(), '') <> 'service_role'
     and coalesce(current_setting('lf.allow_plan_change', true), '') <> 'on' then
    raise exception 'plan_change_not_allowed';
  end if;
  return new;
end $$;

drop trigger if exists lf_profiles_protect_plan on public.lf_profiles;
create trigger lf_profiles_protect_plan before update on public.lf_profiles
  for each row execute function public.lf_protect_plan();

-- -----------------------------------------------------------------------------
-- Uso diário (tokens e gerações) — escrito apenas pelas funções abaixo
-- -----------------------------------------------------------------------------
create table if not exists public.lf_daily_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  tokens_used int not null default 0,
  site_generations int not null default 0,
  primary key (user_id, day)
);

-- -----------------------------------------------------------------------------
-- Dados de prospecção
-- -----------------------------------------------------------------------------
create table if not exists public.lf_companies (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  category text not null default '',
  address text not null default '',
  city text not null default '',
  state text,
  phone text,
  website text,
  rating numeric(2, 1),
  review_count int,
  source text not null default 'demo' check (source in ('demo', 'google_places')),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.lf_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company_id text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'negotiating', 'converted', 'lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, company_id),
  foreign key (user_id, company_id) references public.lf_companies (user_id, id) on delete cascade
);

create table if not exists public.lf_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  company_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, company_id),
  foreign key (user_id, company_id) references public.lf_companies (user_id, id) on delete cascade
);

create table if not exists public.lf_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company_id text not null,
  text text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now(),
  foreign key (user_id, company_id) references public.lf_companies (user_id, id) on delete cascade
);

create table if not exists public.lf_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  segment text not null,
  region text not null,
  filters jsonb not null default '{}'::jsonb,
  result_count int not null default 0,
  tokens_used int not null default 0,
  source text not null default 'demo',
  created_at timestamptz not null default now()
);

create table if not exists public.lf_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  content text not null check (char_length(content) between 1 and 4000),
  category text not null check (category in ('first-contact', 'follow-up', 'proposal', 'objections', 'sites', 'other')),
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lf_site_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  brief jsonb not null,
  output text not null,
  engine text not null default 'template' check (engine in ('template', 'ai')),
  created_at timestamptz not null default now()
);

create table if not exists public.lf_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lf_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.lf_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  kind text not null default 'message' check (kind in ('message', 'notice')),
  created_at timestamptz not null default now()
);

create table if not exists public.lf_sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client text not null check (char_length(client) between 1 and 160),
  company_id text,
  service text not null default '',
  amount int not null check (amount > 0),
  date date not null,
  status text not null default 'paid' check (status in ('paid', 'pending')),
  notes text check (char_length(notes) <= 300),
  created_at timestamptz not null default now()
);

create table if not exists public.lf_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  label text not null,
  href text,
  created_at timestamptz not null default now()
);

-- Índices
create index if not exists lf_leads_user_idx on public.lf_leads (user_id);
create index if not exists lf_notes_user_company_idx on public.lf_notes (user_id, company_id);
create index if not exists lf_searches_user_idx on public.lf_searches (user_id, created_at desc);
create index if not exists lf_prompts_user_idx on public.lf_prompts (user_id);
create index if not exists lf_generations_user_idx on public.lf_site_generations (user_id, created_at desc);
create index if not exists lf_conversations_user_idx on public.lf_conversations (user_id, updated_at desc);
create index if not exists lf_messages_conversation_idx on public.lf_messages (conversation_id, created_at);
create index if not exists lf_sales_user_idx on public.lf_sales (user_id, date desc);
create index if not exists lf_activity_user_idx on public.lf_activity (user_id, created_at desc);

-- updated_at automático
create or replace function public.lf_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists lf_leads_touch on public.lf_leads;
create trigger lf_leads_touch before update on public.lf_leads for each row execute function public.lf_touch_updated_at();
drop trigger if exists lf_prompts_touch on public.lf_prompts;
create trigger lf_prompts_touch before update on public.lf_prompts for each row execute function public.lf_touch_updated_at();

-- Limite de prompts por plano
create or replace function public.lf_enforce_prompt_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_limit int;
  v_count int;
begin
  if not lf_has_plan(new.user_id, 'silver') then
    raise exception 'plan_required';
  end if;
  select l.prompts into v_limit from lf_plan_limits((select plan from lf_profiles where id = new.user_id)) l;
  if v_limit is not null then
    select count(*) into v_count from lf_prompts where user_id = new.user_id;
    if v_count >= v_limit then
      raise exception 'limit_reached';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists lf_prompts_limit on public.lf_prompts;
create trigger lf_prompts_limit before insert on public.lf_prompts for each row execute function public.lf_enforce_prompt_limit();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.lf_app_settings enable row level security;
alter table public.lf_profiles enable row level security;
alter table public.lf_daily_usage enable row level security;
alter table public.lf_companies enable row level security;
alter table public.lf_leads enable row level security;
alter table public.lf_favorites enable row level security;
alter table public.lf_notes enable row level security;
alter table public.lf_searches enable row level security;
alter table public.lf_prompts enable row level security;
alter table public.lf_site_generations enable row level security;
alter table public.lf_conversations enable row level security;
alter table public.lf_messages enable row level security;
alter table public.lf_sales enable row level security;
alter table public.lf_activity enable row level security;

drop policy if exists "settings_read" on public.lf_app_settings;
create policy "settings_read" on public.lf_app_settings for select to authenticated using (true);

drop policy if exists "profiles_select_own" on public.lf_profiles;
create policy "profiles_select_own" on public.lf_profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profiles_update_own" on public.lf_profiles;
create policy "profiles_update_own" on public.lf_profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "usage_select_own" on public.lf_daily_usage;
create policy "usage_select_own" on public.lf_daily_usage for select to authenticated using (user_id = auth.uid());

-- Tabelas comuns: o dono faz tudo com os próprios registros
do $$
declare t text;
begin
  foreach t in array array['lf_companies', 'lf_leads', 'lf_favorites', 'lf_notes', 'lf_searches', 'lf_prompts', 'lf_site_generations', 'lf_conversations', 'lf_messages', 'lf_activity']
  loop
    execute format('drop policy if exists "own_rows" on public.%I', t);
    execute format('create policy "own_rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- Financeiro: leitura e exclusão para o dono; criação/edição só a partir do Silver
drop policy if exists "sales_select_own" on public.lf_sales;
create policy "sales_select_own" on public.lf_sales for select to authenticated using (user_id = auth.uid());
drop policy if exists "sales_delete_own" on public.lf_sales;
create policy "sales_delete_own" on public.lf_sales for delete to authenticated using (user_id = auth.uid());
drop policy if exists "sales_insert_silver" on public.lf_sales;
create policy "sales_insert_silver" on public.lf_sales for insert to authenticated
  with check (user_id = auth.uid() and public.lf_has_plan(auth.uid(), 'silver'));
drop policy if exists "sales_update_silver" on public.lf_sales;
create policy "sales_update_silver" on public.lf_sales for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.lf_has_plan(auth.uid(), 'silver'));

-- -----------------------------------------------------------------------------
-- Funções chamadas pelo app
-- -----------------------------------------------------------------------------

-- Uso de hoje
create or replace function public.lf_usage_today()
returns table (day date, tokens_used int, site_generations int)
language sql stable security definer set search_path = public as $$
  select lf_today_br(), coalesce(u.tokens_used, 0), coalesce(u.site_generations, 0)
  from (select 1) as one
  left join lf_daily_usage u on u.user_id = auth.uid() and u.day = lf_today_br()
$$;

-- Debita tokens (1 por empresa exibida). Falha com 'insufficient_tokens' se passar do limite do dia.
-- Quando a busca real existir, esta função será chamada pela edge function do Google Places.
create or replace function public.lf_consume_tokens(p_amount int)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_day date := lf_today_br();
  v_limit int;
  v_used int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_amount is null or p_amount < 1 or p_amount > 60 then raise exception 'invalid_amount'; end if;
  select l.tokens into v_limit from lf_plan_limits((select plan from lf_profiles where id = v_uid)) l;
  insert into lf_daily_usage (user_id, day) values (v_uid, v_day) on conflict do nothing;
  select tokens_used into v_used from lf_daily_usage where user_id = v_uid and day = v_day for update;
  if v_used + p_amount > v_limit then raise exception 'insufficient_tokens'; end if;
  update lf_daily_usage set tokens_used = tokens_used + p_amount where user_id = v_uid and day = v_day;
  return v_used + p_amount;
end $$;

-- Registra uma geração do Gerador de Prompts para Sites (valida plano e limite diário)
create or replace function public.lf_register_site_generation()
returns int language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_day date := lf_today_br();
  v_limit int;
  v_used int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select l.site_generations into v_limit from lf_plan_limits((select plan from lf_profiles where id = v_uid)) l;
  if coalesce(v_limit, 0) = 0 then raise exception 'plan_required'; end if;
  insert into lf_daily_usage (user_id, day) values (v_uid, v_day) on conflict do nothing;
  select site_generations into v_used from lf_daily_usage where user_id = v_uid and day = v_day for update;
  if v_used >= v_limit then raise exception 'limit_reached'; end if;
  update lf_daily_usage set site_generations = site_generations + 1 where user_id = v_uid and day = v_day;
  return v_used + 1;
end $$;

-- Troca de plano sem pagamento ("Testar sem pagar"). Só funciona com allow_plan_simulation = true.
create or replace function public.lf_simulate_plan(p_plan text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not (select allow_plan_simulation from lf_app_settings where id = 1) then
    raise exception 'plan_simulation_disabled';
  end if;
  if lf_plan_rank(p_plan) < 0 then raise exception 'invalid_plan'; end if;
  perform set_config('lf.allow_plan_change', 'on', true);
  update lf_profiles set plan = p_plan where id = auth.uid();
end $$;

revoke all on function public.lf_consume_tokens(int) from public, anon;
revoke all on function public.lf_register_site_generation() from public, anon;
revoke all on function public.lf_simulate_plan(text) from public, anon;
revoke all on function public.lf_usage_today() from public, anon;
grant execute on function public.lf_consume_tokens(int) to authenticated;
grant execute on function public.lf_register_site_generation() to authenticated;
grant execute on function public.lf_simulate_plan(text) to authenticated;
grant execute on function public.lf_usage_today() to authenticated;

-- -----------------------------------------------------------------------------
-- Conferência: lista as tabelas do schema public e os gatilhos ligados ao cadastro
-- (auth.users). O resultado aparece embaixo do editor depois do "Run".
-- -----------------------------------------------------------------------------
select 'tabela'::text as tipo, table_name::text as nome
from information_schema.tables
where table_schema = 'public'
union all
select 'gatilho em auth.users'::text, tgname::text
from pg_trigger
where tgrelid = 'auth.users'::regclass and not tgisinternal
order by 1, 2;
