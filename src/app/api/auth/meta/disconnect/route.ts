import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import { deleteTokens } from "~/lib/oauth/meta";
import { enforceRateLimit } from "~/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "meta-disconnect", { max: 30, windowMs: 60_000 });
  if (limited) return limited;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  await deleteTokens(user.id);
  return NextResponse.redirect(
    new URL("/ajustes?meta=disconnected", request.url),
    303,
  );
}
