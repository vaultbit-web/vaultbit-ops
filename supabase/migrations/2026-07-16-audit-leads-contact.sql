-- ============================================================
-- Inteligencia de contacto del fundador · tabla audit_leads
-- Complementa 2026-07-16-audit-leads.sql: columnas que escribe la
-- skill /client-scout al investigar a fondo cada lead (OSINT pasivo:
-- solo perfiles y datos PUBLICADOS por el propio fundador).
--
-- Contrato con n8n (NO romper): el payload del upsert de n8n NUNCA
-- incluye estas columnas, así que sobreviven a los re-avistamientos
-- igual que status/notes/outreach.
--
-- Sin cambios de RLS: heredan las policies por identidad de la tabla
-- (authorized_users), que ya protege datos de contacto de terceros.
-- ============================================================

alter table public.audit_leads
  add column if not exists founder_linkedin text,
  add column if not exists founder_x text,
  add column if not exists founder_github text,
  add column if not exists founder_web text,
  add column if not exists contact_email text,
  add column if not exists contact_channel varchar(16)
    check (contact_channel in ('linkedin','x','email','web','github')),
  add column if not exists traccion text;

comment on column public.audit_leads.founder_linkedin is
  'URL del perfil público de LinkedIn del fundador (OSINT pasivo, verificado a 2 fuentes).';
comment on column public.audit_leads.founder_x is
  'URL del perfil público de X/Twitter del fundador.';
comment on column public.audit_leads.founder_github is
  'URL del perfil público de GitHub del fundador (perfil, no rastreo de repos).';
comment on column public.audit_leads.founder_web is
  'Web personal o del producto con página de contacto.';
comment on column public.audit_leads.contact_email is
  'Email PÚBLICO del fundador o del producto (nunca adivinado ni scrapeado de fugas).';
comment on column public.audit_leads.contact_channel is
  'Mejor canal para el primer mensaje: linkedin > x > email > web > github.';
comment on column public.audit_leads.traccion is
  'Tracción observada: puntos/comentarios en Show HN, menciones, usuarios declarados.';
