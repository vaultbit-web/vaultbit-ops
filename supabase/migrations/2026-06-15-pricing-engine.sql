-- ─────────────────────────────────────────────────────────
-- Motor de precios cerrados · 2026-06-15
--
-- Reglas deterministas EDITABLES para servicios variables del
-- presupuestador (Herencia por patrimonio/herederos, Fiscal por
-- volumen/DeFi, Web3 por entregable, Custodia por complejidad).
-- Convive con `service_pricing` (precio plano legacy intacto):
-- el form usa el motor si el servicio tiene tiers, y el modelo
-- plano en caso contrario.
--
-- RLS: mismo patrón permisivo `auth_all_*` (to authenticated,
-- using true / with check true) que service_pricing y quotes.
-- La autorización real la da assertAuthorized() en las Server
-- Actions (allowlist de emails).
--
-- Proyecto Supabase: YOUR-PROJECT-REF (VaultBit Asesoría)
-- ─────────────────────────────────────────────────────────

-- ── Tabla 1: pricing_tiers ─────────────────────────────────
-- Un "tier" = un escalón base de un servicio, seleccionado por
-- el umbral de un driver numérico ([driver_min, driver_max)) o
-- manualmente. is_custom marca tarifas "desde / a medida".
create table if not exists public.pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  service_slug text not null,
  tier_key     text not null,
  tier_label   text not null,
  modality     text not null default 'one_shot' check (modality in ('one_shot','monthly','yearly')),
  base_price_eur numeric(12,2) not null check (base_price_eur >= 0),
  driver_key text,                       -- 'patrimonio' | 'volumen' | 'complejidad' | 'entregable' | null
  driver_min numeric,                    -- inclusivo (NULL = -inf)
  driver_max numeric,                    -- exclusivo (NULL = +inf)
  is_custom boolean not null default false,
  sort_order integer not null default 0,
  description text,
  active boolean not null default true,
  unique (service_slug, tier_key, modality)
);
create index if not exists pricing_tiers_service_idx on public.pricing_tiers (service_slug, active);

-- ── Tabla 2: pricing_modifiers ─────────────────────────────
-- Recargos / add-ons / passthrough sobre el tier base.
create table if not exists public.pricing_modifiers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  service_slug text not null,
  tier_key text,                         -- NULL = aplica a todos los tiers del servicio
  modifier_key   text not null,          -- 'heredero_adicional' | 'anio_regularizar' | 'exchange_adicional' | 'hardware' | 'cuota_anual'
  label          text not null,
  kind text not null check (kind in ('per_unit','flat','percent','passthrough')),
  unit_amount    numeric(12,2) not null default 0,   -- € por unidad (per_unit) / € (flat) / % (percent)
  free_quantity  integer not null default 0,         -- nº unidades incluidas sin recargo
  input_key      text,                   -- input del caso que lo dispara: 'herederos','exchanges','anios','hardware_eur','defi'
  default_enabled boolean not null default true,
  sort_order integer not null default 0,
  active boolean not null default true
);
create index if not exists pricing_modifiers_service_idx on public.pricing_modifiers (service_slug, active);

-- ── Triggers updated_at (función ya existe en el proyecto) ──
drop trigger if exists pricing_tiers_updated_at on public.pricing_tiers;
create trigger pricing_tiers_updated_at
  before update on public.pricing_tiers
  for each row execute function public.handle_updated_at();

drop trigger if exists pricing_modifiers_updated_at on public.pricing_modifiers;
create trigger pricing_modifiers_updated_at
  before update on public.pricing_modifiers
  for each row execute function public.handle_updated_at();

-- ── RLS · mismo patrón que service_pricing/quotes ──────────
alter table public.pricing_tiers enable row level security;
alter table public.pricing_modifiers enable row level security;

drop policy if exists auth_all_pricing_tiers on public.pricing_tiers;
create policy auth_all_pricing_tiers on public.pricing_tiers
  for all to authenticated using (true) with check (true);

drop policy if exists auth_all_pricing_modifiers on public.pricing_modifiers;
create policy auth_all_pricing_modifiers on public.pricing_modifiers
  for all to authenticated using (true) with check (true);

-- ── Columnas de trazabilidad del caso en quotes ────────────
alter table public.quotes
  add column if not exists pricing_inputs  jsonb,   -- {patrimonio:1200000, herederos:3, ...}
  add column if not exists price_breakdown jsonb;   -- [{label, amount}, ...]

comment on table public.pricing_tiers is 'Motor de precios · escalones base por servicio, con seleccion por umbral de driver numerico o manual.';
comment on table public.pricing_modifiers is 'Motor de precios · recargos per_unit/flat/percent y passthrough aplicados sobre el tier base.';
comment on column public.quotes.pricing_inputs is 'Inputs del caso usados por el motor (snapshot, para recalcular en server).';
comment on column public.quotes.price_breakdown is 'Desglose del precio cerrado (snapshot inmutable del momento de creacion).';
