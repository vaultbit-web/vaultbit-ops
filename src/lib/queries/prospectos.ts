import { createClient } from "~/lib/supabase/server";
import { PIPELINE_ACTIVE_STATUSES, type AuditLead } from "~/lib/leads/types";

/**
 * Lecturas de la sección /prospectos.
 *
 * Server client (RLS por identidad aplica al usuario autorizado). El workflow
 * n8n escribe con service_role directamente contra PostgREST; aquí solo se lee.
 */

export interface AuditLeadsResult {
  leads: AuditLead[];
  /** true si la query falló (para distinguir "error" de "aún no hay leads") */
  error: boolean;
}

export async function getAuditLeads(): Promise<AuditLeadsResult> {
  const supabase = await createClient();

  // Top por relevancia: la valoración de Claude manda, luego la heurística.
  const top = supabase
    .from("audit_leads")
    .select("*")
    .order("score_claude", { ascending: false, nullsFirst: false })
    .order("auditability_score", { ascending: false, nullsFirst: false })
    .order("last_seen_at", { ascending: false })
    .limit(500);

  // El pipeline activo (investigado/contactado/…/cliente) debe verse SIEMPRE,
  // aunque un lead caduque o caiga fuera del top-500 por score.
  const pipeline = supabase
    .from("audit_leads")
    .select("*")
    .in("status", PIPELINE_ACTIVE_STATUSES)
    .order("last_seen_at", { ascending: false });

  const [topRes, pipeRes] = await Promise.all([top, pipeline]);

  if (topRes.error || pipeRes.error) {
    console.error(
      "[getAuditLeads]",
      topRes.error?.message ?? pipeRes.error?.message,
    );
    return { leads: [], error: true };
  }

  // Fusión sin duplicados (el pipeline puede solaparse con el top-500).
  const byId = new Map<string, AuditLead>();
  for (const l of (topRes.data ?? []) as AuditLead[]) byId.set(l.id, l);
  for (const l of (pipeRes.data ?? []) as AuditLead[]) byId.set(l.id, l);

  // España primero: dentro del orden por relevancia, los leads de España suben, luego
  // Europa, luego global (el mercado objetivo de VaultAudit va por delante).
  const zonaWeight = (z: AuditLead["zona"]): number =>
    z === "es" ? 2 : z === "eu" ? 1 : 0;

  const leads = [...byId.values()].sort((a, b) => {
    const za = zonaWeight(a.zona);
    const zb = zonaWeight(b.zona);
    if (zb !== za) return zb - za;
    const sa = a.score_claude ?? a.auditability_score ?? -1;
    const sb = b.score_claude ?? b.auditability_score ?? -1;
    if (sb !== sa) return sb - sa;
    return b.last_seen_at.localeCompare(a.last_seen_at);
  });

  return { leads, error: false };
}
