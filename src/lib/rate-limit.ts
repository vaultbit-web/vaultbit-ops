import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Rate limiting in-memory (fixed window) + comparación timing-safe de secretos.
 *
 * Nota: el estado vive en la memoria del proceso. Funciona en una instancia única
 * (despliegue Dokploy `output: standalone`). En multi-instancia/serverless usar un
 * limitador distribuido (Upstash). Los route handlers de Next corren en runtime Node
 * por defecto, así que el Map de módulo persiste entre peticiones. Fail-open ante error.
 *
 * Ref: web-security skill · references/01-rate-limiting.md (OWASP A04/API4) y 07-webhooks-hmac.md (CWE-208).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** peticiones máximas por ventana */ max: number;
  /** ventana en ms */ windowMs: number;
}

/** IP de cliente best-effort. Tras un proxy, el host setea x-forwarded-for. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Devuelve una respuesta 429 si se excede el límite, o null si se permite.
 * @param req petición entrante
 * @param key identificador lógico de la ruta (p.ej. "meta-sync")
 * @param opts límite
 */
export function enforceRateLimit(
  req: Request,
  key: string,
  opts: RateLimitOptions,
): NextResponse | null {
  try {
    const id = `${key}:${clientIp(req)}`;
    const now = Date.now();
    const b = store.get(id);
    if (!b || b.resetAt <= now) {
      store.set(id, { count: 1, resetAt: now + opts.windowMs });
      return null;
    }
    if (b.count < opts.max) {
      b.count += 1;
      return null;
    }
    const retryAfter = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  } catch {
    return null; // fail-open: nunca bloquees por un fallo del limitador
  }
}

/** Comparación de strings en tiempo constante (anti timing attack). */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length || ba.length === 0) return false;
  return timingSafeEqual(ba, bb);
}
