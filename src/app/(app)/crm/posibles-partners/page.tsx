import { Coffee } from "lucide-react";
import { PosiblesPartnersTable } from "~/components/captacion-90d/posibles-partners-table";
import { PosiblePartnerForm } from "~/components/captacion-90d/posible-partner-form";
import {
  getPartners,
  getPartnerSourcesByPartnerIds,
} from "~/lib/queries/captacion";

export const dynamic = "force-dynamic";

export default async function PosiblesPartnersPage() {
  const partners = await getPartners();
  const sourcesByPartnerId = await getPartnerSourcesByPartnerIds(
    partners.map((p) => p.id),
  );

  const porContactar = partners.filter((p) =>
    ["identificado", "investigado", "por_contactar"].includes(p.pipeline_stage),
  ).length;
  const enConversacion = partners.filter((p) =>
    ["primer_contacto", "reunion", "propuesta"].includes(p.pipeline_stage),
  ).length;
  const activos = partners.filter(
    (p) => p.pipeline_stage === "partner_activo",
  ).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-fg tracking-tight">
            Posibles <span className="font-bold">partners</span>
          </h1>
          <p className="text-sm text-anthracite-200 mt-1">
            Notarías, despachos, fiscalistas y gestores de patrimonio para ir a
            conocer en persona. Click en una fila para abrir la ficha.
          </p>
        </div>
        <PosiblePartnerForm />
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total" value={partners.length} />
        <KpiCard label="Por contactar" value={porContactar} />
        <KpiCard label="En conversación" value={enConversacion} />
        <KpiCard label="Partners activos" value={activos} highlight />
      </div>

      <div className="flex items-start gap-3 rounded-(--radius-md) border border-anthracite-600/30 bg-anthracite-900/60 px-4 py-3 text-xs text-anthracite-200">
        <Coffee
          className="h-3.5 w-3.5 mt-0.5 shrink-0 text-brand-400"
          strokeWidth={1.8}
        />
        <p>
          El objetivo de esta base de datos es el <strong>café presencial</strong>:
          elegir a quién visitar, preparar la conversación y registrar cada paso
          en el pipeline. Filtra por ciudad para planificar rutas de visitas.
        </p>
      </div>

      <PosiblesPartnersTable
        partners={partners}
        sourcesByPartnerId={sourcesByPartnerId}
      />
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
