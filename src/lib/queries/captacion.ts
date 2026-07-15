import { createClient } from "~/lib/supabase/server";
import type {
  Partner,
  PartnerSource,
  CaptacionEvent,
  CaptacionTask,
} from "~/lib/captacion/types";
import { getCurrentPlanWeek } from "~/lib/captacion/types";

/**
 * Lecturas de la sección /captacion-90d.
 *
 * Todas las queries usan el server client (RLS aplica al usuario
 * autenticado). Nada de service_role aquí — eso queda para el seed
 * script (`ops/scripts/seed-captacion-90d.ts`).
 */

export interface DashboardKpis {
  clientes_cerrados: number;
  facturacion_eur_90d: number;
  suscriptores_newsletter: number;
  followers_linkedin: number | null;
}

export async function getPartners(): Promise<Partner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[getPartners]", error.message);
    return [];
  }
  return (data ?? []) as Partner[];
}

export async function getPartnersByOrigin(origin: string): Promise<Partner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("origin", origin)
    .order("verification_level", { ascending: false })
    .order("full_name", { ascending: true });
  if (error) {
    console.error("[getPartnersByOrigin]", error.message);
    return [];
  }
  return (data ?? []) as Partner[];
}

export async function getPartnerById(id: string): Promise<Partner | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[getPartnerById]", error.message);
    return null;
  }
  return (data as Partner | null) ?? null;
}

export async function getPartnerSources(
  partnerId: string,
): Promise<PartnerSource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_sources")
    .select("*")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[getPartnerSources]", error.message);
    return [];
  }
  return (data ?? []) as PartnerSource[];
}

export async function getPartnerSourcesByPartnerIds(
  partnerIds: string[],
): Promise<Record<string, PartnerSource[]>> {
  if (partnerIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_sources")
    .select("*")
    .in("partner_id", partnerIds);
  if (error) {
    console.error("[getPartnerSourcesByPartnerIds]", error.message);
    return {};
  }
  const grouped: Record<string, PartnerSource[]> = {};
  for (const row of (data ?? []) as PartnerSource[]) {
    if (!grouped[row.partner_id]) grouped[row.partner_id] = [];
    grouped[row.partner_id].push(row);
  }
  return grouped;
}

export async function getEvents(): Promise<CaptacionEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date_start", { ascending: true, nullsFirst: false });
  if (error) {
    console.error("[getEvents]", error.message);
    return [];
  }
  return (data ?? []) as CaptacionEvent[];
}

export async function getUpcomingEvents(limit = 3): Promise<CaptacionEvent[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("date_start", today)
    .order("date_start", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("[getUpcomingEvents]", error.message);
    return [];
  }
  return (data ?? []) as CaptacionEvent[];
}

export async function getTasks(): Promise<CaptacionTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("captacion_tasks")
    .select("*")
    .order("priority", { ascending: true })
    .order("week", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[getTasks]", error.message);
    return [];
  }
  return (data ?? []) as CaptacionTask[];
}

export async function getTasksForCurrentWeek(): Promise<CaptacionTask[]> {
  const supabase = await createClient();
  const week = getCurrentPlanWeek();
  const { data, error } = await supabase
    .from("captacion_tasks")
    .select("*")
    .eq("week", week)
    .order("priority", { ascending: true });
  if (error) {
    console.error("[getTasksForCurrentWeek]", error.message);
    return [];
  }
  return (data ?? []) as CaptacionTask[];
}

export async function getNextPartnerActions(
  limit = 5,
): Promise<Partner[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .not("next_action", "is", null)
    .gte("next_action_date", today)
    .order("next_action_date", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("[getNextPartnerActions]", error.message);
    return [];
  }
  return (data ?? []) as Partner[];
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const supabase = await createClient();

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);
  const cutoffIso = ninetyDaysAgo.toISOString();

  // Clientes cerrados (funnel_leads con status='convertido')
  const { count: clientesCerrados } = await supabase
    .from("funnel_leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "convertido");

  // Facturación 90d (quotes en estado 'aceptado' creados en últimos 90d)
  const { data: quotesData } = await supabase
    .from("quotes")
    .select("total_eur")
    .eq("status", "aceptado")
    .gte("created_at", cutoffIso);
  const facturacion = (quotesData ?? []).reduce<number>((acc, q) => {
    const value = (q as { total_eur?: number | string | null }).total_eur;
    const n = typeof value === "string" ? parseFloat(value) : value;
    return acc + (typeof n === "number" && !Number.isNaN(n) ? n : 0);
  }, 0);

  // Suscriptores newsletter
  const { count: subscribers } = await supabase
    .from("lead_magnet_subscribers")
    .select("id", { count: "exact", head: true });

  return {
    clientes_cerrados: clientesCerrados ?? 0,
    facturacion_eur_90d: facturacion,
    suscriptores_newsletter: subscribers ?? 0,
    // TODO: conectar LinkedIn Marketing API o scraping autorizado
    followers_linkedin: null,
  };
}

export async function getCaptacionProgress() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("captacion_progress")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("[getCaptacionProgress]", error.message);
    return null;
  }
  return data;
}
