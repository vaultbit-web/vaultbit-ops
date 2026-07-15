-- ============================================================
-- Endurecimiento RLS de job_offers (mínimo privilegio)
-- Hallazgo de auditoría (12/07/2026): las policies INSERT/DELETE para
-- `authenticated` eran superficie de ataque innecesaria. La app NUNCA
-- inserta ni borra ofertas como usuario: eso lo hace el workflow n8n con
-- la service_role key (que bypassa RLS). La app solo hace SELECT + UPDATE
-- del campo `status` (triaje). Retiramos INSERT/DELETE de `authenticated`.
--
-- Nota: SELECT y UPDATE se mantienen con el patrón `authenticated` del resto
-- del proyecto (consistencia). El endurecimiento por email/allowlist a nivel
-- RLS es una decisión transversal a todas las tablas, fuera de este cambio.
-- ============================================================

drop policy if exists "authenticated insert job_offers" on public.job_offers;
drop policy if exists "authenticated delete job_offers" on public.job_offers;
