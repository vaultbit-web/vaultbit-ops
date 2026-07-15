"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import {
  ENTITY_ROUTE,
  ENTITY_TABLE,
  type EntityType,
  ENTITY_TYPES,
  FUNNEL_LEAD_STATUS,
  INVESTOR_STATUS,
  LEAD_MAGNET_STATUS,
  PARTNER_STATUS,
} from "~/lib/supabase/types";

export type BulkActionResult =
  | { ok: true; affected: number }
  | { ok: false; error: string };

const VALID_STATUSES: Record<EntityType, readonly string[]> = {
  funnel_lead: FUNNEL_LEAD_STATUS,
  lead_magnet: LEAD_MAGNET_STATUS,
  investor: INVESTOR_STATUS,
  partner: PARTNER_STATUS,
};

const MAX_BULK = 200;

async function assertAuthorized() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) throw new Error("No autorizado");
  return { user, supabase };
}

/**
 * Cambia el status en bloque para múltiples filas del mismo entityType.
 * Aplica los mismos efectos secundarios temporales que `updateLeadStatus`
 * (contacted_at / converted_at / delivered_at) cuando el estado destino
 * lo requiere. Devuelve `affected` con el número real de filas tocadas.
 */
export async function bulkUpdateStatus(
  entityType: EntityType,
  ids: string[],
  newStatus: string,
): Promise<BulkActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!ENTITY_TYPES.includes(entityType)) {
      return { ok: false, error: "Tipo de entidad inválido" };
    }
    if (!VALID_STATUSES[entityType].includes(newStatus)) {
      return { ok: false, error: `Estado "${newStatus}" no permitido` };
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return { ok: false, error: "Sin selección" };
    }
    if (ids.length > MAX_BULK) {
      return { ok: false, error: `Máximo ${MAX_BULK} filas por operación` };
    }

    const table = ENTITY_TABLE[entityType];
    const patch: Record<string, unknown> = { status: newStatus };

    if (entityType === "funnel_lead") {
      if (newStatus === "contactado") {
        patch.contacted_at = new Date().toISOString();
      } else if (newStatus === "convertido") {
        patch.converted_at = new Date().toISOString();
      }
    }
    if (entityType === "lead_magnet" && newStatus === "entregado") {
      patch.delivered = true;
      patch.delivered_at = new Date().toISOString();
    }

    const { error, count } = await supabase
      .from(table)
      .update(patch, { count: "exact" })
      .in("id", ids);

    if (error) {
      console.error("[bulkUpdateStatus]", error.message);
      return { ok: false, error: error.message };
    }

    revalidatePath(ENTITY_ROUTE[entityType]);
    revalidatePath("/dashboard");
    return { ok: true, affected: count ?? ids.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

/**
 * Elimina en bloque. Las relaciones FK sin ON DELETE CASCADE pueden
 * fallar (ej. crm_notes/crm_tasks con FK a estos registros) — devolvemos
 * el error real de Postgres para que el usuario sepa qué pasó.
 */
export async function bulkDelete(
  entityType: EntityType,
  ids: string[],
): Promise<BulkActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!ENTITY_TYPES.includes(entityType)) {
      return { ok: false, error: "Tipo de entidad inválido" };
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return { ok: false, error: "Sin selección" };
    }
    if (ids.length > MAX_BULK) {
      return { ok: false, error: `Máximo ${MAX_BULK} filas por operación` };
    }

    const table = ENTITY_TABLE[entityType];

    // Limpieza dependencias: borrar notas y tareas asociadas primero (no hay
    // ON DELETE CASCADE configurado en el schema, así que lo hacemos manual).
    const { error: notesErr } = await supabase
      .from("crm_notes")
      .delete()
      .eq("entity_type", entityType)
      .in("entity_id", ids);
    if (notesErr) {
      console.error("[bulkDelete:notes]", notesErr.message);
    }
    const { error: tasksErr } = await supabase
      .from("crm_tasks")
      .delete()
      .eq("entity_type", entityType)
      .in("entity_id", ids);
    if (tasksErr) {
      console.error("[bulkDelete:tasks]", tasksErr.message);
    }

    const { error, count } = await supabase
      .from(table)
      .delete({ count: "exact" })
      .in("id", ids);
    if (error) {
      console.error("[bulkDelete]", error.message);
      return { ok: false, error: error.message };
    }

    revalidatePath(ENTITY_ROUTE[entityType]);
    revalidatePath("/dashboard");
    return { ok: true, affected: count ?? ids.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}
