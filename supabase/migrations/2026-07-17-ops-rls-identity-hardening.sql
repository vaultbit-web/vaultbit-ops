-- ============================================================
-- Endurecimiento RLS (2ª tanda): las tablas que se quedaron autorizando por ROL
-- `authenticated` pasan a IDENTIDAD `public.is_authorized()` (allowlist authorized_users),
-- igual que ya se hizo con el CRM (2026-07-16-crm-rls-identity-hardening.sql) y audit_leads.
-- Proyecto: YOUR-PROJECT-REF (VaultBit Asesoría).
--
-- PROBLEMA (advisor + pg_policies): partners, partner_sources, events, captacion_tasks,
-- founder_ideas/scripts/metrics y job_offers autorizaban con `auth.role()='authenticated'`;
-- y funnel_leads/funnel_sessions/cal_bookings exponían la LECTURA (SELECT `USING(true)`) al
-- rol authenticated. Con signups abiertos, cualquier JWT authenticated leía/escribía esa PII
-- vía PostgREST. Cierra el hueco AUNQUE los signups sigan abiertos.
--
-- SEGURO: estas tablas solo las escribe/lee Daniel autenticado (server actions con
-- assertAuthorized) o service_role (n8n, que bypassa RLS). founder@example.com está en
-- authorized_users → conserva acceso. El FUNNEL PÚBLICO NO se rompe: se conservan intactas
-- las policies `anon` de funnel_leads/funnel_sessions (alta desde la landing) y las de
-- escritura del webhook en cal_bookings. Solo se endurecen las policies de rol authenticated.
-- ============================================================

-- ── Tablas 100% internas: 4 policies (SELECT/INSERT/UPDATE/DELETE) → is_authorized() ──
do $$
declare t text;
begin
  foreach t in array array['partners','partner_sources','events','captacion_tasks',
                           'founder_ideas','founder_scripts','founder_metrics']
  loop
    execute format('drop policy if exists "authenticated read %1$s"   on public.%1$I', t);
    execute format('drop policy if exists "authenticated insert %1$s" on public.%1$I', t);
    execute format('drop policy if exists "authenticated update %1$s" on public.%1$I', t);
    execute format('drop policy if exists "authenticated delete %1$s" on public.%1$I', t);
    execute format('create policy "authorized read %1$s"   on public.%1$I for select to authenticated using (public.is_authorized())', t);
    execute format('create policy "authorized insert %1$s" on public.%1$I for insert to authenticated with check (public.is_authorized())', t);
    execute format('create policy "authorized update %1$s" on public.%1$I for update to authenticated using (public.is_authorized()) with check (public.is_authorized())', t);
    execute format('create policy "authorized delete %1$s" on public.%1$I for delete to authenticated using (public.is_authorized())', t);
  end loop;
end $$;

-- ── job_offers: solo SELECT + UPDATE eran por rol (INSERT/DELETE ya se retiraron; n8n usa service_role) ──
drop policy if exists "authenticated read job_offers"   on public.job_offers;
drop policy if exists "authenticated update job_offers" on public.job_offers;
create policy "authorized read job_offers"   on public.job_offers for select to authenticated using (public.is_authorized());
create policy "authorized update job_offers" on public.job_offers for update to authenticated using (public.is_authorized()) with check (public.is_authorized());

-- ── funnel_leads: endurecer SOLO lo de authenticated (lectura de PII). Conservar anon_insert. ──
drop policy if exists "auth_read_funnel_leads"   on public.funnel_leads;
drop policy if exists "auth_update_funnel_leads" on public.funnel_leads;
drop policy if exists "auth_delete_funnel_leads" on public.funnel_leads;
create policy "authorized read funnel_leads"   on public.funnel_leads for select to authenticated using (public.is_authorized());
create policy "authorized update funnel_leads" on public.funnel_leads for update to authenticated using (public.is_authorized()) with check (public.is_authorized());
create policy "authorized delete funnel_leads" on public.funnel_leads for delete to authenticated using (public.is_authorized());

-- ── funnel_sessions: endurecer authenticated read/delete. Conservar las 3 policies anon (insert + select/update 24h). ──
drop policy if exists "auth_read_funnel_sessions"   on public.funnel_sessions;
drop policy if exists "auth_delete_funnel_sessions" on public.funnel_sessions;
create policy "authorized read funnel_sessions"   on public.funnel_sessions for select to authenticated using (public.is_authorized());
create policy "authorized delete funnel_sessions" on public.funnel_sessions for delete to authenticated using (public.is_authorized());

-- ── cal_bookings: endurecer authenticated read/delete (datos de asistentes = PII). Conservar la
--    escritura del webhook (anon INSERT/UPDATE). NOTA de seguimiento: esa escritura anon abierta
--    (advisor "RLS always true") debería enrutar por un RPC SECURITY DEFINER en vez de anon directo;
--    mientras, la defensa es la verificación HMAC del handler (fail-closed, ver route.ts). ──
drop policy if exists "Authenticated users can read bookings" on public.cal_bookings;
drop policy if exists "Authenticated can delete bookings"     on public.cal_bookings;
create policy "authorized read cal_bookings"   on public.cal_bookings for select to authenticated using (public.is_authorized());
create policy "authorized delete cal_bookings" on public.cal_bookings for delete to authenticated using (public.is_authorized());

-- ── Higiene: fijar search_path en las funciones flagged por el advisor (evita hijack por search_path) ──
alter function public.handle_updated_at() set search_path = public;
alter function public.next_quote_number() set search_path = public;
alter function public.next_contract_number() set search_path = public;
alter function public.tg_linkedin_contacts_updated_at() set search_path = public;
