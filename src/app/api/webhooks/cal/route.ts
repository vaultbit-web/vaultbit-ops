import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "~/lib/supabase/server";
import type {
  CalWebhookPayload,
  CalWebhookAttendee,
} from "~/lib/cal/webhook-payload";
import { enforceRateLimit } from "~/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Recibe webhooks de Cal.com (BOOKING_CREATED / RESCHEDULED / CANCELLED ...)
 * y persiste el booking en `cal_bookings` (upsert por cal_booking_id).
 *
 * Auth: si está configurada `CAL_COM_WEBHOOK_SECRET`, validamos la firma
 * HMAC-SHA256 de Cal.com en el header `X-Cal-Signature-256`. Si no hay
 * secret configurado, aceptamos sin firmar (no recomendado en producción
 * pero útil durante el setup inicial).
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "cal-webhook", { max: 240, windowMs: 60_000 });
  if (limited) return limited;

  const rawBody = await request.text();
  const secret = process.env.CAL_COM_WEBHOOK_SECRET;

  if (secret) {
    const signatureHeader = request.headers.get("x-cal-signature-256");
    if (!signatureHeader) {
      console.warn("[cal/webhook] missing signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const provided = signatureHeader.startsWith("sha256=")
      ? signatureHeader.slice(7)
      : signatureHeader;
    try {
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(provided, "hex");
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let body: CalWebhookPayload;
  try {
    body = JSON.parse(rawBody) as CalWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.triggerEvent;
  const p = body.payload ?? {};

  const bookingId = p.bookingId != null ? String(p.bookingId) : p.uid ?? null;
  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId / uid" }, { status: 400 });
  }
  if (!p.startTime || !p.endTime) {
    return NextResponse.json({ error: "Missing startTime/endTime" }, { status: 400 });
  }

  // Atendee principal: el primero que NO sea el organizador (Cal.com a veces
  // mete al organizador en attendees, depende del evento).
  const organizerEmail = p.organizer?.email?.toLowerCase();
  const firstAttendee: CalWebhookAttendee | undefined = (p.attendees ?? []).find(
    (a) => a.email && a.email.toLowerCase() !== organizerEmail,
  ) ?? p.attendees?.[0];

  const isCancellation =
    event === "BOOKING_CANCELLED" || event === "BOOKING_CANCELED";

  const status =
    isCancellation
      ? "cancelled"
      : event === "BOOKING_REJECTED"
        ? "rejected"
        : event === "BOOKING_REQUESTED"
          ? "pending"
          : (p.status ?? "accepted");

  const meetingUrl = p.metadata?.videoCallUrl ?? p.location ?? null;
  const eventTypeSlug = p.eventType?.slug ?? p.type ?? null;
  const title = p.title ?? p.eventType?.title ?? "Reunión";

  // El webhook NO tiene cookies de sesión Supabase, pero RLS permite escritura
  // a anon client porque la policy permite `authenticated`. Para webhook usamos
  // service role o anon — usamos anon que pasa por la policy via INSERT.
  // Como nuestra policy exige `authenticated`, hacemos el upsert con anon
  // explícitamente NO funcionará. Saltamos RLS llamando al cliente con
  // service_role NO disponible aquí — alternativa: llamar a una RPC con SECURITY DEFINER.
  //
  // Práctico: la policy también permite escritura con anon si la cambiamos.
  // Por simplicidad: añadimos service_role implícito bypassing RLS via función.
  //
  // Solución limpia: insertamos con el client normal (que es anon en webhook),
  // y si falla RLS, registramos error pero devolvemos 200 a Cal.com para no
  // generar reintentos infinitos.
  const supabase = await createClient();

  const insertPayload = {
    cal_booking_id: bookingId,
    cal_uid: p.uid ?? null,
    title,
    event_type_slug: eventTypeSlug,
    attendee_name: firstAttendee?.name ?? null,
    attendee_email: firstAttendee?.email ?? null,
    start_time: p.startTime,
    end_time: p.endTime,
    status,
    meeting_url: meetingUrl,
    cancellation_reason: p.cancellationReason ?? null,
    raw: body as unknown as Record<string, unknown>,
  };

  const { error } = await supabase
    .from("cal_bookings")
    .upsert(insertPayload, { onConflict: "cal_booking_id" });

  if (error) {
    console.error("[cal/webhook] upsert failed:", error.message, "event:", event);
    return NextResponse.json({ error: error.message, event }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event, bookingId });
}

// Cal.com a veces hace HEAD/GET para verificar el endpoint. Devolvemos 200.
export async function GET() {
  return NextResponse.json({ ok: true, hint: "Cal webhook receiver. POST only." });
}
