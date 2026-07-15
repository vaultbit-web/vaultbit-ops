/**
 * Tipos del payload de webhooks Cal.com.
 * Sólo modelamos los campos que usamos.
 */

export type CalWebhookEvent =
  | "BOOKING_CREATED"
  | "BOOKING_RESCHEDULED"
  | "BOOKING_CANCELLED"
  | "BOOKING_CANCELED" // typo histórico de algunas versiones
  | "MEETING_ENDED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_REQUESTED"
  | "BOOKING_REJECTED";

export interface CalWebhookAttendee {
  email?: string;
  name?: string;
  timeZone?: string;
}

export interface CalWebhookPayload {
  triggerEvent: CalWebhookEvent;
  createdAt?: string;
  payload?: {
    bookingId?: number | string;
    uid?: string;
    type?: string; // event type slug
    eventType?: { slug?: string; title?: string };
    title?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
    cancellationReason?: string | null;
    attendees?: CalWebhookAttendee[];
    organizer?: CalWebhookAttendee;
    location?: string;
    metadata?: Record<string, unknown> & { videoCallUrl?: string };
    additionalNotes?: string;
  };
}
