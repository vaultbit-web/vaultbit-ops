import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { getEntityById } from "~/lib/queries/detail";
import { type LeadMagnetSubscriber, LEAD_MAGNET_STATUS } from "~/lib/supabase/types";
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
  const sub = await getEntityById<LeadMagnetSubscriber>("lead_magnet", id);
  return { title: (sub?.name ?? sub?.email ?? "Suscriptor") + " · Lead magnet" };
}

export default async function LeadMagnetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sub = await getEntityById<LeadMagnetSubscriber>("lead_magnet", id);

  if (!sub) notFound();

  return (
    <>
      <Link
        href="/crm/lead-magnet"
        className="inline-flex items-center gap-1.5 text-xs text-anthracite-400 hover:text-brand-400 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Volver al listado
      </Link>

      <PageHeader
        eyebrow="Lead magnet · Guía 7 errores"
        title={sub.name ?? sub.email}
        description={`Suscrito el ${formatDateTime(sub.created_at)}`}
        actions={
          <StatusSelect
            entityType="lead_magnet"
            entityId={sub.id}
            currentStatus={sub.status}
            statuses={LEAD_MAGNET_STATUS}
            toneClassName={statusToneClass(sub.status)}
          />
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información del suscriptor</CardTitle>
        </CardHeader>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <DetailField
            label="Email"
            value={
              <a
                href={`mailto:${sub.email}`}
                className="inline-flex items-center gap-1.5 text-anthracite-100 hover:text-brand-400"
              >
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                {sub.email}
              </a>
            }
          />
          <DetailField label="Nombre" value={sub.name} />
          <DetailField label="Fuente" value={sub.source} />
          <DetailField
            label="PDF entregado"
            value={
              <Badge tone={sub.delivered ? "success" : "neutral"}>
                {sub.delivered
                  ? `Sí · ${sub.delivered_at ? formatDateTime(sub.delivered_at) : "—"}`
                  : "Pendiente"}
              </Badge>
            }
          />
          <DetailField
            label="Follow-up enviado"
            value={
              <Badge tone={sub.follow_up_sent ? "info" : "neutral"}>
                {sub.follow_up_sent ? "Sí" : "No"}
              </Badge>
            }
          />
          <DetailField label="UTM source" value={sub.utm_source} />
          <DetailField label="UTM campaign" value={sub.utm_campaign} />
          <DetailField label="UTM medium" value={sub.utm_medium} />
          <DetailField label="Referrer" value={sub.referrer} mono />
          <DetailField label="Última actualización" value={formatDateTime(sub.updated_at)} />
        </dl>
      </Card>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <CrmDocActions entityType="lead_magnet" entityId={sub.id} />
        <CalLinkSection
          attendeeEmail={sub.email}
          attendeeName={sub.name}
          revalidatePath={`/crm/lead-magnet/${sub.id}`}
        />
      </div>

      <NotesAndTasksSection entityType="lead_magnet" entityId={sub.id} />
    </>
  );
}
