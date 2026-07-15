import { listTable } from "~/lib/queries/crm";
import { type InvestorInterest } from "~/lib/supabase/types";
import { PageHeader } from "~/components/page-header";
import { CrmToolbar } from "~/components/crm-toolbar";
import { BulkCrmTable } from "~/components/bulk-crm-table";

export const metadata = { title: "Inversores" };
export const dynamic = "force-dynamic";

export default async function InversoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const result = await listTable<InvestorInterest>("investor_interest", {
    q: params.q,
    page: params.page ? Number(params.page) : 1,
  });

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Inversores"
        description="Manifestaciones de interés desde /inversores. Página oculta del sitemap público."
      />

      <CrmToolbar
        basePath="/crm/inversores"
        q={params.q}
        page={result.page}
        pages={result.pages}
        total={result.total}
      />

      <BulkCrmTable
        entityType="investor"
        rows={result.rows}
        emptyMessage={params.q ? "Sin resultados." : "Aún no hay interesados."}
      />
    </>
  );
}
