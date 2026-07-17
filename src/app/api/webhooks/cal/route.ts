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
 * Auth (FAIL-CLOSED): se exige `CAL_COM_WEBHOOK_SECRET` y se valida la firma
 * HMAC-SHA256 de Cal.com en el header `X-Cal-Signature-256`. Sin secret no se
 * puede verificar la firma → se rechaza (no se acepta nada sin firmar).
 * Configura el MISMO valor en Cal.com (webhook) y en el entorno de Ops.
 * Esta ruta está en la allowlist del middleware (se autentica ella sola por HMAC).
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "cal-webhook", { max: 240, windowMs: 60_000 });
  if (limited) return limited;

  const rawBody = await request.text();
  const secret = process.env.CAL_COM_WEBHOOK_SECRET;

  // Fail-closed: sin secreto configurado no se puede verificar → se rechaza.
  if (!secret) {
    console.error("[cal/webhook] CAL_COM_WEBHOOK_SECRET no configurado; rechazando (fail-closed)");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  const signatureHeader = request.headers.get("x-cal-signature-256");
  if (!signatureHeader) {
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

  // El webhook usa el cliente anon (no hay sesión). La escritura en cal_bookings
  // está permitida por la policy anon INSERT/UPDATE de la tabla (ver migración).
  // La defensa real de esta ruta es la verificación HMAC de arriba (fail-closed).
  // Follow-up de seguridad: enrutar esta escritura por un RPC SECURITY DEFINER para
  // que la tabla no necesite escritura anon abierta.
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
