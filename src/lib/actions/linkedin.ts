"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import {
  parseLinkedInUpload,
  enrichConnectionsWithMessages,
  normalizeLinkedinUrl,
} from "~/lib/linkedin/parser";
import { classifyContact } from "~/lib/linkedin/classifier";
import {
  classifyWithGemini,
  type GeminiClassificationInput,
} from "~/lib/linkedin/gemini-classifier";
import { generateLinkedInMessage } from "~/lib/linkedin/message-generator";

const ROUTE = "/crm/linkedin-contactos";
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB
const GEMINI_BATCH_SIZE = 8;

export type LinkedInActionResult = { ok: true } | { ok: false; error: string };

export type LinkedInImportResult =
  | {
      ok: true;
      total: number;
      relevant: number;
      review: number;
      irrelevant: number;
      with_history: number;
    }
  | { ok: false; error: string };

export type LinkedInRefineResult =
  | { ok: true; refined: number; errors: number }
  | { ok: false; error: string };

export type LinkedInMessageActionResult =
  | { ok: true; message: string; modelUsed: string }
  | { ok: false; error: string };

const VALID_OUTREACH_STATUS = [
  "new",
  "message_drafted",
  "sent",
  "replied",
  "archived",
] as const;
type OutreachStatus = (typeof VALID_OUTREACH_STATUS)[number];

const VALID_RELEVANCE = [
  "pending",
  "relevant",
  "irrelevant",
  "review",
] as const;
type RelevanceStatus = (typeof VALID_RELEVANCE)[number];

async function assertAuthorized() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) {
    throw new Error("No autorizado");
  }
  return { user, supabase };
}

function toIsoDate(d: Date | null): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * Sube el export de LinkedIn (ZIP o Connections.csv suelto), parsea,
 * cruza con messages.csv si está, clasifica con la heurística regex
 * y upserta en linkedin_contacts. NO llama a Gemini en esta fase.
 */
