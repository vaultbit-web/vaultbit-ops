import { createClient } from "~/lib/supabase/server";
import { listEvents, type CalendarEvent } from "~/lib/google/calendar-client";
import { getConnectionStatus } from "~/lib/oauth/google";

export interface CalendarWidgetData {
  connected: boolean;
  email: string | null;
  events: CalendarEvent[];
  /** Si hubo error al listar (típico cuando OAUTH_ENCRYPTION_KEY cambió o token revocado). */
  error: string | null;
}

/**
 * Datos del widget de calendario en el dashboard.
 * Devuelve los eventos desde ahora hasta dentro de 7 días.
 */
export async function getCalendarWidgetData(): Promise<CalendarWidgetData> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { connected: false, email: null, events: [], error: null };

    const status = await getConnectionStatus(user.id);
    if (!status.connected) {
      return { connected: false, email: null, events: [], error: null };
    }

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const events = await listEvents(user.id, {
      timeMin: now.toISOString(),
      timeMax: in7Days.toISOString(),
      maxResults: 15,
    });

    return {
      connected: true,
      email: status.email,
      events,
      error: null,
    };
  } catch (err) {
    console.error("[getCalendarWidgetData]", err);
    return {
      connected: true,
      email: null,
      events: [],
      error: err instanceof Error ? err.message : "Error",
    };
  }
}
