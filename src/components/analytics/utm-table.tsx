import { type UtmAttributionRow } from "~/lib/queries/analytics";
import { formatNumber, cn } from "~/lib/utils";

interface UtmTableProps {
  rows: UtmAttributionRow[];
}

export function UtmTable({ rows }: UtmTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-anthracite-400 py-8 text-center">
        Sin tráfico atribuido en este periodo.
      </p>
    );
  }
  const maxLeads = rows.reduce((m, r) => Math.max(m, r.leads), 0);

  return (
    <div className="w-full overflow-x-auto rounded-[16px] border border-anthracite-600/40">
      <table className="w-full text-left text-sm">
        <thead className="bg-anthracite-900 text-[11px] font-semibold uppercase tracking-wider text-anthracite-200">
          <tr>
            <th className="px-4 py-3">Fuente</th>
            <th className="px-4 py-3 text-right">Sesiones</th>
            <th className="px-4 py-3 text-right">Leads</th>
            <th className="px-4 py-3 text-right">Conversión</th>
            <th className="hidden sm:table-cell px-4 py-3 w-[30%]">Volumen leads</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-anthracite-600/30 [&>tr]:bg-anthracite-800">
          {rows.map((r) => {
            const widthPct = maxLeads > 0 ? Math.max(2, (r.leads / maxLeads) * 100) : 0;
            const convTone =
              r.conversionPct >= 10
                ? "text-success"
                : r.conversionPct >= 3
                  ? "text-warning"
                  : "text-anthracite-200";
            return (
              <tr key={r.source}>
                <td className="px-4 py-3 align-middle font-medium text-fg truncate max-w-[200px]">
                  {r.source}
                </td>
                <td className="px-4 py-3 align-middle text-right tabular-nums text-anthracite-100">
                  {formatNumber(r.sessions)}
                </td>
                <td className="px-4 py-3 align-middle text-right tabular-nums font-semibold text-fg">
                  {formatNumber(r.leads)}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 align-middle text-right tabular-nums",
                    convTone,
                  )}
                >
                  {r.conversionPct.toFixed(1)}%
                </td>
                <td className="hidden sm:table-cell px-4 py-3 align-middle">
                  <div className="h-2 rounded-full bg-anthracite-700/60 overflow-hidden">
                    <div
                      className="h-full bg-brand-500/80 rounded-full"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
