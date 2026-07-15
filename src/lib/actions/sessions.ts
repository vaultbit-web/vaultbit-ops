"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";

export type SessionActionResult =
  | { ok: true; affected: number }
  | { ok: false; error: string };

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

/**
 * Borra una fila de funnel_sessions. Usado típicamente para limpiar
 * sesiones de prueba que ensucian las métricas del embudo.
 *
 * Las funnel_sessions tienen FK lead_id → funnel_leads ON DELETE SET NULL,
 * así que borrar una sesión nunca afecta a los leads.
 */
export async function deleteFunnelSession(
  id: string,
): Promise<SessionActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!id) return { ok: false, error: "ID inválido" };
    const { error, count } = await supabase
      .from("funnel_sessions")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/crm/sesiones");
    revalidatePath("/analytics");
    revalidatePath("/dashboard");
    return { ok: true, affected: count ?? 1 };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error",
    };
  }
}

/**
 * Borra TODAS las funnel_sessions. Acción destructiva pensada para
 * limpiar el ruido de pruebas en producción cuando aún no hay tráfico
 * real significativo. La UI exige doble confirmación antes de llamarla.
 */
export async function deleteAllFunnelSessions(): Promise<SessionActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    // delete() requiere un filtro; usamos uno tautológico (id no null)
    // que coincide con la regla de la policy DELETE.
    const { error, count } = await supabase
      .from("funnel_sessions")
      .delete({ count: "exact" })
      .not("id", "is", null);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/crm/sesiones");
    revalidatePath("/analytics");
    revalidatePath("/dashboard");
    return { ok: true, affected: count ?? 0 };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error",
    };
  }
}
