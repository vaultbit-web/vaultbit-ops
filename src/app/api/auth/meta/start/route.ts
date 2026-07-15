import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import { buildAuthUrl } from "~/lib/oauth/meta";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const state = randomBytes(24).toString("hex");
  const url = buildAuthUrl(state);

  const res = NextResponse.redirect(url);
  res.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
