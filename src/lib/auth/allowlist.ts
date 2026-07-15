/**
 * Allowlist de emails autorizados a entrar a VaultBit Ops.
 *
 * Hoy: solo `founder@example.com` (decisión del fundador).
 * En el futuro: se podrá ampliar añadiendo emails a la env `ALLOWED_EMAILS`
 * separados por coma, o migrar a tabla `authorized_users` en Supabase.
 *
 * Esta función se usa tanto en middleware (request lifecycle) como en
 * Server Components (post-auth). Mantenerla pura y sin side-effects.
 */

const DEFAULT_ALLOWED = ["founder@example.com"];

function getAllowedEmails(): string[] {
  const fromEnv = process.env.ALLOWED_EMAILS;
  if (!fromEnv) return DEFAULT_ALLOWED;
  return fromEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return getAllowedEmails().includes(normalized);
}
