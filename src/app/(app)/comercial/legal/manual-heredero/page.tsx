import Link from "next/link";
import { ExternalLink, FileText, ShieldCheck, Users, Printer } from "lucide-react";
import { PageHeader } from "~/components/page-header";

export const metadata = { title: "Manual del Heredero" };

const DOC_URL = "/manual/manual-del-heredero-ejemplo.html";

export default function ManualHerederoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Comercial · Documento de ejemplo"
        title="Manual del Heredero"
        description="El entregable estrella del Protocolo de Herencia Digital, en versión de muestra. Documento oficial de Vaultbit, en tema claro, listo para enseñar a un partner (notaría, abogado de sucesiones o fiscalista)."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Tarjeta principal: abrir el documento */}
        <div className="card-dark p-6 lg:col-span-2 flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <div className="rounded-[10px] bg-brand-500/10 p-2.5 text-brand-400 shrink-0">
              <FileText className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-fg">Manual del Heredero · ejemplo</h2>
              <p className="text-sm text-anthracite-200 mt-1">
                Versión de muestra con titular y datos ficticios. No contiene ningún secreto real
                (claves, semillas ni fragmentos). Shamir Secret Sharing 2 de 3, Conocimiento Cero y
                coordinación con notario y fiscalista colegiados.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={DOC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[10px] bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_15px_-3px_rgba(242,118,26,0.2)] hover:bg-brand-400 transition-colors"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
              Abrir el documento
            </a>
            <span className="text-xs text-anthracite-400">
              Se abre en una pestaña nueva. Para PDF: imprimir (Ctrl/Cmd+P) en A4 con gráficos de fondo.
            </span>
          </div>
        </div>

        {/* Tarjeta: cómo enseñarlo */}
        <div className="card-dark p-6 flex flex-col gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-400">
            Cómo enseñarlo a un partner
          </h3>
          <ul className="flex flex-col gap-3 text-sm text-anthracite-100">
            <li className="flex gap-2.5">
              <Users className="h-4 w-4 text-anthracite-400 shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>Ábrelo en pantalla durante el café y recórrelo por el índice.</span>
            </li>
            <li className="flex gap-2.5">
              <ShieldCheck className="h-4 w-4 text-anthracite-400 shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>Apóyate en la sección 05 (Shamir 2 de 3) y en el Conocimiento Cero: ahí está el encaje con su práctica.</span>
            </li>
            <li className="flex gap-2.5">
              <Printer className="h-4 w-4 text-anthracite-400 shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>Si lo prefieren en papel, imprímelo a PDF A4 y envíalo tras la reunión.</span>
            </li>
          </ul>
          <Link
            href="/comercial/legal"
            className="text-xs text-anthracite-400 hover:text-brand-400 transition-colors mt-1"
          >
            ← Volver a Legal
          </Link>
        </div>
      </div>
    </>
  );
}
