-- =============================================================================
-- LeadFinder — Reforço de segurança para produção
--
-- 1. Desliga o "Testar sem pagar": com ele ligado, qualquer usuário vira Diamond
--    de graça chamando lf_simulate_plan. Planos agora só mudam pela Cakto (ou por
--    SQL feito por você no painel).
-- 2. Limite de buscas: buscas que não encontram nada não gastam tokens, mas gastam
--    créditos da Serper. Sem limite, alguém poderia repetir buscas vazias sem fim.
--    O contador fica em lf_daily_usage (o usuário não consegue apagar nem editar).
-- Rode no Supabase: SQL Editor › New query › Run.
-- =============================================================================

update public.lf_app_settings set allow_plan_simulation = false where id = 1;

alter table public.lf_daily_usage add column if not exists searches int not null default 0;
alter table public.lf_daily_usage add column if not exists last_search_at timestamptz;

-- Registra uma consulta à fonte de dados. Chamada pela edge function lf-places-search
-- antes de cada busca (inclusive "carregar mais"). Limites por dia: Free 15, pagos 150;
-- e no máximo uma consulta a cada 2 segundos.
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
  v_limit := case when v_plan = 'free' then 15 else 150 end;
  insert into lf_daily_usage (user_id, day) values (v_uid, v_day) on conflict do nothing;
  select * into v_row from lf_daily_usage where user_id = v_uid and day = v_day for update;
  if v_row.searches >= v_limit then raise exception 'search_limit'; end if;
  if v_row.last_search_at > now() - interval '2 seconds' then raise exception 'too_fast'; end if;
  update lf_daily_usage set searches = searches + 1, last_search_at = now() where user_id = v_uid and day = v_day;
  return v_row.searches + 1;
end $$;

revoke all on function public.lf_register_search() from public, anon;
grant execute on function public.lf_register_search() to authenticated;


-- 3. Tamanho máximo das mensagens da LeadIA (o app já limita a 2.000 caracteres).
--    Evita mensagens gigantes inseridas direto no banco para encarecer a IA.
alter table public.lf_messages drop constraint if exists lf_messages_content_len;
alter table public.lf_messages add constraint lf_messages_content_len check (char_length(content) <= 12000) not valid;

-- Conferência
select allow_plan_simulation as simulacao_ligada from public.lf_app_settings where id = 1;
