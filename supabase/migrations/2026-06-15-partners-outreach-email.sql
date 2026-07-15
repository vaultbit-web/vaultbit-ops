-- ─────────────────────────────────────────────────────────
-- Correo de captación por partner · 2026-06-15
--
-- Casillas dedicadas (asunto + cuerpo) en cada partner, separadas de
-- las notas operativas. Se editan desde la ficha del partner
-- (PartnerDrawer → sección "Correo de captación") con autoguardado.
-- ─────────────────────────────────────────────────────────

alter table public.partners
  add column if not exists outreach_subject text,
  add column if not exists outreach_email text;

comment on column public.partners.outreach_subject is 'Asunto del correo de captación redactado para este partner.';
comment on column public.partners.outreach_email is 'Cuerpo completo del correo de captación redactado para este partner.';
