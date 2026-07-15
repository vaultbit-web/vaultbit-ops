import { TrendingDown } from "lucide-react";
import { type FunnelStep } from "~/lib/queries/analytics";
import { formatNumber, cn } from "~/lib/utils";

interface FunnelChartProps {
  steps: FunnelStep[];
  /** Etiquetas opcionales por step (índice). Si falta, se muestra "Paso N". */
  stepLabels?: string[];
}

const DEFAULT_STEP_LABELS = [
  "Entrada al diagnóstico",
  "Pregunta 1",
  "Pregunta 2",
  "Pregunta 3",
  "Pregunta 4",
  "Pregunta 5",
  "Resultado",
  "Formulario datos",
  "Lead creado",
  "Confirmación",
];

export function FunnelChart({ steps, stepLabels }: FunnelChartProps) {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-anthracite-400 py-8 text-center">
        Aún no hay sesiones del diagnóstico en este periodo.
      </p>
    );
  }
  const labels = stepLabels ?? DEFAULT_STEP_LABELS;

  return (
    <ul className="flex flex-col gap-2">
      {steps.map((s) => {
        const label = labels[s.step] ?? `Paso ${s.step}`;
        const dropPct = 100 - Math.round(s.pctOfPrev);
        const isFirst = s.step === 0;
        const showDrop = !isFirst && s.drop > 0;
        return (
          <li key={s.step} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 text-anthracite-100">
                <span className="font-mono text-[10px] text-anthracite-400 w-5 shrink-0">
                  {String(s.step).padStart(2, "0")}
                </span>
                <span className="truncate">{label}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                {showDrop ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-error">
                    <TrendingDown className="h-3 w-3" strokeWidth={2} />
                    {dropPct}%
                  </span>
                ) : null}
                <span className="font-mono text-[10px] text-anthracite-400 w-12 text-right">
                  {Math.round(s.pctOfTop)}%
                </span>
                <span className="font-semibold text-fg tabular-nums w-10 text-right">
                  {formatNumber(s.count)}
                </span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-anthracite-700/60 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isFirst ? "bg-brand-500" : "bg-brand-500/70",
                )}
                style={{ width: `${Math.max(2, s.pctOfTop)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
