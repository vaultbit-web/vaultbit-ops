import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isEmailAllowed } from "../auth/allowlist";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session si hace falta. NO insertar lógica entre createServerClient y getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Rutas públicas ante el middleware: se autentican ELLAS SOLAS y no llevan cookie
  // de sesión Supabase, así que no deben pasar por el guard getUser()+allowlist:
  //  - /api/webhooks/* : webhooks externos (Cal.com) verificados por HMAC en el handler.
  //  - /api/meta/sync  : cron con Bearer secret (o sesión+allowlist dentro del handler).
  // (Sin esto, un POST externo sin cookie se redirige a /login y nunca llega al handler.)
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/webhooks/") ||
    pathname === "/api/meta/sync" ||
    pathname.startsWith("/_next") ||
    pathname === "/manifest.json" ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webmanifest)$/);

  if (isPublic) {
    return supabaseResponse;
  }

  // Sin sesión → fuera
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Sesión existe pero email no en allowlist → cerrar sesión
  if (!isEmailAllowed(user.email)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "not_allowed");
    await supabase.auth.signOut();
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
