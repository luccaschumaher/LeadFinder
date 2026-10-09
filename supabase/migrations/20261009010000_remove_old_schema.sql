-- =============================================================================
-- LeadFinder — remove o código antigo do projeto (IRREVERSÍVEL)
-- Remove o gatilho de cadastro antigo (on_auth_user_created), a função que ele
-- chamava e as tabelas antigas profiles, plans e subscriptions.
-- Nada com prefixo lf_ é tocado. As contas de usuário (auth.users) continuam.
-- Rode no Supabase: SQL Editor › New query › Run.
-- =============================================================================

do $$
declare
  v_fn regprocedure;
begin
  -- função chamada pelo gatilho antigo (se existir)
  select t.tgfoid::regprocedure into v_fn
  from pg_trigger t
  where t.tgname = 'on_auth_user_created' and t.tgrelid = 'auth.users'::regclass;

  drop trigger if exists on_auth_user_created on auth.users;

  if v_fn is not null and v_fn::text not like '%lf\_%' then
    begin
      execute format('drop function %s', v_fn);
    exception when dependent_objects_still_exist then
      raise notice 'Função % mantida: ainda é usada por outro objeto.', v_fn;
    end;
  end if;
end $$;

drop table if exists public.subscriptions cascade;
drop table if exists public.plans cascade;
drop table if exists public.profiles cascade;

-- Conferência: deve listar só as tabelas lf_ e o gatilho lf_on_auth_user_created
select 'tabela'::text as tipo, table_name::text as nome
from information_schema.tables
where table_schema = 'public'
union all
select 'gatilho em auth.users'::text, tgname::text
from pg_trigger
where tgrelid = 'auth.users'::regclass and not tgisinternal
order by 1, 2;
