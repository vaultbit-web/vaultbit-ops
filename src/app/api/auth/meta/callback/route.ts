import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import {
  exchangeCodeForShortLived,
  exchangeForLongLived,
  resolveInstagramAccount,
  saveTokens,
} from "~/lib/oauth/meta";

export const dynamic = "force-dynamic";

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
  const errorReason = url.searchParams.get("error_reason");

  if (error) {
    const reason = errorReason ?? error;
    return NextResponse.redirect(
      new URL(`/ajustes?meta=error&reason=${encodeURIComponent(reason)}`, request.url),
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/ajustes?meta=error&reason=missing_params", request.url),
    );
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const stateCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("meta_oauth_state="))
    ?.split("=")[1];
  if (!stateCookie || stateCookie !== state) {
    return NextResponse.redirect(
      new URL("/ajustes?meta=error&reason=state_mismatch", request.url),
    );
  }

  try {
    const shortLived = await exchangeCodeForShortLived(code);
    const longLived = await exchangeForLongLived(shortLived.access_token);
    const account = await resolveInstagramAccount(longLived.access_token);
    await saveTokens({ userId: user.id, longLived, account });

    const res = NextResponse.redirect(
      new URL("/ajustes?meta=connected", request.url),
    );
    res.cookies.set("meta_oauth_state", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[meta/callback]", err);
    const reason = err instanceof Error ? err.message : "unknown";
    return NextResponse.redirect(
      new URL(
        `/ajustes?meta=error&reason=${encodeURIComponent(reason.slice(0, 200))}`,
        request.url,
      ),
    );
  }
}
