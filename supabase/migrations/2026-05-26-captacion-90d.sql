-- ============================================================
-- Captación 90 días + CRM Partners Ibiza Tech Forum 2026
-- Origen: Vaultbit_Manual_Operativo_y_CRM_Partners.html (25 may 2026)
-- Proyecto Supabase: YOUR-PROJECT-REF (VaultBit Asesoría)
-- ============================================================
--
-- Crea 5 tablas para la nueva sección /captacion-90d en ops:
--   1. partners            · CRM de partners con pipeline 7-etapas (separado de prospects)
--   2. partner_sources     · fuentes públicas que verifican un partner (regla ≥2 para promover)
--   3. events              · eventos de marketing (distinto de cal_bookings que es Cal.com)
--   4. captacion_tasks     · backlog 90d con priority/bucket/week (distinto de crm_tasks polimórfico)
--   5. captacion_progress  · estado por usuario (manual leído, última ruta visitada)
--
-- RLS: misma política `authenticated` que el resto del schema (ver
-- 2026-04-30-f2_3_founder_content.sql como referencia).
-- ============================================================


-- ─── 1) partners ───────────────────────────────────────────
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),

  -- Identidad
  full_name text not null,
  company text,
  role text,
  city text,
  country text default 'España',

  -- Contacto y enlaces públicos
  linkedin_url text,
  company_website text,
  community_website text,
  company_cif varchar(32),

  -- Captación
  origin varchar(120),

  -- Clasificación
  verification_level text not null default 'unverified'
    check (verification_level in ('high','medium','low','unverified')),
  competition_risk text not null default 'unknown'
    check (competition_risk in ('none','low','medium','high','very_high','unknown')),
  pipeline_stage text not null default 'identificado'
    check (pipeline_stage in (
      'identificado','investigado','primer_contacto',
      'reunion','propuesta','partner_activo','dormido'
    )),

  -- Trabajo operativo
  linkedin_draft text,
  next_action varchar(280),
  next_action_date date,
  notes text,
  tags text[] not null default '{}'::text[]
);

create index partners_origin_idx on public.partners (origin);
create index partners_pipeline_stage_idx on public.partners (pipeline_stage);
create index partners_next_action_date_idx on public.partners (next_action_date asc nulls last);

create trigger partners_updated_at
  before update on public.partners
  for each row execute function public.handle_updated_at();

alter table public.partners enable row level security;

create policy "authenticated read partners"
  on public.partners for select
  using (auth.role() = 'authenticated');

create policy "authenticated insert partners"
  on public.partners for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated update partners"
  on public.partners for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated delete partners"
  on public.partners for delete
  using (auth.role() = 'authenticated');

comment on table public.partners is
  'CRM de partners con pipeline 7-etapas. Separado de prospects (B2B cold outbound) y de partner_applications (inbound read-only del formulario público). Origen inicial: Ibiza Tech Forum 2026.';


-- ─── 2) partner_sources ────────────────────────────────────
-- Fuentes públicas que verifican un partner. La regla de negocio
-- canPromoteToInvestigado() exige ≥2 para subir de 'identificado'.
create table public.partner_sources (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),

  partner_id uuid not null references public.partners(id) on delete cascade,
  source_url text not null,
  source_type text not null default 'web'
    check (source_type in ('web','linkedin','prensa','registro_mercantil','github','podcast','evento','otro')),
  source_title text,
  notes text
);

create index partner_sources_partner_idx on public.partner_sources (partner_id);

alter table public.partner_sources enable row level security;

create policy "authenticated read partner_sources"
  on public.partner_sources for select
  using (auth.role() = 'authenticated');

create policy "authenticated insert partner_sources"
  on public.partner_sources for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated update partner_sources"
  on public.partner_sources for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated delete partner_sources"
  on public.partner_sources for delete
  using (auth.role() = 'authenticated');

comment on table public.partner_sources is
  'Fuentes públicas independientes (web, LinkedIn, prensa, registro mercantil) que documentan un partner. Necesarias ≥2 para promover de identificado a investigado.';


