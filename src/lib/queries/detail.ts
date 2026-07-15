import { createClient } from "~/lib/supabase/server";
import type { CrmNote, CrmTask, EntityType } from "~/lib/supabase/types";
import { ENTITY_TABLE } from "~/lib/supabase/types";

export async function getEntityById<T>(entityType: EntityType, id: string): Promise<T | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(ENTITY_TABLE[entityType])
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error(`[getEntityById] ${entityType}:`, error.message);
      return null;
    }
    return (data ?? null) as T | null;
  } catch (err) {
    console.error("[getEntityById] threw:", err);
    return null;
  }
}

export async function getNotes(entityType: EntityType, entityId: string): Promise<CrmNote[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("crm_notes")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[getNotes]", error.message);
      return [];
    }
    return (data ?? []) as CrmNote[];
  } catch {
    return [];
  }
}

export async function getTasks(entityType: EntityType, entityId: string): Promise<CrmTask[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("crm_tasks")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("status", { ascending: true })
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[getTasks]", error.message);
      return [];
    }
    return (data ?? []) as CrmTask[];
  } catch {
    return [];
  }
}

/**
 * Tareas pendientes asociadas a cualquier entidad. Se enriquecen con el
 * nombre/email de la entidad para mostrar el contexto en el dashboard.
 */
export interface PendingTaskWithContext extends CrmTask {
  contextLabel: string | null;
}

export async function getPendingTasks(limit = 8): Promise<PendingTaskWithContext[]> {
  try {
    const supabase = await createClient();
    const { data: tasks, error } = await supabase
      .from("crm_tasks")
      .select("*")
      .eq("status", "pending")
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !tasks) {
      console.error("[getPendingTasks]", error?.message);
      return [];
    }

    // Cargar etiquetas de contexto en paralelo, agrupando por entity_type
    const byType = new Map<EntityType, string[]>();
    tasks.forEach((t) => {
      const arr = byType.get(t.entity_type as EntityType) ?? [];
      arr.push(t.entity_id);
      byType.set(t.entity_type as EntityType, arr);
    });

    const labelMap = new Map<string, string>();
    await Promise.all(
      Array.from(byType.entries()).map(async ([etype, ids]) => {
        const table = ENTITY_TABLE[etype];
        const { data } = await supabase
          .from(table)
          .select("id, name, email")
          .in("id", ids);
        data?.forEach((row) => {
          const r = row as { id: string; name?: string | null; email?: string | null };
          labelMap.set(`${etype}:${r.id}`, r.name ?? r.email ?? "—");
        });
      }),
    );

    return tasks.map((t) => ({
      ...(t as CrmTask),
      contextLabel: labelMap.get(`${t.entity_type}:${t.entity_id}`) ?? null,
    }));
  } catch {
    return [];
  }
}
