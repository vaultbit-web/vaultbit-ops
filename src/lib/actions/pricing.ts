"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import {
  SERVICE_SLUGS,
  MODALITIES,
  MODIFIER_KINDS,
  type ServiceSlug,
  type Modality,
  type ModifierKind,
} from "~/lib/supabase/types";
import { round2 } from "~/lib/quotes/calc";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function assertAuthorized() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) {
    throw new Error("No autorizado");
  }
  return { user, supabase };
}

function revalidatePricing() {
  revalidatePath("/comercial/tarifas");
  revalidatePath("/comercial/calculadora/nueva");
}

export interface PricingTierInput {
  id?: string | null;
  service_slug: string;
  tier_key: string;
  tier_label: string;
  modality: string;
  base_price_eur: number;
  driver_key?: string | null;
  driver_min?: number | null;
  driver_max?: number | null;
  is_custom?: boolean;
  sort_order?: number;
  description?: string | null;
  active?: boolean;
}

export async function upsertPricingTier(input: PricingTierInput): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();

    if (!SERVICE_SLUGS.includes(input.service_slug as ServiceSlug)) {
      return { ok: false, error: "Servicio no válido" };
    }
    if (!MODALITIES.includes(input.modality as Modality)) {
      return { ok: false, error: "Modalidad no válida" };
    }
    if (!input.tier_key?.trim()) return { ok: false, error: "tier_key requerido" };
    if (!input.tier_label?.trim()) return { ok: false, error: "Etiqueta requerida" };
    if (typeof input.base_price_eur !== "number" || input.base_price_eur < 0) {
      return { ok: false, error: "Precio base inválido" };
    }

    const row = {
      service_slug: input.service_slug,
      tier_key: input.tier_key.trim(),
      tier_label: input.tier_label.trim(),
      modality: input.modality,
      base_price_eur: round2(input.base_price_eur),
      driver_key: input.driver_key?.trim() || null,
      driver_min: input.driver_min ?? null,
      driver_max: input.driver_max ?? null,
      is_custom: input.is_custom ?? false,
      sort_order: input.sort_order ?? 0,
      description: input.description?.trim() || null,
      active: input.active ?? true,
    };

    if (input.id) {
      const { error } = await supabase.from("pricing_tiers").update(row).eq("id", input.id);
      if (error) return { ok: false, error: error.message };
      revalidatePricing();
      return { ok: true, id: input.id };
    }

    const { data, error } = await supabase
      .from("pricing_tiers")
      .insert(row)
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "Error al crear tier" };
    revalidatePricing();
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export async function deletePricingTier(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    const { error } = await supabase.from("pricing_tiers").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePricing();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

export interface PricingModifierInput {
  id?: string | null;
  service_slug: string;
  tier_key?: string | null;
  modifier_key: string;
  label: string;
  kind: string;
  unit_amount: number;
  free_quantity?: number;
  input_key?: string | null;
  default_enabled?: boolean;
  sort_order?: number;
  active?: boolean;
}

export async function upsertPricingModifier(input: PricingModifierInput): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();

    if (!SERVICE_SLUGS.includes(input.service_slug as ServiceSlug)) {
      return { ok: false, error: "Servicio no válido" };
    }
    if (!MODIFIER_KINDS.includes(input.kind as ModifierKind)) {
      return { ok: false, error: "Tipo de recargo no válido" };
    }
    if (!input.modifier_key?.trim()) return { ok: false, error: "modifier_key requerido" };
    if (!input.label?.trim()) return { ok: false, error: "Etiqueta requerida" };
    if (typeof input.unit_amount !== "number") {
      return { ok: false, error: "Importe inválido" };
    }

    const row = {
      service_slug: input.service_slug,
      tier_key: input.tier_key?.trim() || null,
      modifier_key: input.modifier_key.trim(),
      label: input.label.trim(),
      kind: input.kind,
      unit_amount: round2(input.unit_amount),
      free_quantity: input.free_quantity ?? 0,
      input_key: input.input_key?.trim() || null,
      default_enabled: input.default_enabled ?? true,
      sort_order: input.sort_order ?? 0,
      active: input.active ?? true,
    };

    if (input.id) {
      const { error } = await supabase.from("pricing_modifiers").update(row).eq("id", input.id);
      if (error) return { ok: false, error: error.message };
      revalidatePricing();
      return { ok: true, id: input.id };
    }

    const { data, error } = await supabase
      .from("pricing_modifiers")
      .insert(row)
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "Error al crear recargo" };
    revalidatePricing();
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export async function deletePricingModifier(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    const { error } = await supabase.from("pricing_modifiers").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePricing();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}
