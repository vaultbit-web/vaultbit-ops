import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import { getContractById, getTemplateBySlug } from "~/lib/queries/commercial";
import { ContractPdfDocument } from "~/components/pdf/contract-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const contract = await getContractById(id);
  if (!contract) {
    return new NextResponse("Contrato no encontrado", { status: 404 });
  }

  const tpl = await getTemplateBySlug(contract.template_slug);
  const templateName = tpl?.name ?? contract.template_slug;

  const buffer = await renderToBuffer(
    <ContractPdfDocument contract={contract} templateName={templateName} />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="VaultBit-${contract.contract_number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
