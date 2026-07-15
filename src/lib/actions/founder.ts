"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import {
  generateFounderCopy,
  generateFounderIdeas,
  generateFounderScript,
  type FounderArchetype,
  type FounderFormatLiteral,
  type FounderIdeaCriteria,
} from "~/lib/gemini/client";
import {
  FOUNDER_FORMATS,
  FOUNDER_IDEA_STATUS,
  FOUNDER_SCRIPT_STATUS,
  type FounderIdeaStatus,
  type FounderScriptStatus,
} from "~/lib/supabase/types";

const FOUNDER_ROUTE = "/contenido/personal";

const VALID_ARCHETYPES: FounderArchetype[] = [
  "security",
  "fiscal",
  "inheritance",
  "business",
];

export type FounderActionResult = { ok: true } | { ok: false; error: string };

export type FounderIdeasBatchResult =
  | { ok: true; inserted: number; batchId: string; modelUsed: string }
  | { ok: false; error: string };

export type FounderScriptResult =
  | { ok: true; scriptId: string; modelUsed: string }
  | { ok: false; error: string };

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

function emptyToUndefined(v: string | undefined | null): string | undefined {
  if (!v) return undefined;
  const t = v.trim();
  return t.length === 0 ? undefined : t;
}

function isValidArchetype(v: string | undefined): v is FounderArchetype {
  return v !== undefined && (VALID_ARCHETYPES as string[]).includes(v);
}

function isValidFormat(v: string | undefined): v is FounderFormatLiteral {
  return v !== undefined && (FOUNDER_FORMATS as readonly string[]).includes(v);
}

function generateBatchId(): string {
  // crypto.randomUUID está disponible en Node 18+ (runtime de Next.js)
  return crypto.randomUUID();
}

// ─────────────────────────────────────────────────────────
// IDEAS
// ─────────────────────────────────────────────────────────

