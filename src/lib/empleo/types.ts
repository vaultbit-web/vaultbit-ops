/**
 * Tipos de la sección /empleo (tablero de ofertas).
 *
 * Fuente de verdad TS de la tabla `job_offers` (migración
 * 2026-07-12-job-offers.sql). La escribe el workflow n8n "EMPLEO — Alertas
 * Web3/IA/Seguridad" por upsert sobre `link`; los campos de triaje manual
 * (status, notes, first_seen_at) solo se tocan desde Ops.
 */

export const JOB_OFFER_STATUSES = [
  "nueva",
  "interesa",
  "descartada",
  "aplicada",
  "entrevista",
  "archivada",
] as const;
export type JobOfferStatus = (typeof JOB_OFFER_STATUSES)[number];

export const JOB_OFFER_STATUS_LABELS: Record<JobOfferStatus, string> = {
  nueva: "Nueva",
  interesa: "Interesa",
  descartada: "Descartada",
  aplicada: "Aplicada",
  entrevista: "Entrevista",
  archivada: "Archivada",
};

/** Estados que forman el pipeline personal: visibles aunque la oferta caduque. */
export const PIPELINE_ACTIVE_STATUSES: JobOfferStatus[] = [
  "interesa",
  "aplicada",
  "entrevista",
];

export type MatchEngine = "heuristic" | "claude";

export interface JobOffer {
  id: string;
  created_at: string;
  link: string;
  title: string;
  company: string | null;
  source: string;
  snippet: string | null;
  requirements: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_raw: string | null;
  location: string | null;
  is_remote: boolean;
  is_barcelona: boolean;
  tags: string[];
  score_keyword: number;
  score_match: number | null;
  match_reasons: string[];
  match_engine: MatchEngine;
  status: JobOfferStatus;
  notes: string | null;
  published_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

// ─── Nivel de match ─────────────────────────────────────────

export const MATCH_LEVELS = ["alto", "medio", "bajo", "sin"] as const;
export type MatchLevel = (typeof MATCH_LEVELS)[number];

export const MATCH_LEVEL_LABELS: Record<MatchLevel, string> = {
  alto: "Match alto",
  medio: "Match medio",
  bajo: "Match bajo",
  sin: "Sin puntuar",
};

export function matchLevel(score: number | null): MatchLevel {
  if (score == null) return "sin";
  if (score >= 70) return "alto";
  if (score >= 45) return "medio";
  return "bajo";
}

// ─── Frescura ───────────────────────────────────────────────

/** Días sin re-avistar una oferta (2 pasadas/día) para considerarla caducada. */
export const STALE_AFTER_DAYS = 10;

export function isStale(offer: Pick<JobOffer, "last_seen_at">): boolean {
  const last = Date.parse(offer.last_seen_at);
  if (Number.isNaN(last)) return false;
  return Date.now() - last > STALE_AFTER_DAYS * 86_400_000;
}
