/**
 * Validación de emails con sintaxis + MX lookup nativo (Node DNS).
 *
 * Diseñado para ejecutarse DESPUÉS de Gemini y ANTES de persistir en
 * Supabase. Su único propósito: detectar emails inventados o con dominio
 * inexistente antes de que el operador intente contactar y reciba bounces.
 *
 * Decisión de diseño: NUNCA descarta el prospecto entero. Los emails que
 * no superan la validación se persisten como `null` con un flag en
 * `email_validation_status`. La persona puede ser valiosa y el email
 * rellenarse manualmente más adelante.
 *
 * Diferencia con la antigua `validateSuggestedEmail` (que vivía en
 * gemini/client.ts): aquella rechazaba dominios públicos (gmail, etc.).
 * Esta los persiste con flag `public_provider` — en modo holder un
 * particular con gmail personal es perfectamente válido.
 */

import { promises as dns } from "node:dns";

export type EmailValidationStatus =
  | "valid"
  | "no_mx"
  | "invalid_syntax"
  | "rejected"
  | "public_provider"
  | "not_found";

export interface EmailValidationResult {
  status: EmailValidationStatus;
  email: string | null;
}

/** Proveedores de email público — válidos pero sospechosos para B2B. */
export const PUBLIC_EMAIL_PROVIDERS = new Set<string>([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "yahoo.es",
  "icloud.com",
  "me.com",
  "live.com",
  "msn.com",
  "protonmail.com",
  "proton.me",
]);

/** Dominios reservados RFC2606 / inventados de manual. */
const RESERVED_DOMAINS = new Set<string>([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test",
  "localhost",
  "invalid",
  "domain.com",
  "tld",
]);

const EMAIL_SYNTAX_RE = /^[^\s@]+@([a-z0-9-]+\.)+[a-z]{2,}$/i;
const MX_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("MX timeout")), ms),
    ),
  ]);
}

export async function validateEmail(
  raw: string | null | undefined,
): Promise<EmailValidationResult> {
  if (!raw || typeof raw !== "string") {
    return { status: "not_found", email: null };
  }
  const email = raw.trim().toLowerCase();
  if (email.length === 0) {
    return { status: "not_found", email: null };
  }

  if (!EMAIL_SYNTAX_RE.test(email)) {
    return { status: "invalid_syntax", email: null };
  }

  const domain = email.split("@")[1];
  if (!domain) {
    return { status: "invalid_syntax", email: null };
  }

  if (RESERVED_DOMAINS.has(domain)) {
    return { status: "rejected", email: null };
  }

  // Resolución MX. Si falla o tarda >3s lo tratamos como no_mx (conservador).
  try {
    const records = await withTimeout(dns.resolveMx(domain), MX_TIMEOUT_MS);
    if (!records || records.length === 0) {
      return { status: "no_mx", email: null };
    }
  } catch {
    return { status: "no_mx", email: null };
  }

  if (PUBLIC_EMAIL_PROVIDERS.has(domain)) {
    return { status: "public_provider", email };
  }

  return { status: "valid", email };
}
