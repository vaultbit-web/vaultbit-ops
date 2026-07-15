import { createClient } from "~/lib/supabase/server";
import { ARCHETYPE_LABELS, type Archetype } from "~/lib/supabase/types";

const DAY_MS = 1000 * 60 * 60 * 24;

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

function pctDelta(current: number, previous: number): number {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

export interface AnalyticsRange {
  days: number;
  label: string;
}

export const RANGE_PRESETS: AnalyticsRange[] = [
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
  { days: 365, label: "12 meses" },
];

// ─────────────────────────────────────────────────────────
// KPIs comparativos (período actual vs anterior)
// ─────────────────────────────────────────────────────────

export interface AnalyticsKpis {
  leadsCurrent: number;
  leadsPrevious: number;
  leadsDelta: number;
  sessionsCurrent: number;
  sessionsPrevious: number;
  sessionsDelta: number;
  completionRateCurrent: number; // 0..100
  completionRatePrevious: number;
  conversionCurrent: number; // leads / sessions * 100
  conversionPrevious: number;
  leadMagnetCurrent: number;
  leadMagnetPrevious: number;
  leadMagnetDelta: number;
  investorsCurrent: number;
  partnersCurrent: number;
}

async function countTable(
  table: string,
  since: string,
  until: string,
  filters?: { col: string; eq: unknown }[],
): Promise<number> {
  try {
    const supabase = await createClient();
    let q = supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .gte("created_at", since)
      .lt("created_at", until);
    filters?.forEach((f) => {
      q = q.eq(f.col, f.eq);
    });
    const { count, error } = await q;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getAnalyticsKpis(days: number): Promise<AnalyticsKpis> {
  const now = new Date();
  const sinceCurrent = new Date(now.getTime() - days * DAY_MS).toISOString();
  const sincePrevious = new Date(now.getTime() - days * 2 * DAY_MS).toISOString();
  const untilNow = now.toISOString();

  const [
    leadsCurrent,
    leadsPrevious,
    sessionsCurrent,
    sessionsPrevious,
    sessionsCompletedCurrent,
    sessionsCompletedPrevious,
    leadMagnetCurrent,
    leadMagnetPrevious,
    investorsCurrent,
    partnersCurrent,
  ] = await Promise.all([
    countTable("funnel_leads", sinceCurrent, untilNow),
    countTable("funnel_leads", sincePrevious, sinceCurrent),
    countTable("funnel_sessions", sinceCurrent, untilNow),
    countTable("funnel_sessions", sincePrevious, sinceCurrent),
    countTable("funnel_sessions", sinceCurrent, untilNow, [{ col: "completed", eq: true }]),
    countTable("funnel_sessions", sincePrevious, sinceCurrent, [{ col: "completed", eq: true }]),
    countTable("lead_magnet_subscribers", sinceCurrent, untilNow),
    countTable("lead_magnet_subscribers", sincePrevious, sinceCurrent),
    countTable("investor_interest", sinceCurrent, untilNow),
    countTable("partner_applications", sinceCurrent, untilNow),
  ]);

  const completionRateCurrent =
    sessionsCurrent > 0 ? (sessionsCompletedCurrent / sessionsCurrent) * 100 : 0;
  const completionRatePrevious =
    sessionsPrevious > 0 ? (sessionsCompletedPrevious / sessionsPrevious) * 100 : 0;
  const conversionCurrent =
    sessionsCurrent > 0 ? (leadsCurrent / sessionsCurrent) * 100 : 0;
  const conversionPrevious =
    sessionsPrevious > 0 ? (leadsPrevious / sessionsPrevious) * 100 : 0;

  return {
    leadsCurrent,
    leadsPrevious,
    leadsDelta: pctDelta(leadsCurrent, leadsPrevious),
    sessionsCurrent,
    sessionsPrevious,
    sessionsDelta: pctDelta(sessionsCurrent, sessionsPrevious),
    completionRateCurrent,
    completionRatePrevious,
    conversionCurrent,
    conversionPrevious,
    leadMagnetCurrent,
    leadMagnetPrevious,
    leadMagnetDelta: pctDelta(leadMagnetCurrent, leadMagnetPrevious),
    investorsCurrent,
    partnersCurrent,
  };
}

// ─────────────────────────────────────────────────────────
// Drop-off del embudo de diagnóstico
// Para cada step n, sesiones que llegaron al menos a ese paso.
// ─────────────────────────────────────────────────────────

export interface FunnelStep {
  step: number;
  count: number;
  /** % respecto al step 0 (top of funnel). */
  pctOfTop: number;
  /** % respecto al step n-1 (continuación inmediata). */
  pctOfPrev: number;
  /** Caída absoluta vs step anterior. */
  drop: number;
}

export async function getFunnelDropoff(days: number): Promise<FunnelStep[]> {
  try {
    const supabase = await createClient();
    const since = daysAgoIso(days);
    const { data, error } = await supabase
      .from("funnel_sessions")
      .select("step_reached")
      .gte("created_at", since);
    if (error || !data || data.length === 0) return [];

    const steps = data.map((r) => Number(r.step_reached ?? 0));
    const maxStep = steps.reduce((m, v) => Math.max(m, v), 0);

    const counts: number[] = [];
    for (let s = 0; s <= maxStep; s++) {
      counts.push(steps.filter((v) => v >= s).length);
    }
    const top = counts[0] ?? 0;

    return counts.map((count, idx) => {
      const prev = counts[idx - 1] ?? count;
      return {
        step: idx,
        count,
        pctOfTop: top > 0 ? (count / top) * 100 : 0,
        pctOfPrev: prev > 0 ? (count / prev) * 100 : 100,
        drop: prev - count,
      };
    });
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// Cohortes mensuales: leads creados por mes, desglosado por arquetipo
// ─────────────────────────────────────────────────────────

export interface MonthlyCohort {
  month: string; // YYYY-MM
  monthLabel: string; // "abr 2026"
  total: number;
  byArchetype: { archetype: string; label: string; count: number }[];
}

const MONTH_LABELS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export async function getMonthlyCohorts(monthsBack: number): Promise<MonthlyCohort[]> {
  try {
    const supabase = await createClient();
    const since = new Date();
    since.setMonth(since.getMonth() - monthsBack);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("funnel_leads")
      .select("archetype, created_at")
      .gte("created_at", since.toISOString());

    if (error || !data) return [];

    const byMonth = new Map<string, Map<string, number>>();
    for (const row of data) {
      const d = new Date(row.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth.has(key)) byMonth.set(key, new Map());
      const archetype = row.archetype ?? "sin_definir";
      const m = byMonth.get(key)!;
      m.set(archetype, (m.get(archetype) ?? 0) + 1);
    }

    // Genera cohortes de los últimos `monthsBack` meses (incluyendo vacíos)
    const cohorts: MonthlyCohort[] = [];
    for (let i = monthsBack; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      d.setDate(1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const archMap = byMonth.get(key) ?? new Map();
      const byArchetype = Array.from(archMap, ([archetype, count]) => ({
        archetype,
        label: ARCHETYPE_LABELS[archetype as Archetype] ?? archetype,
        count: count as number,
      })).sort((a, b) => b.count - a.count);
      const total = byArchetype.reduce((s, r) => s + r.count, 0);
      cohorts.push({
        month: key,
        monthLabel: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
        total,
        byArchetype,
      });
    }
    return cohorts;
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// Atribución por UTM source (sesiones + leads → conversion%)
// ─────────────────────────────────────────────────────────

export interface UtmAttributionRow {
  source: string;
  sessions: number;
  leads: number;
  conversionPct: number;
}

export async function getUtmAttribution(days: number): Promise<UtmAttributionRow[]> {
  try {
    const supabase = await createClient();
    const since = daysAgoIso(days);

    const [sessionsRes, leadsRes] = await Promise.all([
      supabase
        .from("funnel_sessions")
        .select("utm_source")
        .gte("created_at", since),
      supabase
        .from("funnel_leads")
        .select("utm_source")
        .gte("created_at", since),
    ]);

    const sessionsByUtm = new Map<string, number>();
    sessionsRes.data?.forEach((r) => {
      const k = r.utm_source ?? "(directo)";
      sessionsByUtm.set(k, (sessionsByUtm.get(k) ?? 0) + 1);
    });
    const leadsByUtm = new Map<string, number>();
    leadsRes.data?.forEach((r) => {
      const k = r.utm_source ?? "(directo)";
      leadsByUtm.set(k, (leadsByUtm.get(k) ?? 0) + 1);
    });

    const allKeys = new Set<string>([
      ...sessionsByUtm.keys(),
      ...leadsByUtm.keys(),
    ]);
    const rows: UtmAttributionRow[] = [];
    allKeys.forEach((source) => {
      const sessions = sessionsByUtm.get(source) ?? 0;
      const leads = leadsByUtm.get(source) ?? 0;
      const conversionPct = sessions > 0 ? (leads / sessions) * 100 : 0;
      rows.push({ source, sessions, leads, conversionPct });
    });
    rows.sort((a, b) => b.leads - a.leads || b.sessions - a.sessions);
    return rows;
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// Distribución de status del pipeline de ventas
// ─────────────────────────────────────────────────────────

export interface StatusBreakdownRow {
  status: string;
  count: number;
  pct: number;
}

export async function getLeadsStatusBreakdown(days: number): Promise<StatusBreakdownRow[]> {
  try {
    const supabase = await createClient();
    const since = daysAgoIso(days);
    const { data, error } = await supabase
      .from("funnel_leads")
      .select("status")
      .gte("created_at", since);
    if (error || !data) return [];
    const counts = new Map<string, number>();
    data.forEach((r) => {
      const k = r.status ?? "sin_estado";
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    const total = data.length;
    return Array.from(counts, ([status, count]) => ({
      status,
      count,
      pct: total > 0 ? (count / total) * 100 : 0,
    })).sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// Drop-off segmentado: dónde abandona cada origen y cada arquetipo.
// Responde "¿en qué paso exactamente se va la gente?" con contexto.
// ─────────────────────────────────────────────────────────

export interface SegmentedFunnelRow {
  segment: string;
  total: number;
  steps: number[];           // count >= step n para n=0..9
  maxReached: number;        // paso al que llega la mayoría (mediana aproximada)
  lastStepBeforeDrop: number; // último paso donde aún hay >=50% del top
  completed: number;
  conversionPct: number;     // completed / total * 100
}

const FUNNEL_TOTAL_STEPS = 10; // 0..9

function buildSegmentRow(segment: string, steps: number[]): SegmentedFunnelRow {
  const counts: number[] = [];
  for (let s = 0; s < FUNNEL_TOTAL_STEPS; s++) {
    counts.push(steps.filter((v) => v >= s).length);
  }
  const total = counts[0] ?? 0;
  const completed = steps.filter((v) => v >= 9).length;
  const half = total / 2;
  const lastStepBeforeDrop = counts.reduce(
    (acc, c, i) => (c >= half ? i : acc),
    0,
  );
  return {
    segment,
    total,
    steps: counts,
    maxReached: steps.reduce((m, v) => Math.max(m, v), 0),
    lastStepBeforeDrop,
    completed,
    conversionPct: total > 0 ? (completed / total) * 100 : 0,
  };
}

export async function getFunnelDropoffByUtm(days: number): Promise<SegmentedFunnelRow[]> {
  try {
    const supabase = await createClient();
    const since = daysAgoIso(days);
    const { data, error } = await supabase
      .from("funnel_sessions")
      .select("step_reached, utm_source")
      .gte("created_at", since);
    if (error || !data) return [];

    const grouped = new Map<string, number[]>();
    data.forEach((r) => {
      const key = r.utm_source ?? "(directo)";
      const arr = grouped.get(key) ?? [];
      arr.push(Number(r.step_reached ?? 0));
      grouped.set(key, arr);
    });

    return Array.from(grouped, ([source, steps]) => buildSegmentRow(source, steps))
      .sort((a, b) => b.total - a.total);
  } catch {
    return [];
  }
}

export async function getFunnelDropoffByArchetype(days: number): Promise<SegmentedFunnelRow[]> {
  try {
    const supabase = await createClient();
    const since = daysAgoIso(days);
    // Solo sesiones donde el arquetipo se asignó (step >=5). Antes de Q5 no hay
    // información de arquetipo, por lo que segmentar abajo de step 5 no aporta.
    const { data, error } = await supabase
      .from("funnel_sessions")
      .select("step_reached, archetype")
      .gte("created_at", since)
      .not("archetype", "is", null);
    if (error || !data) return [];

    const grouped = new Map<string, number[]>();
    data.forEach((r) => {
      const key = r.archetype ?? "sin_definir";
      const arr = grouped.get(key) ?? [];
      arr.push(Number(r.step_reached ?? 0));
      grouped.set(key, arr);
    });

    return Array.from(grouped, ([archetype, steps]) => buildSegmentRow(archetype, steps))
      .sort((a, b) => b.total - a.total);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// Salud de datos del embudo: detecta inconsistencias que invalidan métricas.
// Crítico para responder "¿los leads están entrando bien?" con confianza.
// ─────────────────────────────────────────────────────────

export interface FunnelDataHealth {
  sessionsTotal: number;
  sessionsStuckAtZero: number;       // sesiones que solo registraron step 0 — sospechosas
  sessionsStuckAtZeroPct: number;
  sessionsCompletedNoLead: number;   // completed=true pero lead_id=null (bug grave)
  sessionsStep9NotCompleted: number; // step=9 pero completed=false (bug)
  sessionsWithLeadNotCompleted: number; // lead_id set pero completed=false (bug)
  leadsOrphan: number;               // funnel_leads sin sesión vinculada
  leadsTotal: number;
  oldestStuckSession: string | null; // ISO timestamp
  recentInbound: {
    funnel_sessions_24h: number;
    funnel_leads_24h: number;
    lead_magnet_24h: number;
    investor_24h: number;
    partner_24h: number;
  };
}

export async function getFunnelDataHealth(days: number): Promise<FunnelDataHealth> {
  const supabase = await createClient();
  const since = daysAgoIso(days);
  const since24h = daysAgoIso(1);

  const empty: FunnelDataHealth = {
    sessionsTotal: 0,
    sessionsStuckAtZero: 0,
    sessionsStuckAtZeroPct: 0,
    sessionsCompletedNoLead: 0,
    sessionsStep9NotCompleted: 0,
    sessionsWithLeadNotCompleted: 0,
    leadsOrphan: 0,
    leadsTotal: 0,
    oldestStuckSession: null,
    recentInbound: {
      funnel_sessions_24h: 0,
      funnel_leads_24h: 0,
      lead_magnet_24h: 0,
      investor_24h: 0,
      partner_24h: 0,
    },
  };

  try {
    const [
      sessionsAll,
      sessionsStuckRes,
      sessionsCompletedNoLeadRes,
      sessionsStep9NotCompletedRes,
      sessionsWithLeadNotCompletedRes,
      leadsAll,
      sessions24h,
      leads24h,
      leadMagnet24h,
      investor24h,
      partner24h,
    ] = await Promise.all([
      supabase
        .from("funnel_sessions")
        .select("id, step_reached, completed, lead_id, created_at")
        .gte("created_at", since),
      supabase
        .from("funnel_sessions")
        .select("created_at", { count: "exact" })
        .gte("created_at", since)
        .eq("step_reached", 0)
        .order("created_at", { ascending: true })
        .limit(1),
      supabase
        .from("funnel_sessions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since)
        .eq("completed", true)
        .is("lead_id", null),
      supabase
        .from("funnel_sessions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since)
        .eq("step_reached", 9)
        .eq("completed", false),
      supabase
        .from("funnel_sessions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since)
        .not("lead_id", "is", null)
        .eq("completed", false),
      supabase
        .from("funnel_leads")
        .select("id", { count: "exact" })
        .gte("created_at", since),
      supabase
        .from("funnel_sessions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since24h),
      supabase
        .from("funnel_leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since24h),
      supabase
        .from("lead_magnet_subscribers")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since24h),
      supabase
        .from("investor_interest")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since24h),
      supabase
        .from("partner_applications")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since24h),
    ]);

    const allSessions = sessionsAll.data ?? [];
    const sessionsTotal = allSessions.length;
    const sessionsStuckAtZero = allSessions.filter((s) => s.step_reached === 0).length;
    const leadsRows = leadsAll.data ?? [];
    const leadsTotal = leadsRows.length;

    // Orfanos: leads que NO aparecen como lead_id en ninguna sesión
    const leadIdsInSessions = new Set(
      allSessions.map((s) => s.lead_id).filter((v): v is string => Boolean(v)),
    );
    const leadsOrphan = leadsRows.filter((l) => !leadIdsInSessions.has(l.id)).length;

    return {
      sessionsTotal,
      sessionsStuckAtZero,
      sessionsStuckAtZeroPct:
        sessionsTotal > 0 ? (sessionsStuckAtZero / sessionsTotal) * 100 : 0,
      sessionsCompletedNoLead: sessionsCompletedNoLeadRes.count ?? 0,
      sessionsStep9NotCompleted: sessionsStep9NotCompletedRes.count ?? 0,
      sessionsWithLeadNotCompleted: sessionsWithLeadNotCompletedRes.count ?? 0,
      leadsOrphan,
      leadsTotal,
      oldestStuckSession: sessionsStuckRes.data?.[0]?.created_at ?? null,
      recentInbound: {
        funnel_sessions_24h: sessions24h.count ?? 0,
        funnel_leads_24h: leads24h.count ?? 0,
        lead_magnet_24h: leadMagnet24h.count ?? 0,
        investor_24h: investor24h.count ?? 0,
        partner_24h: partner24h.count ?? 0,
      },
    };
  } catch {
    return empty;
  }
}
