import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { listContracts } from "~/lib/queries/commercial";
import {
  type Contract,
  type ContractStatus,
} from "~/lib/supabase/types";
import { PageHeader } from "~/components/page-header";
import { CrmToolbar } from "~/components/crm-toolbar";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "~/components/ui/table";
import { Badge, type BadgeProps } from "~/components/ui/badge";
import { formatDateShort } from "~/lib/utils";

export const metadata = { title: "Histórico contratos" };
export const dynamic = "force-dynamic";

const STATUS_TONES: Record<ContractStatus, BadgeProps["tone"]> = {
  borrador: "neutral",
  enviado: "info",
  firmado: "success",
  cancelado: "error",
};

export default async function ContractsHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const result = await listContracts({
    q: params.q,
    page: params.page ? Number(params.page) : 1,
    status: params.status,
  });

  return (
    <>
      <Link
        href="/comercial/legal"
        className="inline-flex items-center gap-1.5 text-xs text-anthracite-400 hover:text-brand-400 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Volver a plantillas
      </Link>

      <PageHeader
        eyebrow="Comercial · Legal"
        title="Histórico de contratos"
        description="Todos los contratos generados a partir de plantillas. PDF disponible en cualquier momento."
      />

      <CrmToolbar
        basePath="/comercial/legal/contratos"
        q={params.q}
        page={result.page}
        pages={result.pages}
        total={result.total}
        searchPlaceholder="Buscar por cliente, número o email…"
      />

      <Table>
        <THead>
          <TR>
            <TH>Nº</TH>
            <TH>Cliente</TH>
            <TH className="hidden md:table-cell">Plantilla</TH>
            <TH>Estado</TH>
            <TH className="hidden sm:table-cell">Fecha</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {result.rows.length === 0 ? (
            <EmptyRow
              colSpan={6}
              message={params.q ? "Sin resultados." : "Aún no hay contratos generados."}
            />
          ) : (
            result.rows.map((c: Contract) => (
              <TR key={c.id}>
                <TD className="font-mono text-xs">
                  <Link
                    href={`/comercial/legal/contratos/${c.id}`}
                    className="text-fg hover:text-brand-400"
                  >
                    {c.contract_number}
                  </Link>
                </TD>
                <TD>
                  <Link
                    href={`/comercial/legal/contratos/${c.id}`}
                    className="font-medium text-fg hover:text-brand-400"
                  >
                    {c.client_name}
                  </Link>
                </TD>
                <TD className="hidden md:table-cell text-anthracite-200 text-xs font-mono">
                  {c.template_slug} · v{c.template_version}
                </TD>
                <TD>
                  <Badge tone={STATUS_TONES[c.status as ContractStatus] ?? "neutral"}>
                    {c.status}
                  </Badge>
                </TD>
                <TD className="hidden sm:table-cell text-anthracite-200">
                  {formatDateShort(c.created_at)}
                </TD>
                <TD>
                  <a
                    href={`/api/contracts/${c.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-anthracite-400 hover:text-brand-400"
                  >
                    <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                    PDF
                  </a>
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </>
  );
}
