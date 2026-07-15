import Link from "next/link";
import { Linkedin, ShieldAlert, Users } from "lucide-react";
import { createClient } from "~/lib/supabase/server";
import { PageHeader } from "~/components/page-header";
import { LinkedInImportForm } from "~/components/linkedin-import-form";
import { LinkedInContactCard } from "~/components/linkedin-contact-card";
import { LinkedInBatchActions } from "~/components/linkedin-batch-actions";
import { cn } from "~/lib/utils";

export const metadata = { title: "Contactos LinkedIn" };
export const dynamic = "force-dynamic";

const RELEVANCE_VALUES = ["all", "relevant", "review", "irrelevant"] as const;
type RelevanceFilter = (typeof RELEVANCE_VALUES)[number];

const OUTREACH_VALUES = [
  "all",
  "new",
  "message_drafted",
  "sent",
  "replied",
  "archived",
] as const;
type OutreachFilter = (typeof OUTREACH_VALUES)[number];

const RELEVANCE_LABELS: Record<RelevanceFilter, string> = {
  all: "Todos",
  relevant: "Relevantes",
  review: "Pendiente review",
  irrelevant: "Descartados",
};

const OUTREACH_LABELS: Record<OutreachFilter, string> = {
  all: "Cualquier estado",
  new: "Nuevos",
  message_drafted: "Borrador",
  sent: "Enviados",
  replied: "Respondidos",
  archived: "Archivados",
};

interface PageSearchParams {
  relevance?: string;
  outreach?: string;
  with_history?: string;
}

function parseRelevance(raw: string | undefined): RelevanceFilter {
  return (RELEVANCE_VALUES as readonly string[]).includes(raw ?? "")
    ? (raw as RelevanceFilter)
    : "relevant";
}

function parseOutreach(raw: string | undefined): OutreachFilter {
  return (OUTREACH_VALUES as readonly string[]).includes(raw ?? "")
    ? (raw as OutreachFilter)
    : "all";
}

