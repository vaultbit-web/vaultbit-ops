/**
 * Tipos exportados para el resto de la app.
 *
 * Vienen del schema real de Supabase (auto-generado en database.types.ts).
 * Si el schema cambia, regenerar con:
 *
 *   mcp supabase generate_typescript_types --project-id YOUR-PROJECT-REF
 */

import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];

// CRM existente
export type FunnelLead = Tables["funnel_leads"]["Row"];
export type FunnelSession = Tables["funnel_sessions"]["Row"];
export type InvestorInterest = Tables["investor_interest"]["Row"];
export type LeadMagnetSubscriber = Tables["lead_magnet_subscribers"]["Row"];
export type PartnerApplication = Tables["partner_applications"]["Row"];

// CRM editable F1
export type CrmNote = Tables["crm_notes"]["Row"];
export type CrmTask = Tables["crm_tasks"]["Row"];

// Comercial F1.2
export type ServicePricing = Tables["service_pricing"]["Row"];
export type Quote = Tables["quotes"]["Row"];
export type ContractTemplate = Tables["contract_templates"]["Row"];
export type Contract = Tables["contracts"]["Row"];

// Comercial · Motor de precios cerrados
export type PricingTier = Tables["pricing_tiers"]["Row"];
export type PricingModifier = Tables["pricing_modifiers"]["Row"];

// Email · F1.3
export type EmailLog = Tables["email_log"]["Row"];

// Marca Personal del Fundador · F2.3
export type FounderIdea = Tables["founder_ideas"]["Row"];
export type FounderScript = Tables["founder_scripts"]["Row"];
export type FounderMetric = Tables["founder_metrics"]["Row"];

export const FOUNDER_IDEA_STATUS = [
  "raw",
  "diamond",
  "discarded",
  "promoted",
] as const;
export type FounderIdeaStatus = (typeof FOUNDER_IDEA_STATUS)[number];

export const FOUNDER_IDEA_STATUS_LABELS: Record<FounderIdeaStatus, string> = {
  raw: "Sin filtrar",
  diamond: "Ganadora",
  discarded: "Descartada",
  promoted: "Promovida",
};

export const FOUNDER_SCRIPT_STATUS = [
  "script",
  "recorded",
  "edited",
  "scheduled",
  "published",
] as const;
export type FounderScriptStatus = (typeof FOUNDER_SCRIPT_STATUS)[number];

export const FOUNDER_SCRIPT_STATUS_LABELS: Record<FounderScriptStatus, string> = {
  script: "Guion",
  recorded: "Grabado",
  edited: "Editado",
  scheduled: "Programado",
  published: "Publicado",
};

export const FOUNDER_FORMATS = [
  "POV",
  "blog",
  "talking_head",
  "interview",
  "characters",
  "dynamic",
] as const;
export type FounderFormat = (typeof FOUNDER_FORMATS)[number];

export const FOUNDER_FORMAT_LABELS: Record<FounderFormat, string> = {
  POV: "POV (punto de vista)",
  blog: "Blog (caminando)",
  talking_head: "Hablando a cámara",
  interview: "Entrevista",
  characters: "Personajes",
  dynamic: "Dinámico (Erasmia)",
};

export interface FounderIdeaScoreBreakdown {
  contracurrent?: boolean;
  filter_5_50?: boolean;
  unique?: boolean;
  common_applicable?: boolean;
  polemical?: boolean;
  format_fit?: boolean;
  brand_congruent?: boolean;
  viral_reference?: boolean;
}

export const EMAIL_CHANNELS = ["quote", "contract", "manual", "diagnosis"] as const;
export type EmailChannel = (typeof EMAIL_CHANNELS)[number];

export const EMAIL_STATUS = ["queued", "sent", "failed"] as const;
export type EmailStatus = (typeof EMAIL_STATUS)[number];

// ─────────────────────────────────────────────────────────
// Constants extraídos de los CHECK constraints reales en Postgres.
// ─────────────────────────────────────────────────────────

export const FUNNEL_LEAD_STATUS = [
  "nuevo",
  "contactado",
  "en_seguimiento",
  "convertido",
  "descartado",
] as const;
export type FunnelLeadStatus = (typeof FUNNEL_LEAD_STATUS)[number];

export const ARCHETYPES = [
  "security",
  "fiscal",
  "inheritance",
  "business",
] as const;
export type Archetype = (typeof ARCHETYPES)[number];

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  security: "Seguridad y custodia",
  fiscal: "Fiscalidad",
  inheritance: "Herencia digital",
  business: "Web3 B2B",
};

export const CHANNELS = ["whatsapp", "email"] as const;
export type Channel = (typeof CHANNELS)[number];

export const INVESTOR_STATUS = [
  "nuevo",
  "contactado",
  "calificado",
  "descartado",
] as const;
export type InvestorStatus = (typeof INVESTOR_STATUS)[number];

export const PARTNER_STATUS = [
  "nuevo",
  "contactado",
  "calificado",
  "firmado",
  "descartado",
] as const;
export type PartnerStatus = (typeof PARTNER_STATUS)[number];

export const PARTNER_TYPES = [
  "fiscal",
  "sucesiones",
  "custodia-fisica",
  "desarrollo-web3",
  "otro",
] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  fiscal: "Fiscalista",
  sucesiones: "Sucesiones / notario",
  "custodia-fisica": "Custodia física",
  "desarrollo-web3": "Desarrollo Web3",
  otro: "Otro",
};

