"use server";

import { revalidatePath } from "next/cache";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import { getEntityById } from "~/lib/queries/detail";
import type { FunnelLead } from "~/lib/supabase/types";
import { parseAnswers } from "~/lib/diagnosis/types";
import type { DiagnosisModel } from "~/lib/diagnosis/types";
import { composeDiagnosis } from "~/lib/diagnosis/composer";
import { composeDiagnosisEmail } from "~/lib/diagnosis/email-template";
import { DiagnosisPdfDocument } from "~/components/pdf/diagnosis-pdf";

type LoadResult =
  | { error: string }
  | { lead: FunnelLead; model: DiagnosisModel };

export type DiagnosisActionResult =
  | { ok: true; alreadySent?: boolean }
  | { ok: false; error: string; code?: "DRAFTS" | "ALREADY_SENT" | "INVALID_ANSWERS" };

export interface DiagnosisDefaults {
  ok: true;
  to: string;
  subject: string;
  body: string;
  hasDrafts: boolean;
  alreadySentAt: string | null;
}

export type DiagnosisDefaultsResult =
  | DiagnosisDefaults
  | { ok: false; error: string };

const FROM_FOUNDER = "danielbrosed@vaultbit.es";
const FROM_FOUNDER_NAME = "Daniel Brosed · VaultBit Advisory";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

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

async function loadLeadAndModel(leadId: string): Promise<LoadResult> {
  const lead = await getEntityById<FunnelLead>("funnel_lead", leadId);
  if (!lead) return { error: "Lead no encontrado" };
  if (!lead.email) return { error: "El lead no tiene email" };

  const answers = parseAnswers({
    q1: lead.q1,
    q2: lead.q2,
    q3: lead.q3,
    q4: lead.q4,
    q5: lead.q5,
  });
  if (!answers) {
    return {
      error:
        "Las respuestas Q1-Q5 del lead no están completas o tienen valores no esperados. Imposible componer el diagnóstico.",
    };
  }

  const model = composeDiagnosis({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    answers,
  });

  return { lead, model };
}

interface N8nPayload {
  to: string;
  subject: string;
  body: string;
  attachment_base64: string;
  attachment_filename: string;
  channel: string;
  related_id: string;
  email_log_id: string;
  /** El workflow n8n debe leer este campo para fijar From en SMTP.
   *  Si el workflow no lo respeta aún, el remitente fallback será info@vaultbit.es. */
  from: string;
  from_name: string;
}

async function callN8nWebhook(
  payload: N8nPayload,
): Promise<{ ok: boolean; error?: string; n8nExecutionId?: string }> {
  const url = process.env.N8N_OPS_WEBHOOK_URL;
  if (!url) {
    return { ok: false, error: "N8N_OPS_WEBHOOK_URL no configurada" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `n8n respondió ${res.status}: ${text.slice(0, 300)}` };
    }

    const data = (await res.json().catch(() => null)) as
      | { execution_id?: string; executionId?: string }
      | null;
    return {
      ok: true,
      n8nExecutionId: data?.execution_id ?? data?.executionId ?? undefined,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Fallo en webhook n8n" };
  }
}

// ─────────────────────────────────────────────────────────
// Public · obtener defaults para el modal del botón
// ─────────────────────────────────────────────────────────

