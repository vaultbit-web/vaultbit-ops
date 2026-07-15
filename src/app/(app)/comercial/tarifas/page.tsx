import { getAllPricingTiers, getAllPricingModifiers } from "~/lib/queries/commercial";
import { PageHeader } from "~/components/page-header";
import { PricingAdmin } from "~/components/pricing-admin";

export const metadata = { title: "Tarifas" };
export const dynamic = "force-dynamic";

export default async function TarifasPage() {
  const [tiers, modifiers] = await Promise.all([
    getAllPricingTiers(),
    getAllPricingModifiers(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Comercial"
        title="Tarifas"
        description="Precios base por tier y recargos del motor de presupuestos. Los cambios se aplican al instante en la calculadora. Importes NET (sin IVA): el 21% lo añade el presupuesto."
      />
      <PricingAdmin tiers={tiers} modifiers={modifiers} />
    </>
  );
}
