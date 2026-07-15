import type {
  Partner,
  PartnerSource,
  PipelineStage,
} from "./types";

/**
 * Regla de promoción de partners en el pipeline 7-etapas.
 *
 * Origen: Vaultbit_Manual_Operativo_y_CRM_Partners.html · Sección 10,
 * bloque "CRITERIO DE PROMOCIÓN DE PARTNER":
 *
 *   «Un partner solo puede pasar de pipeline_stage = 'identificado' a
 *   'investigado' cuando verification_level = 'high' Y existen al menos
 *   2 source_url distintas en una tabla partner_sources documentando
 *   nombre completo, empresa y rol.»
 *
 * Esta función es pura (sin I/O) — la usa la UI para decidir si mostrar
 * un banner amber y los server actions para bloquear escrituras inválidas.
 */

export interface PromotionResult {
  ok: boolean;
  reason?: string;
}

/**
 * Comprueba si un partner cumple los requisitos para subir de
 * 'identificado' a 'investigado'.
 */
export function canPromoteToInvestigado(
  partner: Pick<Partner, "verification_level">,
  sources: Pick<PartnerSource, "source_url">[],
): PromotionResult {
  if (partner.verification_level !== "high") {
    return {
      ok: false,
      reason: "Verificación insuficiente — el partner debe estar marcado como verification_level = 'high'.",
    };
  }

  const uniqueUrls = new Set(
    sources.map((s) => s.source_url.trim().toLowerCase()).filter(Boolean),
  );
  if (uniqueUrls.size < 2) {
    return {
      ok: false,
      reason: "Verificación insuficiente — añadir fuente independiente (mínimo 2 source_url distintas).",
    };
  }

  return { ok: true };
}

/**
 * Mensaje del banner amber mostrado en `<PartnersIbizaTable />` y
 * `<PartnerDrawer />` cuando el partner no cumple la regla.
 */
export const VERIFICATION_INSUFFICIENT_BANNER =
  "Verificación insuficiente — añadir fuente independiente";

/**
 * Wrapper genérico: dada cualquier transición de pipeline, devuelve si
 * está permitida. De momento sólo bloqueamos identificado → investigado;
 * el resto de transiciones se permiten libremente (decisión humana).
 */
export function canTransitionPipeline(
  _partner: Pick<Partner, "verification_level" | "pipeline_stage">,
  _sources: Pick<PartnerSource, "source_url">[],
  _to: PipelineStage,
): PromotionResult {
  // Sin gate automático de verificación: el operador decide libremente la
  // etapa del partner en el pipeline (la prospección la valida Daniel al
  // llamar, no hace falta forzar verification_level='high' + 2 fuentes).
  return { ok: true };
}
