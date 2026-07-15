/**
 * Sistema modular de diagnóstico personalizado · VaultBit Ops
 *
 * Cada lead que completa /diagnostico contesta 5 preguntas con 4 valores
 * cada una → 4^5 = 1.024 combinaciones únicas. En lugar de escribir 1.024
 * PDFs, ensamblamos cada uno a partir de fragmentos modulares pre-escritos
 * a mano.
 *
 * Mapping:
 *   Q1 (experiencia)     → modificador de tono lingüístico (envoltura)
 *   Q2 (custodia)        → bloque "punto crítico de custodia"
 *   Q3 (declaración)     → bloque "punto crítico fiscal"
 *   Q4 (herencia)        → bloque "punto crítico de herencia"
 *   Q5 (preocupación)    → priorización (orden de los 3 bloques) + frame de portada
 *
 * Los 3 bloques técnicos NO varían según Q1 (los datos verificables son
 * universales). Q1 solo modula portada, cierre, email envolvente.
 */

// ─────────────────────────────────────────────────────────
// Valores posibles de cada pregunta (sincronizados con
// public/diagnostico/index.html — selectOption(this, N, 'value'))
// ─────────────────────────────────────────────────────────

export const Q1_VALUES = ["new", "medium", "senior", "institutional"] as const;
export const Q2_VALUES = ["exchange", "cold", "mixed", "unsure"] as const;
export const Q3_VALUES = ["compliant", "partial", "none", "unknown"] as const;
export const Q4_VALUES = ["protocol", "partial-plan", "hidden", "company"] as const;
export const Q5_VALUES = ["security", "fiscal", "inheritance", "business"] as const;

export type Q1Value = (typeof Q1_VALUES)[number];
export type Q2Value = (typeof Q2_VALUES)[number];
export type Q3Value = (typeof Q3_VALUES)[number];
export type Q4Value = (typeof Q4_VALUES)[number];
export type Q5Value = (typeof Q5_VALUES)[number];

export interface DiagnosisAnswers {
  q1: Q1Value;
  q2: Q2Value;
  q3: Q3Value;
  q4: Q4Value;
  q5: Q5Value;
}

// ─────────────────────────────────────────────────────────
// Bloque temático (cuerpo del PDF · 1 por punto crítico)
// ─────────────────────────────────────────────────────────

export type BlockKey = "fiscal" | "inheritance" | "custody";

export interface DiagnosisBlock {
  /** Identificador del eje (para priorización y debugging) */
  key: BlockKey;
  /** Título del punto crítico (h2 del bloque) */
  title: string;
  /** "EL DAÑO": frase contundente, 1 línea, va en strip naranja */
  damage: string;
  /** Cuerpo: 2-3 párrafos con datos verificables citados */
  body: string[];
  /** "PROTOCOLO": 3-5 pasos accionables numerados */
  protocol: string[];
  /** "LÍNEA ROJA": hasta dónde llega VaultBit */
  redLine: string;
  /** Versión condensada (1 párrafo) para inclusión en el email */
  emailSummary: string;
  /** Marca si el fragmento aún es DRAFT (texto placeholder no enviable) */
  draft: boolean;
}

// ─────────────────────────────────────────────────────────
// Modificador de tono lingüístico según Q1 (experiencia)
// ─────────────────────────────────────────────────────────

export interface ToneModifier {
  level: Q1Value;
  /** Cómo enmarcar al lead en el saludo del email/portada */
  audienceLabel: string;
  /** Línea de auto-frame anti-IA al final del email */
  antiAiClosing: string;
  /** Glosario que se inyecta en el cuerpo del email cuando aplica
   *  (vacío para senior/institutional, breve para new/medium) */
  glossaryHint: string | null;
  /** Marca DRAFT */
  draft: boolean;
}

// ─────────────────────────────────────────────────────────
// Reglas de priorización + framing de portada según Q5
// ─────────────────────────────────────────────────────────

export interface PriorityRule {
  concern: Q5Value;
  /** Orden en que se renderizan los 3 bloques en el PDF */
  blockOrder: [BlockKey, BlockKey, BlockKey];
  /** Eyebrow naranja de la portada */
  eyebrow: string;
  /** Headline grande de la portada */
  headline: string;
  /** Lede de la portada (2-3 frases) */
  lede: string;
  /** Justificación de la hoja de ruta (página 3) */
  roadmapRationale: string;
  /** Marca DRAFT */
  draft: boolean;
}

// ─────────────────────────────────────────────────────────
// Output del composer · todo lo que el PDF y el email necesitan
// ─────────────────────────────────────────────────────────

export interface DiagnosisModel {
  /** Datos crudos del lead (para personalización: nombre, fecha, archetype) */
  lead: {
    id: string;
    name: string;
    email: string;
    answers: DiagnosisAnswers;
    /** Archetype derivado de Q5 (igual que ARCHETYPE de Supabase) */
    archetype: Q5Value;
    /** Fecha de generación del diagnóstico (no del lead original) */
    generatedAt: Date;
  };

  /** Frame de portada según Q5 */
  cover: Pick<PriorityRule, "eyebrow" | "headline" | "lede">;

  /** 3 bloques técnicos en el orden correcto según Q5 */
  blocks: [DiagnosisBlock, DiagnosisBlock, DiagnosisBlock];

  /** Hoja de ruta de la página 3 */
  roadmap: {
    sequence: [BlockKey, BlockKey, BlockKey];
    rationale: string;
  };

  /** Modificador de tono que aplica al email envolvente */
  tone: ToneModifier;

  /** Si CUALQUIER fragmento usado es DRAFT, el modelo entero queda marcado */
  hasDrafts: boolean;
}

// ─────────────────────────────────────────────────────────
// Helpers de validación
// ─────────────────────────────────────────────────────────

export function isQ1Value(v: unknown): v is Q1Value {
  return typeof v === "string" && (Q1_VALUES as readonly string[]).includes(v);
}
export function isQ2Value(v: unknown): v is Q2Value {
  return typeof v === "string" && (Q2_VALUES as readonly string[]).includes(v);
}
export function isQ3Value(v: unknown): v is Q3Value {
  return typeof v === "string" && (Q3_VALUES as readonly string[]).includes(v);
}
export function isQ4Value(v: unknown): v is Q4Value {
  return typeof v === "string" && (Q4_VALUES as readonly string[]).includes(v);
}
export function isQ5Value(v: unknown): v is Q5Value {
  return typeof v === "string" && (Q5_VALUES as readonly string[]).includes(v);
}

/**
 * Convierte las respuestas crudas de un FunnelLead (string | null cada una)
 * a un DiagnosisAnswers tipado, o devuelve null si alguna falta o no es válida.
 */
export function parseAnswers(raw: {
  q1: string | null;
  q2: string | null;
  q3: string | null;
  q4: string | null;
  q5: string | null;
}): DiagnosisAnswers | null {
  if (!isQ1Value(raw.q1)) return null;
  if (!isQ2Value(raw.q2)) return null;
  if (!isQ3Value(raw.q3)) return null;
  if (!isQ4Value(raw.q4)) return null;
  if (!isQ5Value(raw.q5)) return null;
  return { q1: raw.q1, q2: raw.q2, q3: raw.q3, q4: raw.q4, q5: raw.q5 };
}