export const LEAD_MAGNET_STATUS = [
  "nuevo",
  "entregado",
  "engaged",
  "convertido",
  "descartado",
] as const;
export type LeadMagnetStatus = (typeof LEAD_MAGNET_STATUS)[number];

// ─────────────────────────────────────────────────────────
// Entidades del CRM unificado
// ─────────────────────────────────────────────────────────

export const ENTITY_TYPES = [
  "funnel_lead",
  "lead_magnet",
  "investor",
  "partner",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const ENTITY_LABELS: Record<EntityType, string> = {
  funnel_lead: "Diagnóstico",
  lead_magnet: "Lead magnet",
  investor: "Inversor",
  partner: "Partner",
};

export const ENTITY_TABLE: Record<EntityType, string> = {
  funnel_lead: "funnel_leads",
  lead_magnet: "lead_magnet_subscribers",
  investor: "investor_interest",
  partner: "partner_applications",
};

export const ENTITY_ROUTE: Record<EntityType, string> = {
  funnel_lead: "/crm/ventas",
  lead_magnet: "/crm/lead-magnet",
  investor: "/crm/inversores",
  partner: "/crm/partners",
};

export const TASK_STATUS = ["pending", "done", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUS)[number];

// ─────────────────────────────────────────────────────────
// Comercial · Calculadora
// ─────────────────────────────────────────────────────────

export const SERVICE_SLUGS = [
  "heritage-protocol",
  "arquitectura-custodia",
  "consultoria-360",
  "conexion-fiscal",
  "web3-b2b",
] as const;
export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export const SERVICE_LABELS: Record<ServiceSlug, string> = {
  "heritage-protocol": "Heritage Protocol",
  "arquitectura-custodia": "Arquitectura de Custodia",
  "consultoria-360": "Consultoría 360º",
  "conexion-fiscal": "Conexión Fiscal",
  "web3-b2b": "Web3 B2B",
};

export const SERVICE_DESCRIPTIONS: Record<ServiceSlug, string> = {
  "heritage-protocol":
    "Protocolo de herencia digital · división de claves Shamir + Manual del Heredero + integración notarial.",
  "arquitectura-custodia":
    "Diseño técnico de custodia · cold storage, multi-sig, distribución de claves para HNWI.",
  "consultoria-360":
    "Auditoría completa: custodia + fiscal + sucesoria. Plan integral coordinado.",
  "conexion-fiscal":
    "Derivación a fiscalista cripto colegiado especializado.",
  "web3-b2b":
    "Empresas que quieren operar, aceptar o tesorizar criptoactivos.",
};

export const TIERS = ["esencial", "completo", "premium"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_LABELS: Record<Tier, string> = {
  esencial: "Esencial",
  completo: "Completo",
  premium: "Premium",
};

export const MODALITIES = ["one_shot", "monthly", "yearly"] as const;
export type Modality = (typeof MODALITIES)[number];

export const MODALITY_LABELS: Record<Modality, string> = {
  one_shot: "Pago único",
  monthly: "Cuota mensual",
  yearly: "Cuota anual",
};

export const QUOTE_STATUS = [
  "borrador",
  "enviado",
  "aceptado",
  "rechazado",
  "expirado",
] as const;
export type QuoteStatus = (typeof QUOTE_STATUS)[number];

// ─────────────────────────────────────────────────────────
// Comercial · Motor de precios cerrados
//
// NOTA: TIERS (esencial/completo/premium) es legacy y solo se usa
// como fallback de etiqueta en PDFs/detalle antiguos. La fuente de
// verdad de los tiers vivos son las filas de `pricing_tiers`
// (tier_key + tier_label), editables desde /comercial/tarifas.
// ─────────────────────────────────────────────────────────

export const MODIFIER_KINDS = ["per_unit", "flat", "percent", "passthrough"] as const;
export type ModifierKind = (typeof MODIFIER_KINDS)[number];

export const MODIFIER_KIND_LABELS: Record<ModifierKind, string> = {
  per_unit: "Por unidad",
  flat: "Cantidad fija",
  percent: "Porcentaje sobre base",
  passthrough: "Repercutido (coste directo)",
};

/** Drivers numéricos que pueden auto-seleccionar el tier de un servicio. */
export const PRICING_DRIVERS = ["patrimonio", "volumen", "complejidad", "entregable"] as const;
export type PricingDriver = (typeof PRICING_DRIVERS)[number];

export const PRICING_DRIVER_LABELS: Record<PricingDriver, string> = {
  patrimonio: "Patrimonio (€)",
  volumen: "Volumen / transacciones",
  complejidad: "Complejidad",
  entregable: "Entregable",
};

// ─────────────────────────────────────────────────────────
// Comercial · Legal
// ─────────────────────────────────────────────────────────

export const CONTRACT_CATEGORIES = [
  "precontrato",
  "nda",
  "contrato",
  "partner",
  "aceptacion",
] as const;
export type ContractCategory = (typeof CONTRACT_CATEGORIES)[number];

export const CONTRACT_CATEGORY_LABELS: Record<ContractCategory, string> = {
  precontrato: "Precontrato",
  nda: "NDA",
  contrato: "Contrato",
  partner: "Partner",
  aceptacion: "Aceptación",
};

export const CONTRACT_STATUS = [
  "borrador",
  "enviado",
  "firmado",
  "cancelado",
] as const;
export type ContractStatus = (typeof CONTRACT_STATUS)[number];

/**
 * Estructura del JSON `placeholders` de cada plantilla legal.
 * Definida aquí para typing seguro en el editor.
 */
export interface PlaceholderDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "date";
  required?: boolean;
  default?: string;
}
