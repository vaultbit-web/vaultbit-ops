import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { enforceRateLimit } from "~/lib/rate-limit";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "sign-out", { max: 30, windowMs: 60_000 });
  if (limited) return limited;
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/login`, { status: 303 });
}
