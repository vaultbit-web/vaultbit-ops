-- ============================================================
-- F2.3 · Marca Personal del Fundador
-- Tablas: founder_ideas (banco bruto) + founder_scripts (cola editorial)
-- Aplicar desde Supabase Dashboard → SQL Editor → Run
-- Proyecto: VaultBit Asesoría (YOUR-PROJECT-REF)
-- ============================================================

-- ─── Tabla 1: founder_ideas ────────────────────────────────
-- Banco de las 100 ideas brutas/mes que la IA genera.
-- Daniel filtra a 10 "diamantinas" y promueve a guion.

create table public.founder_ideas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),

  -- Idea propiamente
  theme text not null,
  archetype text check (archetype in ('security','fiscal','inheritance','business')),
  format text check (format in ('POV','blog','talking_head','interview','characters','dynamic')),

  -- Score 0-8 según checklist Víctor Eras
  idea_score integer check (idea_score is null or (idea_score between 0 and 8)),
  idea_score_breakdown jsonb default '{}'::jsonb,
  rationale text,
  notes text,

  -- Lifecycle
  status text default 'raw' check (status in ('raw','diamond','discarded','promoted')),
  promoted_script_id uuid,

  -- Compliance
  compliance_passes boolean,
  compliance_flagged jsonb default '[]'::jsonb,

  -- Auditoría
  batch_id uuid
);

create index founder_ideas_created_at_idx on public.founder_ideas (created_at desc);
create index founder_ideas_status_idx on public.founder_ideas (status);
create index founder_ideas_score_idx on public.founder_ideas (idea_score desc nulls last);
create index founder_ideas_batch_idx on public.founder_ideas (batch_id);

create trigger founder_ideas_updated_at
  before update on public.founder_ideas
  for each row execute function public.handle_updated_at();

alter table public.founder_ideas enable row level security;

create policy "authenticated read founder_ideas"
  on public.founder_ideas
  for select
  using (auth.role() = 'authenticated');

create policy "authenticated insert founder_ideas"
  on public.founder_ideas
  for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated update founder_ideas"
  on public.founder_ideas
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated delete founder_ideas"
  on public.founder_ideas
  for delete
  using (auth.role() = 'authenticated');

comment on table public.founder_ideas is 'F2.3 — Banco de ideas brutas para Reels generadas por Gemini Pro siguiendo metodología Víctor Eras adaptada a VaultBit.';


-- ─── Tabla 2: founder_scripts ──────────────────────────────
-- Guiones promovidos desde una idea (o creados directos).
-- Pasan por estados: script → recorded → edited → scheduled → published.

create table public.founder_scripts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),

  -- Origen
  idea_id uuid references public.founder_ideas(id) on delete set null,

  -- Cabecera
  theme text not null,
  archetype text check (archetype in ('security','fiscal','inheritance','business')),
  format text check (format in ('POV','blog','talking_head','interview','characters','dynamic')),
  estimated_duration_s integer,
  keyword text,

  -- Hook
  hook_options jsonb default '[]'::jsonb,
  hook_chosen text,

  -- Guion 4 bloques
  script_hook text,
  script_context text,
  script_moral text,
  script_cta text,

  -- Calidad
  idea_score integer check (idea_score is null or (idea_score between 0 and 8)),
  rationale text,
  suggested_hashtags jsonb default '[]'::jsonb,

  -- Compliance
  compliance_passes boolean,
  compliance_flagged jsonb default '[]'::jsonb,

  -- Cola editorial
  status text default 'script' check (status in ('script','recorded','edited','scheduled','published')),
  notes text,
  recorded_at timestamptz,
  scheduled_at timestamptz,
  published_at timestamptz,

  -- Tracking del Reel publicado (rellena F2.3 sesión 2)
  instagram_url text,
  instagram_media_id text
);

create index founder_scripts_created_at_idx on public.founder_scripts (created_at desc);
create index founder_scripts_status_idx on public.founder_scripts (status);
create index founder_scripts_published_at_idx on public.founder_scripts (published_at desc nulls last);
create index founder_scripts_idea_idx on public.founder_scripts (idea_id);

create trigger founder_scripts_updated_at
  before update on public.founder_scripts
  for each row execute function public.handle_updated_at();

alter table public.founder_scripts enable row level security;

create policy "authenticated read founder_scripts"
  on public.founder_scripts
  for select
  using (auth.role() = 'authenticated');

create policy "authenticated insert founder_scripts"
  on public.founder_scripts
  for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated update founder_scripts"
  on public.founder_scripts
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated delete founder_scripts"
  on public.founder_scripts
  for delete
  using (auth.role() = 'authenticated');

comment on table public.founder_scripts is 'F2.3 — Guiones de Reels en cola editorial. Generados por Gemini Pro siguiendo metodología Víctor Eras. Estados: script → recorded → edited → scheduled → published.';


-- ─── FK opcional desde founder_ideas a founder_scripts ─────
-- (Ya teníamos columna promoted_script_id en founder_ideas; ahora le añadimos la FK)

alter table public.founder_ideas
  add constraint founder_ideas_promoted_script_id_fkey
  foreign key (promoted_script_id) references public.founder_scripts(id) on delete set null;
