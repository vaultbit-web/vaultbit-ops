import { type StatusBreakdownRow } from "~/lib/queries/analytics";
import { statusToneClass, STATUS_LABEL_OVERRIDES } from "~/components/status-tones";
import { formatNumber, cn } from "~/lib/utils";

interface StatusBarsProps {
  rows: StatusBreakdownRow[];
}

export function StatusBars({ rows }: StatusBarsProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-anthracite-400 py-8 text-center">
        Sin datos para mostrar.
      </p>
    );
  }
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-3">
      {/* Stacked single bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full border border-anthracite-700">
        {rows.map((r) => (
          <div
            key={r.status}
            className={cn(getBarColor(r.status), "h-full")}
            style={{ width: `${r.pct}%` }}
            title={`${r.status}: ${r.count}`}
            aria-label={`${r.status} ${r.pct.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <ul className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {rows.map((r) => (
          <li key={r.status} className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-medium border",
                statusToneClass(r.status),
              )}
            >
              {STATUS_LABEL_OVERRIDES[r.status] ?? r.status}
            </span>
            <span className="text-xs text-anthracite-200">
              <span className="font-semibold text-fg tabular-nums">
                {formatNumber(r.count)}
              </span>{" "}
              <span className="text-anthracite-400">· {r.pct.toFixed(0)}%</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-anthracite-400">
        Total: {formatNumber(total)} leads
      </p>
    </div>
  );
}

function getBarColor(status: string): string {
  switch (status) {
    case "nuevo":
      return "bg-brand-500";
    case "contactado":
      return "bg-anthracite-400";
    case "en_seguimiento":
      return "bg-warning";
    case "convertido":
      return "bg-success";
    case "descartado":
      return "bg-error";
    default:
      return "bg-anthracite-600";
  }
}
