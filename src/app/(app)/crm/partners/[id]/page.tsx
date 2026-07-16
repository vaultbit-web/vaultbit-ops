import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, ExternalLink } from "lucide-react";
import { getEntityById } from "~/lib/queries/detail";
import {
  type PartnerApplication,
  type PartnerType,
  PARTNER_STATUS,
  PARTNER_TYPE_LABELS,
} from "~/lib/supabase/types";
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
  const p = await getEntityById<PartnerApplication>("partner", id);
  return { title: (p?.name ?? "Partner") + " · Partners" };
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getEntityById<PartnerApplication>("partner", id);

  if (!p) notFound();

  const typeLabel = PARTNER_TYPE_LABELS[p.partner_type as PartnerType] ?? p.partner_type;

  return (
    <>
      <Link
        href="/crm/partners"
        className="inline-flex items-center gap-1.5 text-xs text-anthracite-400 hover:text-brand-400 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Volver a partners
      </Link>

      <PageHeader
        eyebrow={`Partner · ${typeLabel}`}
        title={p.name}
        description={`Aplicó el ${formatDateTime(p.created_at)}`}
        actions={
          <StatusSelect
            entityType="partner"
            entityId={p.id}
            currentStatus={p.status}
            statuses={PARTNER_STATUS}
            toneClassName={statusToneClass(p.status)}
          />
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información del partner</CardTitle>
        </CardHeader>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <DetailField
            label="Email"
            value={
              <a
                href={`mailto:${p.email}`}
                className="inline-flex items-center gap-1.5 text-anthracite-100 hover:text-brand-400"
              >
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                {p.email}
              </a>
            }
          />
          <DetailField label="Nombre" value={p.name} />
          <DetailField label="Organización" value={p.organization} />
          <DetailField label="Tipo" value={<Badge tone="success">{typeLabel}</Badge>} />
          <DetailField
            label="LinkedIn"
            value={
              p.linkedin ? (
                <a
                  href={p.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-anthracite-100 hover:text-brand-400"
                >
                  Ver perfil <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                </a>
              ) : null
            }
          />
          <DetailField label="Mensaje" value={p.message} wide />
          <DetailField label="UTM source" value={p.utm_source} />
          <DetailField label="UTM campaign" value={p.utm_campaign} />
          <DetailField label="Última actualización" value={formatDateTime(p.updated_at)} />
        </dl>
      </Card>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <CrmDocActions entityType="partner" entityId={p.id} />
        <CalLinkSection
          attendeeEmail={p.email}
          attendeeName={p.name}
          revalidatePath={`/crm/partners/${p.id}`}
        />
      </div>

      <NotesAndTasksSection entityType="partner" entityId={p.id} />
    </>
  );
}
