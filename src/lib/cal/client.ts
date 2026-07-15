/**
 * Cliente Cal.com API v2.
 *
 * IMPORTANTE: La API v1 fue desmantelada por Cal.com (todos los endpoints
 * /v1/* devuelven 410 Gone). Tras debug, el endpoint correcto para listar
 * event types es `/v2/atoms/event-types` (los "atoms" son el conjunto de
 * componentes que el propio frontend de Cal.com usa).
 *
 * Auth: header `Authorization: Bearer cal_live_xxx` + header `cal-api-version`.
 */

const BASE = "https://api.cal.com/v2";

function getApiKey(): string | null {
  return process.env.CAL_COM_API_KEY || null;
}

function authHeaders(): Record<string, string> {
  const key = getApiKey();
  if (!key) throw new Error("CAL_COM_API_KEY no configurada");
  return {
    Authorization: `Bearer ${key}`,
    "cal-api-version": "2024-08-13",
  };
}

// ─────────────────────────────────────────────────────────
// /v2/me — info del usuario
// ─────────────────────────────────────────────────────────

export interface CalUserInfo {
  id: number;
  username: string | null;
  email: string;
  name: string | null;
}

interface RawUserCommon {
  id?: number;
  username?: string | null;
  email?: string;
  name?: string | null;
}

export async function getCalMe(): Promise<CalUserInfo | null> {
  try {
    const res = await fetch(`${BASE}/me`, {
      headers: authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(
        "[cal.getCalMe]",
        res.status,
        (await res.text()).slice(0, 200),
      );
      return null;
    }
    const json = (await res.json()) as { data?: RawUserCommon };
    const user = json.data;
    if (!user?.email) return null;
    return {
      id: user.id ?? 0,
      username: user.username ?? null,
      email: user.email,
      name: user.name ?? null,
    };
  } catch (err) {
    console.error("[cal.getCalMe] threw:", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// /v2/atoms/event-types — listar event types
// ─────────────────────────────────────────────────────────

export interface CalEventType {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  lengthInMinutes: number;
  publicUrl: string;
}

interface RawEventTypeAtom {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  length: number;
  hidden?: boolean;
}

interface AtomsEventTypesResponse {
  status?: string;
  data?: {
    eventTypes?: RawEventTypeAtom[];
  };
}

export async function listEventTypes(): Promise<CalEventType[]> {
  const me = await getCalMe();
  const username = me?.username ?? "";

  try {
    const res = await fetch(`${BASE}/atoms/event-types`, {
      headers: authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(
        "[cal.listEventTypes]",
        res.status,
        (await res.text()).slice(0, 300),
      );
      return [];
    }
    const json = (await res.json()) as AtomsEventTypesResponse;
    const raws = json.data?.eventTypes ?? [];

    return raws
      .filter((et) => !et.hidden)
      .map((et) => ({
        id: et.id,
        slug: et.slug,
        title: et.title,
        description: et.description ?? null,
        lengthInMinutes: et.length ?? 30,
        publicUrl: username
          ? `https://cal.com/${username}/${et.slug}`
          : `https://cal.com/${et.slug}`,
      }));
  } catch (err) {
    console.error("[cal.listEventTypes] threw:", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// Estado de conexión
// ─────────────────────────────────────────────────────────

export interface CalConnectionStatus {
  configured: boolean;
  connected: boolean;
  email: string | null;
  username: string | null;
  publicUrl: string | null;
  error: string | null;
}

export async function getCalConnectionStatus(): Promise<CalConnectionStatus> {
  if (!getApiKey()) {
    return {
      configured: false,
      connected: false,
      email: null,
      username: null,
      publicUrl: null,
      error: null,
    };
  }
  try {
    const me = await getCalMe();
    if (!me) {
      return {
        configured: true,
        connected: false,
        email: null,
        username: null,
        publicUrl: null,
        error: "API key no válida o caducada",
      };
    }
    return {
      configured: true,
      connected: true,
      email: me.email,
      username: me.username,
      publicUrl: me.username ? `https://cal.com/${me.username}` : null,
      error: null,
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      email: null,
      username: null,
      publicUrl: null,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

// ─────────────────────────────────────────────────────────
// /v2/bookings — crear booking directamente
// ─────────────────────────────────────────────────────────

export interface CreateBookingInput {
  eventTypeId: number;
  /** Duración del event type, usada para calcular `end` si la API lo requiere. */
  lengthMinutes: number;
  startISO: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeeTimezone?: string;
  language?: string;
  notes?: string;
}

export interface CreatedBooking {
  id: number | string;
  uid: string;
  bookingUrl: string;
  meetingUrl: string | null;
  status: string;
}

interface RawBookingV2 {
  id?: number | string;
  uid?: string;
  status?: string;
  meetingUrl?: string;
  location?: string;
  metadata?: { videoCallUrl?: string };
}

interface BookingResponseV2 {
  status?: string;
  data?: RawBookingV2;
}

export async function createBooking(input: CreateBookingInput): Promise<CreatedBooking> {
  const startDate = new Date(input.startISO);

  // Cal.com API v2 (versión 2024-08-13) acepta:
  //   { start, eventTypeId, attendee: { name, email, timeZone, language }, ... }
  // y calcula `end` automáticamente con la duración del event type.
  const body = {
    start: startDate.toISOString(),
    eventTypeId: input.eventTypeId,
    attendee: {
      name: input.attendeeName,
      email: input.attendeeEmail,
      timeZone: input.attendeeTimezone ?? "Europe/Madrid",
      language: input.language ?? "es",
    },
    ...(input.notes
      ? { bookingFieldsResponses: { notes: input.notes } }
      : {}),
    metadata: {},
  };

  const res = await fetch(`${BASE}/bookings`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Cal.com booking falló (${res.status}): ${text.slice(0, 300)}`,
    );
  }

  const json = (await res.json()) as BookingResponseV2;
  const booking = json.data;
  if (!booking?.uid && !booking?.id) {
    throw new Error("Cal.com respondió sin uid del booking");
  }

  const uid = booking.uid ?? String(booking.id);
  const meetingUrl =
    booking.metadata?.videoCallUrl ?? booking.meetingUrl ?? booking.location ?? null;

  return {
    id: booking.id ?? uid,
    uid,
    bookingUrl: `https://cal.com/booking/${uid}`,
    meetingUrl:
      meetingUrl && typeof meetingUrl === "string" && meetingUrl.startsWith("http")
        ? meetingUrl
        : null,
    status: booking.status ?? "ACCEPTED",
  };
}
