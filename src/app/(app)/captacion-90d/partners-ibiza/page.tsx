import { AlertTriangle } from "lucide-react";
import { PartnersIbizaTable } from "~/components/captacion-90d/partners-ibiza-table";
import {
  getPartnersByOrigin,
  getPartnerSourcesByPartnerIds,
} from "~/lib/queries/captacion";

export const dynamic = "force-dynamic";

export default async function PartnersIbizaPage() {
  const partners = await getPartnersByOrigin("Ibiza Tech Forum 2026");
  const sourcesByPartnerId = await getPartnerSourcesByPartnerIds(
    partners.map((p) => p.id),
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-light text-fg tracking-tight">
          Partners · <span className="font-bold">Ibiza Tech Forum 2026</span>
        </h1>
        <p className="text-sm text-anthracite-200 mt-1">
          {partners.length} contactos verificados. Click en una fila para abrir la ficha completa con borrador LinkedIn.
        </p>
      </header>

      <div className="flex items-start gap-3 rounded-(--radius-md) border border-anthracite-600/30 bg-anthracite-900/60 px-4 py-3 text-xs text-anthracite-200">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-warning" strokeWidth={1.8} />
        <p>
          Regla de promoción: para subir un partner de <strong>identificado</strong> a <strong>investigado</strong> se requiere <code className="text-brand-400">verification_level = high</code> y un mínimo de <strong>2 fuentes públicas independientes</strong>. Las filas con triángulo amarillo no cumplen.
        </p>
      </div>

      <PartnersIbizaTable
        partners={partners}
        sourcesByPartnerId={sourcesByPartnerId}
      />
    </div>
  );
}
