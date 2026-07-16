import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChartLine,
  Coins,
  Handshake,
  Linkedin,
  Mail,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { formatDateShort, formatEuro, formatNumber } from "~/lib/utils";
import {
  getCurrentPlanWeek,
  CAPTACION_PLAN_TOTAL_WEEKS,
  CAPTACION_PLAN_START_ISO,
  type Partner,
  type CaptacionEvent,
  type CaptacionTask,
} from "~/lib/captacion/types";
import { KpiCard } from "./kpi-card";
import type { DashboardKpis } from "~/lib/queries/captacion";

interface Dashboard90dProps {
  kpis: DashboardKpis;
  weekTasks: CaptacionTask[];
  nextActions: Partner[];
  upcomingEvents: CaptacionEvent[];
}

export function Dashboard90d({
  kpis,
  weekTasks,
  nextActions,
  upcomingEvents,
}: Dashboard90dProps) {
  const currentWeek = getCurrentPlanWeek();
  const progressPct =
    (currentWeek / CAPTACION_PLAN_TOTAL_WEEKS) * 100;
  const startDate = formatDateShort(CAPTACION_PLAN_START_ISO);

  return (
    <div className="space-y-8">
      <header className="glow-orange relative">
        <p className="text-[10px] uppercase tracking-[0.12em] text-brand-400 font-semibold mb-2">
          Vaultbit Advisory · Captación 90 días
        </p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-fg tracking-tight leading-tight">
          Espacio de Trabajo · <span className="font-bold">90 días</span>
        </h1>
        <p className="mt-2 text-sm text-anthracite-200 max-w-2xl">
          Hub operativo del plan de captación. Conectado a partners,
          eventos y backlog. Fuente: Manual Operativo v1.1 (25 may 2026).
        </p>
      </header>

      {/* KPIs */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            label="Clientes cerrados"
            value={formatNumber(kpis.clientes_cerrados)}
            icon={Users}
            emphasis
          />
          <KpiCard
            label="Facturación 90 d"
            value={formatEuro(kpis.facturacion_eur_90d)}
            icon={Coins}
            hint="Suma de presupuestos en estado aceptado"
          />
          <KpiCard
            label="Subs newsletter"
            value={formatNumber(kpis.suscriptores_newsletter)}
            icon={Mail}
          />
          <KpiCard
            label="Followers LinkedIn"
            value="—"
            icon={Linkedin}
            hint="Pendiente conectar LinkedIn API"
          />
        </div>
      </section>

      {/* Progreso 90 días */}
      <section className="card-dark p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.12em] text-anthracite-200 font-semibold">
              Progreso del plan
            </p>
            <p className="text-sm text-fg mt-0.5">
              Semana <span className="font-bold text-brand-500">{currentWeek}</span> de {CAPTACION_PLAN_TOTAL_WEEKS}
            </p>
          </div>
          <p className="text-xs text-anthracite-400 shrink-0 whitespace-nowrap">
            Inicio: {startDate}
          </p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-anthracite-900 overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-anthracite-400">
          <span>Semana 1</span>
          <span>Semana {CAPTACION_PLAN_TOTAL_WEEKS}</span>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Esta semana */}
        <section className="card-dark p-4 sm:p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-3 gap-2 min-w-0">
            <div className="flex items-center gap-2 text-fg min-w-0">
              <TrendingUp className="h-4 w-4 text-brand-500 shrink-0" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold truncate">Esta semana</h2>
            </div>
            <Link
              href="/captacion-90d/backlog"
              className="text-[11px] text-brand-400 hover:text-brand-500 inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              Backlog
              <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          </div>
          {weekTasks.length === 0 ? (
            <p className="text-xs text-anthracite-400">
              Sin tareas para la semana {currentWeek}.
            </p>
          ) : (
            <ul className="space-y-2">
              {weekTasks.slice(0, 8).map((t) => (
                <li
                  key={t.id}
                  className="card-dark-sub px-3 py-2 flex items-start gap-2 text-sm"
                >
                  <PriorityDot priority={t.priority} />
                  <div className="min-w-0 flex-1">
                    <p className="text-anthracite-100 leading-snug line-clamp-2 text-[13px] sm:text-sm">
                      {t.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-anthracite-400">
                      <span className="uppercase tracking-wider truncate max-w-[55%]">{t.bucket}</span>
                      <span aria-hidden="true">·</span>
                      <span>{t.status}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Próximas acciones partners */}
        <section className="card-dark p-4 sm:p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-3 gap-2 min-w-0">
            <div className="flex items-center gap-2 text-fg min-w-0">
              <Handshake className="h-4 w-4 text-brand-500 shrink-0" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold truncate">Acciones · partners</h2>
            </div>
            <Link
              href="/captacion-90d/partners-ibiza"
              className="text-[11px] text-brand-400 hover:text-brand-500 inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              Ibiza
              <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          </div>
          {nextActions.length === 0 ? (
            <p className="text-xs text-anthracite-400">Sin próximas acciones programadas.</p>
          ) : (
            <ul className="space-y-2">
              {nextActions.slice(0, 5).map((p) => (
                <li
                  key={p.id}
                  className="card-dark-sub px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-fg truncate">{p.full_name}</p>
                    <span className="text-[10px] text-brand-400 whitespace-nowrap">
                      {formatDateShort(p.next_action_date)}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-anthracite-200 line-clamp-2">
                    {p.next_action}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Eventos próximos */}
        <section className="card-dark p-4 sm:p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-3 gap-2 min-w-0">
            <div className="flex items-center gap-2 text-fg min-w-0">
              <CalendarDays className="h-4 w-4 text-brand-500 shrink-0" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold truncate">Eventos próximos</h2>
            </div>
            <Link
              href="/captacion-90d/eventos-trackear"
              className="text-[11px] text-brand-400 hover:text-brand-500 inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              Lista
              <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-anthracite-400">Sin eventos con fecha futura programada.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingEvents.map((e) => (
                <li key={e.id} className="card-dark-sub px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-fg truncate">{e.name}</p>
                    <Badge tone={trackingTone(e.tracking_status)} className="shrink-0">
                      {e.tracking_status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-anthracite-400">
                    {e.location ?? "Ubicación por confirmar"}
                    {e.date_start ? ` · ${formatDateShort(e.date_start)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Atajos */}
      <section className="card-dark p-5">
        <div className="flex items-center gap-2 mb-3">
          <ChartLine className="h-4 w-4 text-brand-500" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold text-fg">Atajos</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ShortcutLink href="/captacion-90d/backlog" label="Backlog kanban" />
          <ShortcutLink href="/captacion-90d/partners-ibiza" label="Partners · Ibiza" />
          <ShortcutLink href="/captacion-90d/eventos-trackear" label="Eventos a trackear" />
          <ShortcutLink href="/captacion-90d/manual-operativo" label="Manual operativo" />
        </div>
      </section>
    </div>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const color =
    priority === "P0"
      ? "bg-error"
      : priority === "P1"
        ? "bg-brand-500"
        : "bg-anthracite-400";
  return (
    <span className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full" aria-label={priority}>
      <span className={`block h-2 w-2 rounded-full ${color}`} />
    </span>
  );
}

function trackingTone(
  s: string,
): "brand" | "warning" | "success" | "info" | "neutral" {
  switch (s) {
    case "speak":
      return "brand";
    case "sponsor":
      return "warning";
    case "attend":
      return "success";
    case "monitor":
      return "info";
    default:
      return "neutral";
  }
}

function ShortcutLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="card-dark-sub px-4 py-3 text-sm text-anthracite-100 hover:text-brand-400 hover:bg-anthracite-800/80 transition-colors flex items-center justify-between"
    >
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 text-anthracite-400" strokeWidth={1.5} />
    </Link>
  );
}
