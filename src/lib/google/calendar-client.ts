import { getValidAccessToken } from "~/lib/oauth/google";

/**
 * Cliente fetch para Google Calendar API v3 sobre el calendario "primary"
 * del usuario conectado. Sin dependencia de `googleapis` (pesa ~5MB).
 */

const BASE = "https://www.googleapis.com/calendar/v3";

export interface CalendarEvent {
  id: string;
  summary: string;
  description: string | null;
  location: string | null;
  start: string; // ISO datetime o YYYY-MM-DD para all-day
  end: string;
  allDay: boolean;
  htmlLink: string;
  status: string;
}

interface RawEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  status?: string;
}

function normalizeEvent(raw: RawEvent): CalendarEvent {
  const allDay = Boolean(raw.start.date && !raw.start.dateTime);
  return {
    id: raw.id,
    summary: raw.summary ?? "(sin título)",
    description: raw.description ?? null,
    location: raw.location ?? null,
    start: raw.start.dateTime ?? raw.start.date ?? "",
    end: raw.end.dateTime ?? raw.end.date ?? "",
    allDay,
    htmlLink: raw.htmlLink ?? "",
    status: raw.status ?? "confirmed",
  };
}

export interface ListEventsOptions {
  timeMin?: string; // ISO
  timeMax?: string; // ISO
  maxResults?: number;
  q?: string;
}

export async function listEvents(
  userId: string,
  opts: ListEventsOptions = {},
): Promise<CalendarEvent[]> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return [];

  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: String(opts.maxResults ?? 25),
  });
  if (opts.timeMin) params.set("timeMin", opts.timeMin);
  if (opts.timeMax) params.set("timeMax", opts.timeMax);
  if (opts.q) params.set("q", opts.q);

  const res = await fetch(`${BASE}/calendars/primary/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 401) {
      console.error("[calendar.listEvents] 401: token inválido o revocado");
      return [];
    }
    const text = await res.text();
    throw new Error(`Calendar listEvents falló: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { items?: RawEvent[] };
  return (data.items ?? []).map(normalizeEvent);
}

export interface CreateEventInput {
  summary: string;
  description?: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  location?: string;
  /** Email del invitado (opcional). */
  attendeeEmail?: string;
}

export async function createEvent(
  userId: string,
  input: CreateEventInput,
): Promise<CalendarEvent> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    throw new Error("Google Calendar no conectado");
  }

  const body: Record<string, unknown> = {
    summary: input.summary,
    description: input.description ?? undefined,
    location: input.location ?? undefined,
    start: { dateTime: input.start, timeZone: "Europe/Madrid" },
    end: { dateTime: input.end, timeZone: "Europe/Madrid" },
  };
  if (input.attendeeEmail) {
    body.attendees = [{ email: input.attendeeEmail }];
  }

  const res = await fetch(`${BASE}/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar createEvent falló: ${res.status} ${text}`);
  }
  const data = (await res.json()) as RawEvent;
  return normalizeEvent(data);
}
