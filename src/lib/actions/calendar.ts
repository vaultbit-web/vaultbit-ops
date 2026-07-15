"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import { createEvent } from "~/lib/google/calendar-client";

export type CalendarActionResult =
  | { ok: true; htmlLink: string }
  | { ok: false; error: string };

interface CreateEventArgs {
  summary: string;
  description?: string;
  startISO: string;
  endISO: string;
  location?: string;
  attendeeEmail?: string;
  /** Path a revalidar tras crear (ej. la página detalle del lead). */
  revalidate?: string;
}

export async function createCalendarEvent(args: CreateEventArgs): Promise<CalendarActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !isEmailAllowed(user.email)) {
      return { ok: false, error: "No autorizado" };
    }

    const summary = args.summary.trim();
    if (summary.length === 0) return { ok: false, error: "El título es obligatorio" };
    if (summary.length > 500) return { ok: false, error: "Título demasiado largo" };

    const start = new Date(args.startISO);
    const end = new Date(args.endISO);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { ok: false, error: "Fechas inválidas" };
    }
    if (end <= start) {
      return { ok: false, error: "La fecha de fin debe ser posterior al inicio" };
    }

    const event = await createEvent(user.id, {
      summary,
      description: args.description?.trim() || undefined,
      location: args.location?.trim() || undefined,
      start: start.toISOString(),
      end: end.toISOString(),
      attendeeEmail: args.attendeeEmail?.trim() || undefined,
    });

    revalidatePath("/dashboard");
    if (args.revalidate) revalidatePath(args.revalidate);

    return { ok: true, htmlLink: event.htmlLink };
  } catch (err) {
    console.error("[createCalendarEvent]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error creando evento",
    };
  }
}