export async function generateFounderIdeasBatch(
  formData: FormData,
): Promise<FounderIdeasBatchResult> {
  try {
    const { user, supabase } = await assertAuthorized();

    const countRaw = formData.get("count")?.toString();
    const archetypeRaw = formData.get("archetype")?.toString();
    const extraContext = emptyToUndefined(formData.get("extraContext")?.toString());

    const count = Math.min(Math.max(Number(countRaw ?? 20) || 20, 5), 50);
    const criteria: FounderIdeaCriteria = {
      count,
      extraContext,
    };
    if (isValidArchetype(archetypeRaw)) criteria.archetype = archetypeRaw;

    const result = await generateFounderIdeas(criteria);
    if (result.ideas.length === 0) {
      return {
        ok: false,
        error:
          "Gemini no devolvió ninguna idea. Intenta con menos count o más contexto.",
      };
    }

    const batchId = generateBatchId();
    const rows = result.ideas.map((idea) => ({
      created_by: user.id,
      theme: idea.theme,
      archetype: idea.archetype,
      format: idea.format,
      idea_score: idea.idea_score,
      idea_score_breakdown: idea.idea_score_breakdown,
      rationale: idea.rationale,
      status: "raw",
      compliance_passes: idea.compliance_passes,
      compliance_flagged: idea.compliance_flagged,
      batch_id: batchId,
    }));

    const { error } = await supabase.from("founder_ideas").insert(rows);
    if (error) {
      console.error("[generateFounderIdeasBatch] insert", error.message);
      return { ok: false, error: error.message };
    }

    revalidatePath(FOUNDER_ROUTE);
    return {
      ok: true,
      inserted: rows.length,
      batchId,
      modelUsed: result.modelUsed,
    };
  } catch (err) {
    console.error("[generateFounderIdeasBatch]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function updateIdeaStatus(
  ideaId: string,
  newStatus: FounderIdeaStatus,
): Promise<FounderActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!FOUNDER_IDEA_STATUS.includes(newStatus)) {
      return { ok: false, error: `Estado "${newStatus}" no permitido` };
    }
    if (!ideaId) return { ok: false, error: "ID inválido" };

    const { error } = await supabase
      .from("founder_ideas")
      .update({ status: newStatus })
      .eq("id", ideaId);
    if (error) return { ok: false, error: error.message };

    revalidatePath(FOUNDER_ROUTE);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function deleteIdea(
  ideaId: string,
): Promise<FounderActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!ideaId) return { ok: false, error: "ID inválido" };
    const { error } = await supabase
      .from("founder_ideas")
      .delete()
      .eq("id", ideaId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(FOUNDER_ROUTE);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

// ─────────────────────────────────────────────────────────
// SCRIPTS
// ─────────────────────────────────────────────────────────

export async function promoteIdeaToScript(
  ideaId: string,
): Promise<FounderScriptResult> {
  try {
    const { user, supabase } = await assertAuthorized();
    if (!ideaId) return { ok: false, error: "ID inválido" };

    const { data: idea, error: fetchErr } = await supabase
      .from("founder_ideas")
      .select("*")
      .eq("id", ideaId)
      .single();
    if (fetchErr || !idea) {
      return { ok: false, error: fetchErr?.message ?? "Idea no encontrada" };
    }

    // Si la idea ya tenía un guion vinculado, comprobamos si sigue vivo.
    // Si existe y la idea está en estado "promoted", regenerar significa
    // sustituir: el cliente ya pidió confirmación al usuario.
    if (idea.promoted_script_id) {
      const { data: existing } = await supabase
        .from("founder_scripts")
        .select("id")
        .eq("id", idea.promoted_script_id)
        .maybeSingle();
      if (existing) {
        // Borramos el guion previo para evitar duplicados huérfanos.
        await supabase
          .from("founder_scripts")
          .delete()
          .eq("id", existing.id);
      }
    }

    const result = await generateFounderScript({
      theme: idea.theme,
      archetype: isValidArchetype(idea.archetype ?? undefined)
        ? (idea.archetype as FounderArchetype)
        : undefined,
      format: isValidFormat(idea.format ?? undefined)
        ? (idea.format as FounderFormatLiteral)
        : undefined,
      extraContext: idea.rationale ?? undefined,
    });

    const scriptRow = scriptCandidateToRow(result.script, user.id, ideaId);
    const { data: inserted, error: insertErr } = await supabase
      .from("founder_scripts")
      .insert(scriptRow)
      .select("id")
      .single();
    if (insertErr || !inserted) {
      return { ok: false, error: insertErr?.message ?? "Error insertando guion" };
    }

    const { error: updateErr } = await supabase
      .from("founder_ideas")
      .update({ status: "promoted", promoted_script_id: inserted.id })
      .eq("id", ideaId);
    if (updateErr) {
      console.error("[promoteIdeaToScript] update idea", updateErr.message);
    }

    revalidatePath(FOUNDER_ROUTE);
    return { ok: true, scriptId: inserted.id, modelUsed: result.modelUsed };
  } catch (err) {
    console.error("[promoteIdeaToScript]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function generateScriptFromTopic(
  formData: FormData,
): Promise<FounderScriptResult> {
  try {
    const { user, supabase } = await assertAuthorized();

    const theme = (formData.get("theme") ?? "").toString().trim();
    if (!theme) return { ok: false, error: "Falta el tema" };
    if (theme.length > 300) {
      return { ok: false, error: "Tema demasiado largo (máx 300)" };
    }

    const archetypeRaw = formData.get("archetype")?.toString();
    const formatRaw = formData.get("format")?.toString();
    const extraContext = emptyToUndefined(
      formData.get("extraContext")?.toString(),
    );

    const result = await generateFounderScript({
      theme,
      archetype: isValidArchetype(archetypeRaw) ? archetypeRaw : undefined,
      format: isValidFormat(formatRaw) ? formatRaw : undefined,
      extraContext,
    });

    const scriptRow = scriptCandidateToRow(result.script, user.id, null);
    const { data: inserted, error } = await supabase
      .from("founder_scripts")
      .insert(scriptRow)
      .select("id")
      .single();
    if (error || !inserted) {
      return { ok: false, error: error?.message ?? "Error insertando guion" };
    }

    revalidatePath(FOUNDER_ROUTE);
    return { ok: true, scriptId: inserted.id, modelUsed: result.modelUsed };
  } catch (err) {
    console.error("[generateScriptFromTopic]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function updateScriptStatus(
  scriptId: string,
  newStatus: FounderScriptStatus,
): Promise<FounderActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!FOUNDER_SCRIPT_STATUS.includes(newStatus)) {
      return { ok: false, error: `Estado "${newStatus}" no permitido` };
    }
    if (!scriptId) return { ok: false, error: "ID inválido" };

    const patch: Record<string, unknown> = { status: newStatus };
    const now = new Date().toISOString();
    if (newStatus === "recorded") patch.recorded_at = now;
    if (newStatus === "published") patch.published_at = now;

    const { error } = await supabase
      .from("founder_scripts")
      .update(patch)
      .eq("id", scriptId);
    if (error) return { ok: false, error: error.message };

    revalidatePath(FOUNDER_ROUTE);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function setScriptInstagramUrl(
  scriptId: string,
  url: string,
): Promise<FounderActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!scriptId) return { ok: false, error: "ID inválido" };
    const trimmed = url.trim();
    if (trimmed && !/^https?:\/\/(www\.)?instagram\.com\//i.test(trimmed)) {
      return {
        ok: false,
        error: "La URL debe ser de instagram.com (ej: https://www.instagram.com/reel/...)",
      };
    }
    const { error } = await supabase
      .from("founder_scripts")
      .update({ instagram_url: trimmed.length > 0 ? trimmed : null })
      .eq("id", scriptId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(FOUNDER_ROUTE);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function setScriptHookChosen(
  scriptId: string,
  hookChosen: string,
): Promise<FounderActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!scriptId) return { ok: false, error: "ID inválido" };
    const trimmed = hookChosen.trim();
    if (!trimmed) return { ok: false, error: "Hook vacío" };
    if (trimmed.length > 1000) {
      return { ok: false, error: "Hook demasiado largo" };
    }
    const { error } = await supabase
      .from("founder_scripts")
      .update({ hook_chosen: trimmed, script_hook: trimmed })
      .eq("id", scriptId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(FOUNDER_ROUTE);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function setScriptNote(
  scriptId: string,
  note: string,
): Promise<FounderActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!scriptId) return { ok: false, error: "ID inválido" };
    const trimmed = note.trim();
    if (trimmed.length > 5000) {
      return { ok: false, error: "Nota demasiado larga (máx 5000)" };
    }
    const { error } = await supabase
      .from("founder_scripts")
      .update({ notes: trimmed.length > 0 ? trimmed : null })
      .eq("id", scriptId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(FOUNDER_ROUTE);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export type GenerateCopyResult =
  | { ok: true; copy: string; modelUsed: string }
  | { ok: false; error: string };

/**
 * Genera el caption/descripción del Reel para un guion existente. Es un
 * paso aparte del generador de guion (refinamiento F2.3 sesión 2): el
 * usuario pulsa "Generar copy" cuando quiere preparar la publicación.
 * Persiste en `script_copy` con `copy_generated_at`.
 */
export async function generateScriptCopy(
  scriptId: string,
): Promise<GenerateCopyResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!scriptId) return { ok: false, error: "ID inválido" };

    const { data: script, error: fetchErr } = await supabase
      .from("founder_scripts")
      .select(
        "id, theme, archetype, hook_chosen, script_hook, script_context, script_moral, script_cta, suggested_hashtags",
      )
      .eq("id", scriptId)
      .maybeSingle();
    if (fetchErr || !script) {
      return { ok: false, error: fetchErr?.message ?? "Guion no encontrado" };
    }

    const hashtags = Array.isArray(script.suggested_hashtags)
      ? script.suggested_hashtags.flatMap((x) =>
          typeof x === "string" ? [x] : [],
        )
      : [];

    const result = await generateFounderCopy({
      theme: script.theme,
      hook: script.hook_chosen ?? script.script_hook ?? null,
      context: script.script_context ?? null,
      moral: script.script_moral ?? null,
      cta: script.script_cta ?? null,
      archetype: script.archetype ?? null,
      suggested_hashtags: hashtags,
    });

    const { error: updateErr } = await supabase
      .from("founder_scripts")
      .update({
        script_copy: result.copy,
        copy_generated_at: new Date().toISOString(),
      })
      .eq("id", scriptId);
    if (updateErr) {
      return { ok: false, error: updateErr.message };
    }

    revalidatePath(FOUNDER_ROUTE);
    return { ok: true, copy: result.copy, modelUsed: result.modelUsed };
  } catch (err) {
    console.error("[generateScriptCopy]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function setScriptCopy(
  scriptId: string,
  copy: string,
): Promise<FounderActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!scriptId) return { ok: false, error: "ID inválido" };
    const trimmed = copy.trim();
    if (trimmed.length > 5000) {
      return { ok: false, error: "Copy demasiado largo (máx 5000)" };
    }
    const { error } = await supabase
      .from("founder_scripts")
      .update({ script_copy: trimmed.length > 0 ? trimmed : null })
      .eq("id", scriptId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(FOUNDER_ROUTE);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function deleteScript(
  scriptId: string,
): Promise<FounderActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!scriptId) return { ok: false, error: "ID inválido" };

    // Antes de borrar el guion, vemos si vino de una idea para poder
    // revertir la idea a "ganadora" y dejarla disponible para regenerar.
    const { data: scriptRow } = await supabase
      .from("founder_scripts")
      .select("idea_id")
      .eq("id", scriptId)
      .single();

    const { error } = await supabase
      .from("founder_scripts")
      .delete()
      .eq("id", scriptId);
    if (error) return { ok: false, error: error.message };

    if (scriptRow?.idea_id) {
      const { error: ideaErr } = await supabase
        .from("founder_ideas")
        .update({ status: "diamond", promoted_script_id: null })
        .eq("id", scriptRow.idea_id);
      if (ideaErr) {
        // No bloqueamos el delete por esto, solo lo dejamos en log.
        console.error(
          "[deleteScript] no se pudo revertir idea origen:",
          ideaErr.message,
        );
      }
    }

    revalidatePath(FOUNDER_ROUTE);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

// ─────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────

function scriptCandidateToRow(
  script: import("~/lib/gemini/client").FounderScriptCandidate,
  userId: string,
  ideaId: string | null,
) {
  return {
    created_by: userId,
    idea_id: ideaId,
    theme: script.theme,
    archetype: script.archetype,
    format: script.format,
    estimated_duration_s: script.estimated_duration_s,
    keyword: script.keyword,
    hook_options: script.hook_options,
    hook_chosen: script.hook_options[0] ?? null,
    script_hook: script.script.hook ?? script.hook_options[0] ?? null,
    script_context: script.script.context,
    script_moral: script.script.moral,
    script_cta: script.script.cta,
    idea_score: script.idea_score,
    rationale: script.rationale,
    suggested_hashtags: script.suggested_hashtags,
    compliance_passes: script.compliance_passes,
    compliance_flagged: script.compliance_flagged,
    status: "script",
  };
}
