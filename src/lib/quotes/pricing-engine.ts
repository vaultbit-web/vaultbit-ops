/**
 * Motor de precios cerrados — helper PURO (sin fetch, fechas ni random).
 *
 * Convierte los inputs de un caso + las reglas editables (pricing_tiers
 * y pricing_modifiers) en UN precio cerrado determinista. El resultado
 * `closedPrice` se usa como `base_price_eur` que entra en
 * computeQuoteAmounts() (descuento + IVA), sin tocar esa fórmula.
 *
 * Se importa tanto en cliente (previsualización en vivo) como en servidor
 * (recálculo de validación antes de persistir) — misma single source of
 * truth que calc.ts.
 */

import { round2 } from "./calc";
import type { PricingTier, PricingModifier } from "~/lib/supabase/types";

export interface PricingRules {
  tiers: PricingTier[];
  modifiers: PricingModifier[];
}

export type PricingInputs = Record<string, number | boolean | string | null | undefined>;

export interface BreakdownLine {
  label: string;
  amount: number;
}

export interface ServicePriceResult {
  /** Precio base del tier seleccionado. */
  basePrice: number;
  /** Desglose línea a línea (tier + cada recargo aplicado). */
  breakdown: BreakdownLine[];
  /** Precio cerrado = base + Σ recargos. Entra como base_price_eur. */
  closedPrice: number;
  selectedTierKey: string | null;
  selectedTierLabel: string | null;
  /** true si el tier es "desde / a medida": el comercial debe confirmar. */
  isCustom: boolean;
  /** false si el servicio no tiene reglas en el motor (usar legacy plano). */
  hasRules: boolean;
}

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

/** Parsea el snapshot price_breakdown (jsonb) de una quote a líneas tipadas. */
export function parseBreakdown(json: unknown): BreakdownLine[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (x): x is BreakdownLine =>
      !!x &&
      typeof x === "object" &&
      typeof (x as BreakdownLine).label === "string" &&
      typeof (x as BreakdownLine).amount === "number",
  );
}

/** Una línea de servicio dentro de un presupuesto multi-servicio. */
export interface QuoteItem {
  service_slug: string;
  tier: string;
  modality: string;
  /** Etiqueta para mostrar, p.ej. "Protocolo de Herencia · Patrimonio (500k–2M €)". */
  label: string;
  /** Precio cerrado NET de esta línea. */
  base_price_eur: number;
  breakdown: BreakdownLine[];
  pricing_inputs?: PricingInputs | null;
}

/** Parsea el snapshot quote_items (jsonb) de una quote a líneas tipadas. */
export function parseQuoteItems(json: unknown): QuoteItem[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({
      service_slug: String(x.service_slug ?? ""),
      tier: String(x.tier ?? ""),
      modality: String(x.modality ?? "one_shot"),
      label: String(x.label ?? ""),
      base_price_eur: round2(num(x.base_price_eur)),
      breakdown: parseBreakdown(x.breakdown),
      pricing_inputs: (x.pricing_inputs as PricingInputs) ?? null,
    }))
    .filter((it) => it.service_slug);
}

/** Tiers de un servicio para una modalidad, activos y ordenados. */
export function tiersFor(
  rules: PricingRules,
  serviceSlug: string,
  modality = "one_shot",
): PricingTier[] {
  return rules.tiers
    .filter((t) => t.service_slug === serviceSlug && t.modality === modality && t.active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function serviceHasRules(rules: PricingRules, serviceSlug: string): boolean {
  return rules.tiers.some((t) => t.service_slug === serviceSlug && t.active);
}

/** Devuelve el driver numérico del servicio (patrimonio/volumen) si existe. */
export function numericDriverKey(tiers: PricingTier[]): string | null {
  const withRange = tiers.find(
    (t) => t.driver_key && (t.driver_min !== null || t.driver_max !== null),
  );
  return withRange?.driver_key ?? null;
}

function selectTier(
  tiers: PricingTier[],
  inputs: PricingInputs,
  tierKey?: string,
): PricingTier | null {
  if (tiers.length === 0) return null;

  // 1) Selección explícita (desplegable categórico: complejidad, entregable…)
  if (tierKey) {
    const explicit = tiers.find((t) => t.tier_key === tierKey);
    if (explicit) return explicit;
  }

  // 2) Driver numérico por umbral [driver_min, driver_max)
  const driver = numericDriverKey(tiers);
  if (driver) {
    const value = num(inputs[driver]);
    // El tier aplicable de mayor umbral cuyo driver_min <= value.
    const byMin = [...tiers].sort((a, b) => (a.driver_min ?? -Infinity) - (b.driver_min ?? -Infinity));
    let chosen: PricingTier | null = null;
    for (const t of byMin) {
      const min = t.driver_min ?? -Infinity;
      const max = t.driver_max ?? Infinity;
      if (value >= min && value < max) return t;
      if (value >= min) chosen = t; // candidato "por encima de todos los rangos"
    }
    if (chosen) return chosen;
  }

  // 3) Fallback: primer tier por orden.
  return tiers[0];
}

export function computeServicePrice(
  serviceSlug: string,
  inputs: PricingInputs,
  rules: PricingRules,
  opts?: { tierKey?: string; modality?: string },
): ServicePriceResult {
  const modality = opts?.modality ?? "one_shot";
  const tiers = tiersFor(rules, serviceSlug, modality);

  if (tiers.length === 0) {
    return {
      basePrice: 0,
      breakdown: [],
      closedPrice: 0,
      selectedTierKey: null,
      selectedTierLabel: null,
      isCustom: false,
      hasRules: serviceHasRules(rules, serviceSlug),
    };
  }

  const tier = selectTier(tiers, inputs, opts?.tierKey)!;
  const basePrice = round2(num(tier.base_price_eur));
  const breakdown: BreakdownLine[] = [{ label: tier.tier_label, amount: basePrice }];

  const mods = rules.modifiers
    .filter(
      (m) =>
        m.service_slug === serviceSlug &&
        m.active &&
        (m.tier_key === null || m.tier_key === tier.tier_key),
    )
    .sort((a, b) => a.sort_order - b.sort_order);

  for (const m of mods) {
    let amount = 0;
    if (m.kind === "per_unit") {
      const qty = Math.max(0, num(m.input_key ? inputs[m.input_key] : 0) - (m.free_quantity ?? 0));
      amount = round2(qty * num(m.unit_amount));
    } else if (m.kind === "flat") {
      const enabled = m.input_key ? Boolean(inputs[m.input_key]) : m.default_enabled;
      amount = enabled ? round2(num(m.unit_amount)) : 0;
    } else if (m.kind === "percent") {
      const enabled = m.input_key ? Boolean(inputs[m.input_key]) : m.default_enabled;
      amount = enabled ? round2((basePrice * num(m.unit_amount)) / 100) : 0;
    } else if (m.kind === "passthrough") {
      amount = round2(num(m.input_key ? inputs[m.input_key] : 0));
    }
    if (amount !== 0) breakdown.push({ label: m.label, amount });
  }

  const closedPrice = round2(breakdown.reduce((acc, l) => acc + l.amount, 0));

  return {
    basePrice,
    breakdown,
    closedPrice,
    selectedTierKey: tier.tier_key,
    selectedTierLabel: tier.tier_label,
    isCustom: tier.is_custom,
    hasRules: true,
  };
}
