import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getActivePricing, getPricingRules } from "~/lib/queries/commercial";
import { ENTITY_TYPES, type EntityType } from "~/lib/supabase/types";
import { getCrmClientDetails } from "~/lib/actions/search";
import { PageHeader } from "~/components/page-header";
import { QuoteForm } from "~/components/quote-form";

export const metadata = { title: "Nuevo presupuesto" };
export const dynamic = "force-dynamic";

export default async function NuevoPresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ entity_type?: string; entity_id?: string }>;
}) {
  const sp = await searchParams;
  const [pricing, rules] = await Promise.all([getActivePricing(), getPricingRules()]);
  const hasAnyPricing = pricing.length > 0 || rules.tiers.length > 0;

  // Pre-vincular cliente CRM desde URL params (?entity_type=...&entity_id=...)
  let initialCrmClient: Awaited<ReturnType<typeof getCrmClientDetails>> | null = null;
  if (
    sp.entity_type &&
    sp.entity_id &&
    ENTITY_TYPES.includes(sp.entity_type as EntityType)
  ) {
    initialCrmClient = await getCrmClientDetails(sp.entity_type as EntityType, sp.entity_id);
  }

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
        eyebrow="Comercial"
        title="Nuevo presupuesto"
        description="Selecciona servicio, modalidad y tarifa. Puedes editar el precio base y aplicar descuentos."
      />

      {!hasAnyPricing ? (
        <div className="card-dark p-6 text-sm text-anthracite-200">
          No hay tarifas configuradas. Define los tiers y recargos en{" "}
          <a href="/comercial/tarifas" className="text-brand-400 hover:underline">
            Comercial · Tarifas
          </a>
          .
        </div>
      ) : (
        <QuoteForm
          pricing={pricing}
          rules={rules}
          initialCrmClient={
            initialCrmClient
              ? {
                  entity_type: initialCrmClient.entity_type,
                  entity_id: initialCrmClient.entity_id,
                  name: initialCrmClient.name,
                  email: initialCrmClient.email,
                  organization: initialCrmClient.organization,
                }
              : null
          }
        />
      )}
    </>
  );
}
