"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import {
  CAPTACION_TASK_BUCKETS,
  CAPTACION_TASK_PRIORITIES,
  CAPTACION_TASK_STATUSES,
  PIPELINE_STAGES,
  PROFESSIONAL_TYPES,
  EVENT_TRACKING_STATUSES,
  type CaptacionTaskBucket,
  type CaptacionTaskPriority,
  type CaptacionTaskStatus,
  type PipelineStage,
  type ProfessionalType,
} from "~/lib/captacion/types";
import { canTransitionPipeline } from "~/lib/captacion/partner-promotion";
import {
  getPartnerById,
  getPartnerSources,
} from "~/lib/queries/captacion";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type ActionResultWithId =
  | { ok: true; id: string }
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

const BASE_REVALIDATE = [
  "/captacion-90d",
  "/captacion-90d/backlog",
  "/captacion-90d/partners-ibiza",
  "/captacion-90d/eventos-trackear",
  "/crm/posibles-partners",
];

function revalidateAll() {
  BASE_REVALIDATE.forEach((r) => revalidatePath(r));
}

// ─────────────────────────────────────────────────────────
// Tasks
// ─────────────────────────────────────────────────────────

export async function updateTaskStatus(
  taskId: string,
  status: CaptacionTaskStatus,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!CAPTACION_TASK_STATUSES.includes(status)) {
      return { ok: false, error: "Estado de tarea inválido" };
    }
    if (!taskId) return { ok: false, error: "ID inválido" };

    const { error } = await supabase
      .from("captacion_tasks")
      .update({ status })
      .eq("id", taskId);
    if (error) return { ok: false, error: error.message };

    revalidateAll();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority: CaptacionTaskPriority;
  bucket: CaptacionTaskBucket;
  week?: number | null;
  due_date?: string | null;
  partner_id?: string | null;
  event_id?: string | null;
  owner?: string;
}

