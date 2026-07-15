-- ============================================================
-- F2.3 sesión 2 · Sync Meta Insights
-- Tablas: meta_oauth_tokens (token Graph API cifrado) + founder_metrics
--         (snapshots diarios de métricas por Reel)
-- Aplicar desde Supabase Dashboard → SQL Editor → Run
-- Proyecto: VaultBit Asesoría (YOUR-PROJECT-REF)
-- ============================================================

-- ─── Tabla 1: meta_oauth_tokens ────────────────────────────
-- Espejo de google_oauth_tokens. Long-lived token (60 días) cifrado
-- AES-256-GCM con OAUTH_ENCRYPTION_KEY. Solo guardamos un token por
-- usuario; reconectar sobrescribe.

create table public.meta_oauth_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Token largo-vivido (60 días) cifrado.
  access_token_enc text not null,

  -- Caducidad real (Meta devuelve expires_in en segundos al hacer el
  -- exchange del long-lived token).
  expires_at timestamptz not null,

  -- Identidad de Instagram Business asociada al token.
  instagram_user_id text,
  instagram_username text,

  -- Página de Facebook a la que está vinculada la cuenta IG (Meta exige
  -- esto para Insights). Guardamos el id por si hay varias.
  facebook_page_id text,
  facebook_page_name text,

  -- Lista de scopes concedidos (string separado por comas, como Graph).
  scope text default ''
);

create trigger meta_oauth_tokens_updated_at
  before update on public.meta_oauth_tokens
  for each row execute function public.handle_updated_at();

alter table public.meta_oauth_tokens enable row level security;

create policy "authenticated read meta_oauth_tokens"
  on public.meta_oauth_tokens
  for select
  using (auth.uid() = user_id);

create policy "authenticated insert meta_oauth_tokens"
  on public.meta_oauth_tokens
  for insert
  with check (auth.uid() = user_id);

create policy "authenticated update meta_oauth_tokens"
  on public.meta_oauth_tokens
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "authenticated delete meta_oauth_tokens"
  on public.meta_oauth_tokens
  for delete
  using (auth.uid() = user_id);

comment on table public.meta_oauth_tokens is 'F2.3 sesión 2 — Token long-lived de Meta Graph API cifrado AES-256-GCM. Una fila por usuario, sobrescribe en reconexión.';


-- ─── Tabla 2: founder_metrics ──────────────────────────────
-- Snapshot diario de métricas de cada Reel publicado. Histórico que
-- permite ver evolución del RI por vídeo y comparar entre Reels.

create table public.founder_metrics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  script_id uuid not null references public.founder_scripts(id) on delete cascade,
  instagram_media_id text not null,
  snapshot_date date not null default current_date,

  -- Métricas crudas devueltas por Graph API
  -- (campo Insights: plays, reach, saved, shares, likes, comments,
  --  total_interactions, ig_reels_avg_watch_time, ig_reels_video_view_total_time)
  plays integer,
  reach integer,
  saved integer,
  shares integer,
  likes integer,
  comments integer,
  total_interactions integer,

  -- Tiempo de visualización (ms según Meta)
  avg_watch_time_ms integer,
  total_watch_time_ms integer,

  -- Calculados localmente al insertar
  completion_rate numeric(5,4),

  -- JSON crudo de la respuesta (para auditar y poder añadir métricas
  -- nuevas sin migrar el schema).
  raw_payload jsonb default '{}'::jsonb,

  -- Una fila por (script, día). Si re-sincronizamos el mismo día,
  -- hacemos UPSERT por esta clave.
  unique (script_id, snapshot_date)
);

create index founder_metrics_script_date_idx
  on public.founder_metrics (script_id, snapshot_date desc);
create index founder_metrics_instagram_media_idx
  on public.founder_metrics (instagram_media_id);

alter table public.founder_metrics enable row level security;

create policy "authenticated read founder_metrics"
  on public.founder_metrics
  for select
  using (auth.role() = 'authenticated');

create policy "authenticated insert founder_metrics"
  on public.founder_metrics
  for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated update founder_metrics"
  on public.founder_metrics
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated delete founder_metrics"
  on public.founder_metrics
  for delete
  using (auth.role() = 'authenticated');

comment on table public.founder_metrics is 'F2.3 sesión 2 — Snapshots diarios de métricas Meta Insights por Reel publicado. Un row por (script_id, snapshot_date).';


-- ─── Refinamiento F2.3 sesión 2 + copy generator ──────────
-- Se añade columna script_copy a founder_scripts para guardar la
-- descripción/caption del Reel generada por IA en un paso separado.
-- copy_generated_at marca cuándo se generó por última vez (puede
-- regenerarse sin borrar el guion).

alter table public.founder_scripts
  add column if not exists script_copy text,
  add column if not exists copy_generated_at timestamptz;

comment on column public.founder_scripts.script_copy is 'Caption/descripción del Reel generada por Gemini en paso aparte (refinamiento F2.3 s2). Optimizada para Instagram: hook en primer párrafo, longitud 125-300 chars antes del "...más", hashtags al final.';
