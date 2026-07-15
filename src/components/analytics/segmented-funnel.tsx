import { TrendingDown } from "lucide-react";
import { type SegmentedFunnelRow } from "~/lib/queries/analytics";
import { formatNumber, cn } from "~/lib/utils";

interface SegmentedFunnelProps {
  rows: SegmentedFunnelRow[];
  /** Etiqueta de la columna izquierda (ej. "Fuente UTM", "Arquetipo"). */
  segmentLabel: string;
  /** Etiqueta opcional para cada step (índice). */
  stepLabels?: string[];
  /** Si true, oculta segmentos con 0 sesiones. */
  hideEmpty?: boolean;
  /** Mensaje cuando no hay datos. */
  emptyMessage?: string;
}

const DEFAULT_STEP_SHORT = ["S0", "Q1", "Q2", "Q3", "Q4", "Q5", "Res", "Form", "Lead", "OK"];

export function SegmentedFunnel({
  rows,
  segmentLabel,
  stepLabels,
  hideEmpty = true,
  emptyMessage = "Sin sesiones para segmentar en este periodo.",
}: SegmentedFunnelProps) {
  const filtered = hideEmpty ? rows.filter((r) => r.total > 0) : rows;
  if (filtered.length === 0) {
    return (
      <p className="text-sm text-anthracite-400 py-8 text-center">{emptyMessage}</p>
    );
  }
  const labels = stepLabels ?? DEFAULT_STEP_SHORT;

  return (
    <div className="w-full overflow-x-auto rounded-[16px] border border-anthracite-600/40">
      <table className="w-full text-left text-xs">
        <thead className="bg-anthracite-900 text-[10px] font-semibold uppercase tracking-wider text-anthracite-200">
          <tr>
            <th className="px-3 py-2 sticky left-0 bg-anthracite-900">{segmentLabel}</th>
            <th className="px-2 py-2 text-right">Total</th>
            {labels.map((lab, i) => (
              <th key={i} className="px-2 py-2 text-right">
                {lab}
              </th>
            ))}
            <th className="px-3 py-2 text-right">Conv.</th>
            <th className="px-3 py-2 text-right">Cae en</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-anthracite-600/30">
          {filtered.map((r) => {
            const dropStep = r.lastStepBeforeDrop + 1; // siguiente paso = donde cae
            return (
              <tr key={r.segment} className="bg-anthracite-800">
                <td className="px-3 py-2 align-middle font-medium text-fg sticky left-0 bg-anthracite-800 truncate max-w-[180px]">
                  {r.segment}
                </td>
                <td className="px-2 py-2 align-middle text-right tabular-nums text-anthracite-100 font-semibold">
                  {formatNumber(r.total)}
                </td>
                {r.steps.map((count, i) => {
                  const pct = r.total > 0 ? (count / r.total) * 100 : 0;
                  const intensity = Math.min(100, Math.round(pct));
                  // Resaltar el último paso con count > 0 (donde se quedan)
                  const isLast = i > 0 && count > 0 && r.steps[i + 1] === 0;
                  return (
                    <td
                      key={i}
                      className={cn(
                        "px-2 py-2 align-middle text-right tabular-nums relative",
                        isLast && "outline outline-1 outline-error/40",
                      )}
                      title={`Paso ${i}: ${count} sesiones (${pct.toFixed(0)}%)`}
                    >
                      <div
                        className="absolute inset-0 bg-brand-500/15"
                        style={{ opacity: intensity / 100 }}
                        aria-hidden="true"
                      />
                      <span className={cn("relative", count === 0 && "text-anthracite-500")}>
                        {count}
                      </span>
                    </td>
                  );
                })}
                <td
                  className={cn(
                    "px-3 py-2 align-middle text-right tabular-nums font-semibold",
                    r.conversionPct >= 10
                      ? "text-success"
                      : r.conversionPct >= 3
                        ? "text-warning"
                        : "text-anthracite-200",
                  )}
                >
                  {r.conversionPct.toFixed(1)}%
                </td>
                <td className="px-3 py-2 align-middle text-right text-anthracite-200">
                  {r.completed === r.total ? (
                    <span className="text-success">—</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-error">
                      <TrendingDown className="h-3 w-3" strokeWidth={2} />
                      {labels[dropStep] ?? `S${dropStep}`}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