export async function createTask(
  input: CreateTaskInput,
): Promise<ActionResultWithId> {
  try {
    const { user, supabase } = await assertAuthorized();

    const title = input.title.trim();
    if (title.length === 0)
      return { ok: false, error: "El título no puede estar vacío" };
    if (title.length > 280)
      return { ok: false, error: "Título demasiado largo (máx 280)" };

    if (!CAPTACION_TASK_PRIORITIES.includes(input.priority))
      return { ok: false, error: "Prioridad inválida" };
    if (!CAPTACION_TASK_BUCKETS.includes(input.bucket))
      return { ok: false, error: "Bucket inválido" };
    if (
      input.week != null &&
      (!Number.isInteger(input.week) || input.week < 1 || input.week > 13)
    ) {
      return { ok: false, error: "Semana fuera de rango (1-13)" };
    }

    const { data, error } = await supabase
      .from("captacion_tasks")
      .insert({
        title,
        description: input.description?.trim() || null,
        priority: input.priority,
        bucket: input.bucket,
        week: input.week ?? null,
        due_date: input.due_date ?? null,
        partner_id: input.partner_id ?? null,
        event_id: input.event_id ?? null,
        owner: input.owner?.trim() || "Daniel Brosed",
        created_by: user.id,
        source_doc: "Creación manual desde /captacion-90d",
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidateAll();
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    const { error } = await supabase
      .from("captacion_tasks")
      .delete()
      .eq("id", taskId);
    if (error) return { ok: false, error: error.message };
    revalidateAll();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

// ─────────────────────────────────────────────────────────
// Partners · promoción
// ─────────────────────────────────────────────────────────

export async function promotePartnerStage(
  partnerId: string,
  to: PipelineStage,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!PIPELINE_STAGES.includes(to))
      return { ok: false, error: "Etapa inválida" };

    const partner = await getPartnerById(partnerId);
    if (!partner) return { ok: false, error: "Partner no encontrado" };

    const sources = await getPartnerSources(partnerId);
    const check = canTransitionPipeline(partner, sources, to);
    if (!check.ok) {
      return { ok: false, error: check.reason ?? "Transición no permitida" };
    }

    const { error } = await supabase
      .from("partners")
      .update({ pipeline_stage: to })
      .eq("id", partnerId);
    if (error) return { ok: false, error: error.message };

    revalidateAll();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function addPartnerSource(
  partnerId: string,
  sourceUrl: string,
  sourceType: string,
  sourceTitle?: string,
): Promise<ActionResult> {
  try {
    const { user, supabase } = await assertAuthorized();
    const url = sourceUrl.trim();
    if (!/^https?:\/\//.test(url)) {
      return { ok: false, error: "URL inválida (debe empezar por http(s)://)" };
    }
    const { error } = await supabase.from("partner_sources").insert({
      partner_id: partnerId,
      source_url: url,
      source_type: sourceType || "web",
      source_title: sourceTitle?.trim() || null,
      created_by: user.id,
    });
    if (error) return { ok: false, error: error.message };
    revalidateAll();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

// ─────────────────────────────────────────────────────────
// Posibles partners · prospección presencial
// ─────────────────────────────────────────────────────────

export interface CreateProspectPartnerInput {
  full_name: string;
  company?: string | null;
  professional_type?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  company_website?: string | null;
  notes?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normalizeWebsite(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export async function createProspectPartner(
  input: CreateProspectPartnerInput,
): Promise<ActionResultWithId> {
  try {
    const { user, supabase } = await assertAuthorized();

    const fullName = input.full_name.trim();
    if (fullName.length === 0)
      return { ok: false, error: "El nombre no puede estar vacío" };
    if (fullName.length > 200)
      return { ok: false, error: "Nombre demasiado largo (máx 200)" };

    const email = input.email?.trim() || null;
    if (email && !EMAIL_RE.test(email))
      return { ok: false, error: "Email con formato inválido" };

    const professionalType = input.professional_type?.trim() || null;
    if (
      professionalType &&
      !PROFESSIONAL_TYPES.includes(professionalType as ProfessionalType)
    ) {
      return { ok: false, error: "Tipo de profesional inválido" };
    }

    const { data, error } = await supabase
      .from("partners")
      .insert({
        full_name: fullName,
        company: input.company?.trim() || null,
        professional_type: professionalType,
        city: input.city?.trim() || null,
        country: "España",
        email,
        phone: input.phone?.trim() || null,
        company_website: normalizeWebsite(input.company_website),
        notes: input.notes?.trim() || null,
        origin: "Prospección manual",
        pipeline_stage: "identificado",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidateAll();
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function updatePartnerNotes(
  partnerId: string,
  notes: string | null,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!partnerId) return { ok: false, error: "ID inválido" };

    const value = notes?.trim() ? notes.trim() : null;
    if (value && value.length > 8000)
      return { ok: false, error: "Notas demasiado largas (máx 8000)" };

    const { error } = await supabase
      .from("partners")
      .update({ notes: value })
      .eq("id", partnerId);
    if (error) return { ok: false, error: error.message };

    revalidateAll();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function updatePartnerOutreach(
  partnerId: string,
  subject: string | null,
  email: string | null,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!partnerId) return { ok: false, error: "ID inválido" };

    const subjectValue = subject?.trim() ? subject.trim() : null;
    const emailValue = email?.trim() ? email.trim() : null;
    if (subjectValue && subjectValue.length > 500)
      return { ok: false, error: "Asunto demasiado largo (máx 500)" };
    if (emailValue && emailValue.length > 12000)
      return { ok: false, error: "Correo demasiado largo (máx 12000)" };

    const { error } = await supabase
      .from("partners")
      .update({ outreach_subject: subjectValue, outreach_email: emailValue })
      .eq("id", partnerId);
    if (error) return { ok: false, error: error.message };

    revalidateAll();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function updatePartnerCallScript(
  partnerId: string,
  callScript: string | null,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!partnerId) return { ok: false, error: "ID inválido" };

    const value = callScript?.trim() ? callScript.trim() : null;
    if (value && value.length > 6000)
      return { ok: false, error: "Guion demasiado largo (máx 6000)" };

    const { error } = await supabase
      .from("partners")
      .update({ call_script: value })
      .eq("id", partnerId);
    if (error) return { ok: false, error: error.message };

    revalidateAll();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export interface UpdatePartnerContactInput {
  email?: string | null;
  phone?: string | null;
  professional_type?: string | null;
  city?: string | null;
  company_website?: string | null;
}

export async function updatePartnerContactInfo(
  partnerId: string,
  input: UpdatePartnerContactInput,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!partnerId) return { ok: false, error: "ID inválido" };

    const email = input.email?.trim() || null;
    if (email && !EMAIL_RE.test(email))
      return { ok: false, error: "Email con formato inválido" };

    const professionalType = input.professional_type?.trim() || null;
    if (
      professionalType &&
      !PROFESSIONAL_TYPES.includes(professionalType as ProfessionalType)
    ) {
      return { ok: false, error: "Tipo de profesional inválido" };
    }

    const { error } = await supabase
      .from("partners")
      .update({
        email,
        phone: input.phone?.trim() || null,
        professional_type: professionalType,
        city: input.city?.trim() || null,
        company_website: normalizeWebsite(input.company_website),
      })
      .eq("id", partnerId);
    if (error) return { ok: false, error: error.message };

    revalidateAll();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

// ─────────────────────────────────────────────────────────
// Eventos
// ─────────────────────────────────────────────────────────

export async function convertEventToTask(
  eventId: string,
  title?: string,
): Promise<ActionResultWithId> {
  try {
    const { user, supabase } = await assertAuthorized();

    const { data: event, error: evErr } = await supabase
      .from("events")
      .select("id, name, related_partner_id, tracking_status")
      .eq("id", eventId)
      .maybeSingle();
    if (evErr) return { ok: false, error: evErr.message };
    if (!event) return { ok: false, error: "Evento no encontrado" };

    const safeTitle =
      title?.trim() ||
      `Seguir evento: ${(event as { name: string }).name}`;

    const { data, error } = await supabase
      .from("captacion_tasks")
      .insert({
        title: safeTitle.slice(0, 280),
        priority: "P1",
        bucket: "eventos",
        event_id: eventId,
        partner_id:
          (event as { related_partner_id: string | null }).related_partner_id ??
          null,
        owner: "Daniel Brosed",
        created_by: user.id,
        source_doc: "Convertir evento desde /captacion-90d",
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };

    revalidateAll();
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export async function updateEventTrackingStatus(
  eventId: string,
  status: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!EVENT_TRACKING_STATUSES.includes(status as never)) {
      return { ok: false, error: "Estado inválido" };
    }
    const { error } = await supabase
      .from("events")
      .update({ tracking_status: status })
      .eq("id", eventId);
    if (error) return { ok: false, error: error.message };
    revalidateAll();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

// ─────────────────────────────────────────────────────────
// Progreso del manual
// ─────────────────────────────────────────────────────────

export async function markManualRead(): Promise<ActionResult> {
  try {
    const { user, supabase } = await assertAuthorized();
    const { error } = await supabase
      .from("captacion_progress")
      .upsert(
        {
          user_id: user.id,
          manual_read_at: new Date().toISOString(),
          last_visited_route: "/captacion-90d/manual-operativo",
        },
        { onConflict: "user_id" },
      );
    if (error) return { ok: false, error: error.message };
    revalidatePath("/captacion-90d/manual-operativo");
    revalidatePath("/captacion-90d");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}
