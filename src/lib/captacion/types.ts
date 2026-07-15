/**
 * Tipos y constantes para la sección "Captación 90 días".
 *
 * Estos tipos coinciden 1:1 con el schema definido en
 * `ops/supabase/migrations/2026-05-26-captacion-90d.sql`.
 *
 * Mientras `database.types.ts` no se regenere tras la migración, este
 * archivo es la fuente de verdad TypeScript. Cuando se regeneren los
 * tipos auto-generados, conservar los `*_LABELS` y las constantes
 * `export const ...` aquí — el tipo `Partner`, `Event`, etc. se podrá
 * sustituir por `Database["public"]["Tables"]["partners"]["Row"]`.
 */

// ─────────────────────────────────────────────────────────
// Enums (CHECK constraints en Postgres)
// ─────────────────────────────────────────────────────────

export const VERIFICATION_LEVELS = ["high", "medium", "low", "unverified"] as const;
export type VerificationLevel = (typeof VERIFICATION_LEVELS)[number];

export const VERIFICATION_LEVEL_LABELS: Record<VerificationLevel, string> = {
  high: "Verificación alta",
  medium: "Verificación media",
  low: "Verificación baja",
  unverified: "Sin verificar",
};

export const COMPETITION_RISKS = [
  "none",
  "low",
  "medium",
  "high",
  "very_high",
  "unknown",
] as const;
export type CompetitionRisk = (typeof COMPETITION_RISKS)[number];

export const COMPETITION_RISK_LABELS: Record<CompetitionRisk, string> = {
  none: "Sin solape",
  low: "Solape bajo",
  medium: "Solape medio",
  high: "Competencia directa",
  very_high: "Competencia funcional total",
  unknown: "Por evaluar",
};

export const PIPELINE_STAGES = [
  "identificado",
  "investigado",
  "por_contactar",
  "primer_contacto",
  "reunion",
  "propuesta",
  "partner_activo",
  "dormido",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  identificado: "Identificado",
  investigado: "Investigado",
  por_contactar: "Por contactar",
  primer_contacto: "Primer contacto",
  reunion: "Reunión",
  propuesta: "Propuesta",
  partner_activo: "Partner activo",
  dormido: "Dormido",
};

export const PROFESSIONAL_TYPES = [
  "notaria",
  "abogado_sucesiones",
  "fiscalista",
  "gestor_patrimonio",
  "gestoria",
  "family_office",
  "otro",
] as const;
export type ProfessionalType = (typeof PROFESSIONAL_TYPES)[number];

export const PROFESSIONAL_TYPE_LABELS: Record<ProfessionalType, string> = {
  notaria: "Notaría",
  abogado_sucesiones: "Abogado de sucesiones",
  fiscalista: "Fiscalista",
  gestor_patrimonio: "Gestor de patrimonio",
  gestoria: "Gestoría",
  family_office: "Family office",
  otro: "Otro",
};

export const PARTNER_SOURCE_TYPES = [
  "web",
  "linkedin",
  "prensa",
  "registro_mercantil",
  "github",
  "podcast",
  "evento",
  "otro",
] as const;
export type PartnerSourceType = (typeof PARTNER_SOURCE_TYPES)[number];

export const EVENT_TRACKING_STATUSES = [
  "attend",
  "speak",
  "sponsor",
  "monitor",
  "skip",
] as const;
export type EventTrackingStatus = (typeof EVENT_TRACKING_STATUSES)[number];

export const EVENT_TRACKING_STATUS_LABELS: Record<EventTrackingStatus, string> = {
  attend: "Asistir",
  speak: "Ponente",
  sponsor: "Patrocinar",
  monitor: "Monitorizar",
  skip: "Descartar",
};

export const CAPTACION_TASK_PRIORITIES = ["P0", "P1", "P2"] as const;
export type CaptacionTaskPriority = (typeof CAPTACION_TASK_PRIORITIES)[number];

export const CAPTACION_TASK_STATUSES = [
  "todo",
  "doing",
  "done",
  "blocked",
] as const;
export type CaptacionTaskStatus = (typeof CAPTACION_TASK_STATUSES)[number];

export const CAPTACION_TASK_STATUS_LABELS: Record<CaptacionTaskStatus, string> = {
  todo: "Por hacer",
  doing: "En curso",
  done: "Hecho",
  blocked: "Bloqueado",
};

