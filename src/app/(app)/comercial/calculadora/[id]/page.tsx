import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, ScrollText } from "lucide-react";
import { getQuoteById } from "~/lib/queries/commercial";
import {
  type ServiceSlug,
  SERVICE_LABELS,
  type Tier,
  TIER_LABELS,
  type Modality,
  MODALITY_LABELS,
} from "~/lib/supabase/types";
import { PageHeader } from "~/components/page-header";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { DetailField } from "~/components/detail-field";
import { QuoteStatusActions } from "~/components/quote-status-actions";
import { EmailSendButton } from "~/components/email-send-button";
import { ClientEmailEditor } from "~/components/client-email-editor";
import { formatDateTime, formatEuro } from "~/lib/utils";
import { parseBreakdown, parseQuoteItems } from "~/lib/quotes/pricing-engine";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await getQuoteById(id);
  return { title: q ? `${q.quote_number} · ${q.client_name}` : "Presupuesto" };
}

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const q = await getQuoteById(id);
  if (!q) notFound();

  const items = parseQuoteItems(q.quote_items);
  const isMulti = items.length > 1;
  const breakdown = parseBreakdown(q.price_breakdown);
  const serviceLabel = SERVICE_LABELS[q.service_slug as ServiceSlug] ?? q.service_slug;
  // Etiqueta bonita del tier: la 1ª línea del desglose granular es el tier_label.
  const tierLabel =
    items[0]?.breakdown[0]?.label ?? breakdown[0]?.label ?? TIER_LABELS[q.tier as Tier] ?? q.tier;
  const modalityLabel = MODALITY_LABELS[q.modality as Modality] ?? q.modality;
  const servicesSummary = items.length
    ? items.map((it) => it.label).join(", ")
    : `${serviceLabel} · ${tierLabel}`;

  const expirationDate = new Date(
    new Date(q.created_at).getTime() + q.validity_days * 24 * 60 * 60 * 1000,
  );

  return (
    <>
      <Link
        href="/comercial/calculadora"
        className="inline-flex items-center gap-1.5 text-xs text-anthracite-400 hover:text-brand-400 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Volver a presupuestos
      </Link>

      <PageHeader
        eyebrow={`Presupuesto · ${q.quote_number}`}
        title={q.client_name}
        description={`Creado el ${formatDateTime(q.created_at)} · Válido hasta el ${formatDateTime(expirationDate.toISOString())}`}
        actions={<QuoteStatusActions quoteId={q.id} currentStatus={q.status} />}
      />

      <ClientEmailEditor channel="quote" id={q.id} currentEmail={q.client_email} />

      <div className="flex flex-wrap gap-3 mb-6">
        <EmailSendButton
          channel="quote"
          id={q.id}
          defaultTo={q.client_email}
          defaultSubject={`Tu presupuesto · ${q.quote_number} · VaultBit Advisory`}
          defaultBody={`Hola ${q.client_name},\n\nAdjunto tu presupuesto ${q.quote_number} para los servicios de VaultBit Advisory.\n\nSi tienes cualquier duda, respóndeme directamente a este correo o agendamos una llamada.\n\nUn saludo,\nDaniel Brosed\nVaultBit Advisory · vaultbit.es`}
        />
        <a href={`/api/quotes/${q.id}/pdf`} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="md">
            <FileText className="h-4 w-4" strokeWidth={1.5} />
            Descargar PDF
          </Button>
        </a>
        <Link
          href={{
            pathname: "/comercial/legal/aceptacion-presupuesto",
            query: {
              quote_id: q.id,
              cliente_nombre: q.client_name,
              cliente_nif: q.client_nif ?? "",
              cliente_email: q.client_email ?? "",
              numero_presupuesto: q.quote_number,
              servicio_nombre: servicesSummary,
              importe_total: formatEuro(q.total_eur),
              ...(q.crm_entity_type && q.crm_entity_id
                ? { entity_type: q.crm_entity_type, entity_id: q.crm_entity_id }
                : {}),
            },
          }}
        >
          <Button variant="ghost" size="md">
            <ScrollText className="h-4 w-4" strokeWidth={1.5} />
            Generar aceptación
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalle</CardTitle>
          </CardHeader>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <DetailField label="Cliente" value={q.client_name} />
            <DetailField label="NIF / CIF" value={q.client_nif} />
            <DetailField label="Email" value={q.client_email} />
            <DetailField label="Empresa" value={q.client_company} />
            <DetailField label="Sector" value={q.client_sector} />
            <DetailField label="Domicilio" value={q.client_address} wide />
            {isMulti ? (
              <DetailField
                label="Servicios"
                wide
                value={
                  <div className="flex flex-col gap-1">
                    {items.map((it, i) => (
                      <span key={i}>
                        {it.label} · {MODALITY_LABELS[it.modality as Modality] ?? it.modality}
                      </span>
                    ))}
                  </div>
                }
              />
            ) : (
              <>
                <DetailField label="Servicio" value={serviceLabel} />
                <DetailField label="Tier" value={<Badge tone="brand">{tierLabel}</Badge>} />
                <DetailField label="Modalidad" value={modalityLabel} />
              </>
            )}
            <DetailField label="Validez" value={`${q.validity_days} días`} />
            <DetailField label="Notas (PDF)" value={q.notes} wide />
            <DetailField label="Notas internas" value={q.internal_notes} wide />
          </dl>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Importes</CardTitle>
          </CardHeader>
          <dl className="flex flex-col gap-3 text-sm">
            {items.length ? (
              <div className="flex flex-col gap-2.5 pb-2 mb-1 border-b border-anthracite-600/20">
                {items.map((it, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between text-anthracite-100">
                      <dt className="truncate pr-2 font-medium">{it.label}</dt>
                      <dd className="shrink-0 tabular-nums text-fg">{formatEuro(it.base_price_eur)}</dd>
                    </div>
                    {it.breakdown.length > 1
                      ? it.breakdown.map((l, j) => (
                          <div key={j} className="flex justify-between text-xs text-anthracite-400 pl-2">
                            <dt className="truncate pr-2">{l.label}</dt>
                            <dd className="shrink-0 tabular-nums">{formatEuro(l.amount)}</dd>
                          </div>
                        ))
                      : null}
                  </div>
                ))}
                {isMulti ? (
                  <div className="flex justify-between text-anthracite-100 pt-2 border-t border-anthracite-600/20">
                    <dt className="font-medium">Base combinada</dt>
                    <dd className="font-medium tabular-nums">{formatEuro(q.base_price_eur)}</dd>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex justify-between text-anthracite-200">
                <dt>Precio base</dt>
                <dd className="text-fg">{formatEuro(q.base_price_eur)}</dd>
              </div>
            )}
            {q.discount_percent > 0 ? (
              <div className="flex justify-between text-anthracite-200">
                <dt>Descuento ({q.discount_percent}%)</dt>
                <dd className="text-fg">
                  − {formatEuro(q.base_price_eur - q.subtotal_eur)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between text-anthracite-200">
              <dt>Subtotal</dt>
              <dd className="text-fg">{formatEuro(q.subtotal_eur)}</dd>
            </div>
            <div className="flex justify-between text-anthracite-200">
              <dt>IVA ({q.vat_percent}%)</dt>
              <dd className="text-fg">{formatEuro(q.vat_amount_eur)}</dd>
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-anthracite-600/30 mt-2">
              <dt className="text-anthracite-100 font-medium">Total</dt>
              <dd className="text-2xl font-semibold text-brand-400 tracking-tight">
                {formatEuro(q.total_eur)}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}
