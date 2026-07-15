import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { colors } from "./styles";
import type {
  AnalyticsKpis,
  FunnelStep,
  MonthlyCohort,
  StatusBreakdownRow,
  UtmAttributionRow,
} from "~/lib/queries/analytics";

interface AnalyticsReportPdfProps {
  rangeLabel: string;
  generatedAt: string; // ISO
  kpis: AnalyticsKpis;
  funnel: FunnelStep[];
  cohorts: MonthlyCohort[];
  utm: UtmAttributionRow[];
  statusBreakdown: StatusBreakdownRow[];
}

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: colors.text,
    paddingTop: 70,
    paddingBottom: 60,
    paddingLeft: 50,
    paddingRight: 50,
    lineHeight: 1.5,
  },
  brandStripe: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: colors.brand,
  },
  header: {
    position: "absolute",
    top: 30,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.ink,
    letterSpacing: 0.8,
  },
  brandTag: {
    fontSize: 7,
    color: colors.hint,
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  headerRight: {
    fontSize: 7.5,
    color: colors.muted,
    textAlign: "right",
    letterSpacing: 0.2,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 0.4,
    borderTopColor: colors.rule,
  },
  footerText: {
    fontSize: 7,
    color: colors.hint,
    letterSpacing: 0.3,
  },
  eyebrow: {
    fontSize: 7.5,
    color: colors.brand,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  h1: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: colors.ink,
    marginBottom: 4,
    lineHeight: 1.2,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.ink,
    marginTop: 22,
    marginBottom: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  small: {
    fontSize: 8,
    color: colors.muted,
  },

  // KPI grid
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    marginHorizontal: -4,
  },
  kpiCard: {
    width: "25%",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  kpiCardInner: {
    backgroundColor: colors.surface,
    borderLeftWidth: 2,
    borderLeftColor: colors.brand,
    padding: 8,
    height: 60,
  },
  kpiLabel: {
    fontSize: 7,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  kpiValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: colors.ink,
    marginTop: 2,
  },
  kpiDelta: {
    fontSize: 7,
    marginTop: 2,
  },
  deltaUp: { color: "#16a34a" },
  deltaDown: { color: "#dc2626" },
  deltaFlat: { color: colors.muted },

  // Funnel
  funnelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  funnelStepNum: {
    width: 18,
    fontSize: 7,
    color: colors.hint,
    fontFamily: "Helvetica-Bold",
  },
  funnelLabel: {
    flex: 1,
    fontSize: 8.5,
    color: colors.text,
  },
  funnelBarWrap: {
    width: 160,
    height: 8,
    backgroundColor: colors.rule,
    marginRight: 8,
    overflow: "hidden",
  },
  funnelBar: {
    height: "100%",
    backgroundColor: colors.brand,
  },
  funnelCount: {
    width: 30,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.ink,
    textAlign: "right",
  },
  funnelDrop: {
    width: 36,
    fontSize: 7,
    color: "#dc2626",
    textAlign: "right",
  },

  // Tabla genérica
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 5,
    borderBottomWidth: 0.6,
    borderBottomColor: colors.ruleStrong,
    marginBottom: 4,
  },
  th: {
    fontSize: 7.5,
    color: colors.hint,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.3,
    borderBottomColor: colors.rule,
  },
  td: {
    fontSize: 8.5,
    color: colors.text,
  },
  tdBold: {
    fontSize: 8.5,
    color: colors.ink,
    fontFamily: "Helvetica-Bold",
  },
  // Columnas UTM
  utmSource: { flex: 2 },
  utmCol: { flex: 1, textAlign: "right" },

  // Cohortes
  cohortsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -3,
  },
  cohortCard: {
    width: "16.66%",
    paddingHorizontal: 3,
    marginBottom: 6,
  },
  cohortInner: {
    backgroundColor: colors.surface,
    padding: 6,
    minHeight: 50,
    borderTopWidth: 1.5,
    borderTopColor: colors.brand,
  },
  cohortLabel: {
    fontSize: 6.5,
    color: colors.hint,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  cohortTotal: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.ink,
    marginTop: 2,
  },
  cohortBreakdown: {
    fontSize: 6.5,
    color: colors.muted,
    marginTop: 2,
  },

  // Status breakdown
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  statusName: {
    width: 110,
    fontSize: 8.5,
    color: colors.text,
  },
  statusBarWrap: {
    flex: 1,
    height: 6,
    backgroundColor: colors.rule,
    marginRight: 8,
  },
  statusBar: {
    height: "100%",
  },
  statusValue: {
    width: 40,
    fontSize: 8,
    color: colors.muted,
    textAlign: "right",
  },
});

