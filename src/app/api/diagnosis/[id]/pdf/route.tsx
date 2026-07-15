import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import { getEntityById } from "~/lib/queries/detail";
import type { FunnelLead } from "~/lib/supabase/types";
import { parseAnswers } from "~/lib/diagnosis/types";
import { composeDiagnosis } from "~/lib/diagnosis/composer";
import { DiagnosisPdfDocument } from "~/components/pdf/diagnosis-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vista previa del PDF de diagnóstico (no envía).
 * Devuelve siempre 200 con un PDF, marcado con marca de agua "BORRADOR" si
 * algún fragmento de la combinación Q1-Q5 todavía no está redactado.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const { id } = await ctx.params;
  const lead = await getEntityById<FunnelLead>("funnel_lead", id);
  if (!lead) return new NextResponse("Lead no encontrado", { status: 404 });

  const answers = parseAnswers({
    q1: lead.q1,
    q2: lead.q2,
    q3: lead.q3,
    q4: lead.q4,
    q5: lead.q5,
  });
  if (!answers) {
    return new NextResponse(
      "Las respuestas Q1-Q5 del lead no están completas o tienen valores no esperados.",
      { status: 422 },
    );
  }

  const model = composeDiagnosis({
    id: lead.id,
    name: lead.name,
    email: lead.email ?? "",
    answers,
  });

  const buffer = await renderToBuffer(<DiagnosisPdfDocument model={model} />);
  const safeName = lead.name.replace(/[^\w\d-]+/g, "-").slice(0, 40) || "lead";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="VaultBit-Diagnostico-${safeName}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
