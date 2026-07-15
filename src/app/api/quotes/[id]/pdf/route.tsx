import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import { getQuoteById } from "~/lib/queries/commercial";
import { QuotePdfDocument } from "~/components/pdf/quote-pdf";

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
  const quote = await getQuoteById(id);
  if (!quote) {
    return new NextResponse("Presupuesto no encontrado", { status: 404 });
  }

  const buffer = await renderToBuffer(<QuotePdfDocument quote={quote} />);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="VaultBit-Presupuesto-${quote.quote_number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
