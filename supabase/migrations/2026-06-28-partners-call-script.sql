-- ─────────────────────────────────────────────────────────
-- Guion de llamada en frío por partner · 2026-06-28
--
-- Casilla dedicada para el guion de primera llamada (método Cooling):
-- opener para pasar centralita, pedir por quien decide, pitch de 30s,
-- cierre de reunión y respuestas a objeciones. Se edita desde la ficha
-- del partner (PartnerDrawer → sección "Guion de llamada") con autoguardado.
-- ─────────────────────────────────────────────────────────

alter table public.partners
  add column if not exists call_script text;

comment on column public.partners.call_script is 'Guion de llamada en frio (Cooling) redactado para este partner: opener, pedir por quien decide, pitch 30s, cierre reunion, objeciones.';
