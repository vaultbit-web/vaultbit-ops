-- ============================================================
-- Sección "Contactos LinkedIn" en VaultBit Ops
-- Aplicada en producción: 2026-05-19 (proyecto YOUR-PROJECT-REF)
-- ============================================================
--
-- Tablas:
--   • linkedin_imports — audit log de subidas de ZIP / CSV
--   • linkedin_contacts — 1 fila por contacto único (dedup por linkedin_url)
--
-- Privacidad: contenido de messages.csv NUNCA se persiste.
-- Solo derivamos has_message_history, last_message_at, messages_count.

create table if not exists public.linkedin_imports (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  source_filename text,
  connections_count integer not null default 0,
  messages_count integer not null default 0,
  notes text
);

create table if not exists public.linkedin_contacts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  import_id uuid references public.linkedin_imports(id) on delete set null,
  linkedin_url text not null unique,
  first_name text,
  last_name text,
  email_address text,
  company text,
  position text,
  connected_on date,
  relevance_status text not null default 'pending'
    check (relevance_status in ('pending','relevant','irrelevant','review')),
  relevance_reason text,
  sector_tags jsonb not null default '[]'::jsonb,
  crypto_signal boolean not null default false,
  has_message_history boolean not null default false,
  last_message_at timestamptz,
  messages_count integer not null default 0,
  outreach_status text not null default 'new'
    check (outreach_status in ('new','message_drafted','sent','replied','archived')),
  generated_message text,
  generated_message_at timestamptz,
  notes text
);

create index if not exists linkedin_contacts_created_by_relevance_idx
  on public.linkedin_contacts (created_by, relevance_status);

create index if not exists linkedin_contacts_created_by_outreach_idx
  on public.linkedin_contacts (created_by, outreach_status);

-- RLS

alter table public.linkedin_imports enable row level security;
alter table public.linkedin_contacts enable row level security;

create policy "auth_select_linkedin_imports"
  on public.linkedin_imports for select to authenticated using (created_by = auth.uid());
create policy "auth_insert_linkedin_imports"
  on public.linkedin_imports for insert to authenticated with check (created_by = auth.uid());
create policy "auth_update_linkedin_imports"
  on public.linkedin_imports for update to authenticated using (created_by = auth.uid());
create policy "auth_delete_linkedin_imports"
  on public.linkedin_imports for delete to authenticated using (created_by = auth.uid());

create policy "auth_select_linkedin_contacts"
  on public.linkedin_contacts for select to authenticated using (created_by = auth.uid());
create policy "auth_insert_linkedin_contacts"
  on public.linkedin_contacts for insert to authenticated with check (created_by = auth.uid());
create policy "auth_update_linkedin_contacts"
  on public.linkedin_contacts for update to authenticated using (created_by = auth.uid());
create policy "auth_delete_linkedin_contacts"
  on public.linkedin_contacts for delete to authenticated using (created_by = auth.uid());

-- trigger updated_at

create or replace function public.tg_linkedin_contacts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_linkedin_contacts_updated_at on public.linkedin_contacts;

create trigger trg_linkedin_contacts_updated_at
  before update on public.linkedin_contacts
  for each row execute function public.tg_linkedin_contacts_updated_at();
