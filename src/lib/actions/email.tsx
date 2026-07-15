"use server";

import { revalidatePath } from "next/cache";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import { getQuoteById, getContractById, getTemplateBySlug } from "~/lib/queries/commercial";
import { QuotePdfDocument } from "~/components/pdf/quote-pdf";
import { ContractPdfDocument } from "~/components/pdf/contract-pdf";

export type ActionResult = { ok: true } | { ok: false; error: string };

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

interface SendEmailViaN8nParams {
  to: string;
  subject: string;
  body: string;
  attachmentBase64: string;
  attachmentFilename: string;
  channel: "quote" | "contract";
  relatedId: string;
  emailLogId: string;
}

/**
 * Llama al webhook de n8n encargado de enviar el email vía SMTP Hostinger.
 * El workflow n8n responde 200 + JSON {ok:true, sent_at} cuando ha enviado.
 *
 * Requisitos en Dokploy:
 *   - N8N_OPS_WEBHOOK_URL apunta a la ruta del webhook (ej.
 *     https://n8n.example.com/webhook/vb-send-email).
 *   - El workflow tiene credenciales SMTP "Hostinger SMTP" configuradas.
 */
async function callN8nWebhook(params: SendEmailViaN8nParams): Promise<{
  ok: boolean;
  error?: string;
  n8nExecutionId?: string;
}> {
  const url = process.env.N8N_OPS_WEBHOOK_URL;
  if (!url) {
    return { ok: false, error: "N8N_OPS_WEBHOOK_URL no configurada" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: params.to,
        subject: params.subject,
        body: params.body,
        attachment_base64: params.attachmentBase64,
        attachment_filename: params.attachmentFilename,
        channel: params.channel,
        related_id: params.relatedId,
        email_log_id: params.emailLogId,
      }),
      // n8n puede tardar varios segundos en enviar y responder
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `n8n respondió ${res.status}: ${text.slice(0, 300)}` };
    }

    const data = await res.json().catch(() => null);
    return { ok: true, n8nExecutionId: data?.execution_id ?? data?.executionId ?? undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Fallo en webhook n8n" };
  }
}

// ──────────────────────────────────────────────────────────────────────
// Send Quote
// ──────────────────────────────────────────────────────────────────────

export async function sendQuoteEmail(
  quoteId: string,
  customSubject?: string,
  customBody?: string,
): Promise<ActionResult> {
  try {
    const { user, supabase } = await assertAuthorized();

    const quote = await getQuoteById(quoteId);
    if (!quote) return { ok: false, error: "Presupuesto no encontrado" };
    if (!quote.client_email) {
      return { ok: false, error: "El presupuesto no tiene email de cliente" };
    }

    const subject = customSubject ?? `Tu presupuesto · ${quote.quote_number} · VaultBit Advisory`;
    const body =
      customBody ??
      `Hola ${quote.client_name},

Adjunto tu presupuesto ${quote.quote_number} para los servicios de VaultBit Advisory.

Si tienes cualquier duda, respóndeme directamente a este correo o agendamos una llamada.

Un saludo,
Daniel Brosed
VaultBit Advisory · vaultbit.es`;

    // Generar PDF en memoria
    const buffer = await renderToBuffer(<QuotePdfDocument quote={quote} />);
    const base64 = Buffer.from(buffer).toString("base64");
    const filename = `VaultBit-Presupuesto-${quote.quote_number}.pdf`;

    // Registrar email_log queued
    const { data: logRow, error: logErr } = await supabase
      .from("email_log")
      .insert({
        channel: "quote",
        related_id: quote.id,
        to_email: quote.client_email,
        subject,
        body,
        attachment_url: filename,
        status: "queued",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (logErr || !logRow) {
      return { ok: false, error: logErr?.message ?? "No se pudo registrar el envío" };
    }

    // Llamar a n8n
    const n8nRes = await callN8nWebhook({
      to: quote.client_email,
      subject,
      body,
      attachmentBase64: base64,
      attachmentFilename: filename,
      channel: "quote",
      relatedId: quote.id,
      emailLogId: logRow.id,
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

    // Marcar email_log como sent + quote como enviado
    await supabase
      .from("email_log")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        n8n_execution_id: n8nRes.n8nExecutionId ?? null,
      })
      .eq("id", logRow.id);

    if (quote.status === "borrador") {
      await supabase
        .from("quotes")
        .update({ status: "enviado", sent_at: new Date().toISOString() })
        .eq("id", quote.id);
    }

    revalidatePath(`/comercial/calculadora/${quote.id}`);
    revalidatePath("/comercial/calculadora");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

// ──────────────────────────────────────────────────────────────────────
// Send Contract
// ──────────────────────────────────────────────────────────────────────

export async function sendContractEmail(
  contractId: string,
  customSubject?: string,
  customBody?: string,
): Promise<ActionResult> {
  try {
    const { user, supabase } = await assertAuthorized();

    const contract = await getContractById(contractId);
    if (!contract) return { ok: false, error: "Contrato no encontrado" };
    if (!contract.client_email) {
      return { ok: false, error: "El contrato no tiene email de cliente" };
    }
    const tpl = await getTemplateBySlug(contract.template_slug);
    const templateName = tpl?.name ?? contract.template_slug;

    const subject = customSubject ?? `${templateName} · ${contract.contract_number} · VaultBit`;
    const body =
      customBody ??
      `Hola ${contract.client_name},

Te adjunto el documento "${templateName}" (${contract.contract_number}) para tu revisión.

Si necesitas cualquier modificación o aclaración, respóndeme directamente.

Un saludo,
Daniel Brosed
VaultBit Advisory · vaultbit.es`;

    const buffer = await renderToBuffer(
      <ContractPdfDocument contract={contract} templateName={templateName} />,
    );
    const base64 = Buffer.from(buffer).toString("base64");
    const filename = `VaultBit-${contract.contract_number}.pdf`;

    const { data: logRow, error: logErr } = await supabase
      .from("email_log")
      .insert({
        channel: "contract",
        related_id: contract.id,
        to_email: contract.client_email,
        subject,
        body,
        attachment_url: filename,
        status: "queued",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (logErr || !logRow) {
      return { ok: false, error: logErr?.message ?? "No se pudo registrar el envío" };
    }

    const n8nRes = await callN8nWebhook({
      to: contract.client_email,
      subject,
      body,
      attachmentBase64: base64,
      attachmentFilename: filename,
      channel: "contract",
      relatedId: contract.id,
      emailLogId: logRow.id,
    });

    if (!n8nRes.ok) {
      await supabase
        .from("email_log")
        .update({ status: "failed", error_message: n8nRes.error?.slice(0, 1000) ?? "unknown" })
        .eq("id", logRow.id);
      return { ok: false, error: n8nRes.error ?? "Fallo al enviar" };
    }

    await supabase
      .from("email_log")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        n8n_execution_id: n8nRes.n8nExecutionId ?? null,
      })
      .eq("id", logRow.id);

    if (contract.status === "borrador") {
      await supabase
        .from("contracts")
        .update({ status: "enviado", sent_at: new Date().toISOString() })
        .eq("id", contract.id);
    }

    revalidatePath(`/comercial/legal/contratos/${contract.id}`);
    revalidatePath("/comercial/legal/contratos");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
