import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import { syncReelMetrics } from "~/lib/meta/insights";
import { enforceRateLimit, safeEqual } from "~/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Endpoint de sincronización de métricas Meta para los Reels publicados.
 *
 * Dos modos de autorización:
 *
 *   1. Cron externo (n8n) → cabecera `Authorization: Bearer <META_SYNC_SECRET>`.
 *      En este caso sincronizamos para TODOS los user_id que tengan token
 *      Meta guardado. Hoy en producción solo hay uno (Daniel).
 *
 *   2. Trigger manual desde la UI → sesión Supabase válida + email en
 *      allowlist. Sincroniza solo para el usuario actual.
 *
 * Devuelve un JSON con `scanned / synced / skipped / errors` por usuario.
 */

interface SyncSummary {
  userId: string;
  scanned: number;
  synced: number;
  skipped: number;
  errors: { scriptId: string; error: string }[];
}

async function handler(request: Request) {
  const limited = enforceRateLimit(request, "meta-sync", { max: 120, windowMs: 60_000 });
  if (limited) return limited;

  const authHeader = request.headers.get("authorization") ?? "";
  const secret = process.env.META_SYNC_SECRET;
  const bearerOk =
    secret !== undefined &&
    secret.length > 0 &&
    safeEqual(authHeader, `Bearer ${secret}`);

  const supabase = await createClient();
  const summaries: SyncSummary[] = [];

  if (bearerOk) {
    // Modo cron: enumerar todos los users con token Meta y sync
    const { data: rows } = await supabase
      .from("meta_oauth_tokens")
      .select("user_id");
    const userIds = (rows ?? []).map((r) => r.user_id);
    for (const userId of userIds) {
      const r = await syncReelMetrics(userId);
      summaries.push({ userId, ...r });
    }
    return NextResponse.json({ ok: true, mode: "cron", summaries });
  }

  // Modo manual: requiere sesión + allowlist
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const r = await syncReelMetrics(user.id);
  return NextResponse.json({
    ok: true,
    mode: "manual",
    summaries: [{ userId: user.id, ...r }],
  });
}

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
