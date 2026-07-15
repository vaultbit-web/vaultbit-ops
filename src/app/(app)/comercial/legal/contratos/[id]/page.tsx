import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { getContractById, getTemplateBySlug } from "~/lib/queries/commercial";
import { PageHeader } from "~/components/page-header";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { DetailField } from "~/components/detail-field";
import { ContractStatusActions } from "~/components/contract-status-actions";
import { EmailSendButton } from "~/components/email-send-button";
import { ClientEmailEditor } from "~/components/client-email-editor";
import { formatDateTime } from "~/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getContractById(id);
  return { title: c ? `${c.contract_number} · ${c.client_name}` : "Contrato" };
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await getContractById(id);
  if (!c) notFound();
  const tpl = await getTemplateBySlug(c.template_slug);

  return (
    <>
      <Link
        href="/comercial/legal/contratos"
        className="inline-flex items-center gap-1.5 text-xs text-anthracite-400 hover:text-brand-400 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Volver al histórico
      </Link>

      <PageHeader
        eyebrow={`Contrato · ${c.contract_number}`}
        title={c.client_name}
        description={`${tpl?.name ?? c.template_slug} · v${c.template_version} · creado el ${formatDateTime(c.created_at)}`}
        actions={<ContractStatusActions contractId={c.id} currentStatus={c.status} />}
      />

      <ClientEmailEditor channel="contract" id={c.id} currentEmail={c.client_email} />

      <div className="flex flex-wrap gap-3 mb-6">
        <EmailSendButton
          channel="contract"
          id={c.id}
          defaultTo={c.client_email}
          defaultSubject={`${tpl?.name ?? c.template_slug} · ${c.contract_number} · VaultBit`}
          defaultBody={`Hola ${c.client_name},\n\nTe adjunto el documento "${tpl?.name ?? c.template_slug}" (${c.contract_number}) para tu revisión.\n\nSi necesitas cualquier modificación o aclaración, respóndeme directamente.\n\nUn saludo,\nDaniel Brosed\nVaultBit Advisory · vaultbit.es`}
        />
        <a href={`/api/contracts/${c.id}/pdf`} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="md">
            <FileText className="h-4 w-4" strokeWidth={1.5} />
            Descargar PDF
          </Button>
        </a>
        {c.quote_id ? (
          <Link href={`/comercial/calculadora/${c.quote_id}`}>
            <Button variant="ghost" size="md">
              Ver presupuesto vinculado
            </Button>
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Datos del contrato</CardTitle>
          </CardHeader>
          <dl className="flex flex-col gap-3">
            <DetailField label="Cliente" value={c.client_name} />
            <DetailField label="NIF/CIF" value={c.client_nif} />
            <DetailField label="Email" value={c.client_email} />
            <DetailField
              label="Estado"
              value={<Badge tone="brand">{c.status}</Badge>}
            />
            <DetailField
              label="Enviado"
              value={c.sent_at ? formatDateTime(c.sent_at) : null}
            />
            <DetailField
              label="Firmado"
              value={c.signed_at ? formatDateTime(c.signed_at) : null}
            />
            <DetailField label="Última actualización" value={formatDateTime(c.updated_at)} />
          </dl>
        </Card>

        <Card className="lg:col-span-2 lg:max-h-[80vh] lg:overflow-y-auto">
          <CardHeader>
            <CardTitle>Contenido (rellenado)</CardTitle>
          </CardHeader>
          <article className="text-sm text-anthracite-100 whitespace-pre-wrap leading-relaxed">
            {c.body_md_filled}
          </article>
        </Card>
      </div>
    </>
  );
}
