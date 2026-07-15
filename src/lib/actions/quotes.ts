"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import {
  SERVICE_SLUGS,
  SERVICE_LABELS,
  MODALITIES,
  QUOTE_STATUS,
  ENTITY_TYPES,
  type ServiceSlug,
  type Modality,
  type QuoteStatus,
  type EntityType,
} from "~/lib/supabase/types";
import { computeQuoteAmounts, round2 } from "~/lib/quotes/calc";
import {
  computeServicePrice,
  tiersFor,
  numericDriverKey,
  serviceHasRules,
  type PricingInputs,
  type PricingRules,
  type QuoteItem,
} from "~/lib/quotes/pricing-engine";
import { getPricingRules } from "~/lib/queries/commercial";

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

/** Una línea de servicio del presupuesto (multi-servicio). */
export interface CreateQuoteItemInput {
  service_slug: string;
  tier: string;
  modality: string;
  /** Precio manual de la línea (solo legacy / override). */
  base_price_eur?: number;
  /** Inputs del caso para el motor de precios cerrados. */
  pricing_inputs?: PricingInputs | null;
  /** Si true, se respeta base_price_eur manual y NO se recalcula con el motor. */
  override_price?: boolean;
}

export interface CreateQuoteInput {
  client_name: string;
  client_nif?: string | null;
  client_email?: string | null;
  client_company?: string | null;
  client_sector?: string | null;
  client_address?: string | null;
  /** Líneas de servicio (multi-servicio). Si se omite, se usan los campos sueltos. */
  items?: CreateQuoteItemInput[];
  // Campos de servicio único (legacy / compatibilidad)
  service_slug?: string;
  tier?: string;
  modality?: string;
  base_price_eur?: number;
  pricing_inputs?: PricingInputs | null;
  override_price?: boolean;
  // Comunes a todo el presupuesto
  discount_percent?: number;
  vat_percent?: number;
  validity_days?: number;
  notes?: string | null;
  internal_notes?: string | null;
  /** Vinculación opcional a una entidad CRM */
  crm_entity_type?: EntityType | null;
  crm_entity_id?: string | null;
}

/** Calcula y valida una línea de servicio (precio cerrado o manual). */
function computeQuoteLine(
  item: CreateQuoteItemInput,
  rules: PricingRules,
): { ok: true; line: QuoteItem } | { ok: false; error: string } {
  if (!SERVICE_SLUGS.includes(item.service_slug as ServiceSlug)) {
    return { ok: false, error: "Servicio no válido" };
  }
  if (!MODALITIES.includes(item.modality as Modality)) {
    return { ok: false, error: "Modalidad no válida" };
  }
  if (!item.tier || typeof item.tier !== "string") {
    return { ok: false, error: "Tier no válido" };
  }

  const serviceLabel = SERVICE_LABELS[item.service_slug as ServiceSlug] ?? item.service_slug;
  const engineService = serviceHasRules(rules, item.service_slug);

  if (engineService && !item.override_price) {
    // Motor: si hay driver numérico, deriva el tier desde pricing_inputs.
    const sTiers = tiersFor(rules, item.service_slug, item.modality);
    const driver = numericDriverKey(sTiers);
    const engine = computeServicePrice(item.service_slug, item.pricing_inputs ?? {}, rules, {
      tierKey: driver ? undefined : item.tier,
      modality: item.modality,
    });
    if (!engine.hasRules || engine.selectedTierKey === null) {
      return { ok: false, error: `No se pudo calcular el precio de ${serviceLabel}` };
    }
    return {
      ok: true,
      line: {
        service_slug: item.service_slug,
        tier: engine.selectedTierKey,
        modality: item.modality,
        label: `${serviceLabel} · ${engine.selectedTierLabel ?? engine.selectedTierKey}`,
        base_price_eur: engine.closedPrice,
        breakdown: engine.breakdown,
        pricing_inputs: item.pricing_inputs ?? null,
      },
    };
  }

  // Legacy plano o precio manual (override).
  if (typeof item.base_price_eur !== "number" || item.base_price_eur < 0) {
    return { ok: false, error: `Precio base inválido en ${serviceLabel}` };
  }
  return {
    ok: true,
    line: {
      service_slug: item.service_slug,
      tier: item.tier,
      modality: item.modality,
      label: `${serviceLabel} · ${item.tier}`,
      base_price_eur: round2(item.base_price_eur),
      breakdown: [],
      pricing_inputs: item.override_price ? item.pricing_inputs ?? null : null,
    },
  };
}

