import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, ExternalLink } from "lucide-react";
import { getEntityById } from "~/lib/queries/detail";
import { type InvestorInterest, INVESTOR_STATUS } from "~/lib/supabase/types";
import { PageHeader } from "~/components/page-header";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { DetailField } from "~/components/detail-field";
import { StatusSelect } from "~/components/status-select";
import { NotesAndTasksSection } from "~/components/notes-tasks-section";
import { CrmDocActions } from "~/components/crm-doc-actions";
import { CalLinkSection } from "~/components/cal-link-section";
import { statusToneClass } from "~/components/status-tones";
import { formatDateTime } from "~/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inv = await getEntityById<InvestorInterest>("investor", id);
  return { title: (inv?.name ?? inv?.email ?? "Inversor") + " · Inversores" };
}

export default async function InvestorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inv = await getEntityById<InvestorInterest>("investor", id);

  if (!inv) notFound();

  return (
    <>
      <Link
        href="/crm/inversores"
        className="inline-flex items-center gap-1.5 text-xs text-anthracite-400 hover:text-brand-400 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Volver al listado
      </Link>

      <PageHeader
        eyebrow="Inversor"
        title={inv.name ?? inv.email}
        description={`Interés registrado el ${formatDateTime(inv.created_at)}`}
        actions={
          <StatusSelect
            entityType="investor"
            entityId={inv.id}
            currentStatus={inv.status}
            statuses={INVESTOR_STATUS}
            toneClassName={statusToneClass(inv.status)}
          />
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información del inversor</CardTitle>
        </CardHeader>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <DetailField
            label="Email"
            value={
              <a
                href={`mailto:${inv.email}`}
                className="inline-flex items-center gap-1.5 text-anthracite-100 hover:text-brand-400"
              >
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                {inv.email}
              </a>
            }
          />
          <DetailField label="Nombre" value={inv.name} />
          <DetailField label="Organización" value={inv.organization} />
          <DetailField
            label="LinkedIn"
            value={
              inv.linkedin ? (
                <a
                  href={inv.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-anthracite-100 hover:text-brand-400"
                >
                  Ver perfil <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                </a>
              ) : null
            }
          />
          <DetailField
            label="Vehículo"
            value={inv.vehicle_type ? <Badge tone="info">{inv.vehicle_type}</Badge> : null}
          />
          <DetailField
            label="Ticket"
            value={inv.ticket_size ? <Badge tone="warning">{inv.ticket_size}</Badge> : null}
          />
          <DetailField label="Mensaje" value={inv.message} wide />
          <DetailField label="Notas (legacy)" value={inv.notes} wide />
          <DetailField label="UTM source" value={inv.utm_source} />
          <DetailField label="UTM campaign" value={inv.utm_campaign} />
          <DetailField label="Última actualización" value={formatDateTime(inv.updated_at)} />
        </dl>
      </Card>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <CrmDocActions entityType="investor" entityId={inv.id} />
        <CalLinkSection
          attendeeEmail={inv.email}
          attendeeName={inv.name}
          revalidatePath={`/crm/inversores/${inv.id}`}
        />
      </div>

      <NotesAndTasksSection entityType="investor" entityId={inv.id} />
    </>
  );
}
