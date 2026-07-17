import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Build standalone para imagen Docker minimalista (Dokploy)
  output: "standalone",
  // Silenciamos el warning de "multiple lockfiles" — el lockfile de ops/ es el correcto
  outputFileTracingRoot: path.resolve(__dirname),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // CSP baseline no-bloqueante (sin script-src para no romper el runtime de Next).
          // PENDIENTE (endurecer contra XSS): CSP con nonce por request. Enfoque exacto sin
          // romper la app: generar el nonce en middleware.ts, setear
          // `script-src 'self' 'nonce-<n>' 'strict-dynamic'` + `x-nonce` en la request, y quitar
          // la CSP de aquí (pasa a ser dinámica). Requiere smoke-test en runtime tras desplegar
          // (Next inyecta el nonce en sus scripts automáticamente). Ver web-security: templates/middleware.nextjs.ts.
          { key: "Content-Security-Policy", value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; upgrade-insecure-requests" },
          // HSTS con subdominios + preload (1 año). El dominio ya sirve solo por HTTPS.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default config;
