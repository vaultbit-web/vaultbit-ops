import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { listQuotes } from "~/lib/queries/commercial";
import {
  type Quote,
  type ServiceSlug,
  SERVICE_LABELS,
  type Tier,
  TIER_LABELS,
  type QuoteStatus,
} from "~/lib/supabase/types";
import { parseQuoteItems } from "~/lib/quotes/pricing-engine";
import { PageHeader } from "~/components/page-header";
import { CrmToolbar } from "~/components/crm-toolbar";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "~/components/ui/table";
import { Badge, type BadgeProps } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { formatDateShort, formatEuro } from "~/lib/utils";

export const metadata = { title: "Calculadora de precios" };
export const dynamic = "force-dynamic";

const STATUS_TONES: Record<QuoteStatus, BadgeProps["tone"]> = {
  borrador: "neutral",
  enviado: "info",
  aceptado: "success",
  rechazado: "error",
  expirado: "warning",
};

export default async function CalculadoraListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const result = await listQuotes({
    q: params.q,
    page: params.page ? Number(params.page) : 1,
    status: params.status,
  });

  return (
    <>
      <PageHeader
        eyebrow="Comercial"
        title="Presupuestos"
        description="Calcula, guarda y descarga presupuestos en PDF con branding VaultBit."
        actions={
          <Link href="/comercial/calculadora/nueva">
            <Button size="md">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Nuevo presupuesto
            </Button>
          </Link>
        }
      />

      <CrmToolbar
        basePath="/comercial/calculadora"
        q={params.q}
        page={result.page}
        pages={result.pages}
        total={result.total}
        searchPlaceholder="Buscar por cliente, email o número…"
      />

      <Table>
        <THead>
          <TR>
            <TH>Nº</TH>
            <TH>Cliente</TH>
            <TH className="hidden md:table-cell">Servicio · Tier</TH>
            <TH>Total</TH>
            <TH>Estado</TH>
            <TH className="hidden sm:table-cell">Fecha</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {result.rows.length === 0 ? (
            <EmptyRow
              colSpan={7}
              message={
                params.q
                  ? "Sin resultados."
                  : "Aún no hay presupuestos. Crea el primero arriba."
              }
            />
          ) : (
            result.rows.map((q: Quote) => {
              const items = parseQuoteItems(q.quote_items);
              const isMulti = items.length > 1;
              const serviceText = isMulti
                ? "Varios servicios"
                : SERVICE_LABELS[q.service_slug as ServiceSlug] ?? q.service_slug;
              const tierText = isMulti
                ? `${items.length} servicios`
                : items[0]?.breakdown[0]?.label ?? TIER_LABELS[q.tier as Tier] ?? q.tier;
              return (
              <TR key={q.id}>
                <TD className="font-mono text-xs">
                  <Link
                    href={`/comercial/calculadora/${q.id}`}
                    className="text-fg hover:text-brand-400"
                  >
                    {q.quote_number}
                  </Link>
                </TD>
                <TD>
                  <div className="flex flex-col">
                    <Link
                      href={`/comercial/calculadora/${q.id}`}
                      className="font-medium text-fg hover:text-brand-400"
                    >
                      {q.client_name}
                    </Link>
                    {q.client_email ? (
                      <span className="text-[11px] text-anthracite-400">{q.client_email}</span>
                    ) : null}
                  </div>
                </TD>
                <TD className="hidden md:table-cell text-anthracite-100">
                  <div className="flex flex-col">
                    <span>{serviceText}</span>
                    <span className="text-[11px] text-anthracite-400">{tierText}</span>
                  </div>
                </TD>
                <TD className="font-medium text-fg">{formatEuro(q.total_eur)}</TD>
                <TD>
                  <Badge tone={STATUS_TONES[q.status as QuoteStatus] ?? "neutral"}>
                    {q.status}
                  </Badge>
                </TD>
                <TD className="hidden sm:table-cell text-anthracite-200">
                  {formatDateShort(q.created_at)}
                </TD>
                <TD>
                  <a
                    href={`/api/quotes/${q.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-anthracite-400 hover:text-brand-400"
                  >
                    <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                    PDF
                  </a>
                </TD>
              </TR>
              );
            })
          )}
        </TBody>
      </Table>
    </>
  );
}
