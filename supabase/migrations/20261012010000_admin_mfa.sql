-- =============================================================================
-- LeadFinder — Painel administrativo exige verificação em duas etapas (MFA)
--
-- Os dados do painel só saem do banco quando a sessão foi confirmada com o código
-- do app autenticador (nível "aal2" do Supabase). Mesmo com a senha vazada, ninguém
-- vê nada sem o celular do administrador. O site principal não muda.
-- Rode no Supabase: SQL Editor › New query › Run (depois do 20261012000000_admin.sql).
-- =============================================================================

create or replace function public.lf_admin_guard()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not lf_is_admin() then raise exception 'forbidden'; end if;
  if coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then raise exception 'mfa_required'; end if;
end $$;

revoke all on function public.lf_admin_guard() from public, anon, authenticated;

select 'Painel protegido com verificação em duas etapas' as resultado;