const STATUS_COLOR: Record<string, string> = {
  nuevo: colors.brand,
  contactado: colors.ruleStrong,
  en_seguimiento: "#d97706",
  convertido: "#16a34a",
  descartado: "#dc2626",
};

function fmt(n: number): string {
  return new Intl.NumberFormat("es-ES").format(n);
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function deltaStyle(delta: number) {
  if (delta === 0) return s.deltaFlat;
  return delta > 0 ? s.deltaUp : s.deltaDown;
}

function deltaText(delta: number): string {
  if (delta === 0) return "→ sin cambio";
  return `${delta > 0 ? "▲" : "▼"} ${delta > 0 ? "+" : ""}${delta}%`;
}

interface KpiCellProps {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
}

function KpiCell({ label, value, delta, hint }: KpiCellProps) {
  return (
    <View style={s.kpiCard}>
      <View style={s.kpiCardInner}>
        <Text style={s.kpiLabel}>{label}</Text>
        <Text style={s.kpiValue}>{value}</Text>
        {delta !== undefined ? (
          <Text style={[s.kpiDelta, deltaStyle(delta)]}>{deltaText(delta)}</Text>
        ) : hint ? (
          <Text style={[s.kpiDelta, s.deltaFlat]}>{hint}</Text>
        ) : null}
      </View>
    </View>
  );
}

export function AnalyticsReportPdf({
  rangeLabel,
  generatedAt,
  kpis,
  funnel,
  cohorts,
  utm,
  statusBreakdown,
}: AnalyticsReportPdfProps) {
  const totalLeadsStatus = statusBreakdown.reduce((sum, r) => sum + r.count, 0);
  const cohortsRecent = cohorts.slice(-12); // últimos 12 meses como mucho

  return (
    <Document
      title={`VaultBit Ops · Informe ejecutivo · ${rangeLabel}`}
      author="VaultBit Advisory S.L."
      subject={`Informe de funnel y atribución · ${rangeLabel}`}
    >
      <Page size="A4" style={s.page}>
        <View style={s.brandStripe} fixed />

        <View style={s.header} fixed>
          <View>
            <Text style={s.brandName}>VAULTBIT OPS</Text>
            <Text style={s.brandTag}>Informe ejecutivo · funnel y atribución</Text>
          </View>
          <View>
            <Text style={s.headerRight}>{rangeLabel}</Text>
            <Text style={[s.headerRight, { marginTop: 2 }]}>
              {fmtDate(generatedAt)}
            </Text>
          </View>
        </View>

        <Text style={s.eyebrow}>Periodo {rangeLabel}</Text>
        <Text style={s.h1}>Informe ejecutivo</Text>
        <Text style={s.small}>
          Datos comparados frente al periodo anterior equivalente. Generado el{" "}
          {fmtDate(generatedAt)}.
        </Text>

        {/* KPIs */}
        <Text style={s.h2}>Métricas clave</Text>
        <View style={s.kpiGrid}>
          <KpiCell
            label="Leads"
            value={fmt(kpis.leadsCurrent)}
            delta={kpis.leadsDelta}
            hint={`vs ${fmt(kpis.leadsPrevious)}`}
          />
          <KpiCell
            label="Sesiones"
            value={fmt(kpis.sessionsCurrent)}
            delta={kpis.sessionsDelta}
          />
          <KpiCell
            label="% completado"
            value={`${kpis.completionRateCurrent.toFixed(1)}%`}
            hint={`vs ${kpis.completionRatePrevious.toFixed(1)}%`}
          />
          <KpiCell
            label="Conversión"
            value={`${kpis.conversionCurrent.toFixed(1)}%`}
            hint={`vs ${kpis.conversionPrevious.toFixed(1)}%`}
          />
          <KpiCell
            label="Lead magnet"
            value={fmt(kpis.leadMagnetCurrent)}
            delta={kpis.leadMagnetDelta}
          />
          <KpiCell label="Inversores" value={fmt(kpis.investorsCurrent)} />
          <KpiCell label="Partners" value={fmt(kpis.partnersCurrent)} />
        </View>

        {/* Embudo */}
        <Text style={s.h2}>Embudo del diagnóstico — drop-off por paso</Text>
        {funnel.length === 0 ? (
          <Text style={s.small}>Sin sesiones del diagnóstico en este periodo.</Text>
        ) : (
          funnel.map((step) => {
            const dropPct = step.step === 0 ? 0 : 100 - Math.round(step.pctOfPrev);
            return (
              <View key={step.step} style={s.funnelRow}>
                <Text style={s.funnelStepNum}>
                  {String(step.step).padStart(2, "0")}
                </Text>
                <Text style={s.funnelLabel}>
                  Paso {step.step} ({Math.round(step.pctOfTop)}%)
                </Text>
                <View style={s.funnelBarWrap}>
                  <View
                    style={[
                      s.funnelBar,
                      { width: `${Math.max(2, step.pctOfTop)}%` },
                    ]}
                  />
                </View>
                <Text style={s.funnelCount}>{fmt(step.count)}</Text>
                <Text style={s.funnelDrop}>
                  {step.step > 0 && step.drop > 0 ? `-${dropPct}%` : ""}
                </Text>
              </View>
            );
          })
        )}
      </Page>

      {/* Página 2 */}
      <Page size="A4" style={s.page}>
        <View style={s.brandStripe} fixed />
        <View style={s.header} fixed>
          <View>
            <Text style={s.brandName}>VAULTBIT OPS</Text>
            <Text style={s.brandTag}>Informe ejecutivo · funnel y atribución</Text>
          </View>
          <View>
            <Text style={s.headerRight}>{rangeLabel}</Text>
            <Text style={[s.headerRight, { marginTop: 2 }]}>
              {fmtDate(generatedAt)}
            </Text>
          </View>
        </View>

        <Text style={s.h2}>Cohortes mensuales · leads del diagnóstico</Text>
        {cohortsRecent.every((c) => c.total === 0) ? (
          <Text style={s.small}>Aún no hay leads en este periodo.</Text>
        ) : (
          <View style={s.cohortsGrid}>
            {cohortsRecent.map((c) => (
              <View key={c.month} style={s.cohortCard}>
                <View style={s.cohortInner}>
                  <Text style={s.cohortLabel}>{c.monthLabel}</Text>
                  <Text style={s.cohortTotal}>{fmt(c.total)}</Text>
                  {c.byArchetype.length > 0 ? (
                    <Text style={s.cohortBreakdown}>
                      {c.byArchetype
                        .slice(0, 3)
                        .map((a) => `${a.label.split(" ")[0]} ${a.count}`)
                        .join(" · ")}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={s.h2}>Estado del pipeline · {rangeLabel}</Text>
        {statusBreakdown.length === 0 ? (
          <Text style={s.small}>Sin datos.</Text>
        ) : (
          <>
            {statusBreakdown.map((row) => (
              <View key={row.status} style={s.statusRow}>
                <Text style={s.statusName}>
                  {row.status.replace(/_/g, " ")}
                </Text>
                <View style={s.statusBarWrap}>
                  <View
                    style={[
                      s.statusBar,
                      {
                        backgroundColor: STATUS_COLOR[row.status] ?? colors.muted,
                        width: `${row.pct}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={s.statusValue}>
                  {fmt(row.count)} ({row.pct.toFixed(0)}%)
                </Text>
              </View>
            ))}
            <Text style={[s.small, { marginTop: 4 }]}>
              Total: {fmt(totalLeadsStatus)} leads creados en el periodo.
            </Text>
          </>
        )}

        <Text style={s.h2}>Atribución por fuente UTM</Text>
        {utm.length === 0 ? (
          <Text style={s.small}>Sin tráfico atribuido en este periodo.</Text>
        ) : (
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={[s.th, s.utmSource]}>Fuente</Text>
              <Text style={[s.th, s.utmCol]}>Sesiones</Text>
              <Text style={[s.th, s.utmCol]}>Leads</Text>
              <Text style={[s.th, s.utmCol]}>Conversión</Text>
            </View>
            {utm.slice(0, 12).map((row) => (
              <View key={row.source} style={s.tableRow}>
                <Text style={[s.td, s.utmSource]}>{row.source}</Text>
                <Text style={[s.td, s.utmCol]}>{fmt(row.sessions)}</Text>
                <Text style={[s.tdBold, s.utmCol]}>{fmt(row.leads)}</Text>
                <Text style={[s.td, s.utmCol]}>
                  {row.conversionPct.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            VaultBit Advisory S.L. · Informe interno
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
