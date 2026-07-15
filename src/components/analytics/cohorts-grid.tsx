import { type MonthlyCohort } from "~/lib/queries/analytics";
import { cn, formatNumber } from "~/lib/utils";

interface CohortsGridProps {
  cohorts: MonthlyCohort[];
}

const ARCH_TONE: Record<string, string> = {
  security: "bg-brand-500",
  fiscal: "bg-warning",
  inheritance: "bg-success",
  business: "bg-anthracite-200",
  sin_definir: "bg-anthracite-600",
};

export function CohortsGrid({ cohorts }: CohortsGridProps) {
  if (cohorts.every((c) => c.total === 0)) {
    return (
      <p className="text-sm text-anthracite-400 py-8 text-center">
        Aún no hay leads del diagnóstico en este periodo.
      </p>
    );
  }
  const max = cohorts.reduce((m, c) => Math.max(m, c.total), 0);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2">
      {cohorts.map((c) => {
        const heightPct = max > 0 ? Math.max(4, (c.total / max) * 100) : 0;
        return (
          <div
            key={c.month}
            className="card-dark-sub p-2.5 flex flex-col items-stretch gap-1.5 min-h-[110px] border border-anthracite-600/30"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-400 truncate">
              {c.monthLabel}
            </p>
            <div className="flex-1 flex items-end">
              {c.total === 0 ? (
                <span className="text-[10px] text-anthracite-500 mx-auto">—</span>
              ) : (
                <div
                  className="w-full rounded-[4px] flex flex-col-reverse overflow-hidden border border-anthracite-700"
                  style={{ height: `${heightPct}%` }}
                >
                  {c.byArchetype.map((row) => {
                    const segPct = c.total > 0 ? (row.count / c.total) * 100 : 0;
                    return (
                      <div
                        key={row.archetype}
                        className={cn("w-full", ARCH_TONE[row.archetype] ?? "bg-anthracite-600")}
                        style={{ height: `${segPct}%` }}
                        title={`${row.label}: ${row.count}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-base font-semibold text-fg tabular-nums">
              {formatNumber(c.total)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function CohortsLegend() {
  const items: { archetype: string; label: string }[] = [
    { archetype: "security", label: "Seguridad" },
    { archetype: "fiscal", label: "Fiscalidad" },
    { archetype: "inheritance", label: "Herencia" },
    { archetype: "business", label: "Web3 B2B" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 text-[10px] text-anthracite-300">
      {items.map((i) => (
        <span key={i.archetype} className="inline-flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-sm", ARCH_TONE[i.archetype])} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
