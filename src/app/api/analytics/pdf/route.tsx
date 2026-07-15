import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import {
  getAnalyticsKpis,
  getFunnelDropoff,
  getMonthlyCohorts,
  getUtmAttribution,
  getLeadsStatusBreakdown,
  RANGE_PRESETS,
} from "~/lib/queries/analytics";
import { AnalyticsReportPdf } from "~/components/pdf/analytics-report-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_DAYS = new Set(RANGE_PRESETS.map((p) => p.days));

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("days") ?? 30);
  const days = VALID_DAYS.has(requested) ? requested : 30;
  const rangeLabel =
    RANGE_PRESETS.find((p) => p.days === days)?.label ?? "30 días";
  const monthsBack = Math.min(13, Math.max(6, Math.ceil(days / 30)));

  const [kpis, funnel, cohorts, utm, statusBreakdown] = await Promise.all([
    getAnalyticsKpis(days),
    getFunnelDropoff(days),
    getMonthlyCohorts(monthsBack),
    getUtmAttribution(days),
    getLeadsStatusBreakdown(days),
  ]);

  const buffer = await renderToBuffer(
    <AnalyticsReportPdf
      rangeLabel={rangeLabel}
      generatedAt={new Date().toISOString()}
      kpis={kpis}
      funnel={funnel}
      cohorts={cohorts}
      utm={utm}
      statusBreakdown={statusBreakdown}
    />,
  );

  const today = new Date().toISOString().slice(0, 10);
  const filename = `VaultBit-Ops-Informe-${today}-${days}d.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