export async function importLinkedInZip(
  formData: FormData,
): Promise<LinkedInImportResult> {
  try {
    const { user, supabase } = await assertAuthorized();

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return { ok: false, error: "Falta el archivo" };
    }
    if (file.size === 0) {
      return { ok: false, error: "El archivo está vacío" };
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return {
        ok: false,
        error: `El archivo supera el límite de ${MAX_UPLOAD_BYTES / 1024 / 1024}MB`,
      };
    }

    const buf = await file.arrayBuffer();
    const { connections, messages } = await parseLinkedInUpload(buf);

    if (connections.length === 0) {
      return {
        ok: false,
        error:
          "No se encontraron contactos en el archivo. LinkedIn entrega Connections.csv en el segundo email del export (24h después). Espera al segundo link e inténtalo de nuevo.",
      };
    }

    const enriched = enrichConnectionsWithMessages(connections, messages);

    // Crear import_id (audit log)
    const { data: imp, error: impErr } = await supabase
      .from("linkedin_imports")
      .insert({
        created_by: user.id,
        source_filename: file.name,
        connections_count: enriched.length,
        messages_count: messages.length,
      })
      .select("id")
      .single();
    if (impErr || !imp) {
      console.error("[importLinkedInZip] insert linkedin_imports", impErr?.message);
      return { ok: false, error: impErr?.message ?? "Error creando import" };
    }

    // Construir rows con clasificación heurística
    const rows = enriched.map((c) => {
      const cls = classifyContact(c);
      return {
        created_by: user.id,
        import_id: imp.id,
        linkedin_url: normalizeLinkedinUrl(c.linkedin_url),
        first_name: c.first_name,
        last_name: c.last_name,
        email_address: c.email_address,
        company: c.company,
        position: c.position,
        connected_on: toIsoDate(c.connected_on),
        relevance_status: cls.relevance_status,
        relevance_reason: cls.relevance_reason,
        sector_tags: cls.sector_tags,
        crypto_signal: cls.crypto_signal,
        has_message_history: c.has_message_history,
        last_message_at: c.last_message_at ? c.last_message_at.toISOString() : null,
        messages_count: c.messages_count,
      };
    });

    // Upsert por linkedin_url. Preserva outreach_status, notes,
    // generated_message si la fila ya existía (ON CONFLICT DO UPDATE).
    const { error: upErr } = await supabase
      .from("linkedin_contacts")
      .upsert(rows, {
        onConflict: "linkedin_url",
        ignoreDuplicates: false,
      });

    if (upErr) {
      console.error("[importLinkedInZip] upsert", upErr.message);
      return { ok: false, error: upErr.message };
    }

    const counts = rows.reduce(
      (acc, r) => {
        if (r.relevance_status === "relevant") acc.relevant += 1;
        else if (r.relevance_status === "review") acc.review += 1;
        else acc.irrelevant += 1;
        if (r.has_message_history) acc.with_history += 1;
        return acc;
      },
      { relevant: 0, review: 0, irrelevant: 0, with_history: 0 },
    );

    revalidatePath(ROUTE);
    return {
      ok: true,
      total: rows.length,
      ...counts,
    };
  } catch (err) {
    console.error("[importLinkedInZip]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

/**
 * Refina con Gemini todos los contactos con relevance_status='review'.
 * Procesa en batches para limitar coste / latencia.
 */
export async function refineReviewContactsWithGemini(): Promise<LinkedInRefineResult> {
  try {
    const { user, supabase } = await assertAuthorized();

    const { data, error } = await supabase
      .from("linkedin_contacts")
      .select("id, first_name, last_name, position, company, linkedin_url")
      .eq("created_by", user.id)
      .eq("relevance_status", "review");

    if (error) return { ok: false, error: error.message };
    if (!data || data.length === 0) {
      return { ok: true, refined: 0, errors: 0 };
    }

    let refined = 0;
    let errors = 0;

    for (let i = 0; i < data.length; i += GEMINI_BATCH_SIZE) {
      const batch = data.slice(i, i + GEMINI_BATCH_SIZE) as GeminiClassificationInput[];
      try {
        const results = await classifyWithGemini(batch);
        for (const r of results) {
          const { error: updErr } = await supabase
            .from("linkedin_contacts")
            .update({
              relevance_status: r.result.relevance_status,
              relevance_reason: r.result.relevance_reason,
              sector_tags: r.result.sector_tags,
              crypto_signal: r.result.crypto_signal,
            })
            .eq("id", r.id)
            .eq("created_by", user.id);
          if (updErr) {
            errors += 1;
            console.error("[refineReview] update", r.id, updErr.message);
          } else {
            refined += 1;
          }
        }
      } catch (err) {
        errors += batch.length;
        console.error(
          "[refineReview] batch error",
          err instanceof Error ? err.message : err,
        );
      }
    }

    revalidatePath(ROUTE);
    return { ok: true, refined, errors };
  } catch (err) {
    console.error("[refineReviewContactsWithGemini]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

/**
 * Genera primer mensaje LinkedIn para un contacto. Persiste el borrador
 * en `generated_message` y mueve outreach_status a 'message_drafted'.
 */
export async function generateContactLinkedInMessage(
  contactId: string,
): Promise<LinkedInMessageActionResult> {
  try {
    const { user, supabase } = await assertAuthorized();
    if (!contactId) return { ok: false, error: "ID inválido" };

    const { data: contact, error } = await supabase
      .from("linkedin_contacts")
      .select("*")
      .eq("id", contactId)
      .eq("created_by", user.id)
      .single();
    if (error || !contact) {
      return { ok: false, error: error?.message ?? "Contacto no encontrado" };
    }

    const sectorTags: string[] = Array.isArray(contact.sector_tags)
      ? (contact.sector_tags as unknown[]).filter(
          (t): t is string => typeof t === "string",
        )
      : [];

    const result = await generateLinkedInMessage({
      first_name: contact.first_name,
      last_name: contact.last_name,
      company: contact.company,
      position: contact.position,
      connected_on: contact.connected_on,
      has_message_history: contact.has_message_history,
      last_message_at: contact.last_message_at,
      sector_tags: sectorTags,
      crypto_signal: contact.crypto_signal,
    });

    const { error: updErr } = await supabase
      .from("linkedin_contacts")
      .update({
        generated_message: result.message,
        generated_message_at: new Date().toISOString(),
        outreach_status:
          contact.outreach_status === "new"
            ? "message_drafted"
            : contact.outreach_status,
      })
      .eq("id", contactId)
      .eq("created_by", user.id);
    if (updErr) return { ok: false, error: updErr.message };

    revalidatePath(ROUTE);
    return { ok: true, message: result.message, modelUsed: result.modelUsed };
  } catch (err) {
    console.error("[generateContactLinkedInMessage]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function updateLinkedInOutreachStatus(
  contactId: string,
  status: OutreachStatus,
): Promise<LinkedInActionResult> {
  try {
    const { user, supabase } = await assertAuthorized();
    if (!contactId) return { ok: false, error: "ID inválido" };
    if (!VALID_OUTREACH_STATUS.includes(status)) {
      return { ok: false, error: `Estado "${status}" no permitido` };
    }
    const { error } = await supabase
      .from("linkedin_contacts")
      .update({ outreach_status: status })
      .eq("id", contactId)
      .eq("created_by", user.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(ROUTE);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function updateLinkedInRelevance(
  contactId: string,
  status: RelevanceStatus,
): Promise<LinkedInActionResult> {
  try {
    const { user, supabase } = await assertAuthorized();
    if (!contactId) return { ok: false, error: "ID inválido" };
    if (!VALID_RELEVANCE.includes(status)) {
      return { ok: false, error: `Estado "${status}" no permitido` };
    }
    const { error } = await supabase
      .from("linkedin_contacts")
      .update({
        relevance_status: status,
        relevance_reason:
          status === "relevant"
            ? "Reclasificado manualmente como relevante"
            : status === "irrelevant"
              ? "Reclasificado manualmente como irrelevante"
              : null,
      })
      .eq("id", contactId)
      .eq("created_by", user.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(ROUTE);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function updateLinkedInNotes(
  contactId: string,
  notes: string,
): Promise<LinkedInActionResult> {
  try {
    const { user, supabase } = await assertAuthorized();
    if (!contactId) return { ok: false, error: "ID inválido" };
    const trimmed = notes.trim();
    if (trimmed.length > 5000) {
      return { ok: false, error: "La nota es demasiado larga (máx 5000)" };
    }
    const { error } = await supabase
      .from("linkedin_contacts")
      .update({ notes: trimmed.length > 0 ? trimmed : null })
      .eq("id", contactId)
      .eq("created_by", user.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(ROUTE);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function saveLinkedInMessageDraft(
  contactId: string,
  message: string,
): Promise<LinkedInActionResult> {
  try {
    const { user, supabase } = await assertAuthorized();
    if (!contactId) return { ok: false, error: "ID inválido" };
    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return { ok: false, error: "El mensaje está vacío" };
    }
    if (trimmed.length > 2500) {
      return { ok: false, error: "Mensaje demasiado largo (máx 2500)" };
    }
    const { error } = await supabase
      .from("linkedin_contacts")
      .update({
        generated_message: trimmed,
        generated_message_at: new Date().toISOString(),
      })
      .eq("id", contactId)
      .eq("created_by", user.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(ROUTE);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function deleteLinkedInContact(
  contactId: string,
): Promise<LinkedInActionResult> {
  try {
    const { user, supabase } = await assertAuthorized();
    if (!contactId) return { ok: false, error: "ID inválido" };
    const { error } = await supabase
      .from("linkedin_contacts")
      .delete()
      .eq("id", contactId)
      .eq("created_by", user.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(ROUTE);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}
