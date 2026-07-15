import Link from "next/link";
import { Sparkles, Wand2 } from "lucide-react";
import { createClient } from "~/lib/supabase/server";
import { PageHeader } from "~/components/page-header";
import { FounderIdeaGeneratorForm } from "~/components/founder-idea-generator-form";
import { FounderScriptCreatorForm } from "~/components/founder-script-creator-form";
import { FounderIdeaCard } from "~/components/founder-idea-card";
import { FounderScriptCard } from "~/components/founder-script-card";
import {
  FOUNDER_IDEA_STATUS,
  FOUNDER_IDEA_STATUS_LABELS,
  FOUNDER_SCRIPT_STATUS,
  FOUNDER_SCRIPT_STATUS_LABELS,
  type FounderIdea,
  type FounderIdeaStatus,
  type FounderMetric,
  type FounderScript,
  type FounderScriptStatus,
} from "~/lib/supabase/types";
import { cn } from "~/lib/utils";

export const metadata = { title: "Marca personal" };
export const dynamic = "force-dynamic";

const VIEWS = ["ideas", "cola"] as const;
type View = (typeof VIEWS)[number];

const ALL = "all" as const;
type IdeaFilter = FounderIdeaStatus | typeof ALL;
type ScriptFilter = FounderScriptStatus | typeof ALL;

interface PageSearchParams {
  view?: string;
  status?: string;
  sort?: string;
}

function parseView(raw: string | undefined): View {
  return raw === "cola" ? "cola" : "ideas";
}

function parseIdeaFilter(raw: string | undefined): IdeaFilter {
  if (raw && (FOUNDER_IDEA_STATUS as readonly string[]).includes(raw)) {
    return raw as FounderIdeaStatus;
  }
  return ALL;
}

function parseScriptFilter(raw: string | undefined): ScriptFilter {
  if (raw && (FOUNDER_SCRIPT_STATUS as readonly string[]).includes(raw)) {
    return raw as FounderScriptStatus;
  }
  return ALL;
}

