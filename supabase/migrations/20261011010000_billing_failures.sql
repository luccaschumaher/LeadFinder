-- =============================================================================
-- LeadFinder — Rede de segurança dos pagamentos
--
-- A Cakto NÃO reenvia um aviso quando o servidor responde com erro. Para nenhum
-- pagamento se perder, todo aviso que não puder ser aplicado na hora (erro no
-- banco, plano ou e-mail não reconhecido) fica guardado em lf_billing_failures.
--
-- Para ver os pendentes:     select * from lf_billing_failures order by created_at desc;
-- Para reprocessar todos:    select lf_billing_retry_failures();
-- Rode no Supabase: SQL Editor › New query › Run.
-- =============================================================================

create table if not exists public.lf_billing_failures (
  id bigint generated always as identity primary key,
  event_id text not null unique,
  event text not null,
  kind text,
  plan text,
  email text,
  user_id uuid,
  reason text not null,
  offer text,
  product text,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

-- Só o servidor acessa (sem políticas = ninguém pelo app).
alter table public.lf_billing_failures enable row level security;

-- Reprocessa os avisos guardados que já têm plano e e-mail. Os que derem certo saem da lista.
create or replace function public.lf_billing_retry_failures()
returns table (event_id text, result text) language plpgsql security definer set search_path = public as $$
declare r record; v jsonb;
begin
  for r in select * from lf_billing_failures f where f.plan is not null and f.email is not null and f.kind is not null loop
    begin
      v := lf_billing_event(r.event_id, r.event, r.kind, r.plan, r.email, r.user_id);
      delete from lf_billing_failures where id = r.id;
      event_id := r.event_id; result := coalesce(v ->> 'plan', v ->> 'result', 'ok');
    exception when others then
      update lf_billing_failures set attempts = attempts + 1, reason = sqlerrm where id = r.id;
      event_id := r.event_id; result := 'erro: ' || sqlerrm;
    end;
    return next;
  end loop;
end $$;

revoke all on function public.lf_billing_retry_failures() from public, anon, authenticated;
grant execute on function public.lf_billing_retry_failures() to service_role;

-- Conferência: pg_cron agendado? (vence planos não renovados)
select case when to_regclass('cron.job') is null
  then 'pg_cron NÃO instalado: ative em Database › Extensions e rode de novo o 20261010000000_cakto_billing.sql'
  else 'pg_cron instalado' end as vencimento_automatico;
