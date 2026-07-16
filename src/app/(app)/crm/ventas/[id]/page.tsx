import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle } from "lucide-react";
import { getEntityById } from "~/lib/queries/detail";
import {
  type FunnelLead,
  ARCHETYPE_LABELS,
  type Archetype,
  FUNNEL_LEAD_STATUS,
} from "~/lib/supabase/types";
import { PageHeader } from "~/components/page-header";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { DetailField } from "~/components/detail-field";
import { StatusSelect } from "~/components/status-select";
import { NotesAndTasksSection } from "~/components/notes-tasks-section";
import { CrmDocActions } from "~/components/crm-doc-actions";
import { CalLinkSection } from "~/components/cal-link-section";
import { DiagnosisSendButton } from "~/components/diagnosis-send-button";
import { statusToneClass, STATUS_LABEL_OVERRIDES } from "~/components/status-tones";
import { formatDateTime } from "~/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getEntityById<FunnelLead>("funnel_lead", id);
  return { title: lead?.name ? `${lead.name} · Pipeline` : "Lead" };
}

export default async function FunnelLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getEntityById<FunnelLead>("funnel_lead", id);

  if (!lead) notFound();

  const archetype = ARCHETYPE_LABELS[lead.archetype as Archetype] ?? lead.archetype;
  const answers = [lead.q1, lead.q2, lead.q3, lead.q4, lead.q5].filter(Boolean) as string[];

  return (
    <>
      <Link
        href="/crm/ventas"
        className="inline-flex items-center gap-1.5 text-xs text-anthracite-400 hover:text-brand-400 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Volver al pipeline
      </Link>

      <PageHeader
        eyebrow={`Diagnóstico · ${archetype}`}
        title={lead.name}
        description={`Lead recibido el ${formatDateTime(lead.created_at)}`}
        actions={
          <StatusSelect
            entityType="funnel_lead"
            entityId={lead.id}
            currentStatus={lead.status}
            statuses={FUNNEL_LEAD_STATUS}
            labels={STATUS_LABEL_OVERRIDES}
            toneClassName={statusToneClass(lead.status)}
          />
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información del lead</CardTitle>
        </CardHeader>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <DetailField
            label="Email"
            value={
              <a
                href={`mailto:${lead.email}`}
                className="inline-flex items-center gap-1.5 text-anthracite-100 hover:text-brand-400"
              >
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                {lead.email}
              </a>
            }
          />
          <DetailField
            label="Canal preferido"
            value={
              <Badge tone={lead.channel === "whatsapp" ? "success" : "info"}>
                {lead.channel === "whatsapp" ? (
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" strokeWidth={1.5} />
                    WhatsApp
                  </span>
                ) : (
                  "Email"
                )}
              </Badge>
            }
          />
          <DetailField label="Arquetipo" value={archetype} />
          <DetailField label="Estado actual" value={lead.status} />
          <DetailField label="UTM source" value={lead.utm_source} />
          <DetailField label="UTM campaign" value={lead.utm_campaign} />
          <DetailField label="UTM medium" value={lead.utm_medium} />
          <DetailField label="Referrer" value={lead.referrer} mono />
          <DetailField
            label="Contactado"
            value={lead.contacted_at ? formatDateTime(lead.contacted_at) : null}
          />
          <DetailField
            label="Convertido"
            value={lead.converted_at ? formatDateTime(lead.converted_at) : null}
          />
          <DetailField label="Última actualización" value={formatDateTime(lead.updated_at)} />
          <DetailField
            label="Notas internas (campo legacy)"
            value={lead.notes}
            wide
          />
        </dl>

        {answers.length > 0 ? (
          <div className="mt-6 pt-6 border-t border-anthracite-600/30">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-400 mb-3">
              Respuestas del diagnóstico
            </p>
            <ol className="flex flex-col gap-2 list-decimal list-inside">
              {answers.map((a, i) => (
                <li key={i} className="text-sm text-anthracite-100 pl-2">
                  {a}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </Card>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <DiagnosisSendButton leadId={lead.id} defaultTo={lead.email} />
        <CrmDocActions entityType="funnel_lead" entityId={lead.id} />
        <CalLinkSection
          attendeeEmail={lead.email}
          attendeeName={lead.name}
          revalidatePath={`/crm/ventas/${lead.id}`}
        />
      </div>

      <NotesAndTasksSection entityType="funnel_lead" entityId={lead.id} />
    </>
  );
}
