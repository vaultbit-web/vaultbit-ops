import { createClient } from "~/lib/supabase/server";
import { ARCHETYPE_LABELS, type Archetype } from "~/lib/supabase/types";

export interface DashboardKpis {
  funnelLeadsTotal: number;
  funnelLeads30d: number;
  funnelLeadsPrev30d: number;
  funnelSessions30d: number;
  funnelSessionsCompleted30d: number;
  conversionRate30d: number; // 0..1
  leadMagnet30d: number;
  leadMagnetTotal: number;
  investors30d: number;
  partners30d: number;
  partnersTotal: number;
  recentActivity: ActivityItem[];
  archetypeBreakdown: { archetype: string; label: string; count: number }[];
}

export interface ActivityItem {
  source: "funnel_lead" | "lead_magnet" | "investor" | "partner";
  id: string;
  title: string;
  subtitle: string | null;
  created_at: string;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

async function countSince(table: string, since: string, extraFilter?: { col: string; eq: unknown }): Promise<number> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
    if (extraFilter) {
      query = query.eq(extraFilter.col, extraFilter.eq);
    }
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countBetween(table: string, since: string, until: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .gte("created_at", since)
      .lt("created_at", until);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countTotal(table: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true });
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const since30 = daysAgoIso(30);
  const since60 = daysAgoIso(60);

  const [
    funnelLeadsTotal,
    funnelLeads30d,
    funnelLeadsPrev30d,
    funnelSessions30d,
    funnelSessionsCompleted30d,
    leadMagnet30d,
    leadMagnetTotal,
    investors30d,
    partners30d,
    partnersTotal,
    recentActivity,
    archetypeBreakdown,
  ] = await Promise.all([
    countTotal("funnel_leads"),
    countSince("funnel_leads", since30),
    countBetween("funnel_leads", since60, since30),
    countSince("funnel_sessions", since30),
    countSince("funnel_sessions", since30, { col: "completed", eq: true }),
    countSince("lead_magnet_subscribers", since30),
    countTotal("lead_magnet_subscribers"),
    countSince("investor_interest", since30),
    countSince("partner_applications", since30),
    countTotal("partner_applications"),
    getRecentActivity(10),
    getArchetypeBreakdown(since30),
  ]);

  // Conversión real: sesiones completadas que tienen lead asociado vs sesiones iniciadas
  const conversionRate30d =
    funnelSessions30d > 0 ? funnelLeads30d / funnelSessions30d : 0;

  return {
    funnelLeadsTotal,
    funnelLeads30d,
    funnelLeadsPrev30d,
    funnelSessions30d,
    funnelSessionsCompleted30d,
    conversionRate30d,
    leadMagnet30d,
    leadMagnetTotal,
    investors30d,
    partners30d,
    partnersTotal,
    recentActivity,
    archetypeBreakdown,
  };
}

async function getRecentActivity(limit: number): Promise<ActivityItem[]> {
  try {
    const supabase = await createClient();
    const [funnelLeads, leadMagnet, investors, partners] = await Promise.all([
      supabase
        .from("funnel_leads")
        .select("id, name, email, archetype, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("lead_magnet_subscribers")
        .select("id, name, email, source, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("investor_interest")
        .select("id, name, email, ticket_size, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("partner_applications")
        .select("id, name, email, partner_type, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

    const items: ActivityItem[] = [];

    funnelLeads.data?.forEach((r) =>
      items.push({
        source: "funnel_lead",
        id: r.id,
        title: r.name ?? r.email ?? "Lead anónimo",
        subtitle: ARCHETYPE_LABELS[r.archetype as Archetype] ?? r.archetype,
        created_at: r.created_at,
      }),
    );
    leadMagnet.data?.forEach((r) =>
      items.push({
        source: "lead_magnet",
        id: r.id,
        title: r.name ?? r.email,
        subtitle: r.source ?? null,
        created_at: r.created_at,
      }),
    );
    investors.data?.forEach((r) =>
      items.push({
        source: "investor",
        id: r.id,
        title: r.name ?? r.email,
        subtitle: r.ticket_size ?? null,
        created_at: r.created_at,
      }),
    );
    partners.data?.forEach((r) =>
      items.push({
        source: "partner",
        id: r.id,
        title: r.name,
        subtitle: r.partner_type ?? null,
        created_at: r.created_at,
      }),
    );

    return items
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, limit);
  } catch {
    return [];
  }
}

async function getArchetypeBreakdown(since: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("funnel_leads")
      .select("archetype")
      .gte("created_at", since);
    if (error || !data) return [];
    const counts = new Map<string, number>();
    for (const row of data) {
      const key = row.archetype ?? "sin_definir";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts, ([archetype, count]) => ({
      archetype,
      label: ARCHETYPE_LABELS[archetype as Archetype] ?? archetype,
      count,
    })).sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}
