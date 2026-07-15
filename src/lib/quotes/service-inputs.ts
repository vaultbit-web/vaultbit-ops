/**
 * Catálogo declarativo de los INPUTS del caso que pide cada servicio.
 *
 * Lo consume el formulario de la calculadora (para renderizar los campos
 * dinámicos) y el motor de precios (que lee estos valores). Mantenerlo
 * sincronizado con los `input_key` de las filas de `pricing_modifiers` y
 * con el `driver_key` de `pricing_tiers`.
 *
 * NO incluye la selección de tier categórica (single_sig, básico, estudio…):
 * esa la resuelve el desplegable de tier del form. Aquí van solo:
 *  - drivers numéricos que auto-seleccionan el tier (p.ej. patrimonio), y
 *  - inputs que disparan modifiers (herederos, exchanges, años, hardware…).
 */

import type { ServiceSlug, PricingDriver } from "~/lib/supabase/types";

export interface ServiceInputDef {
  /** Clave usada en pricing_inputs y como input_key de los modifiers. */
  key: string;
  label: string;
  type: "number" | "boolean" | "select";
  /** Si este input numérico auto-selecciona el tier por umbral. */
  driverFor?: PricingDriver;
  options?: { value: string; label: string }[];
  min?: number;
  step?: number;
  default?: number | boolean | string;
  help?: string;
}

export const SERVICE_INPUTS: Record<ServiceSlug, ServiceInputDef[]> = {
  // Precio fijo: sin parámetros de caso.
  "consultoria-360": [],

  // Tier por complejidad (desplegable) + hardware repercutido.
  "arquitectura-custodia": [
    {
      key: "hardware_eur",
      label: "Hardware / bóveda a repercutir (€)",
      type: "number",
      min: 0,
      step: 10,
      default: 0,
      help: "Placas de acero, hardware wallets, caja fuerte… Se suma como coste directo (passthrough).",
    },
  ],

  // Tier por patrimonio (auto) + recargo por heredero adicional.
  "heritage-protocol": [
    {
      key: "patrimonio",
      label: "Patrimonio a proteger (€)",
      type: "number",
      driverFor: "patrimonio",
      min: 0,
      step: 10000,
      default: 0,
      help: "Selecciona el tier automáticamente: Esencial <500k · Patrimonio 500k–2M · Legado >2M.",
    },
    {
      key: "herederos",
      label: "Nº de herederos",
      type: "number",
      min: 1,
      step: 1,
      default: 1,
      help: "El primero va incluido; cada heredero adicional añade recargo.",
    },
  ],

  // Tier por complejidad (desplegable) + recargos por exchanges/años.
  "conexion-fiscal": [
    {
      key: "exchanges",
      label: "Nº de exchanges / wallets",
      type: "number",
      min: 1,
      step: 1,
      default: 1,
      help: "Hasta 3 incluidos; cada uno adicional añade recargo.",
    },
    {
      key: "anios",
      label: "Años a regularizar",
      type: "number",
      min: 1,
      step: 1,
      default: 1,
      help: "El año corriente va incluido; cada año extra añade recargo.",
    },
  ],

  // Tier por entregable (desplegable) + auditoría externa repercutida.
  "web3-b2b": [
    {
      key: "audit_extra_eur",
      label: "Auditoría externa a repercutir (€)",
      type: "number",
      min: 0,
      step: 100,
      default: 0,
      help: "Solo si el entregable incluye auditoría de smart contracts de un tercero (passthrough).",
    },
  ],
};

/** Valores por defecto de los inputs de un servicio. */
export function defaultInputs(serviceSlug: ServiceSlug): Record<string, number | boolean | string> {
  const out: Record<string, number | boolean | string> = {};
  for (const def of SERVICE_INPUTS[serviceSlug] ?? []) {
    out[def.key] = def.default ?? (def.type === "boolean" ? false : def.type === "number" ? 0 : "");
  }
  return out;
}
