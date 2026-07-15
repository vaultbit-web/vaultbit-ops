/**
 * Helper Graph API para leer Insights de Reels publicados desde la cuenta
 * de Instagram Business vinculada al token de Meta del usuario.
 *
 * Reels usa el endpoint:
 *   GET /{ig-media-id}/insights?metric=plays,reach,saved,shares,likes,
 *       comments,total_interactions,ig_reels_avg_watch_time,
 *       ig_reels_video_view_total_time
 *
 * Métricas devueltas:
 *   • plays: reproducciones (deprecated en favor de views, lo seguimos
 *     guardando por compatibilidad)
 *   • reach: cuentas únicas alcanzadas
 *   • likes / comments / shares / saved: interacciones
 *   • total_interactions: suma de las anteriores (la calcula Meta)
 *   • ig_reels_avg_watch_time: tiempo medio en ms
 *   • ig_reels_video_view_total_time: tiempo total acumulado en ms
 *
 * El completion_rate aproximado se calcula como
 *     avg_watch_time / estimated_duration_s (en ms vs segundos).
 */

import { createClient } from "~/lib/supabase/server";
import {
  getValidAccessToken,
  getUserMetaContext,
} from "~/lib/oauth/meta";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

const INSIGHTS_METRICS = [
  "plays",
  "reach",
  "saved",
  "shares",
  "likes",
  "comments",
  "total_interactions",
  "ig_reels_avg_watch_time",
  "ig_reels_video_view_total_time",
] as const;

interface InsightsValue {
  value?: number;
}

interface InsightsItem {
  name?: string;
  values?: InsightsValue[];
}

interface InsightsResponse {
  data?: InsightsItem[];
  error?: { message?: string; type?: string; code?: number };
}

interface RecentMediaItem {
  id: string;
  permalink?: string;
  media_type?: string;
  caption?: string;
  timestamp?: string;
}

interface RecentMediaResponse {
  data?: RecentMediaItem[];
  paging?: { cursors?: { after?: string }; next?: string };
  error?: { message?: string };
}

export interface ReelInsightsRaw {
  plays: number | null;
  reach: number | null;
  saved: number | null;
  shares: number | null;
  likes: number | null;
  comments: number | null;
  total_interactions: number | null;
  avg_watch_time_ms: number | null;
  total_watch_time_ms: number | null;
  raw: Record<string, number | null>;
}

/**
 * Lista los últimos N media de la cuenta de Instagram Business.
 * Útil para auditar / mostrar al usuario qué hay disponible para sync.
 */
export async function listRecentMedia(
  userId: string,
  limit = 25,
): Promise<RecentMediaItem[]> {
  const token = await getValidAccessToken(userId);
  const ctx = await getUserMetaContext(userId);
  if (!token || !ctx) return [];

  const url = new URL(`${GRAPH_BASE}/${ctx.instagram_user_id}/media`);
  url.searchParams.set("fields", "id,permalink,media_type,caption,timestamp");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", token);

  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    console.error("[meta listRecentMedia]", res.status, text.slice(0, 200));
    return [];
  }
  const data = (await res.json()) as RecentMediaResponse;
  if (data.error) {
    console.error("[meta listRecentMedia]", data.error.message);
    return [];
  }
  return data.data ?? [];
}

/**
 * Pide insights crudos a Graph para un media (Reel) concreto.
 */
export async function getMediaInsights(
  userId: string,
  mediaId: string,
): Promise<ReelInsightsRaw | null> {
  const token = await getValidAccessToken(userId);
  if (!token) return null;

  const url = new URL(`${GRAPH_BASE}/${mediaId}/insights`);
  url.searchParams.set("metric", INSIGHTS_METRICS.join(","));
  url.searchParams.set("access_token", token);

  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    console.error(
      "[meta getMediaInsights]",
      mediaId,
      res.status,
      text.slice(0, 300),
    );
    return null;
  }
  const data = (await res.json()) as InsightsResponse;
  if (data.error) {
    console.error("[meta getMediaInsights]", mediaId, data.error.message);
    return null;
  }

  const raw: Record<string, number | null> = {};
  for (const item of data.data ?? []) {
    if (!item.name) continue;
    const v = item.values?.[0]?.value;
    raw[item.name] = typeof v === "number" ? v : null;
  }

  return {
    plays: raw["plays"] ?? null,
    reach: raw["reach"] ?? null,
    saved: raw["saved"] ?? null,
    shares: raw["shares"] ?? null,
    likes: raw["likes"] ?? null,
    comments: raw["comments"] ?? null,
    total_interactions: raw["total_interactions"] ?? null,
    avg_watch_time_ms: raw["ig_reels_avg_watch_time"] ?? null,
    total_watch_time_ms: raw["ig_reels_video_view_total_time"] ?? null,
    raw,
  };
}

