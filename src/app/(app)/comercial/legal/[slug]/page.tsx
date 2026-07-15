import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTemplateBySlug } from "~/lib/queries/commercial";
import {
  CONTRACT_CATEGORY_LABELS,
  ENTITY_TYPES,
  type ContractCategory,
  type EntityType,
  type PlaceholderDef,
} from "~/lib/supabase/types";
import { getCrmClientDetails } from "~/lib/actions/search";
import { PageHeader } from "~/components/page-header";
import { Badge } from "~/components/ui/badge";
import { ContractEditor } from "~/components/contract-editor";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTemplateBySlug(slug);
  return { title: t ? `${t.name} · Legal` : "Plantilla" };
}

export default async function TemplateEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const t = await getTemplateBySlug(slug);

  if (!t || !t.active) notFound();

  // Coger los placeholders y los valores iniciales desde query params
  const placeholders = (Array.isArray(t.placeholders) ? t.placeholders : []) as unknown as PlaceholderDef[];
  const initialValues: Record<string, string> = {};
  for (const k of Object.keys(sp)) {
    const v = sp[k];
    if (typeof v === "string") initialValues[k] = v;
  }
  const quoteId = typeof sp.quote_id === "string" ? sp.quote_id : null;

  // Vinculación CRM opcional desde URL: ?entity_type=...&entity_id=...
  const entityType = typeof sp.entity_type === "string" ? sp.entity_type : null;
  const entityId = typeof sp.entity_id === "string" ? sp.entity_id : null;
  let initialCrmLink: { entity_type: EntityType; entity_id: string; name: string } | null = null;
  let crmEmail: string | null = null;
  if (entityType && entityId && ENTITY_TYPES.includes(entityType as EntityType)) {
    const details = await getCrmClientDetails(entityType as EntityType, entityId);
    if (details) {
      initialCrmLink = {
        entity_type: details.entity_type,
        entity_id: details.entity_id,
        name: details.name,
      };
      crmEmail = details.email;
      // Autorrellenar placeholders típicos con datos del CRM
      const map: Record<string, string | null> = {
        cliente_nombre: details.name,
        contraparte_nombre: details.name,
        partner_nombre: details.name,
        cliente_email: details.email,
        contraparte_email: details.email,
      };
      for (const ph of placeholders) {
        if (initialValues[ph.key]) continue; // respeta lo que ya viniera por URL
        const v = map[ph.key];
        if (v) initialValues[ph.key] = v;
      }
    }
  }

  // Email del cliente: prioridad URL params > CRM > vacío. Igual con NIF.
  const initialClientEmail =
    initialValues.cliente_email ??
    initialValues.contraparte_email ??
    initialValues.partner_email ??
    crmEmail ??
    null;
  const initialClientNif =
    initialValues.cliente_nif ??
    initialValues.contraparte_nif ??
    initialValues.partner_nif ??
    null;

  return (
    <>
      <Link
        href="/comercial/legal"
        className="inline-flex items-center gap-1.5 text-xs text-anthracite-400 hover:text-brand-400 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Volver a plantillas
      </Link>

      <PageHeader
        eyebrow={`Plantilla · ${CONTRACT_CATEGORY_LABELS[t.category as ContractCategory] ?? t.category}`}
        title={t.name}
        description={t.description ?? undefined}
        actions={<Badge tone="info">v{t.version}</Badge>}
      />

      <ContractEditor
        templateSlug={t.slug}
        templateName={t.name}
        bodyMd={t.body_md}
        placeholders={placeholders}
        initialValues={initialValues}
        quoteId={quoteId}
        initialCrmLink={initialCrmLink}
        initialClientEmail={initialClientEmail}
        initialClientNif={initialClientNif}
      />
    </>
  );
}
