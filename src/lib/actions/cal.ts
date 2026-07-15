"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import { createBooking } from "~/lib/cal/client";

export type CalBookingResult =
  | { ok: true; bookingUrl: string; meetingUrl: string | null }
  | { ok: false; error: string };

interface CreateCalBookingArgs {
  eventTypeId: number;
  lengthMinutes: number;
  startISO: string;
  attendeeName: string;
  attendeeEmail: string;
  notes?: string;
  /** Path a revalidar tras crear el booking (página detalle del lead). */
  revalidate?: string;
}

export async function createCalBookingAction(
  args: CreateCalBookingArgs,
): Promise<CalBookingResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !isEmailAllowed(user.email)) {
      return { ok: false, error: "No autorizado" };
    }

    const name = args.attendeeName.trim();
    const email = args.attendeeEmail.trim();
    if (!name) return { ok: false, error: "Falta el nombre del cliente" };
    if (!email) return { ok: false, error: "Falta el email del cliente" };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return { ok: false, error: "Email inválido" };
    }

    const start = new Date(args.startISO);
    if (Number.isNaN(start.getTime())) {
      return { ok: false, error: "Fecha de inicio inválida" };
    }
    if (start.getTime() < Date.now() - 5 * 60 * 1000) {
      return { ok: false, error: "La fecha debe ser futura" };
    }

    const booking = await createBooking({
      eventTypeId: args.eventTypeId,
      lengthMinutes: args.lengthMinutes,
      startISO: start.toISOString(),
      attendeeName: name,
      attendeeEmail: email,
      notes: args.notes?.trim() || undefined,
    });

    revalidatePath("/dashboard");
    if (args.revalidate) revalidatePath(args.revalidate);

    return {
      ok: true,
      bookingUrl: booking.bookingUrl,
      meetingUrl: booking.meetingUrl,
    };
  } catch (err) {
    console.error("[createCalBookingAction]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error creando booking",
    };
  }
}
