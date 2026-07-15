import {
  Users,
  Activity,
  Download,
  Coins,
  Handshake,
  TrendingUp,
  CheckCircle2,
  ListChecks,
} from "lucide-react";
import Link from "next/link";
import { getDashboardKpis, type ActivityItem } from "~/lib/queries/kpis";
import { getPendingTasks } from "~/lib/queries/detail";
import {
  ENTITY_LABELS,
  ENTITY_ROUTE,
  type EntityType,
} from "~/lib/supabase/types";
import { PageHeader } from "~/components/page-header";
import { KpiCard } from "~/components/kpi-card";
import { Card, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { TaskItem } from "~/components/task-item";
import { CalendarWidget } from "~/components/calendar-widget";
import { MobileCollapsible } from "~/components/mobile-collapsible";
import { formatNumber, relativeTime } from "~/lib/utils";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const SOURCE_LABELS: Record<ActivityItem["source"], { label: string; tone: "brand" | "success" | "warning" | "info" }> = {
  funnel_lead: { label: "Diagnóstico", tone: "brand" },
  lead_magnet: { label: "Guía 7 errores", tone: "info" },
  investor: { label: "Inversor", tone: "warning" },
  partner: { label: "Partner", tone: "success" },
};

function pctDelta(current: number, previous: number): { value: number; positive: boolean | null } {
  if (previous === 0 && current === 0) return { value: 0, positive: null };
  if (previous === 0) return { value: 100, positive: true };
  const v = Math.round(((current - previous) / previous) * 100);
  return { value: v, positive: v === 0 ? null : v > 0 };
}

export default async function DashboardPage() {
  const [k, pendingTasks] = await Promise.all([
    getDashboardKpis(),
    getPendingTasks(8),
  ]);
  const delta = pctDelta(k.funnelLeads30d, k.funnelLeadsPrev30d);
  const completionRate =
    k.funnelSessions30d > 0
      ? (k.funnelSessionsCompleted30d / k.funnelSessions30d) * 100
      : 0;

  return (
    <>
      <PageHeader
        eyebrow="Vista general"
        title="Dashboard"
        description="Resumen operativo de los últimos 30 días — leads, conversión, tareas pendientes y actividad reciente."
      />

      <section className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Leads diagnóstico · 30d"
          value={k.funnelLeads30d}
          delta={delta}
          hint={`${k.funnelLeadsTotal} totales`}
          icon={Users}
          highlight
        />
        <KpiCard
          label="Sesiones embudo · 30d"
          value={k.funnelSessions30d}
          icon={Activity}
          hint="Inicios del diagnóstico"
        />
        <KpiCard
          label="Embudo completado"
          value={`${completionRate.toFixed(1)}%`}
          icon={CheckCircle2}
          hint={`${k.funnelSessionsCompleted30d} de ${k.funnelSessions30d}`}
        />
        <KpiCard
          label="Conversión a lead"
          value={`${(k.conversionRate30d * 100).toFixed(1)}%`}
          icon={TrendingUp}
          hint="Sesiones → lead 30d"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2 mt-4 sm:mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
                <CardTitle>Tareas pendientes</CardTitle>
              </div>
              {pendingTasks.length > 0 ? (
                <Badge tone="brand">{pendingTasks.length}</Badge>
              ) : null}
            </div>
            <CardDescription>
              {pendingTasks.length === 0
                ? "Sin tareas pendientes ahora mismo."
                : "Ordenadas por fecha de vencimiento (más urgentes primero)."}
            </CardDescription>
          </CardHeader>

          {pendingTasks.length === 0 ? (
            <p className="text-sm text-anthracite-400 text-center py-6">
              Crea tareas desde la página detalle de cualquier lead.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pendingTasks.map((t) => {
                const route = ENTITY_ROUTE[t.entity_type as EntityType];
                const label = ENTITY_LABELS[t.entity_type as EntityType];
                return (
                  <TaskItem
                    key={t.id}
                    task={t}
                    showContext
                    contextLabel={t.contextLabel ? `${label} · ${t.contextLabel}` : label}
                    contextHref={route ? `${route}/${t.entity_id}` : undefined}
                  />
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>
              Últimos eventos de las 4 fuentes de leads.
            </CardDescription>
          </CardHeader>

          {k.recentActivity.length === 0 ? (
            <p className="text-sm text-anthracite-400 py-6 text-center">
              Sin actividad reciente. Cuando entren leads, aparecerán aquí.
            </p>
          ) : (
            <ul className="flex flex-col">
              {k.recentActivity.map((item) => {
                const meta = SOURCE_LABELS[item.source];
                const route =
                  item.source === "funnel_lead"
                    ? `/crm/ventas/${item.id}`
                    : item.source === "lead_magnet"
                      ? `/crm/lead-magnet/${item.id}`
                      : item.source === "investor"
                        ? `/crm/inversores/${item.id}`
                        : `/crm/partners/${item.id}`;
                return (
                  <li
                    key={`${item.source}-${item.id}`}
                    className="flex items-center justify-between gap-3 py-3 border-b border-anthracite-600/20 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={route}
                        className="block text-sm text-fg truncate hover:text-brand-400 transition-colors"
                      >
                        {item.title}
                      </Link>
                      {item.subtitle ? (
                        <p className="text-xs text-anthracite-400 truncate">
                          {item.subtitle}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      <span className="text-[11px] text-anthracite-400 hidden sm:inline">
                        {relativeTime(item.created_at)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      <section className="mt-6 sm:mt-8">
        <CalendarWidget />
      </section>

      <div className="mt-6 sm:mt-8">
        <MobileCollapsible title="Más métricas · lead magnet, inversores y partners">
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mt-2 lg:mt-0">
            <KpiCard
              label="Lead magnet · 30d"
              value={k.leadMagnet30d}
              icon={Download}
              hint={`${k.leadMagnetTotal} totales`}
            />
            <KpiCard
              label="Inversores · 30d"
              value={k.investors30d}
              icon={Coins}
            />
            <KpiCard
              label="Partners · 30d"
              value={k.partners30d}
              icon={Handshake}
              hint={`${k.partnersTotal} totales`}
            />
            <div className="card-dark p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-anthracite-200 mb-3">
                Arquetipos · 30d
              </p>
              {k.archetypeBreakdown.length === 0 ? (
                <p className="text-sm text-anthracite-400">Sin datos.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {k.archetypeBreakdown.slice(0, 4).map((row) => {
                    const max = k.archetypeBreakdown[0].count;
                    const pct = max > 0 ? Math.round((row.count / max) * 100) : 0;
                    return (
                      <li key={row.archetype} className="flex items-center gap-2 text-xs">
                        <span className="w-20 sm:w-24 truncate text-anthracite-100">
                          {row.label}
                        </span>
                        <span className="flex-1 h-1.5 bg-anthracite-700 rounded-full overflow-hidden">
                          <span
                            className="block h-full bg-brand-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <span className="w-6 text-right text-anthracite-200 font-medium">
                          {formatNumber(row.count)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </MobileCollapsible>
      </div>
    </>
  );
}
