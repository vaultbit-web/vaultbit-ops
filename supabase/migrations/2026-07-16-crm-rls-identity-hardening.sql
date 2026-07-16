-- ============================================================
-- Endurecimiento RLS del CRM: de `authenticated` (rol) a identidad
-- Proyecto Supabase: YOUR-PROJECT-REF (VaultBit Asesoría)
--
-- PROBLEMA (advisor Supabase + memoria vaultbit-ops-rls-critico):
-- estas tablas guardan PII y datos comerciales pero autorizaban con
-- `USING (true)` para el rol `authenticated`. Si los signups de Supabase
-- Auth estuvieran abiertos, cualquiera que se registrara obtendría un JWT
-- `authenticated` y podría leer/escribir el CRM vía PostgREST.
--
-- SOLUCIÓN: gatear por IDENTIDAD con public.is_authorized() (allowlist
-- authorized_users, ya usada por audit_leads). Solo un usuario cuyo email
-- esté en la allowlist accede. Cierra el hueco AUNQUE los signups sigan
-- abiertos (defensa que no depende de un ajuste del panel).
--
-- SEGURIDAD DEL CAMBIO (verificado antes de aplicar):
--  * Estas 9 tablas solo las tocan: (a) el Ops autenticado con email
--    allowlisted (server actions que llaman a isEmailAllowed), y
--    (b) service_role (n8n/seeds), que BYPASSA RLS y no se ve afectado.
--  * La web pública (Astro) NO lee estas tablas.
--  * El webhook de Cal (anon) solo escribe en cal_bookings, que NO se toca.
--  * founder@example.com está en authorized_users → conserva acceso total.
--
-- NOTA: cualquier email añadido a la env ALLOWED_EMAILS del Ops debe estar
-- también en authorized_users, o ese usuario entrará a la app pero la BD le
-- negará estas tablas. Ampliar con:  insert into public.authorized_users(email)
-- values ('otro@email') on conflict do nothing;
--
-- REVERSIBLE: para volver atrás, recrear cada policy con USING (true) TO
-- authenticated (estado anterior).
-- ============================================================

-- ── Tablas con una única policy ALL permisiva ───────────────
-- contracts
drop policy if exists "auth_all_contracts" on public.contracts;
create policy "authorized all contracts" on public.contracts
  for all to authenticated
  using (public.is_authorized()) with check (public.is_authorized());

-- contract_templates
drop policy if exists "auth_all_contract_templates" on public.contract_templates;
create policy "authorized all contract_templates" on public.contract_templates
  for all to authenticated
  using (public.is_authorized()) with check (public.is_authorized());

-- email_log
drop policy if exists "auth_all_email_log" on public.email_log;
create policy "authorized all email_log" on public.email_log
  for all to authenticated
  using (public.is_authorized()) with check (public.is_authorized());

-- quotes
drop policy if exists "auth_all_quotes" on public.quotes;
create policy "authorized all quotes" on public.quotes
  for all to authenticated
  using (public.is_authorized()) with check (public.is_authorized());

-- pricing_tiers
drop policy if exists "auth_all_pricing_tiers" on public.pricing_tiers;
create policy "authorized all pricing_tiers" on public.pricing_tiers
  for all to authenticated
  using (public.is_authorized()) with check (public.is_authorized());

-- pricing_modifiers
drop policy if exists "auth_all_pricing_modifiers" on public.pricing_modifiers;
create policy "authorized all pricing_modifiers" on public.pricing_modifiers
  for all to authenticated
  using (public.is_authorized()) with check (public.is_authorized());

-- service_pricing
drop policy if exists "auth_all_service_pricing" on public.service_pricing;
create policy "authorized all service_pricing" on public.service_pricing
  for all to authenticated
  using (public.is_authorized()) with check (public.is_authorized());

-- ── crm_notes: 4 policies (se preserva el self-check de created_by) ──
drop policy if exists "authenticated_users_select_crm_notes" on public.crm_notes;
drop policy if exists "authenticated_users_insert_crm_notes" on public.crm_notes;
drop policy if exists "authenticated_users_update_crm_notes" on public.crm_notes;
drop policy if exists "authenticated_users_delete_crm_notes" on public.crm_notes;

create policy "authorized select crm_notes" on public.crm_notes
  for select to authenticated using (public.is_authorized());
create policy "authorized insert crm_notes" on public.crm_notes
  for insert to authenticated
  with check (public.is_authorized() and (auth.uid() = created_by or created_by is null));
create policy "authorized update crm_notes" on public.crm_notes
  for update to authenticated
  using (public.is_authorized()) with check (public.is_authorized());
create policy "authorized delete crm_notes" on public.crm_notes
  for delete to authenticated using (public.is_authorized());

-- ── crm_tasks: 4 policies (idéntico patrón) ─────────────────
drop policy if exists "authenticated_users_select_crm_tasks" on public.crm_tasks;
drop policy if exists "authenticated_users_insert_crm_tasks" on public.crm_tasks;
drop policy if exists "authenticated_users_update_crm_tasks" on public.crm_tasks;
drop policy if exists "authenticated_users_delete_crm_tasks" on public.crm_tasks;

create policy "authorized select crm_tasks" on public.crm_tasks
  for select to authenticated using (public.is_authorized());
create policy "authorized insert crm_tasks" on public.crm_tasks
  for insert to authenticated
  with check (public.is_authorized() and (auth.uid() = created_by or created_by is null));
create policy "authorized update crm_tasks" on public.crm_tasks
  for update to authenticated
  using (public.is_authorized()) with check (public.is_authorized());
create policy "authorized delete crm_tasks" on public.crm_tasks
  for delete to authenticated using (public.is_authorized());
