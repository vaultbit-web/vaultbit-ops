import Link from "next/link";
import { ArrowRight, ScrollText, History } from "lucide-react";
import { getActiveTemplates } from "~/lib/queries/commercial";
import {
  CONTRACT_CATEGORY_LABELS,
  type ContractCategory,
} from "~/lib/supabase/types";
import { PageHeader } from "~/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

export const metadata = { title: "Legal · Plantillas" };
export const dynamic = "force-dynamic";

const CATEGORY_TONE = {
  precontrato: "brand",
  nda: "info",
  contrato: "success",
  partner: "warning",
  aceptacion: "neutral",
} as const;

export default async function LegalListPage() {
  const templates = await getActiveTemplates();

  return (
    <>
      <PageHeader
        eyebrow="Comercial"
        title="Legal · Plantillas"
        description="Genera precontratos, NDAs y acuerdos a partir de plantillas con placeholders. El PDF se firma manualmente."
        actions={
          <Link href="/comercial/legal/contratos">
            <Button variant="secondary" size="md">
              <History className="h-4 w-4" strokeWidth={1.5} />
              Histórico de contratos
            </Button>
          </Link>
        }
      />

      {templates.length === 0 ? (
        <div className="card-dark p-6 text-sm text-anthracite-200">
          No hay plantillas activas. Carga las iniciales en{" "}
          <code className="text-brand-400">contract_templates</code>.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((t) => {
            const cat = t.category as ContractCategory;
            return (
              <Card key={t.slug}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ScrollText className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
                    <CardTitle>{t.name}</CardTitle>
                  </div>
                  <Badge tone={CATEGORY_TONE[cat] ?? "neutral"} className="self-start mt-1">
                    {CONTRACT_CATEGORY_LABELS[cat] ?? t.category}
                  </Badge>
                  <CardDescription className="mt-2">{t.description}</CardDescription>
                </CardHeader>
                <Link
                  href={`/comercial/legal/${t.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-500 mt-2"
                >
                  Generar contrato
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
