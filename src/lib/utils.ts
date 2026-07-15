import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number | null | undefined, options?: Intl.NumberFormatOptions) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("es-ES", options).format(n);
}

export function formatEuro(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDateShort(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// ─────────────────────────────────────────────────────────
// Helpers de zona horaria Madrid
//
// Importante: el servidor de Dokploy/Hostinger corre en UTC, así que
// `d.getHours()` y compañía devuelven hora UTC en server components y
// muestran reuniones con 1-2 horas de desfase respecto al calendario
// real del usuario. Estas funciones formatean siempre en Europe/Madrid.
// ─────────────────────────────────────────────────────────

const MADRID_TZ = "Europe/Madrid";

const madridDayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: MADRID_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const madridTimeFmt = new Intl.DateTimeFormat("es-ES", {
  timeZone: MADRID_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const madridDayLongFmt = new Intl.DateTimeFormat("es-ES", {
  timeZone: MADRID_TZ,
  weekday: "long",
  day: "numeric",
  month: "short",
});

/** Devuelve la clave de día (YYYY-MM-DD) en zona Madrid. */
export function madridDayKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return madridDayKeyFmt.format(d);
}

/** Hora HH:MM en zona Madrid. */
export function madridTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return madridTimeFmt.format(d);
}

/**
 * Etiqueta de día relativa al hoy de Madrid: "Hoy", "Mañana" o
 * "Martes 5 may" capitalizado.
 */
export function madridDayLabel(value: string | Date): string {
  const eventKey = madridDayKey(value);
  const todayKey = madridDayKey(new Date());
  const tomorrowKey = madridDayKey(new Date(Date.now() + 24 * 60 * 60 * 1000));

  if (eventKey === todayKey) return "Hoy";
  if (eventKey === tomorrowKey) return "Mañana";

  const d = typeof value === "string" ? new Date(value) : value;
  const formatted = madridDayLongFmt.format(d).replace(",", "");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function relativeTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (Math.abs(diffMin) < 1) return "ahora";
  if (Math.abs(diffMin) < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return `hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (Math.abs(diffD) < 30) return `hace ${diffD} d`;
  return formatDateShort(d);
}
