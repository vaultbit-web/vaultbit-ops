"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import { syncReelMetrics, type SyncReelMetricsResult } from "~/lib/meta/insights";

export type SyncMetaActionResult =
  | { ok: true; result: SyncReelMetricsResult }
  | { ok: false; error: string };

/**
 * Sync manual disparado desde la UI (botón "Sincronizar métricas" en
 * /ajustes). Internamente llama al mismo helper que el cron de n8n.
 */
export async function triggerMetaSync(): Promise<SyncMetaActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !isEmailAllowed(user.email)) {
      return { ok: false, error: "No autorizado" };
    }
    const result = await syncReelMetrics(user.id);
    revalidatePath("/ajustes");
    revalidatePath("/contenido/personal");
    return { ok: true, result };
  } catch (err) {
    console.error("[triggerMetaSync]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}
