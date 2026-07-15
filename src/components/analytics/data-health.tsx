import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { type FunnelDataHealth } from "~/lib/queries/analytics";
import { formatNumber, cn } from "~/lib/utils";

interface DataHealthProps {
  health: FunnelDataHealth;
}

interface HealthCheck {
  ok: boolean;
  severity: "ok" | "warn" | "error";
  label: string;
  value: string;
  detail?: string;
}

export function DataHealthCard({ health }: DataHealthProps) {
  const stuckRatio = health.sessionsStuckAtZeroPct;
  const checks: HealthCheck[] = [
    {
      label: "Sesiones que avanzan más allá del paso 0",
      ok: stuckRatio < 80,
      severity: stuckRatio >= 95 ? "error" : stuckRatio >= 80 ? "warn" : "ok",
      value:
        health.sessionsTotal > 0
          ? `${formatNumber(health.sessionsTotal - health.sessionsStuckAtZero)} / ${formatNumber(health.sessionsTotal)}`
          : "—",
      detail:
        stuckRatio >= 95
          ? `${stuckRatio.toFixed(0)}% se quedan en S0: probable bug de UPDATE en cliente — revisar funnel_sessions.step_reached en producción.`
          : stuckRatio >= 80
            ? `${stuckRatio.toFixed(0)}% se quedan en S0. Normal si hay mucho tráfico curioso; sospechoso si supera 90%.`
            : `${stuckRatio.toFixed(0)}% se quedan en S0 (esperado: <80% si el funnel engancha).`,
    },
    {
      label: "Sesiones completadas con lead vinculado",
      ok: health.sessionsCompletedNoLead === 0,
      severity: health.sessionsCompletedNoLead > 0 ? "error" : "ok",
      value: `${health.sessionsCompletedNoLead} huérfanas`,
      detail:
        health.sessionsCompletedNoLead > 0
          ? "Hay sesiones marcadas completed=true sin lead_id. El INSERT en funnel_leads falló o el UPDATE de lead_id se perdió."
          : "Todas las sesiones completed tienen lead_id.",
    },
    {
      label: "Leads creados con sesión vinculada",
      ok: health.leadsOrphan === 0,
      severity:
        health.leadsOrphan > 0 && health.leadsTotal > 0 ? "error" : health.leadsOrphan > 0 ? "warn" : "ok",
      value: `${health.leadsOrphan} de ${health.leadsTotal} sin sesión`,
      detail:
        health.leadsOrphan > 0
          ? "Hay leads en funnel_leads que no tienen sesión asociada. El UPDATE final de funnel_sessions (completed/lead_id) no se ejecutó."
          : "Todos los leads tienen su sesión vinculada.",
    },
    {
      label: "Sesiones en paso 9 marcadas como completed",
      ok: health.sessionsStep9NotCompleted === 0,
      severity: health.sessionsStep9NotCompleted > 0 ? "warn" : "ok",
      value: `${health.sessionsStep9NotCompleted} sin marcar`,
      detail:
        health.sessionsStep9NotCompleted > 0
          ? "Sesiones que llegaron a paso 9 sin completed=true. El segundo UPDATE de submitCapture falló."
          : "Todos los step 9 quedaron marcados.",
    },
  ];

  const errors = checks.filter((c) => c.severity === "error").length;
  const warns = checks.filter((c) => c.severity === "warn").length;
  const okBadge =
    errors > 0 ? "error" : warns > 0 ? "warn" : "ok";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
            okBadge === "ok" && "border-success/40 text-success bg-success/10",
            okBadge === "warn" && "border-warning/40 text-warning bg-warning/10",
            okBadge === "error" && "border-error/40 text-error bg-error/10",
          )}
        >
          {okBadge === "ok" ? (
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
          ) : okBadge === "warn" ? (
            <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          {okBadge === "ok"
            ? "Sin incidencias detectadas"
            : okBadge === "warn"
              ? `${warns} aviso${warns === 1 ? "" : "s"}`
              : `${errors} incidencia${errors === 1 ? "" : "s"} crítica${errors === 1 ? "" : "s"}`}
        </span>
      </div>

      <ul className="space-y-2">
        {checks.map((c, i) => (
          <li
            key={i}
            className={cn(
              "rounded-(--radius-md) border px-3 py-2 text-xs",
              c.severity === "ok" && "border-anthracite-600/40 bg-anthracite-900/40",
              c.severity === "warn" && "border-warning/30 bg-warning/5",
              c.severity === "error" && "border-error/40 bg-error/5",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-anthracite-100">{c.label}</span>
              <span
                className={cn(
                  "font-mono tabular-nums",
                  c.severity === "ok" && "text-anthracite-200",
                  c.severity === "warn" && "text-warning",
                  c.severity === "error" && "text-error font-semibold",
                )}
              >
                {c.value}
              </span>
            </div>
            {c.detail ? (
              <p className="mt-1 text-[11px] leading-relaxed text-anthracite-300">
                {c.detail}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="border-t border-anthracite-600/30 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-300 mb-2">
          Entradas últimas 24 h
        </p>
        <ul className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
          <InboundPill label="Sesiones" value={health.recentInbound.funnel_sessions_24h} />
          <InboundPill label="Leads" value={health.recentInbound.funnel_leads_24h} />
          <InboundPill label="Lead magnet" value={health.recentInbound.lead_magnet_24h} />
          <InboundPill label="Inversores" value={health.recentInbound.investor_24h} />
          <InboundPill label="Partners" value={health.recentInbound.partner_24h} />
        </ul>
      </div>
    </div>
  );
}

function InboundPill({ label, value }: { label: string; value: number }) {
  return (
    <li className="rounded-(--radius-md) bg-anthracite-900/60 px-2 py-1.5 border border-anthracite-700/40">
      <p className="text-[10px] uppercase tracking-wider text-anthracite-400">{label}</p>
      <p className="text-sm font-semibold text-fg tabular-nums">{formatNumber(value)}</p>
    </li>
  );
}
