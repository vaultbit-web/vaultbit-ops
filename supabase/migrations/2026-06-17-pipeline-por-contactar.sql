-- ─────────────────────────────────────────────────────────
-- Etapa de pipeline "Por contactar" · 2026-06-17
--
-- Nueva etapa entre "investigado" y "primer_contacto" para los partners
-- con el correo de captación ya redactado pero TODAVÍA NO enviado (cola
-- de envío). Así "primer_contacto" queda solo para los ya contactados.
-- ─────────────────────────────────────────────────────────

alter table public.partners
  drop constraint if exists partners_pipeline_stage_check;

alter table public.partners
  add constraint partners_pipeline_stage_check
  check (pipeline_stage in (
    'identificado','investigado','por_contactar','primer_contacto',
    'reunion','propuesta','partner_activo','dormido'
  ));
