"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import {
  AUDIT_LEAD_STATUSES,
  type AuditLeadStatus,
} from "~/lib/leads/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

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

/** Triaje manual de un lead. Es el único campo que Ops escribe en audit_leads. */
export async function updateAuditLeadStatus(
  leadId: string,
  status: AuditLeadStatus,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!AUDIT_LEAD_STATUSES.includes(status)) {
      return { ok: false, error: "Estado inválido" };
    }
    if (!leadId) return { ok: false, error: "ID inválido" };

    const { error } = await supabase
      .from("audit_leads")
      .update({ status })
      .eq("id", leadId);
    if (error) {
      // No filtrar el detalle interno de Postgres/PostgREST al cliente.
      console.error("[updateAuditLeadStatus]", error.message);
      return { ok: false, error: "No se pudo actualizar el estado" };
    }

    revalidatePath("/prospectos");
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "No autorizado") {
      return { ok: false, error: "No autorizado" };
    }
    console.error("[updateAuditLeadStatus]", err);
    return { ok: false, error: "No se pudo actualizar el estado" };
  }
}
