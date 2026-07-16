/**
 * Tipos de la sección /prospectos (tablero de leads de auditoría).
 *
 * Fuente de verdad TS de la tabla `audit_leads` (migración
 * 2026-07-16-audit-leads.sql). La escribe el workflow n8n "CLIENT SCOUT" por
 * upsert sobre `url` (fingerprint heurístico) y la enriquece la skill
 * /client-scout (score_claude, qualify_reasons, outreach). Los campos de triaje
 * manual (status, notes, first_seen_at) solo se tocan desde Ops.
 */

export const AUDIT_LEAD_STATUSES = [
  "nuevo",
  "investigado",
  "contactado",
  "en_conversacion",
  "reunion",
  "cliente",
  "descartado",
  "archivado",
] as const;
export type AuditLeadStatus = (typeof AUDIT_LEAD_STATUSES)[number];

export const AUDIT_LEAD_STATUS_LABELS: Record<AuditLeadStatus, string> = {
  nuevo: "Nuevo",
  investigado: "Investigado",
  contactado: "Contactado",
  en_conversacion: "En conversación",
  reunion: "Reunión",
  cliente: "Cliente",
  descartado: "Descartado",
  archivado: "Archivado",
};

/** Estados del pipeline activo: visibles SIEMPRE aunque el lead caduque. */
export const PIPELINE_ACTIVE_STATUSES: AuditLeadStatus[] = [
  "investigado",
  "contactado",
  "en_conversacion",
  "reunion",
  "cliente",
];

export type MatchEngine = "heuristic" | "claude";

export const LEAD_BUILDERS = [
  "lovable",
  "bolt",
  "v0",
  "replit",
  "desconocido",
] as const;
export type LeadBuilder = (typeof LEAD_BUILDERS)[number];

export const LEAD_ZONAS = ["es", "eu", "global"] as const;
export type LeadZona = (typeof LEAD_ZONAS)[number];

/** Canales de primer contacto, en orden de preferencia (linkedin > x > email > web > github). */
export const CONTACT_CHANNELS = ["linkedin", "x", "email", "web", "github"] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

export const CONTACT_CHANNEL_LABELS: Record<ContactChannel, string> = {
  linkedin: "LinkedIn",
  x: "X / Twitter",
  email: "Email",
  web: "Web",
  github: "GitHub",
};

export interface AuditLead {
  id: string;
  created_at: string;
  url: string;
  product_name: string;
  source: string;
  founder: string | null;
  snippet: string | null;
  builder: LeadBuilder | null;
  stack: string[];
  signals: string[];
  auditability_score: number | null;
  lead_type: "vibe_app" | "blockchain";
  zona: LeadZona | null;
  language: string | null;
  score_claude: number | null;
  qualify_reasons: string[];
  match_engine: MatchEngine;
  founder_linkedin: string | null;
  founder_x: string | null;
  founder_github: string | null;
  founder_web: string | null;
  contact_email: string | null;
  contact_channel: ContactChannel | null;
  traccion: string | null;
  outreach_dm: string | null;
  outreach_email_subject: string | null;
  outreach_email: string | null;
  next_action: string | null;
  next_action_date: string | null;
  status: AuditLeadStatus;
  notes: string | null;
  published_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

// ─── Puntuación ─────────────────────────────────────────────

export const SCORE_LEVELS = ["alto", "medio", "bajo", "sin"] as const;
export type ScoreLevel = (typeof SCORE_LEVELS)[number];

export const SCORE_LEVEL_LABELS: Record<ScoreLevel, string> = {
  alto: "Auditabilidad alta",
  medio: "Auditabilidad media",
  bajo: "Auditabilidad baja",
  sin: "Sin puntuar",
};

/** El score efectivo: la valoración de Claude manda sobre la heurística. */
export function leadScore(lead: Pick<AuditLead, "score_claude" | "auditability_score">): number | null {
  return lead.score_claude ?? lead.auditability_score;
}

export function scoreLevel(score: number | null): ScoreLevel {
  if (score == null) return "sin";
  if (score >= 70) return "alto";
  if (score >= 40) return "medio";
  return "bajo";
}

// ─── Frescura ───────────────────────────────────────────────

/** Días sin re-avistar un lead (2 pasadas/día) para considerarlo caducado. */
export const STALE_AFTER_DAYS = 14;

export function isStale(lead: Pick<AuditLead, "last_seen_at">): boolean {
  const last = Date.parse(lead.last_seen_at);
  if (Number.isNaN(last)) return false;
  return Date.now() - last > STALE_AFTER_DAYS * 86_400_000;
}
