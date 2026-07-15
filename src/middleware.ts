import { type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon-* y archivos de assets
     */
    "/((?!_next/static|_next/image|favicon|icon-|apple-touch|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
