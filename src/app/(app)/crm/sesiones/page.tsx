import { listTable } from "~/lib/queries/crm";
import {
  type FunnelSession,
  type Archetype,
  ARCHETYPE_LABELS,
} from "~/lib/supabase/types";
import { PageHeader } from "~/components/page-header";
import { CrmToolbar } from "~/components/crm-toolbar";
import { SessionBulkClean } from "~/components/session-bulk-clean";
import { SessionRowDelete } from "~/components/session-row-delete";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { formatDateShort } from "~/lib/utils";
import { createClient } from "~/lib/supabase/server";

export const metadata = { title: "Sesiones embudo" };
export const dynamic = "force-dynamic";

export default async function SesionesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const result = await listTable<FunnelSession>(
    "funnel_sessions",
    {
      q: params.q,
      page: params.page ? Number(params.page) : 1,
    },
    ["session_key", "utm_campaign", "archetype"],
  );

  // Total absoluto (sin filtro de búsqueda) para el botón "Borrar todas".
  const supabase = await createClient();
  const { count: totalAbsolute } = await supabase
    .from("funnel_sessions")
    .select("*", { count: "exact", head: true });

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Sesiones del embudo"
        description="Cada inicio del diagnóstico, completado o abandonado. Borra las de prueba para no ensuciar las métricas."
      />

      <CrmToolbar
        basePath="/crm/sesiones"
        q={params.q}
        page={result.page}
        pages={result.pages}
        total={result.total}
        searchPlaceholder="Buscar por session key, arquetipo o campaña…"
      />

      <div className="mb-4">
        <SessionBulkClean total={totalAbsolute ?? 0} />
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Paso</TH>
            <TH className="hidden md:table-cell">Arquetipo</TH>
            <TH>Estado</TH>
            <TH className="hidden lg:table-cell">UTM source</TH>
            <TH className="hidden lg:table-cell">UTM campaña</TH>
            <TH>Lead</TH>
            <TH className="hidden sm:table-cell">Inicio</TH>
            <TH className="w-12"></TH>
          </TR>
        </THead>
        <TBody>
          {result.rows.length === 0 ? (
            <EmptyRow colSpan={8} message="Sin sesiones registradas." />
          ) : (
            result.rows.map((row) => {
              const archetypeLabel = row.archetype
                ? (ARCHETYPE_LABELS[row.archetype as Archetype] ?? row.archetype)
                : null;
              const label = `${row.session_key?.slice(0, 8) ?? row.id.slice(0, 8)} · paso ${row.step_reached}`;
              return (
                <TR key={row.id}>
                  <TD>
                    <Badge tone="brand">{row.step_reached}/9</Badge>
                  </TD>
                  <TD className="hidden md:table-cell">{archetypeLabel ?? "—"}</TD>
                  <TD>
                    {row.completed ? (
                      <Badge tone="success" dot>
                        completado
                      </Badge>
                    ) : (
                      <Badge tone="warning">en curso</Badge>
                    )}
                  </TD>
                  <TD className="hidden lg:table-cell">{row.utm_source ?? "—"}</TD>
                  <TD className="hidden lg:table-cell">{row.utm_campaign ?? "—"}</TD>
                  <TD>
                    {row.lead_id ? (
                      <Badge tone="success">convertido</Badge>
                    ) : (
                      <span className="text-anthracite-400 text-xs">no convertido</span>
                    )}
                  </TD>
                  <TD className="hidden sm:table-cell text-anthracite-200">
                    {formatDateShort(row.created_at)}
                  </TD>
                  <TD>
                    <SessionRowDelete id={row.id} label={label} />
                  </TD>
                </TR>
              );
            })
          )}
        </TBody>
      </Table>
    </>
  );
}