export const CAPTACION_TASK_BUCKETS = [
  "contenido",
  "partners",
  "eventos",
  "producto",
  "venta",
  "admin",
  "comunidad",
] as const;
export type CaptacionTaskBucket = (typeof CAPTACION_TASK_BUCKETS)[number];

export const CAPTACION_TASK_BUCKET_LABELS: Record<CaptacionTaskBucket, string> = {
  contenido: "Contenido",
  partners: "Partners",
  eventos: "Eventos",
  producto: "Producto",
  venta: "Venta",
  admin: "Admin",
  comunidad: "Comunidad",
};

// ─────────────────────────────────────────────────────────
// Row types (espejan el schema SQL — sustituibles por database.types
// cuando se regeneren los tipos auto-generados)
// ─────────────────────────────────────────────────────────

export interface Partner {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;

  full_name: string;
  company: string | null;
  role: string | null;
  city: string | null;
  country: string | null;

  linkedin_url: string | null;
  company_website: string | null;
  community_website: string | null;
  company_cif: string | null;

  // Prospección presencial (migración 2026-06-10, opcionales para no
  // romper seeds/fixtures anteriores a la migración)
  email?: string | null;
  phone?: string | null;
  professional_type?: ProfessionalType | null;

  origin: string | null;

  verification_level: VerificationLevel;
  competition_risk: CompetitionRisk;
  pipeline_stage: PipelineStage;

  linkedin_draft: string | null;
  next_action: string | null;
  next_action_date: string | null;
  notes: string | null;
  tags: string[];

  // Correo de captación · casillas dedicadas (migración 2026-06-15)
  outreach_subject?: string | null;
  outreach_email?: string | null;

  // Guion de llamada en frío (método Cooling) · casilla dedicada (migración 2026-06-28)
  call_script?: string | null;
}

export interface PartnerSource {
  id: string;
  created_at: string;
  created_by: string | null;
  partner_id: string;
  source_url: string;
  source_type: PartnerSourceType;
  source_title: string | null;
  notes: string | null;
}

export interface CaptacionEvent {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;

  name: string;
  organizer: string | null;
  format: string | null;
  date_start: string | null;
  date_end: string | null;
  location: string | null;
  sponsors: string[];

  tracking_status: EventTrackingStatus;
  budget_estimate: number | null;
  roi_estimate: string | null;

  related_partner_id: string | null;
  notes: string | null;
  url: string | null;
}

export interface CaptacionTask {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;

  title: string;
  description: string | null;

  priority: CaptacionTaskPriority;
  status: CaptacionTaskStatus;
  bucket: CaptacionTaskBucket;

  week: number | null;
  due_date: string | null;

  partner_id: string | null;
  event_id: string | null;

  owner: string;
  notes: string | null;
  source_doc: string;
}

export interface CaptacionProgress {
  user_id: string;
  manual_read_at: string | null;
  last_visited_route: string | null;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────
// Plan de 90 días · constantes operativas
// ─────────────────────────────────────────────────────────

/**
 * Fecha de inicio del plan (semana 1).
 * Origen: Vaultbit_Manual_Operativo_y_CRM_Partners.html v1.1 — 25 may 2026.
 * El plan abarca 13 semanas (≈90 días).
 */
export const CAPTACION_PLAN_START_ISO = "2026-05-25";
export const CAPTACION_PLAN_TOTAL_WEEKS = 13;

/**
 * Devuelve la semana actual dentro del plan (1..13).
 * Si la fecha es anterior al inicio → 1. Si posterior al final → 13.
 */
export function getCurrentPlanWeek(now: Date = new Date()): number {
  const start = new Date(CAPTACION_PLAN_START_ISO + "T00:00:00Z").getTime();
  const diffMs = now.getTime() - start;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const week = Math.floor(days / 7) + 1;
  if (week < 1) return 1;
  if (week > CAPTACION_PLAN_TOTAL_WEEKS) return CAPTACION_PLAN_TOTAL_WEEKS;
  return week;
}

/**
 * Disclaimers obligatorios del manual operativo (Sección 10 del HTML).
 * Renderizados al pie de cada vista de /captacion-90d.
 */
export const CAPTACION_DISCLAIMERS = [
  "Información orientativa, no constituye asesoramiento financiero ni fiscal.",
  "Servicio conjunto con partner fiscalista/notario colegiado. Vaultbit aporta la arquitectura técnica.",
  "Protocolo Conocimiento Cero. La semilla la genera y custodia exclusivamente el cliente.",
] as const;