export async function getDiagnosisDefaults(
  leadId: string,
): Promise<DiagnosisDefaultsResult> {
  try {
    await assertAuthorized();
    const result = await loadLeadAndModel(leadId);
    if ("error" in result) return { ok: false, error: result.error };

    const { lead, model } = result;
    const { subject, body } = composeDiagnosisEmail(model);

    // Buscar si ya fue enviado (channel='diagnosis')
    const supabase = await createClient();
    const { data: prior } = await supabase
      .from("email_log")
      .select("sent_at, status")
      .eq("channel", "diagnosis")
      .eq("related_id", leadId)
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      ok: true,
      to: lead.email,
      subject,
      body,
      hasDrafts: model.hasDrafts,
      alreadySentAt: prior?.sent_at ?? null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

// ─────────────────────────────────────────────────────────
// Public · enviar diagnóstico
// ─────────────────────────────────────────────────────────

export async function sendDiagnosisEmail(
  leadId: string,
  customSubject?: string,
  customBody?: string,
  options?: { force?: boolean },
): Promise<DiagnosisActionResult> {
  try {
    const { user, supabase } = await assertAuthorized();

    const result = await loadLeadAndModel(leadId);
    if ("error" in result) return { ok: false, error: result.error };
    const { lead, model } = result;

    // Bloqueo de seguridad: si hay fragmentos DRAFT en la combinación de
    // este lead, NO se permite enviar (ni siquiera con force) hasta que el
    // fundador los redacte. Evita mandar placeholders a un cliente real.
    if (model.hasDrafts) {
      return {
        ok: false,
        code: "DRAFTS",
        error:
          "Algunos fragmentos para esta combinación Q1-Q5 aún están como BORRADOR. Redáctalos antes de enviar. (Revisa los archivos en src/lib/diagnosis/fragments/ y marca draft:false cuando estén listos).",
      };
    }

    // Dedupe: si ya hay un envío sent y no es force, bloquea
    if (!options?.force) {
      const { data: prior } = await supabase
        .from("email_log")
        .select("id, sent_at")
        .eq("channel", "diagnosis")
        .eq("related_id", leadId)
        .eq("status", "sent")
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (prior?.sent_at) {
        return {
          ok: false,
          code: "ALREADY_SENT",
          error: `Este diagnóstico ya se envió el ${new Date(prior.sent_at).toLocaleString("es-ES")}. Marca "Reenviar igualmente" si quieres mandarlo otra vez.`,
        };
      }
    }

    // Componer subject + body (custom override)
    const composed = composeDiagnosisEmail(model);
    const subject = customSubject?.trim() || composed.subject;
    const body = customBody?.trim() || composed.body;

    // Renderizar PDF en memoria
    const buffer = await renderToBuffer(<DiagnosisPdfDocument model={model} />);
    const base64 = Buffer.from(buffer).toString("base64");
    const safeName = lead.name.replace(/[^\w\d-]+/g, "-").slice(0, 40) || "lead";
    const filename = `VaultBit-Diagnostico-${safeName}.pdf`;

    // Insert email_log queued
    const { data: logRow, error: logErr } = await supabase
      .from("email_log")
      .insert({
        channel: "diagnosis",
        related_id: lead.id,
        to_email: lead.email,
        subject,
        body,
        attachment_url: filename,
        status: "queued",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (logErr || !logRow) {
      // Detectar error de CHECK constraint si la migración no se ha corrido
      const msg = logErr?.message ?? "No se pudo registrar el envío";
      if (/check constraint|email_log_channel_check/i.test(msg)) {
        return {
          ok: false,
          error:
            'Falta correr la migración SQL para añadir el canal "diagnosis" al CHECK de email_log. Ejecuta el SQL que dejé en docs/db/diagnosis-channel.sql en Supabase y reintenta.',
        };
      }
      return { ok: false, error: msg };
    }

    // Disparar n8n
    const n8nRes = await callN8nWebhook({
      to: lead.email,
      subject,
      body,
      attachment_base64: base64,
      attachment_filename: filename,
      channel: "diagnosis",
      related_id: lead.id,
      email_log_id: logRow.id,
      from: FROM_FOUNDER,
      from_name: FROM_FOUNDER_NAME,
    });

    if (!n8nRes.ok) {
      await supabase
        .from("email_log")
        .update({
          status: "failed",
          error_message: n8nRes.error?.slice(0, 1000) ?? "unknown",
        })
        .eq("id", logRow.id);
      return { ok: false, error: n8nRes.error ?? "Fallo al enviar" };
    }

    // Marcar sent + actualizar funnel_lead
    await supabase
      .from("email_log")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        n8n_execution_id: n8nRes.n8nExecutionId ?? null,
      })
      .eq("id", logRow.id);

    if (lead.status === "nuevo") {
      await supabase
        .from("funnel_leads")
        .update({
          status: "contactado",
          contacted_at: new Date().toISOString(),
        })
        .eq("id", lead.id);
    } else if (!lead.contacted_at) {
      await supabase
        .from("funnel_leads")
        .update({ contacted_at: new Date().toISOString() })
        .eq("id", lead.id);
    }

    revalidatePath(`/crm/ventas/${lead.id}`);
    revalidatePath("/crm/ventas");

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}
