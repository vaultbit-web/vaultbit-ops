import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import {
  exchangeCodeForTokens,
  getGoogleUserEmail,
  saveTokens,
} from "~/lib/oauth/google";

export const dynamic = "force-dynamic";

/**
 * Callback que recibe Google con `code` y `state`. Valida `state` contra la
 * cookie, intercambia code → tokens, los cifra y guarda. Redirige a /ajustes.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/ajustes?google=error&reason=${encodeURIComponent(error)}`, request.url),
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/ajustes?google=error&reason=missing_params", request.url),
    );
  }

  // Validar state vs cookie
  const cookieHeader = request.headers.get("cookie") ?? "";
  const stateCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("google_oauth_state="))
    ?.split("=")[1];
  if (!stateCookie || stateCookie !== state) {
    return NextResponse.redirect(
      new URL("/ajustes?google=error&reason=state_mismatch", request.url),
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const email = await getGoogleUserEmail(tokens.access_token);
    await saveTokens(user.id, tokens, email);

    const res = NextResponse.redirect(new URL("/ajustes?google=connected", request.url));
    // Limpiar cookie de state
    res.cookies.set("google_oauth_state", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[google/callback]", err);
    const reason = err instanceof Error ? err.message : "unknown";
    return NextResponse.redirect(
      new URL(`/ajustes?google=error&reason=${encodeURIComponent(reason)}`, request.url),
    );
  }
}
