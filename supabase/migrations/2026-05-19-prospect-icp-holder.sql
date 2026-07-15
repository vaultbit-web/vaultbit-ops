-- ============================================================
-- Pivote ICP VaultBit Ops: holder cripto long-term + data hygiene
-- Aplicar en producción: proyecto YOUR-PROJECT-REF
-- ============================================================
--
-- Contexto: el sistema actual de prospección B2B (ver
-- ops/src/lib/gemini/client.ts) estaba calibrado para family offices.
-- El ICP real del Manual Operativo VaultBit Advisory es holder cripto
-- long-term 35-65 años. Esta migración añade columnas para soportar:
--
--   1. Modo dual de búsqueda (holder vs company).
--   2. Trazabilidad de validación de email (gate pre-insert).
--   3. Señales detectadas (inclusión / exclusión) para auditar el filtro.
--   4. Atributos específicos del perfil holder.
--
-- Todas las columnas son nullable. `prospect_type` lleva default
-- 'company' para preservar la semántica de las filas históricas
-- (todas B2B family-office).

alter table public.prospects
  add column if not exists prospect_type text default 'company',
  add column if not exists email_validation_status text,
  add column if not exists email_validated_at timestamptz,
  add column if not exists included_signals jsonb default '[]'::jsonb,
  add column if not exists excluded_signals jsonb default '[]'::jsonb,
  add column if not exists estimated_age_range text,
  add column if not exists antiquity_signal text;

-- Checks (idempotentes vía drop + create)

alter table public.prospects
  drop constraint if exists prospects_prospect_type_check;

alter table public.prospects
  add constraint prospects_prospect_type_check
  check (prospect_type in ('holder', 'company'));

alter table public.prospects
  drop constraint if exists prospects_email_validation_status_check;

alter table public.prospects
  add constraint prospects_email_validation_status_check
  check (
    email_validation_status is null
    or email_validation_status in (
      'valid',
      'no_mx',
      'invalid_syntax',
      'rejected',
      'public_provider',
      'not_found'
    )
  );

-- Índice ligero para filtrar dashboard por tipo.
create index if not exists prospects_prospect_type_idx
  on public.prospects (prospect_type);