/**
 * Resuelve el `instagram_media_id` a partir de la URL del Reel.
 * Si el script ya tiene `instagram_media_id` guardado, lo reusa.
 * Si solo tenemos `instagram_url`, busca el media en `listRecentMedia` por
 * coincidencia de permalink.
 *
 * Devuelve null si no consigue resolverlo (Reel borrado, fuera del rango
 * de los últimos 25, etc.).
 */
async function resolveInstagramMediaId(
  userId: string,
  script: { id: string; instagram_url: string | null; instagram_media_id: string | null },
  recentMediaCache: RecentMediaItem[] | null,
): Promise<{ mediaId: string; cache: RecentMediaItem[] } | null> {
  if (script.instagram_media_id) {
    return {
      mediaId: script.instagram_media_id,
      cache: recentMediaCache ?? [],
    };
  }
  if (!script.instagram_url) return null;

  const cache = recentMediaCache ?? (await listRecentMedia(userId, 50));
  if (cache.length === 0) return null;

  const normalize = (u: string) =>
    u.toLowerCase().replace(/\?.*$/, "").replace(/\/$/, "");
  const target = normalize(script.instagram_url);
  const match = cache.find(
    (m) => m.permalink && normalize(m.permalink) === target,
  );
  if (!match) return null;
  return { mediaId: match.id, cache };
}

export interface SyncReelMetricsResult {
  scanned: number;
  synced: number;
  skipped: number;
  errors: { scriptId: string; error: string }[];
}

/**
 * Para cada `founder_scripts` en estado `published` con `instagram_url`
 * o `instagram_media_id` no nulo, pide los insights actuales y guarda
 * un snapshot diario en `founder_metrics` (UPSERT por (script_id, date)).
 *
 * Si el script no tenía `instagram_media_id` y se resuelve por permalink,
 * lo persistimos para acelerar futuras syncs.
 */
export async function syncReelMetrics(
  userId: string,
): Promise<SyncReelMetricsResult> {
  const supabase = await createClient();
  const result: SyncReelMetricsResult = {
    scanned: 0,
    synced: 0,
    skipped: 0,
    errors: [],
  };

  const { data: scripts, error } = await supabase
    .from("founder_scripts")
    .select("id, instagram_url, instagram_media_id, estimated_duration_s")
    .eq("status", "published")
    .or("instagram_url.not.is.null,instagram_media_id.not.is.null");

  if (error) {
    result.errors.push({ scriptId: "*", error: error.message });
    return result;
  }
  if (!scripts) return result;

  result.scanned = scripts.length;
  let cache: RecentMediaItem[] | null = null;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  for (const script of scripts) {
    try {
      const resolved = await resolveInstagramMediaId(userId, script, cache);
      if (!resolved) {
        result.skipped += 1;
        continue;
      }
      cache = resolved.cache;
      const insights = await getMediaInsights(userId, resolved.mediaId);
      if (!insights) {
        result.skipped += 1;
        continue;
      }

      let completionRate: number | null = null;
      if (
        insights.avg_watch_time_ms !== null &&
        script.estimated_duration_s &&
        script.estimated_duration_s > 0
      ) {
        const ratio =
          insights.avg_watch_time_ms / (script.estimated_duration_s * 1000);
        completionRate = Math.max(0, Math.min(1, Number(ratio.toFixed(4))));
      }

      const { error: upsertErr } = await supabase
        .from("founder_metrics")
        .upsert(
          {
            script_id: script.id,
            instagram_media_id: resolved.mediaId,
            snapshot_date: today,
            plays: insights.plays,
            reach: insights.reach,
            saved: insights.saved,
            shares: insights.shares,
            likes: insights.likes,
            comments: insights.comments,
            total_interactions: insights.total_interactions,
            avg_watch_time_ms: insights.avg_watch_time_ms,
            total_watch_time_ms: insights.total_watch_time_ms,
            completion_rate: completionRate,
            raw_payload: insights.raw,
          },
          { onConflict: "script_id,snapshot_date" },
        );
      if (upsertErr) {
        result.errors.push({ scriptId: script.id, error: upsertErr.message });
        continue;
      }

      // Si descubrimos el media_id por permalink, persistirlo en el script
      // para acelerar próximas syncs.
      if (!script.instagram_media_id) {
        await supabase
          .from("founder_scripts")
          .update({ instagram_media_id: resolved.mediaId })
          .eq("id", script.id);
      }
      result.synced += 1;
    } catch (err) {
      result.errors.push({
        scriptId: script.id,
        error: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }

  return result;
}

/**
 * Devuelve el último snapshot de métricas para un script (para mostrar
 * los chips de stats en la UI sin pedir insights live cada vez).
 */
export async function getLatestMetrics(scriptId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("founder_metrics")
    .select("*")
    .eq("script_id", scriptId)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
