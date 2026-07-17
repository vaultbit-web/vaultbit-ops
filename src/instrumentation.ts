/**
 * Validación de entorno al arranque (fail-fast). Next.js llama a register() una vez
 * cuando arranca el servidor. Si falta una env CRÍTICA, abortamos con un error claro
 * en el arranque en lugar de fallar a mitad de una request (o servir roto).
 * No se ejecuta durante `next build` (solo en el runtime Node del server).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_APP_URL",
  ];
  const missing = required.filter((k) => !process.env[k]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `[env] Faltan variables de entorno críticas: ${missing.join(", ")}. ` +
        "Configúralas en el entorno de Ops antes de arrancar.",
    );
  }

  // Secretos opcionales: su ausencia desactiva la función asociada (no bloquea el arranque),
  // pero se avisa para que no pase inadvertido en producción.
  const optionalWarnings: Record<string, string> = {
    CAL_COM_WEBHOOK_SECRET: "el webhook de Cal.com rechazará las peticiones (fail-closed)",
    OAUTH_ENCRYPTION_KEY: "el cifrado de tokens OAuth (Meta) quedará desactivado",
    META_SYNC_SECRET: "el modo cron de /api/meta/sync no aceptará el Bearer",
  };
  for (const [key, effect] of Object.entries(optionalWarnings)) {
    if (!process.env[key]?.trim()) {
      console.warn(`[env] ${key} no configurada: ${effect}.`);
    }
  }
}
