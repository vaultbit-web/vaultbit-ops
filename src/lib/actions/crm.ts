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
  TASK_STATUS,
  type TaskStatus,
} from "~/lib/supabase/types";

/**
 * Server Actions del CRM editable.
 *
 * Cada action sigue el mismo patrón:
 *   1. assertAuthorized() — bloquea si no hay sesión válida en allowlist.
 *   2. Validación de inputs (no confiamos en lo que llegue del cliente).
 *   3. Mutation contra Supabase con el cliente server-side (RLS aplica).
 *   4. revalidatePath de las rutas afectadas para refrescar el SSR cache.
 *   5. Retorna { ok: true } o { ok: false, error: string }.
 *
 * El cliente las invoca desde Forms server actions o desde botones con
 * useTransition. Ningún token sensible viaja al cliente — solo el ID
 * de la entidad y los datos del formulario.
 */

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

const VALID_STATUSES_BY_ENTITY: Record<EntityType, readonly string[]> = {
  funnel_lead: FUNNEL_LEAD_STATUS,
  lead_magnet: LEAD_MAGNET_STATUS,
  investor: INVESTOR_STATUS,
  partner: PARTNER_STATUS,
};

/**
 * Cambia el status de cualquier registro de los 4 dominios CRM.
 * Setea contacted_at / converted_at automáticamente para funnel_leads
 * cuando aplica (el constraint del SQL no se atreve, aquí mantenemos
 * la disciplina temporal).
 */
export async function updateLeadStatus(
  entityType: EntityType,
  entityId: string,
  newStatus: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();

    if (!ENTITY_TYPES.includes(entityType)) {
      return { ok: false, error: "Tipo de entidad inválido" };
    }
    if (!VALID_STATUSES_BY_ENTITY[entityType].includes(newStatus)) {
      return { ok: false, error: `Estado "${newStatus}" no permitido` };
    }
    if (!entityId || typeof entityId !== "string") {
      return { ok: false, error: "ID inválido" };
    }

    const table = ENTITY_TABLE[entityType];
    const patch: Record<string, unknown> = { status: newStatus };

    // Para funnel_leads: marcar timestamps de transición si procede.
    if (entityType === "funnel_lead") {
      if (newStatus === "contactado") {
        patch.contacted_at = new Date().toISOString();
      } else if (newStatus === "convertido") {
        patch.converted_at = new Date().toISOString();
      }
    }
    // Para lead_magnet: si pasa a "entregado", marcar delivered=true + delivered_at.
    if (entityType === "lead_magnet" && newStatus === "entregado") {
      patch.delivered = true;
      patch.delivered_at = new Date().toISOString();
    }

    const { error } = await supabase.from(table).update(patch).eq("id", entityId);
    if (error) {
      console.error("[updateLeadStatus]", error.message);
      return { ok: false, error: error.message };
    }

    revalidatePath(ENTITY_ROUTE[entityType]);
    revalidatePath(`${ENTITY_ROUTE[entityType]}/${entityId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

/**
 * Crea una nueva nota libre asociada a un registro CRM.
 */
export async function addNote(
  entityType: EntityType,
  entityId: string,
  body: string,
): Promise<ActionResult> {
  try {
    const { user, supabase } = await assertAuthorized();

    if (!ENTITY_TYPES.includes(entityType)) {
      return { ok: false, error: "Tipo de entidad inválido" };
    }
    const trimmed = body.trim();
    if (trimmed.length === 0) {
      return { ok: false, error: "La nota no puede estar vacía" };
    }
    if (trimmed.length > 5000) {
      return { ok: false, error: "La nota es demasiado larga (máx 5000 caracteres)" };
    }

    const { error } = await supabase.from("crm_notes").insert({
      entity_type: entityType,
      entity_id: entityId,
      body: trimmed,
      created_by: user.id,
    });
    if (error) {
      console.error("[addNote]", error.message);
      return { ok: false, error: error.message };
    }

    revalidatePath(`${ENTITY_ROUTE[entityType]}/${entityId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export async function deleteNote(noteId: string, entityType: EntityType, entityId: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    const { error } = await supabase.from("crm_notes").delete().eq("id", noteId);
    if (error) {
      return { ok: false, error: error.message };
    }
    revalidatePath(`${ENTITY_ROUTE[entityType]}/${entityId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

/**
 * Crea una tarea de seguimiento (recordatorio) asociada a un lead.
 */
export async function addTask(
  entityType: EntityType,
  entityId: string,
  title: string,
  description?: string,
  dueAt?: string | null,
): Promise<ActionResult> {
  try {
    const { user, supabase } = await assertAuthorized();

    if (!ENTITY_TYPES.includes(entityType)) {
      return { ok: false, error: "Tipo de entidad inválido" };
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return { ok: false, error: "El título no puede estar vacío" };
    }
    if (trimmedTitle.length > 500) {
      return { ok: false, error: "Título demasiado largo (máx 500)" };
    }

    const trimmedDesc = description?.trim();
    if (trimmedDesc && trimmedDesc.length > 2000) {
      return { ok: false, error: "Descripción demasiado larga (máx 2000)" };
    }

    let normalizedDueAt: string | null = null;
    if (dueAt && dueAt.length > 0) {
      const d = new Date(dueAt);
      if (Number.isNaN(d.getTime())) {
        return { ok: false, error: "Fecha de vencimiento inválida" };
      }
      normalizedDueAt = d.toISOString();
    }

    const { error } = await supabase.from("crm_tasks").insert({
      entity_type: entityType,
      entity_id: entityId,
      title: trimmedTitle,
      description: trimmedDesc || null,
      due_at: normalizedDueAt,
      status: "pending",
      created_by: user.id,
    });
    if (error) {
      console.error("[addTask]", error.message);
      return { ok: false, error: error.message };
    }

    revalidatePath(`${ENTITY_ROUTE[entityType]}/${entityId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export async function setTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!TASK_STATUS.includes(status)) {
      return { ok: false, error: "Estado de tarea inválido" };
    }

    const patch: Record<string, unknown> = { status };
    if (status === "done") {
      patch.completed_at = new Date().toISOString();
    } else {
      patch.completed_at = null;
    }

    // Necesitamos saber qué entidad para revalidar — leemos primero
    const { data: task } = await supabase
      .from("crm_tasks")
      .select("entity_type, entity_id")
      .eq("id", taskId)
      .single();

    const { error } = await supabase.from("crm_tasks").update(patch).eq("id", taskId);
    if (error) return { ok: false, error: error.message };

    if (task) {
      const route = ENTITY_ROUTE[task.entity_type as EntityType];
      if (route) revalidatePath(`${route}/${task.entity_id}`);
    }
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    const { data: task } = await supabase
      .from("crm_tasks")
      .select("entity_type, entity_id")
      .eq("id", taskId)
      .single();

    const { error } = await supabase.from("crm_tasks").delete().eq("id", taskId);
    if (error) return { ok: false, error: error.message };

    if (task) {
      const route = ENTITY_ROUTE[task.entity_type as EntityType];
      if (route) revalidatePath(`${route}/${task.entity_id}`);
    }
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
