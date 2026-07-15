import Link from "next/link";
import {
  Users,
  Activity,
  CheckCircle2,
  TrendingUp,
  Download,
  Coins,
  Handshake,
  FileDown,
} from "lucide-react";
import {
  getAnalyticsKpis,
  getFunnelDropoff,
  getFunnelDropoffByUtm,
  getFunnelDropoffByArchetype,
  getFunnelDataHealth,
  getMonthlyCohorts,
  getUtmAttribution,
  getLeadsStatusBreakdown,
  RANGE_PRESETS,
} from "~/lib/queries/analytics";
import { ARCHETYPE_LABELS, type Archetype } from "~/lib/supabase/types";
import { PageHeader } from "~/components/page-header";
import { KpiCard } from "~/components/kpi-card";
import { Card, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { RangePicker } from "~/components/analytics/range-picker";
import { FunnelChart } from "~/components/analytics/funnel-chart";
import { SegmentedFunnel } from "~/components/analytics/segmented-funnel";
import { DataHealthCard } from "~/components/analytics/data-health";
import {
  CohortsGrid,
  CohortsLegend,
} from "~/components/analytics/cohorts-grid";
import { UtmTable } from "~/components/analytics/utm-table";
import { StatusBars } from "~/components/analytics/status-bars";

export const metadata = { title: "Analítica" };
export const dynamic = "force-dynamic";

const VALID_DAYS = new Set(RANGE_PRESETS.map((p) => p.days));

function pctDelta(value: number) {
  if (value === 0) return { value: 0, positive: null as boolean | null };
  return { value, positive: value > 0 };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const requested = Number(params.days ?? 30);
  const days = VALID_DAYS.has(requested) ? requested : 30;
  const rangeLabel = RANGE_PRESETS.find((p) => p.days === days)?.label ?? "30 días";

  // Para cohortes mostramos los últimos N meses según el rango (mín 6, máx 13)
  const monthsBack = Math.min(13, Math.max(6, Math.ceil(days / 30)));

  const [
    kpis,
    funnel,
    funnelByUtm,
    funnelByArchetype,
    dataHealth,
    cohorts,
    utm,
    statusBreakdown,
  ] = await Promise.all([
    getAnalyticsKpis(days),
    getFunnelDropoff(days),
    getFunnelDropoffByUtm(days),
    getFunnelDropoffByArchetype(days),
    getFunnelDataHealth(days),
    getMonthlyCohorts(monthsBack),
    getUtmAttribution(days),
    getLeadsStatusBreakdown(days),
  ]);

  // Traducir los segmentos de arquetipo a labels en español para la UI
  const funnelByArchetypeLabeled = funnelByArchetype.map((r) => ({
    ...r,
    segment: ARCHETYPE_LABELS[r.segment as Archetype] ?? r.segment,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Analítica"
        title="Embudo, cohortes y atribución"
        description={`Ventana actual: ${rangeLabel}. Compara con el periodo anterior equivalente para ver tendencia real.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RangePicker current={days} basePath="/analytics" />
            <Link
              href={`/api/analytics/pdf?days=${days}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-(--radius-md) border border-anthracite-400/60 px-3 py-1.5 text-xs font-semibold text-fg hover:border-brand-500/50 hover:text-brand-400 transition-colors"
            >
              <FileDown className="h-3.5 w-3.5" strokeWidth={1.5} />
              Exportar PDF
            </Link>
          </div>
        }
      />

      {/* KPIs comparativos */}
      <section className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={`Leads · ${rangeLabel}`}
          value={kpis.leadsCurrent}
          delta={pctDelta(kpis.leadsDelta)}
          hint={`${kpis.leadsPrevious} en periodo anterior`}
          icon={Users}
          highlight
        />
        <KpiCard
          label={`Sesiones · ${rangeLabel}`}
          value={kpis.sessionsCurrent}
          delta={pctDelta(kpis.sessionsDelta)}
          hint={`${kpis.sessionsPrevious} antes`}
          icon={Activity}
        />
        <KpiCard
          label="Embudo completado"
          value={`${kpis.completionRateCurrent.toFixed(1)}%`}
          icon={CheckCircle2}
          hint={`vs ${kpis.completionRatePrevious.toFixed(1)}% antes`}
        />
        <KpiCard
          label="Conversión a lead"
          value={`${kpis.conversionCurrent.toFixed(1)}%`}
          icon={TrendingUp}
          hint={`vs ${kpis.conversionPrevious.toFixed(1)}% antes`}
        />
      </section>

      <section className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 mt-4">
        <KpiCard
          label="Lead magnet"
          value={kpis.leadMagnetCurrent}
          delta={pctDelta(kpis.leadMagnetDelta)}
          icon={Download}
          hint={`${kpis.leadMagnetPrevious} antes`}
        />
        <KpiCard
          label="Inversores"
          value={kpis.investorsCurrent}
          icon={Coins}
        />
        <KpiCard
          label="Partners"
          value={kpis.partnersCurrent}
          icon={Handshake}
        />
      </section>

      {/* Salud de datos del embudo — se muestra primero porque condiciona
          la fiabilidad del resto de métricas. */}
      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Salud de datos del embudo</CardTitle>
            <CardDescription>
              Verifica que los leads se están registrando correctamente y que
              las sesiones avanzan paso a paso. Si hay incidencias críticas,
              las métricas de abajo no son fiables hasta arreglarlas.
            </CardDescription>
          </CardHeader>
          <DataHealthCard health={dataHealth} />
        </Card>
      </section>

      {/* Embudo y status pipeline */}
      <section className="grid gap-4 lg:grid-cols-2 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Embudo del diagnóstico — drop-off por paso</CardTitle>
            <CardDescription>
              Cuántas sesiones llegaron a cada paso. La caída roja indica el
              porcentaje que se perdió respecto al paso anterior.
            </CardDescription>
          </CardHeader>
          <FunnelChart steps={funnel} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del pipeline de ventas</CardTitle>
            <CardDescription>
              Distribución por status de los leads creados en este periodo.
            </CardDescription>
          </CardHeader>
          <StatusBars rows={statusBreakdown} />
        </Card>
      </section>

      {/* Drop-off segmentado por origen y arquetipo — responde
          "¿en qué paso se va exactamente cada tipo de visitante?". */}
      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Drop-off por fuente UTM</CardTitle>
            <CardDescription>
              Cada fila es un origen. Cada columna es un paso del embudo
              (S0 entrada · Q1-Q5 preguntas · Res resultado · Form datos ·
              Lead capturado · OK confirmación). Permite ver de qué fuente
              vienen los que abandonan y dónde se quedan.
            </CardDescription>
          </CardHeader>
          <SegmentedFunnel
            rows={funnelByUtm}
            segmentLabel="Fuente UTM"
            emptyMessage="Sin sesiones atribuidas en este periodo."
          />
        </Card>
      </section>

      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Drop-off por arquetipo</CardTitle>
            <CardDescription>
              El arquetipo se asigna al responder Q5, así que esta vista
              segmenta solo sesiones que llegaron a la pregunta 5.
              Compara qué perfil convierte mejor del resultado al envío del
              formulario.
            </CardDescription>
          </CardHeader>
          <SegmentedFunnel
            rows={funnelByArchetypeLabeled}
            segmentLabel="Arquetipo"
            emptyMessage="Aún no hay sesiones con arquetipo definido (ningún visitante llegó a Q5)."
          />
        </Card>
      </section>

      {/* Cohortes mensuales */}
      <section className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <CardTitle>Cohortes mensuales</CardTitle>
                <CardDescription>
                  Leads del diagnóstico por mes de creación, segmentados por
                  arquetipo. Lee tendencias estacionales.
                </CardDescription>
              </div>
              <CohortsLegend />
            </div>
          </CardHeader>
          <CohortsGrid cohorts={cohorts} />
        </Card>
      </section>

      {/* Atribución UTM */}
      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Atribución por fuente UTM</CardTitle>
            <CardDescription>
              Sesiones del diagnóstico y leads generados, agrupados por
              <code className="mx-1 text-anthracite-100">utm_source</code>. La
              conversión es leads sobre sesiones de la misma fuente.
            </CardDescription>
          </CardHeader>
          <UtmTable rows={utm} />
        </Card>
      </section>
    </>
  );
}
