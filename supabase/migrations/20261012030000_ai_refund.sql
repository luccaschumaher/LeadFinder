-- =============================================================================
-- LeadFinder — Falha da IA não gasta o limite do dia
--
-- A mensagem da LeadIA (ou geração do Gerador) é contada antes de chamar a IA, para
-- ninguém burlar o limite. Se a IA falhar, a edge function lf-ai devolve a contagem
-- com esta função (só o servidor pode chamá-la).
-- Rode no Supabase: SQL Editor › New query › Run.
-- =============================================================================

create or replace function public.lf_refund_usage(p_user uuid, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind = 'wave_messages' then
    update lf_daily_usage set wave_messages = greatest(0, wave_messages - 1)
    where user_id = p_user and day = lf_today_br();
  elsif p_kind = 'site_generations' then
    update lf_daily_usage set site_generations = greatest(0, site_generations - 1)
    where user_id = p_user and day = lf_today_br();
  else
    raise exception 'invalid_kind';
  end if;
end $$;

revoke all on function public.lf_refund_usage(uuid, text) from public, anon, authenticated;
grant execute on function public.lf_refund_usage(uuid, text) to service_role;

select 'Devolução de cota da IA ativada' as resultado;
