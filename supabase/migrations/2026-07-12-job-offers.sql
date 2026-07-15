-- ============================================================
-- Tablero de empleos · pestaña /empleo en Ops
-- Alimentada por el workflow n8n "EMPLEO — Alertas Web3/IA/Seguridad"
-- (id N8N_WORKFLOW_ID): upsert por link con service_role.
-- Proyecto Supabase: YOUR-PROJECT-REF (VaultBit Asesoría)
-- ============================================================
--
-- Contrato con n8n (NO romper): el upsert de n8n usa
-- ?on_conflict=link + Prefer: resolution=merge-duplicates y su payload
-- NUNCA incluye status, notes ni first_seen_at → esos campos son del
-- triaje manual en Ops y sobreviven a los re-avistamientos.
-- score_match lo escribe n8n (heurística); match_engine deja hueco a
-- un scoring con Claude futuro sin migrar de nuevo.
-- ============================================================

create table public.job_offers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Identidad de la oferta
  link text not null unique,
  title text not null,
  company text,
  source varchar(40) not null,

  -- Contenido (snippet ya saneado en n8n: texto plano, sin HTML)
  snippet text,
  requirements text,

  -- Salario (campos de API cuando la fuente los da; regex si no)
  salary_min integer,
  salary_max integer,
  salary_currency varchar(8),
  salary_raw text,

  -- Ubicación
  location text,
  is_remote boolean not null default false,
  is_barcelona boolean not null default false,

  -- Puntuación
  tags text[] not null default '{}'::text[],
  score_keyword numeric(5,1) not null default 0,
  score_match smallint check (score_match between 0 and 100),
  match_reasons text[] not null default '{}'::text[],
  match_engine varchar(16) not null default 'heuristic'
    check (match_engine in ('heuristic','claude')),

  -- Triaje manual (solo Ops; n8n no toca estos campos)
  status varchar(16) not null default 'nueva'
    check (status in ('nueva','interesa','descartada','aplicada','entrevista','archivada')),
  notes text,

  -- Frescura
  published_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index job_offers_score_match_idx on public.job_offers (score_match desc nulls last);
create index job_offers_status_idx on public.job_offers (status);
create index job_offers_source_idx on public.job_offers (source);
create index job_offers_last_seen_idx on public.job_offers (last_seen_at desc);

alter table public.job_offers enable row level security;

create policy "authenticated read job_offers"
  on public.job_offers for select
  using (auth.role() = 'authenticated');

create policy "authenticated insert job_offers"
  on public.job_offers for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated update job_offers"
  on public.job_offers for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated delete job_offers"
  on public.job_offers for delete
  using (auth.role() = 'authenticated');

comment on table public.job_offers is
  'Ofertas de empleo Web3/IA/Seguridad captadas por n8n. Upsert por link; status/notes/first_seen_at son de triaje manual y n8n no los escribe.';
