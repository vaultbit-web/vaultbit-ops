import { createClient } from "~/lib/supabase/server";
import { PIPELINE_ACTIVE_STATUSES, type JobOffer } from "~/lib/empleo/types";

/**
 * Lecturas de la sección /empleo.
 *
 * Server client (RLS aplica al usuario autenticado). El workflow n8n escribe
 * con service_role directamente contra PostgREST; aquí solo se lee.
 */

export interface JobOffersResult {
  offers: JobOffer[];
  /** true si la query falló (para distinguir "error" de "aún no hay ofertas") */
  error: boolean;
}

export async function getJobOffers(): Promise<JobOffersResult> {
  const supabase = await createClient();

  // Top por relevancia (la tabla crece sin límite con 23 fuentes x2/día).
  const top = supabase
    .from("job_offers")
    .select("*")
    .order("score_match", { ascending: false, nullsFirst: false })
    .order("last_seen_at", { ascending: false })
    .limit(500);

  // El pipeline personal (interesa/aplicada/entrevista) debe verse SIEMPRE,
  // aunque una oferta caduque o caiga fuera del top-500 por score.
  const pipeline = supabase
    .from("job_offers")
    .select("*")
    .in("status", PIPELINE_ACTIVE_STATUSES)
    .order("last_seen_at", { ascending: false });

  const [topRes, pipeRes] = await Promise.all([top, pipeline]);

  if (topRes.error || pipeRes.error) {
    console.error(
      "[getJobOffers]",
      topRes.error?.message ?? pipeRes.error?.message,
    );
    return { offers: [], error: true };
  }

  // Fusión sin duplicados (el pipeline puede solaparse con el top-500).
  const byId = new Map<string, JobOffer>();
  for (const o of (topRes.data ?? []) as JobOffer[]) byId.set(o.id, o);
  for (const o of (pipeRes.data ?? []) as JobOffer[]) byId.set(o.id, o);

  const offers = [...byId.values()].sort((a, b) => {
    const sa = a.score_match ?? -1;
    const sb = b.score_match ?? -1;
    if (sb !== sa) return sb - sa;
    return b.last_seen_at.localeCompare(a.last_seen_at);
  });

  return { offers, error: false };
}
