import { Radar } from "lucide-react";
import { JobOffersTable } from "~/components/empleo/job-offers-table";
import { getJobOffers } from "~/lib/queries/empleo";
import { isStale, matchLevel } from "~/lib/empleo/types";

export const dynamic = "force-dynamic";

export default async function EmpleoPage() {
  const { offers, error } = await getJobOffers();

  const vivas = offers.filter((o) => !isStale(o));
  const nuevas = vivas.filter((o) => o.status === "nueva").length;
  const matchAlto = vivas.filter(
    (o) => matchLevel(o.score_match) === "alto" && o.status !== "descartada",
  ).length;
  const interesan = offers.filter((o) => o.status === "interesa").length;
  const enProceso = offers.filter((o) =>
    ["aplicada", "entrevista"].includes(o.status),
  ).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-fg tracking-tight">
            Radar de <span className="font-bold">empleo</span>
          </h1>
          <p className="text-sm text-anthracite-200 mt-1">
            Ofertas Web3, IA y seguridad (remoto o Barcelona) captadas por el
            vigilante n8n dos veces al día y puntuadas contra tu perfil. Click
            en una fila para ver el detalle y los requisitos.
          </p>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Nuevas activas" value={nuevas} />
        <KpiCard label="Match alto" value={matchAlto} highlight />
        <KpiCard label="Interesan" value={interesan} />
        <KpiCard label="Aplicada / entrevista" value={enProceso} />
      </div>

      {error ? (
        <div className="rounded-(--radius-md) border border-error/30 bg-error/10 px-4 py-3 text-xs text-error">
          No se pudieron cargar las ofertas ahora mismo. Es un problema temporal
          de conexión con la base de datos, no que no haya ofertas. Recarga en
          un momento.
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-(--radius-md) border border-anthracite-600/30 bg-anthracite-900/60 px-4 py-3 text-xs text-anthracite-200">
          <Radar
            className="h-3.5 w-3.5 mt-0.5 shrink-0 text-brand-400"
            strokeWidth={1.8}
          />
          <p>
            El objetivo es el <strong>triaje rápido</strong>: revisa las de
            match alto, marca <strong>Interesa</strong> o{" "}
            <strong>Descartada</strong> y lleva aquí el estado de cada
            candidatura. Las ofertas que las fuentes dejan de publicar se marcan
            como caducadas solas.
          </p>
        </div>
      )}

      <JobOffersTable offers={offers} />
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
