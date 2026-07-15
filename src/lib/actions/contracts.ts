"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import {
  CONTRACT_STATUS,
  ENTITY_TYPES,
  type ContractStatus,
  type EntityType,
  type PlaceholderDef,
} from "~/lib/supabase/types";
import { fillPlaceholders } from "~/lib/contracts/fill";

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

export interface CreateContractInput {
  template_slug: string;
  quote_id?: string | null;
  client_name: string;
  client_nif?: string | null;
  client_email?: string | null;
  values: Record<string, string>;
  notes?: string | null;
  /** Vinculación opcional a una entidad CRM */
  crm_entity_type?: EntityType | null;
  crm_entity_id?: string | null;
}

export async function createContract(input: CreateContractInput): Promise<ActionResult> {
  try {
    const { user, supabase } = await assertAuthorized();

    if (!input.template_slug) {
      return { ok: false, error: "Plantilla requerida" };
    }
    if (!input.client_name || input.client_name.trim().length === 0) {
      return { ok: false, error: "Nombre del cliente requerido" };
    }

    // Cargar plantilla actual
    const { data: tpl, error: tplErr } = await supabase
      .from("contract_templates")
      .select("slug, body_md, placeholders, version, active")
      .eq("slug", input.template_slug)
      .maybeSingle();
    if (tplErr || !tpl) {
      return { ok: false, error: "Plantilla no encontrada" };
    }
    if (!tpl.active) {
      return { ok: false, error: "Plantilla inactiva" };
    }

    const placeholders = (Array.isArray(tpl.placeholders) ? tpl.placeholders : []) as PlaceholderDef[];

    // Validar required
    for (const ph of placeholders) {
      if (ph.required) {
        const v = input.values?.[ph.key];
        if (!v || v.trim().length === 0) {
          return { ok: false, error: `Falta el campo "${ph.label}"` };
        }
      }
    }

    // Numerador
    const { data: numData, error: numErr } = await supabase.rpc("next_contract_number");
    if (numErr || !numData) {
      return { ok: false, error: "No se pudo generar número de contrato" };
    }
    const contractNumber = numData as string;

    const bodyFilled = fillPlaceholders(tpl.body_md, input.values ?? {}, placeholders);

    // Validar CRM link
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
      .from("contracts")
      .insert({
        contract_number: contractNumber,
        template_slug: tpl.slug,
        template_version: tpl.version,
        quote_id: input.quote_id ?? null,
        client_name: input.client_name.trim(),
        client_nif: input.client_nif?.trim() || null,
        client_email: input.client_email?.trim() || null,
        values: input.values ?? {},
        body_md_filled: bodyFilled,
        status: "borrador",
        notes: input.notes?.trim() || null,
        created_by: user.id,
        crm_entity_type: crmEntityType,
        crm_entity_id: crmEntityId,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[createContract]", error?.message);
      return { ok: false, error: error?.message ?? "Error al crear contrato" };
    }

    revalidatePath("/comercial/legal");
    revalidatePath("/comercial/legal/contratos");
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export async function createContractAndRedirect(input: CreateContractInput): Promise<void> {
  const res = await createContract(input);
  if (!res.ok) throw new Error(res.error);
  if (res.id) {
    redirect(`/comercial/legal/contratos/${res.id}`);
  }
}

export async function updateContractStatus(
  contractId: string,
  status: ContractStatus,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!CONTRACT_STATUS.includes(status)) {
      return { ok: false, error: "Estado inválido" };
    }

    const patch: Record<string, unknown> = { status };
    const now = new Date().toISOString();
    if (status === "enviado") patch.sent_at = now;
    if (status === "firmado") patch.signed_at = now;

    const { error } = await supabase.from("contracts").update(patch).eq("id", contractId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/comercial/legal/contratos");
    revalidatePath(`/comercial/legal/contratos/${contractId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

export async function deleteContract(contractId: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    const { error } = await supabase.from("contracts").delete().eq("id", contractId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/comercial/legal/contratos");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

/**
 * Actualiza solo el email del cliente del contrato. Útil cuando se generó
 * sin email y queremos enviarlo por correo.
 */
export async function updateContractClientEmail(
  contractId: string,
  email: string | null,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    const trimmed = email?.trim() || null;
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { ok: false, error: "Email no válido" };
    }
    const { error } = await supabase
      .from("contracts")
      .update({ client_email: trimmed })
      .eq("id", contractId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/comercial/legal/contratos/${contractId}`);
    revalidatePath("/comercial/legal/contratos");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}