export default async function FounderContentPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const params = await searchParams;
  const view = parseView(params.view);
  const supabase = await createClient();

  // ─── Fetch ideas + scripts en paralelo ─────────────────
  const [ideasRes, ideaCountsRes, scriptsRes, scriptCountsRes] =
    await Promise.all([
      view === "ideas"
        ? buildIdeasQuery(supabase, parseIdeaFilter(params.status), params.sort)
        : Promise.resolve({ data: [] as FounderIdea[], error: null }),
      supabase.from("founder_ideas").select("status"),
      view === "cola"
        ? buildScriptsQuery(supabase, parseScriptFilter(params.status))
        : Promise.resolve({ data: [] as FounderScript[], error: null }),
      supabase.from("founder_scripts").select("status"),
    ]);

  const ideaRows = (ideasRes.data ?? []) as FounderIdea[];
  const scriptRows = (scriptsRes.data ?? []) as FounderScript[];

  // ─── Último snapshot Meta por script publicado (F2.3 sesión 2) ───
  const publishedIds = scriptRows
    .filter((s) => s.status === "published")
    .map((s) => s.id);
  const latestMetricByScript = new Map<string, FounderMetric>();
  if (publishedIds.length > 0) {
    const { data: metricRows } = await supabase
      .from("founder_metrics")
      .select("*")
      .in("script_id", publishedIds)
      .order("snapshot_date", { ascending: false });
    for (const row of (metricRows ?? []) as FounderMetric[]) {
      if (!latestMetricByScript.has(row.script_id)) {
        latestMetricByScript.set(row.script_id, row);
      }
    }
  }

  // ─── Counts globales ───────────────────────────────────
  const ideaCounts = countByStatus(
    ideaCountsRes.data,
    FOUNDER_IDEA_STATUS as readonly string[],
  );
  const scriptCounts = countByStatus(
    scriptCountsRes.data,
    FOUNDER_SCRIPT_STATUS as readonly string[],
  );

  function buildHref(next: Partial<PageSearchParams>): string {
    const merged = new URLSearchParams();
    const v = next.view ?? params.view ?? view;
    const status = next.status ?? params.status;
    const sort = next.sort ?? params.sort;
    if (v && v !== "ideas") merged.set("view", v);
    if (status && status !== ALL) merged.set("status", status);
    if (sort && sort !== "score") merged.set("sort", sort);
    const qs = merged.toString();
    return qs ? `/contenido/personal?${qs}` : "/contenido/personal";
  }

  return (
    <>
      <PageHeader
        eyebrow="Contenido"
        title="Marca personal"
        description="Generador de Reels para @danielbrosedemprendedor siguiendo la metodología Víctor Eras adaptada a VaultBit. Banco de ideas → cola editorial → publicación."
      />

      <div className="flex items-center gap-1 mb-6 border-b border-anthracite-700/60">
        <Link
          href={buildHref({ view: "ideas", status: ALL })}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            view === "ideas"
              ? "border-brand-500 text-fg"
              : "border-transparent text-anthracite-300 hover:text-fg",
          )}
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" strokeWidth={1.5} />
            Banco de ideas
            <span className="text-[11px] text-anthracite-400">
              ({ideaCounts.total})
            </span>
          </span>
        </Link>
        <Link
          href={buildHref({ view: "cola", status: ALL })}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            view === "cola"
              ? "border-brand-500 text-fg"
              : "border-transparent text-anthracite-300 hover:text-fg",
          )}
        >
          <span className="inline-flex items-center gap-2">
            <Wand2 className="h-4 w-4" strokeWidth={1.5} />
            Cola editorial
            <span className="text-[11px] text-anthracite-400">
              ({scriptCounts.total})
            </span>
          </span>
        </Link>
      </div>

      {view === "ideas" ? (
        <IdeasView
          rows={ideaRows}
          counts={ideaCounts}
          activeFilter={parseIdeaFilter(params.status)}
          activeSort={params.sort === "recent" ? "recent" : "score"}
          buildHref={buildHref}
        />
      ) : (
        <ScriptsView
          rows={scriptRows}
          counts={scriptCounts}
          activeFilter={parseScriptFilter(params.status)}
          buildHref={buildHref}
          latestMetricByScript={latestMetricByScript}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Sub-vistas
// ─────────────────────────────────────────────────────────

interface IdeasViewProps {
  rows: FounderIdea[];
  counts: { total: number; byStatus: Record<string, number> };
  activeFilter: IdeaFilter;
  activeSort: "score" | "recent";
  buildHref: (next: Partial<PageSearchParams>) => string;
}

function IdeasView({
  rows,
  counts,
  activeFilter,
  activeSort,
  buildHref,
}: IdeasViewProps) {
  const filterChips: { value: IdeaFilter; label: string; count: number }[] = [
    { value: ALL, label: "Todas", count: counts.total },
    ...FOUNDER_IDEA_STATUS.map((s) => ({
      value: s as IdeaFilter,
      label: FOUNDER_IDEA_STATUS_LABELS[s],
      count: counts.byStatus[s] ?? 0,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <FounderIdeaGeneratorForm />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {filterChips.map((chip) => {
            const active = activeFilter === chip.value;
            return (
              <Link
                key={chip.value}
                href={buildHref({ status: chip.value })}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-brand-500/15 text-brand-400 border-brand-500/40"
                    : "bg-anthracite-900 text-anthracite-200 border-anthracite-600/40 hover:border-brand-500/30 hover:text-brand-400",
                )}
              >
                {chip.label}
                <span className="opacity-70">{chip.count}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-xs text-anthracite-300">
          <span>Orden:</span>
          {(["score", "recent"] as const).map((opt) => (
            <Link
              key={opt}
              href={buildHref({ sort: opt })}
              className={cn(
                "rounded-full px-2.5 py-1 font-medium border transition-colors",
                activeSort === opt
                  ? "bg-anthracite-700 text-fg border-anthracite-500"
                  : "bg-transparent text-anthracite-300 border-anthracite-700/60 hover:text-fg hover:border-anthracite-500",
              )}
            >
              {opt === "score" ? "Mejor score" : "Más recientes"}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={
            activeFilter === ALL
              ? "Aún no hay ideas en el banco."
              : `No hay ideas en estado "${FOUNDER_IDEA_STATUS_LABELS[activeFilter as FounderIdeaStatus]}".`
          }
          subtitle={
            activeFilter === ALL
              ? "Pulsa Generar ideas para que Gemini Pro lance una tanda."
              : "Cambia el filtro o genera más ideas."
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((idea) => (
            <FounderIdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ScriptsViewProps {
  rows: FounderScript[];
  counts: { total: number; byStatus: Record<string, number> };
  activeFilter: ScriptFilter;
  buildHref: (next: Partial<PageSearchParams>) => string;
  latestMetricByScript: Map<string, FounderMetric>;
}

function ScriptsView({
  rows,
  counts,
  activeFilter,
  buildHref,
  latestMetricByScript,
}: ScriptsViewProps) {
  const filterChips: { value: ScriptFilter; label: string; count: number }[] = [
    { value: ALL, label: "Todos", count: counts.total },
    ...FOUNDER_SCRIPT_STATUS.map((s) => ({
      value: s as ScriptFilter,
      label: FOUNDER_SCRIPT_STATUS_LABELS[s],
      count: counts.byStatus[s] ?? 0,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <FounderScriptCreatorForm />

      <div className="flex items-center gap-2 flex-wrap">
        {filterChips.map((chip) => {
          const active = activeFilter === chip.value;
          return (
            <Link
              key={chip.value}
              href={buildHref({ status: chip.value })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "bg-brand-500/15 text-brand-400 border-brand-500/40"
                  : "bg-anthracite-900 text-anthracite-200 border-anthracite-600/40 hover:border-brand-500/30 hover:text-brand-400",
              )}
            >
              {chip.label}
              <span className="opacity-70">{chip.count}</span>
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={
            activeFilter === ALL
              ? "Aún no hay guiones en cola."
              : `No hay guiones en estado "${FOUNDER_SCRIPT_STATUS_LABELS[activeFilter as FounderScriptStatus]}".`
          }
          subtitle={
            activeFilter === ALL
              ? "Promueve una idea ganadora del banco o genera un guion desde tema libre."
              : "Cambia el filtro o crea un guion nuevo."
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((script) => (
            <FounderScriptCard
              key={script.id}
              script={script}
              latestMetric={latestMetricByScript.get(script.id) ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="card-dark p-10 text-center flex flex-col items-center gap-3">
      <div className="h-12 w-12 rounded-full bg-anthracite-800 flex items-center justify-center">
        <Sparkles className="h-5 w-5 text-anthracite-300" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm text-fg font-medium">{title}</p>
        <p className="text-xs text-anthracite-300 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Helpers de query / counts
// ─────────────────────────────────────────────────────────

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function buildIdeasQuery(
  supabase: SupabaseClient,
  filter: IdeaFilter,
  sort: string | undefined,
) {
  let q = supabase.from("founder_ideas").select("*");
  if (filter !== ALL) q = q.eq("status", filter);
  if (sort === "recent") {
    q = q.order("created_at", { ascending: false });
  } else {
    q = q
      .order("idea_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  }
  return await q.limit(200);
}

async function buildScriptsQuery(
  supabase: SupabaseClient,
  filter: ScriptFilter,
) {
  let q = supabase
    .from("founder_scripts")
    .select("*")
    .order("created_at", { ascending: false });
  if (filter !== ALL) q = q.eq("status", filter);
  return await q.limit(200);
}

function countByStatus(
  rows: { status: string }[] | null,
  validStatuses: readonly string[],
) {
  const counts = { total: 0, byStatus: {} as Record<string, number> };
  for (const s of validStatuses) counts.byStatus[s] = 0;
  for (const r of rows ?? []) {
    counts.total += 1;
    if (counts.byStatus[r.status] !== undefined) {
      counts.byStatus[r.status] += 1;
    }
  }
  return counts;
}
