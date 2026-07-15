-- ─────────────────────────────────────────────────────────
-- Presupuestos multi-servicio · 2026-06-15
--
-- Una quote puede contener varias líneas de servicio (el cliente
-- contrata varios servicios a la vez). Cada item:
--   { service_slug, tier, modality, label, base_price_eur, breakdown[], pricing_inputs }
--
-- Los campos service_slug/tier/modality/base_price_eur de la quote
-- pasan a ser RESUMEN (primer item + suma NET de todas las líneas)
-- para retrocompatibilidad, listado y aceptaciones legacy.
-- ─────────────────────────────────────────────────────────

alter table public.quotes
  add column if not exists quote_items jsonb;

comment on column public.quotes.quote_items is 'Líneas de servicio del presupuesto (multi-servicio). Array de {service_slug,tier,modality,label,base_price_eur,breakdown,pricing_inputs}. NULL en quotes antiguas de servicio único.';
