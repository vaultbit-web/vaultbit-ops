-- ============================================================
-- Bug fix: policies DELETE faltantes en tablas del CRM
-- Aplicado en producción: 2026-04-30 (proyecto YOUR-PROJECT-REF)
-- ============================================================
--
-- Síntoma reportado por el usuario: "no me deja eliminar los leads,
-- le doy a eliminar y se deseleccionan pero realmente no se eliminan".
--
-- Causa raíz: las 5 tablas siguientes tenían RLS activada con policies
-- de SELECT / INSERT / UPDATE pero NO tenían policy DELETE. En Postgres
-- + Supabase RLS, una operación sin policy correspondiente NO devuelve
-- error: simplemente afecta a 0 filas. La acción server `bulkDelete`
-- de `lib/actions/crm-bulk.ts` recibía `count = 0` sin error, devolvía
-- ok=true con 0 affected, y la UI deseleccionaba sin borrar nada.
--
-- Tablas afectadas:
--   • funnel_leads
--   • funnel_sessions
--   • investor_interest
--   • lead_magnet_subscribers
--   • partner_applications
--
-- (`crm_notes`, `crm_tasks`, `prospects`, `cal_bookings`, `founder_*`,
-- `meta_oauth_tokens`, `google_oauth_tokens` ya tenían DELETE — verificado
-- antes de aplicar.)

create policy "auth_delete_funnel_leads"
  on public.funnel_leads
  for delete
  to authenticated
  using (id is not null);

create policy "auth_delete_funnel_sessions"
  on public.funnel_sessions
  for delete
  to authenticated
  using (id is not null);

create policy "auth_delete_investor_interest"
  on public.investor_interest
  for delete
  to authenticated
  using (id is not null);

create policy "auth_delete_lead_magnet_subscribers"
  on public.lead_magnet_subscribers
  for delete
  to authenticated
  using (id is not null);

create policy "auth_delete_partner_applications"
  on public.partner_applications
  for delete
  to authenticated
  using (id is not null);
