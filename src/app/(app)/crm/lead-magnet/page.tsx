import { listTable } from "~/lib/queries/crm";
import { type LeadMagnetSubscriber } from "~/lib/supabase/types";
import { PageHeader } from "~/components/page-header";
import { CrmToolbar } from "~/components/crm-toolbar";
import { BulkCrmTable } from "~/components/bulk-crm-table";

export const metadata = { title: "Lead magnet" };
export const dynamic = "force-dynamic";

export default async function LeadMagnetPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const result = await listTable<LeadMagnetSubscriber>("lead_magnet_subscribers", {
    q: params.q,
    page: params.page ? Number(params.page) : 1,
  });

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Lead magnet · Guía 7 errores"
        description="Suscriptores que descargaron la guía PDF. Click en el nombre para gestionar."
      />

      <CrmToolbar
        basePath="/crm/lead-magnet"
        q={params.q}
        page={result.page}
        pages={result.pages}
        total={result.total}
      />

      <BulkCrmTable
        entityType="lead_magnet"
        rows={result.rows}
        emptyMessage={params.q ? "Sin resultados." : "Aún no hay descargas."}
      />
    </>
  );
}
