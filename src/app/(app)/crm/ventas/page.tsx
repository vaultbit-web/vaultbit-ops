import { listTable } from "~/lib/queries/crm";
import { type FunnelLead } from "~/lib/supabase/types";
import { PageHeader } from "~/components/page-header";
import { CrmToolbar } from "~/components/crm-toolbar";
import { BulkCrmTable } from "~/components/bulk-crm-table";

export const metadata = { title: "Pipeline ventas" };
export const dynamic = "force-dynamic";

export default async function PipelineVentasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const result = await listTable<FunnelLead>("funnel_leads", {
    q: params.q,
    page: params.page ? Number(params.page) : 1,
  });

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Pipeline de ventas"
        description="Leads que completaron el diagnóstico en /diagnostico. Click en el nombre para gestionar."
      />

      <CrmToolbar
        basePath="/crm/ventas"
        q={params.q}
        page={result.page}
        pages={result.pages}
        total={result.total}
      />

      <BulkCrmTable
        entityType="funnel_lead"
        rows={result.rows}
        emptyMessage={
          params.q
            ? "Sin resultados para esa búsqueda."
            : "Aún no hay leads del diagnóstico."
        }
      />
    </>
  );
}