-- ─── 3) events ─────────────────────────────────────────────
-- Eventos de marketing / sector cripto (conferencias, meetups, podcasts).
-- NO confundir con cal_bookings (Cal.com webhooks).
create table public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),

  -- Identidad
  name text not null,
  organizer text,
  format text,
  date_start date,
  date_end date,
  location text,

  -- Sponsors/colaboradores
  sponsors text[] not null default '{}'::text[],

  -- Decisión de cobertura
  tracking_status text not null default 'monitor'
    check (tracking_status in ('attend','speak','sponsor','monitor','skip')),

  -- Economía
  budget_estimate numeric(10,2),
  roi_estimate text,

  -- Vínculos
  related_partner_id uuid references public.partners(id) on delete set null,

  -- Notas
  notes text,
  url text
);

create index events_date_start_idx on public.events (date_start asc nulls last);
create index events_tracking_status_idx on public.events (tracking_status);

create trigger events_updated_at
  before update on public.events
  for each row execute function public.handle_updated_at();

alter table public.events enable row level security;

create policy "authenticated read events"
  on public.events for select
  using (auth.role() = 'authenticated');

create policy "authenticated insert events"
  on public.events for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated update events"
  on public.events for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated delete events"
  on public.events for delete
  using (auth.role() = 'authenticated');

comment on table public.events is
  'Eventos del sector (conferencias, meetups, podcasts, ferias). Separado de cal_bookings que captura webhooks de Cal.com.';


-- ─── 4) captacion_tasks ────────────────────────────────────
-- Backlog 90 días con priority/bucket/week.
-- Distinto de crm_tasks (polimórfico, por entidad CRM, sin priority).
create table public.captacion_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),

  title varchar(280) not null,
  description text,

  priority text not null default 'P1'
    check (priority in ('P0','P1','P2')),
  status text not null default 'todo'
    check (status in ('todo','doing','done','blocked')),
  bucket text not null default 'admin'
    check (bucket in ('contenido','partners','eventos','producto','venta','admin','comunidad')),

  -- Plan de 90d → semana 1..13
  week integer check (week is null or (week between 1 and 13)),
  due_date date,

  -- Vínculos opcionales
  partner_id uuid references public.partners(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,

  owner varchar(80) not null default 'Daniel Brosed',
  notes text,
  source_doc varchar(120) not null default 'Manual Operativo 90 días v1.0'
);

create index captacion_tasks_status_idx on public.captacion_tasks (status);
create index captacion_tasks_priority_idx on public.captacion_tasks (priority);
create index captacion_tasks_week_idx on public.captacion_tasks (week);
create index captacion_tasks_partner_idx on public.captacion_tasks (partner_id);
create index captacion_tasks_event_idx on public.captacion_tasks (event_id);
create index captacion_tasks_due_date_idx on public.captacion_tasks (due_date asc nulls last);

create trigger captacion_tasks_updated_at
  before update on public.captacion_tasks
  for each row execute function public.handle_updated_at();

alter table public.captacion_tasks enable row level security;

create policy "authenticated read captacion_tasks"
  on public.captacion_tasks for select
  using (auth.role() = 'authenticated');

create policy "authenticated insert captacion_tasks"
  on public.captacion_tasks for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated update captacion_tasks"
  on public.captacion_tasks for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated delete captacion_tasks"
  on public.captacion_tasks for delete
  using (auth.role() = 'authenticated');

comment on table public.captacion_tasks is
  'Backlog del plan de captación 90 días con priority (P0/P1/P2), bucket (contenido/partners/eventos/etc) y week (1-13). Distinto de crm_tasks (polimórfico por entidad).';


-- ─── 5) captacion_progress ─────────────────────────────────
-- Estado per-user del manual operativo y vistas.
create table public.captacion_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  manual_read_at timestamptz,
  last_visited_route text,
  updated_at timestamptz not null default now()
);

create trigger captacion_progress_updated_at
  before update on public.captacion_progress
  for each row execute function public.handle_updated_at();

alter table public.captacion_progress enable row level security;

-- Sólo el propio usuario puede leer/escribir su progreso.
create policy "user reads own progress"
  on public.captacion_progress for select
  using (auth.uid() = user_id);

create policy "user inserts own progress"
  on public.captacion_progress for insert
  with check (auth.uid() = user_id);

create policy "user updates own progress"
  on public.captacion_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user deletes own progress"
  on public.captacion_progress for delete
  using (auth.uid() = user_id);

comment on table public.captacion_progress is
  'Estado por usuario del manual operativo (timestamp de lectura) y vistas. RLS estricta: cada usuario ve solo su fila.';
