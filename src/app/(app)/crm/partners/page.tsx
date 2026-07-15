import { listTable } from "~/lib/queries/crm";
import { type PartnerApplication } from "~/lib/supabase/types";
import { PageHeader } from "~/components/page-header";
import { CrmToolbar } from "~/components/crm-toolbar";
import { BulkCrmTable } from "~/components/bulk-crm-table";

export const metadata = { title: "Partners" };
export const dynamic = "force-dynamic";

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const result = await listTable<PartnerApplication>("partner_applications", {
    q: params.q,
    page: params.page ? Number(params.page) : 1,
  });

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Red de partners"
        description="Aplicaciones desde /partners — fiscalistas, sucesiones, custodia física, web3."
      />

      <CrmToolbar
        basePath="/crm/partners"
        q={params.q}
        page={result.page}
        pages={result.pages}
        total={result.total}
      />

      <BulkCrmTable
        entityType="partner"
        rows={result.rows}
        emptyMessage={params.q ? "Sin resultados." : "Aún no hay aplicaciones."}
      />
    </>
  );
}
