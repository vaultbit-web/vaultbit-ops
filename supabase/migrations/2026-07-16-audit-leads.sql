-- ============================================================
-- Tablero de prospección de clientes · pestaña /prospectos en Ops
-- Alimentada por el workflow n8n "CLIENT SCOUT — Apps recién lanzadas"
-- (generador scripts/setup_client_scout_workflow_v1.py):
-- upsert por url con service_role, igual que job_offers.
-- Proyecto Supabase: YOUR-PROJECT-REF (VaultBit Asesoría)
-- ============================================================
--
-- Contrato con n8n (NO romper): el upsert de n8n usa
-- ?on_conflict=url + Prefer: resolution=merge-duplicates y su payload
-- NUNCA incluye status, notes ni first_seen_at → esos campos son del
-- triaje manual en Ops y sobreviven a los re-avistamientos.
-- auditability_score lo escribe n8n (heurística pasiva); score_claude y
-- match_engine='claude' los escribe la skill /client-scout al enriquecer.
--
-- SEGURIDAD (importante): a diferencia de job_offers, esta tabla guarda
-- datos de contacto de TERCEROS (fundadores) y notas de señales de
-- seguridad. Por eso la RLS es POR IDENTIDAD (email en authorized_users),
-- no por el rol `authenticated` genérico. Cierra el gap descrito en la
-- memoria vaultbit-ops-rls-critico para esta tabla.
--
-- NUNCA se almacenan secretos en claro: el fingerprint pasivo redacta
-- cualquier hallazgo a `primeros4…últimos4` antes de guardarlo en signals.
-- ============================================================

-- ── Allowlist a nivel de base de datos ──────────────────────
-- Espejo en BD de ops/src/lib/auth/allowlist.ts (que hoy vive solo en la
-- app). Permite RLS por identidad reutilizable por otras tablas sensibles.
-- Se siembra con el mismo email por defecto; ampliar con un INSERT (sin
-- necesidad de migrar de nuevo). La escritura queda solo para service_role.
create table if not exists public.authorized_users (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);

insert into public.authorized_users (email, note)
values ('founder@example.com', 'Fundador · seed inicial')
on conflict (email) do nothing;

alter table public.authorized_users enable row level security;

-- Función de autorización: SECURITY DEFINER para leer authorized_users sin
-- disparar RLS recursiva. STABLE (mismo resultado dentro de la request).
-- Compara el email del JWT (normalizado) contra la allowlist.
create or replace function public.is_authorized()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.authorized_users au
    where au.email = lower(nullif(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_authorized() from public;
grant execute on function public.is_authorized() to authenticated;

-- Los usuarios autorizados pueden verse entre sí; nadie escribe vía RLS
-- (solo service_role, que la bypassa).
create policy "authorized read authorized_users"
  on public.authorized_users for select
  using (public.is_authorized());

-- ── Tabla de leads de auditoría ─────────────────────────────
create table public.audit_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Identidad del lead
  url text not null unique,
  product_name text not null,
  source varchar(40) not null,
  founder text,

  -- Contenido (snippet ya saneado en n8n: texto plano, sin HTML)
  snippet text,

  -- Señales pasivas (OSINT: solo lo que un navegador descarga de la home)
  builder varchar(24)
    check (builder in ('lovable','bolt','v0','replit','desconocido')),
  stack text[] not null default '{}'::text[],
  signals text[] not null default '{}'::text[],
  auditability_score smallint check (auditability_score between 0 and 100),

  -- Clasificación
  lead_type varchar(16) not null default 'vibe_app'
    check (lead_type in ('vibe_app','blockchain')),
  zona varchar(16) check (zona in ('es','eu','global')),
  language varchar(4),

  -- Enriquecimiento con IA (lo escribe /client-scout; hueco reservado)
  score_claude smallint check (score_claude between 0 and 100),
  qualify_reasons text[] not null default '{}'::text[],
  match_engine varchar(16) not null default 'heuristic'
    check (match_engine in ('heuristic','claude')),

  -- Outreach preparado (patrón de partners; lo redacta /client-scout)
  outreach_dm text,
  outreach_email_subject text,
  outreach_email text,
  next_action text,
  next_action_date date,

  -- Triaje manual (solo Ops; n8n no toca estos campos)
  status varchar(20) not null default 'nuevo'
    check (status in ('nuevo','investigado','contactado','en_conversacion',
                      'reunion','cliente','descartado','archivado')),
  notes text,

  -- Frescura
  published_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index audit_leads_auditability_idx on public.audit_leads (auditability_score desc nulls last);
create index audit_leads_score_claude_idx on public.audit_leads (score_claude desc nulls last);
create index audit_leads_status_idx on public.audit_leads (status);
create index audit_leads_source_idx on public.audit_leads (source);
create index audit_leads_last_seen_idx on public.audit_leads (last_seen_at desc);

alter table public.audit_leads enable row level security;

-- RLS por identidad: la app (usuario autenticado) solo lee y actualiza el
-- triaje si su email está en la allowlist. INSERT/DELETE no se conceden a
-- `authenticated`: n8n inserta con service_role (bypassa RLS) y no se borran
-- filas desde la app (se archivan con status).
create policy "authorized read audit_leads"
  on public.audit_leads for select
  using (public.is_authorized());

create policy "authorized update audit_leads"
  on public.audit_leads for update
  using (public.is_authorized())
  with check (public.is_authorized());

comment on table public.audit_leads is
  'Leads de auditoría de seguridad (apps recién lanzadas) captados por n8n. Upsert por url; status/notes/first_seen_at son de triaje manual y n8n no los escribe. RLS por identidad (authorized_users). Sin secretos en claro: signals lleva hallazgos redactados.';
