import { Radar } from "lucide-react";
import { LeadsTable } from "~/components/prospectos/leads-table";
import { getAuditLeads } from "~/lib/queries/prospectos";
import { isStale, leadScore, scoreLevel } from "~/lib/leads/types";

export const dynamic = "force-dynamic";

export default async function ProspectosPage() {
  const { leads, error } = await getAuditLeads();

  const vivos = leads.filter((l) => !isStale(l));
  const nuevos = vivos.filter((l) => l.status === "nuevo").length;
  const auditables = vivos.filter(
    (l) => scoreLevel(leadScore(l)) === "alto" && l.status !== "descartado",
  ).length;
  const listos = leads.filter((l) => l.status === "investigado").length;
  const enConversacion = leads.filter((l) =>
    ["contactado", "en_conversacion", "reunion"].includes(l.status),
  ).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-fg tracking-tight">
            Radar de <span className="font-bold">clientes</span>
          </h1>
          <p className="text-sm text-anthracite-200 mt-1">
            Apps recién lanzadas (sobre todo vibe-coded con IA) captadas por Client Scout dos veces
            al día, con un fingerprint pasivo de seguridad y ordenadas por auditabilidad. Enriquece y
            redacta el primer mensaje con <strong>/client-scout hoy</strong> en Claude Code.
          </p>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Nuevos sin investigar" value={nuevos} />
        <KpiCard label="Auditabilidad alta" value={auditables} highlight />
        <KpiCard label="Listos para enviar" value={listos} />
        <KpiCard label="En conversación" value={enConversacion} />
      </div>

      {error ? (
        <div className="rounded-(--radius-md) border border-error/30 bg-error/10 px-4 py-3 text-xs text-error">
          No se pudieron cargar los leads ahora mismo. Es un problema temporal de conexión con la
          base de datos, no que no haya leads. Recarga en un momento.
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-(--radius-md) border border-anthracite-600/30 bg-anthracite-900/60 px-4 py-3 text-xs text-anthracite-200">
          <Radar
            className="h-3.5 w-3.5 mt-0.5 shrink-0 text-brand-400"
            strokeWidth={1.8}
          />
          <p>
            El flujo: Client Scout trae y puntúa los lanzamientos, <strong>/client-scout</strong>{" "}
            investiga y deja el primer mensaje escrito, y tú aquí <strong>revisas y envías</strong> tú
            mismo (marca el estado según avance). Las señales del fingerprint son de uso interno para
            priorizar, nunca para soltárselas al fundador.
          </p>
        </div>
      )}

      <LeadsTable leads={leads} />
    </div>
  );
}

function KpiCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="card-dark px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.1em] text-anthracite-400 font-semibold">
        {label}
      </p>
      <p
        className={
          highlight
            ? "text-2xl font-bold text-brand-400 mt-1"
            : "text-2xl font-bold text-fg mt-1"
        }
      >
        {value}
      </p>
    </div>
  );
}