export async function createQuote(input: CreateQuoteInput): Promise<ActionResult> {
  try {
    const { user, supabase } = await assertAuthorized();

    // Validación
    if (!input.client_name || input.client_name.trim().length === 0) {
      return { ok: false, error: "El nombre del cliente es obligatorio" };
    }

    // ── Precio cerrado · recálculo de validación en servidor ──
    // Normalizamos a líneas (multi-servicio). Para cada servicio del motor NO
    // confiamos en el base_price_eur del cliente: lo recalculamos desde
    // pricing_inputs. El total = suma NET de las líneas + descuento + IVA.
    const rules = await getPricingRules();
    const rawItems: CreateQuoteItemInput[] =
      input.items && input.items.length > 0
        ? input.items
        : [
            {
              service_slug: input.service_slug ?? "",
              tier: input.tier ?? "",
              modality: input.modality ?? "one_shot",
              base_price_eur: input.base_price_eur,
              pricing_inputs: input.pricing_inputs ?? null,
              override_price: input.override_price,
            },
          ];

    const items: QuoteItem[] = [];
    for (const ri of rawItems) {
      const res = computeQuoteLine(ri, rules);
      if (!res.ok) return res;
      items.push(res.line);
    }
    if (items.length === 0) {
      return { ok: false, error: "Añade al menos un servicio al presupuesto" };
    }

    const first = items[0];
    const combinedBase = round2(items.reduce((acc, it) => acc + it.base_price_eur, 0));
    // Resumen por servicio (1 línea por servicio) para lectores genéricos.
    const priceBreakdown = items.map((it) => ({ label: it.label, amount: it.base_price_eur }));
    const pricingInputs: PricingInputs | null =
      items.length === 1 ? first.pricing_inputs ?? null : null;

    // Numerador via función Postgres
    const { data: numData, error: numErr } = await supabase.rpc("next_quote_number");
    if (numErr || !numData) {
      console.error("[createQuote] next_quote_number:", numErr?.message);
      return { ok: false, error: "No se pudo generar número de presupuesto" };
    }
    const quoteNumber = numData as string;

    const amounts = computeQuoteAmounts({
      base_price_eur: combinedBase,
      discount_percent: input.discount_percent,
      vat_percent: input.vat_percent,
    });

    // Validar vinculación CRM si viene
    let crmEntityType: EntityType | null = null;
    let crmEntityId: string | null = null;
    if (input.crm_entity_type && input.crm_entity_id) {
      if (!ENTITY_TYPES.includes(input.crm_entity_type)) {
        return { ok: false, error: "Tipo de entidad CRM inválido" };
      }
      crmEntityType = input.crm_entity_type;
      crmEntityId = input.crm_entity_id;
    }

    const { data, error } = await supabase
      .from("quotes")
      .insert({
        quote_number: quoteNumber,
        client_name: input.client_name.trim(),
        client_nif: input.client_nif?.trim() || null,
        client_email: input.client_email?.trim() || null,
        client_company: input.client_company?.trim() || null,
        client_sector: input.client_sector?.trim() || null,
        client_address: input.client_address?.trim() || null,
        service_slug: first.service_slug,
        tier: first.tier,
        modality: first.modality,
        base_price_eur: combinedBase,
        discount_percent: round2(input.discount_percent ?? 0),
        vat_percent: round2(input.vat_percent ?? 21),
        subtotal_eur: amounts.subtotal,
        vat_amount_eur: amounts.vatAmount,
        total_eur: amounts.total,
        validity_days: input.validity_days ?? 30,
        notes: input.notes?.trim() || null,
        internal_notes: input.internal_notes?.trim() || null,
        pricing_inputs: pricingInputs,
        price_breakdown: priceBreakdown,
        quote_items: items,
        status: "borrador",
        created_by: user.id,
        crm_entity_type: crmEntityType,
        crm_entity_id: crmEntityId,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[createQuote]", error?.message);
      return { ok: false, error: error?.message ?? "Error al crear" };
    }

    revalidatePath("/comercial/calculadora");
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export async function createQuoteAndRedirect(input: CreateQuoteInput): Promise<void> {
  const res = await createQuote(input);
  if (!res.ok) throw new Error(res.error);
  if (res.id) {
    redirect(`/comercial/calculadora/${res.id}`);
  }
}

export async function updateQuoteStatus(
  quoteId: string,
  status: QuoteStatus,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!QUOTE_STATUS.includes(status)) {
      return { ok: false, error: "Estado inválido" };
    }

    const patch: Record<string, unknown> = { status };
    const now = new Date().toISOString();
    if (status === "enviado") patch.sent_at = now;
    if (status === "aceptado") patch.accepted_at = now;
    if (status === "rechazado") patch.rejected_at = now;

    const { error } = await supabase.from("quotes").update(patch).eq("id", quoteId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/comercial/calculadora");
    revalidatePath(`/comercial/calculadora/${quoteId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

export async function deleteQuote(quoteId: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    const { error } = await supabase.from("quotes").delete().eq("id", quoteId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/comercial/calculadora");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

/**
 * Actualiza solo el email del cliente. Útil para arreglar quotes/aceptaciones
 * creadas sin email cuando se quiere enviarlas por correo.
 */
export async function updateQuoteClientEmail(
  quoteId: string,
  email: string | null,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    const trimmed = email?.trim() || null;
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { ok: false, error: "Email no válido" };
    }
    const { error } = await supabase
      .from("quotes")
      .update({ client_email: trimmed })
      .eq("id", quoteId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/comercial/calculadora/${quoteId}`);
    revalidatePath("/comercial/calculadora");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}