export default async function LinkedInContactsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const params = await searchParams;
  const relevance = parseRelevance(params.relevance);
  const outreach = parseOutreach(params.outreach);
  const withHistory = params.with_history === "1";

  const supabase = await createClient();

  // KPIs (siempre globales, independientes del filtro)
  const { data: allRows } = await supabase
    .from("linkedin_contacts")
    .select("id, relevance_status, outreach_status, has_message_history");

  const kpis = {
    total: 0,
    relevant: 0,
    review: 0,
    irrelevant: 0,
    drafted: 0,
    sent: 0,
    with_history: 0,
  };
  for (const r of allRows ?? []) {
    kpis.total += 1;
    if (r.relevance_status === "relevant") kpis.relevant += 1;
    else if (r.relevance_status === "review") kpis.review += 1;
    else if (r.relevance_status === "irrelevant") kpis.irrelevant += 1;
    if (r.outreach_status === "message_drafted") kpis.drafted += 1;
    if (r.outreach_status === "sent") kpis.sent += 1;
    if (r.has_message_history) kpis.with_history += 1;
  }

  let query = supabase
    .from("linkedin_contacts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (relevance !== "all") {
    query = query.eq("relevance_status", relevance);
  }
  if (outreach !== "all") {
    query = query.eq("outreach_status", outreach);
  }
  if (withHistory) {
    query = query.eq("has_message_history", true);
  }

  const { data: contacts, error } = await query;

  function buildHref(next: Partial<Record<keyof PageSearchParams, string>>): string {
    const merged = new URLSearchParams();
    const r = next.relevance ?? params.relevance;
    const o = next.outreach ?? params.outreach;
    const h = next.with_history ?? params.with_history;
    if (r && r !== "relevant") merged.set("relevance", r);
    if (o && o !== "all") merged.set("outreach", o);
    if (h === "1") merged.set("with_history", "1");
    const qs = merged.toString();
    return qs ? `/crm/linkedin-contactos?${qs}` : "/crm/linkedin-contactos";
  }

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Contactos LinkedIn"
        description="Importa tu export de LinkedIn, filtra solo los del sector y genera primeros mensajes personales sin agenda comercial. Cero venta en el primer toque."
      />

      <div className="flex flex-col gap-6">
        <LinkedInImportForm />

        <div className="rounded-[10px] border border-warning/25 bg-warning/5 px-4 py-3 flex items-start gap-2.5 text-xs text-warning/90">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="leading-relaxed">
            El contenido de tus mensajes de LinkedIn NUNCA se almacena. Solo
            derivamos contador y fecha de última interacción por contacto, para
            ajustar el tono del primer mensaje. Los contactos importados están
            bajo tu relación previa de aceptación mutua en LinkedIn.
          </p>
        </div>

        {kpis.total > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="Total" value={kpis.total} icon={Users} />
            <KpiCard label="Relevantes" value={kpis.relevant} tone="success" />
            <KpiCard
              label="Pendiente review"
              value={kpis.review}
              tone={kpis.review > 0 ? "warning" : undefined}
            />
            <KpiCard label="Con historial" value={kpis.with_history} icon={Linkedin} />
          </div>
        )}

        {kpis.review > 0 && <LinkedInBatchActions reviewCount={kpis.review} />}

        {kpis.total > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-anthracite-400">
                Relevancia:
              </span>
              {RELEVANCE_VALUES.map((value) => {
                const count =
                  value === "all"
                    ? kpis.total
                    : value === "relevant"
                      ? kpis.relevant
                      : value === "review"
                        ? kpis.review
                        : kpis.irrelevant;
                const active = relevance === value;
                return (
                  <Link
                    key={value}
                    href={buildHref({ relevance: value })}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                      active
                        ? "bg-brand-500/15 text-brand-400 border-brand-500/40"
                        : "bg-anthracite-900 text-anthracite-200 border-anthracite-600/40 hover:border-brand-500/30 hover:text-brand-400",
                    )}
                  >
                    {RELEVANCE_LABELS[value]}
                    <span className="opacity-70">{count}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-anthracite-400">
                Estado outreach:
              </span>
              {OUTREACH_VALUES.map((value) => {
                const active = outreach === value;
                return (
                  <Link
                    key={value}
                    href={buildHref({ outreach: value })}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      active
                        ? "bg-anthracite-700 text-fg border-anthracite-500"
                        : "bg-transparent text-anthracite-300 border-anthracite-700/60 hover:text-fg hover:border-anthracite-500",
                    )}
                  >
                    {OUTREACH_LABELS[value]}
                  </Link>
                );
              })}

              <Link
                href={buildHref({ with_history: withHistory ? "0" : "1" })}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ml-auto",
                  withHistory
                    ? "bg-brand-500/15 text-brand-400 border-brand-500/40"
                    : "bg-transparent text-anthracite-300 border-anthracite-700/60 hover:text-fg hover:border-anthracite-500",
                )}
              >
                {withHistory ? "Solo con historial ✓" : "Solo con historial"}
              </Link>
            </div>
          </div>
        )}

        {error ? (
          <div className="rounded-[10px] border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            Error cargando contactos: {error.message}
          </div>
        ) : !contacts || contacts.length === 0 ? (
          <EmptyState hasData={kpis.total > 0} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {contacts.map((c) => (
              <LinkedInContactCard key={c.id} contact={c} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon?: typeof Users;
  tone?: "success" | "warning";
}) {
  const toneCls =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-fg";
  return (
    <div className="card-dark px-4 py-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-anthracite-400">
          {label}
        </p>
        <p className={cn("text-xl font-light mt-0.5", toneCls)}>{value}</p>
      </div>
      {Icon ? <Icon className="h-4 w-4 text-anthracite-500" strokeWidth={1.5} /> : null}
    </div>
  );
}

function EmptyState({ hasData }: { hasData: boolean }) {
  return (
    <div className="card-dark p-10 text-center flex flex-col items-center gap-3">
      <div className="h-12 w-12 rounded-full bg-anthracite-800 flex items-center justify-center">
        <Linkedin className="h-5 w-5 text-anthracite-300" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm text-fg font-medium">
          {hasData
            ? "No hay contactos con los filtros actuales."
            : "Aún no has importado ningún export de LinkedIn."}
        </p>
        <p className="text-xs text-anthracite-300 mt-1">
          {hasData
            ? "Cambia los filtros o reclasifica los marcados como review."
            : "Sube el ZIP de tu export de LinkedIn con el formulario de arriba."}
        </p>
      </div>
    </div>
  );
}
