import type { PlaceholderDef } from "~/lib/supabase/types";

/**
 * Reemplaza placeholders {{key}} en el cuerpo markdown.
 * Helper puro — usado tanto en server (al crear contrato) como en cliente
 * (preview en el editor).
 *
 * Si un placeholder declarado no tiene valor, deja `[Label no informado]`.
 * Si aparece un placeholder no declarado, también se sustituye por la
 * forma `[key no informado]` para que sea visible al revisar.
 */
export function fillPlaceholders(
  bodyMd: string,
  values: Record<string, string>,
  placeholders: PlaceholderDef[],
): string {
  let result = bodyMd;
  for (const ph of placeholders) {
    const v = values[ph.key];
    const display = v && v.trim().length > 0 ? v.trim() : `[${ph.label} no informado]`;
    result = result.replaceAll(`{{${ph.key}}}`, display);
  }
  result = result.replace(/\{\{([^}]+)\}\}/g, (_, key) => `[${key} no informado]`);
  return result;
}
