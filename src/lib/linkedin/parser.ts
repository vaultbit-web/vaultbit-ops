/**
 * Parser del export de LinkedIn (ZIP o CSV suelto).
 *
 * Solo procesamos dos archivos del ZIP:
 *   • Connections.csv → lista de contactos
 *   • messages.csv    → historial de mensajes (opcional, para detectar
 *                       quién es contacto frío vs antiguo conocido)
 *
 * PRIVACIDAD: messages.csv contiene contenido de conversaciones privadas.
 * Lo parseamos para derivar `last_message_at`, `messages_count` y
 * `has_message_history` por contacto, pero NUNCA persistimos el CONTENT
 * ni el SUBJECT. Solo timestamps y contadores.
 *
 * Funciones puras — no toca Supabase ni filesystem.
 */

import Papa from "papaparse";
import JSZip from "jszip";

export interface LinkedInConnection {
  first_name: string | null;
  last_name: string | null;
  linkedin_url: string;
  email_address: string | null;
  company: string | null;
  position: string | null;
  connected_on: Date | null;
}

export interface LinkedInMessageMeta {
  /** Sender profile URL (puede ser el propio usuario o un contacto). */
  sender_url: string | null;
  /** Recipient profile URL(s) — coma-separadas según LinkedIn. */
  recipient_urls: string | null;
  /** Date en formato ISO de LinkedIn ("2026-05-19 08:43:36 UTC"). */
  date_raw: string | null;
}

export interface EnrichedLinkedInConnection extends LinkedInConnection {
  has_message_history: boolean;
  last_message_at: Date | null;
  messages_count: number;
}

const CONNECTIONS_FILENAME = "Connections.csv";
const MESSAGES_FILENAME = "messages.csv";

/**
 * Parsea un buffer que puede ser:
 *  • ZIP completo de LinkedIn (detectado por magic number PK\x03\x04)
 *  • Connections.csv suelto (detectado por cabecera CSV o preámbulo "Notes:")
 *
 * Si es ZIP, extrae ambos archivos. Si es CSV, asume Connections.
 */
export async function parseLinkedInUpload(
  buf: ArrayBuffer,
): Promise<{ connections: LinkedInConnection[]; messages: LinkedInMessageMeta[] }> {
  const bytes = new Uint8Array(buf);
  // Magic number ZIP: PK\x03\x04
  const isZip =
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04;

  if (isZip) {
    return parseZip(buf);
  }
  // CSV suelto: decodificamos UTF-8 y asumimos Connections
  const text = new TextDecoder("utf-8").decode(buf);
  return {
    connections: parseConnectionsCsv(text),
    messages: [],
  };
}

async function parseZip(
  buf: ArrayBuffer,
): Promise<{ connections: LinkedInConnection[]; messages: LinkedInMessageMeta[] }> {
  const zip = await JSZip.loadAsync(buf);

  const connectionsEntry = findEntry(zip, CONNECTIONS_FILENAME);
  const messagesEntry = findEntry(zip, MESSAGES_FILENAME);

  const connections = connectionsEntry
    ? parseConnectionsCsv(await connectionsEntry.async("string"))
    : [];
  const messages = messagesEntry
    ? parseMessagesCsv(await messagesEntry.async("string"))
    : [];

  return { connections, messages };
}

function findEntry(zip: JSZip, name: string): JSZip.JSZipObject | null {
  // LinkedIn a veces mete archivos en subcarpetas — buscar por nombre exacto al final.
  const lowerTarget = name.toLowerCase();
  for (const entryName of Object.keys(zip.files)) {
    const segments = entryName.split("/");
    const last = segments[segments.length - 1];
    if (last.toLowerCase() === lowerTarget) {
      return zip.files[entryName];
    }
  }
  return null;
}

/**
 * Connections.csv viene con un preámbulo de 3 líneas antes del header:
 *
 *   Notes:
 *   "When exporting your connection data..."
 *   (línea en blanco)
 *   First Name,Last Name,URL,Email Address,Company,Position,Connected On
 *   ...
 *
 * Detectamos la línea que empieza por "First Name," y parseamos a partir de ahí.
 */
export function parseConnectionsCsv(text: string): LinkedInConnection[] {
  const headerIdx = findHeaderIndex(text, "First Name");
  const body = headerIdx > 0 ? text.slice(headerIdx) : text;

  const result = Papa.parse<Record<string, string>>(body, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  return result.data
    .map((row) => normalizeConnection(row))
    .filter((c): c is LinkedInConnection => c !== null);
}

function findHeaderIndex(text: string, headerStart: string): number {
  const lines = text.split(/\r?\n/);
  let charsBefore = 0;
  for (const line of lines) {
    if (line.trimStart().startsWith(headerStart)) {
      return charsBefore;
    }
    charsBefore += line.length + 1; // +1 por el \n
  }
  return 0;
}

function normalizeConnection(row: Record<string, string>): LinkedInConnection | null {
  const url = clean(row["URL"]);
  if (!url || !url.includes("linkedin.com/in/")) return null;

  return {
    first_name: clean(row["First Name"]),
    last_name: clean(row["Last Name"]),
    linkedin_url: normalizeLinkedinUrl(url),
    email_address: clean(row["Email Address"]),
    company: clean(row["Company"]),
    position: clean(row["Position"]),
    connected_on: parseLinkedinDate(row["Connected On"]),
  };
}

function clean(v: string | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

/**
 * Normaliza URLs LinkedIn a forma canónica para deduplicación:
 *   https://www.linkedin.com/in/<slug>
 * (sin trailing slash, sin query params, sin protocolo http alternativo).
 */
export function normalizeLinkedinUrl(url: string): string {
  let u = url.trim().toLowerCase();
  // Tira protocolo
  u = u.replace(/^https?:\/\//, "");
  // Tira www.
  u = u.replace(/^www\./, "");
  // Tira query y fragmento
  u = u.split("?")[0].split("#")[0];
  // Tira trailing slash
  u = u.replace(/\/$/, "");
  return `https://www.${u}`;
}

/**
 * Connected On viene como "19 May 2026", "03 Jan 2024", etc.
 * Devolvemos un Date o null si no parsea.
 */
function parseLinkedinDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Intento directo (Date entiende "19 May 2026" en algunas locales pero no es fiable)
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const m = /^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/.exec(trimmed);
  if (m) {
    const day = parseInt(m[1], 10);
    const monthKey = m[2].slice(0, 3).toLowerCase();
    const month = months[monthKey];
    const year = parseInt(m[3], 10);
    if (month !== undefined) {
      return new Date(Date.UTC(year, month, day));
    }
  }
  // Fallback: dejar a Date que lo intente
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * messages.csv: lo parseamos pero SOLO mantenemos metadata (timestamps + URLs).
 * Descartamos el CONTENT y SUBJECT en RAM — nunca cruzan a Supabase.
 */
export function parseMessagesCsv(text: string): LinkedInMessageMeta[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  return result.data.map((row) => ({
    sender_url: clean(row["SENDER PROFILE URL"]),
    recipient_urls: clean(row["RECIPIENT PROFILE URLS"]),
    date_raw: clean(row["DATE"]),
  }));
}

/**
 * Cruza connections con messages. Para cada conexión calcula:
 *   • has_message_history (al menos 1 mensaje con esa URL como sender O recipient)
 *   • last_message_at      (timestamp del más reciente)
 *   • messages_count       (total)
 *
 * `ownProfileUrl` lo determinamos automáticamente: es la URL que aparece
 * con más frecuencia tanto como sender como recipient (es decir, Daniel).
 */
export function enrichConnectionsWithMessages(
  connections: LinkedInConnection[],
  messages: LinkedInMessageMeta[],
): EnrichedLinkedInConnection[] {
  if (messages.length === 0) {
    return connections.map((c) => ({
      ...c,
      has_message_history: false,
      last_message_at: null,
      messages_count: 0,
    }));
  }

  const ownUrl = inferOwnProfileUrl(messages);

  // Index por URL normalizada para lookup O(1)
  const counts = new Map<string, { count: number; lastAt: Date | null }>();
  for (const m of messages) {
    const senderNorm = m.sender_url ? normalizeLinkedinUrl(m.sender_url) : null;
    const recipientsRaw = m.recipient_urls ? m.recipient_urls.split(",") : [];
    const recipientNorms = recipientsRaw
      .map((r) => r.trim())
      .filter((r) => r.length > 0)
      .map((r) => normalizeLinkedinUrl(r));

    const date = m.date_raw ? parseMessageDate(m.date_raw) : null;

    // El "otro lado" del mensaje (excluyendo a Daniel) es el contacto.
    const others = new Set<string>();
    if (senderNorm && senderNorm !== ownUrl) others.add(senderNorm);
    for (const r of recipientNorms) {
      if (r !== ownUrl) others.add(r);
    }

    for (const other of others) {
      const prev = counts.get(other) ?? { count: 0, lastAt: null };
      prev.count += 1;
      if (date && (!prev.lastAt || date > prev.lastAt)) {
        prev.lastAt = date;
      }
      counts.set(other, prev);
    }
  }

  return connections.map((c) => {
    const norm = normalizeLinkedinUrl(c.linkedin_url);
    const entry = counts.get(norm);
    return {
      ...c,
      has_message_history: Boolean(entry && entry.count > 0),
      last_message_at: entry?.lastAt ?? null,
      messages_count: entry?.count ?? 0,
    };
  });
}

function inferOwnProfileUrl(messages: LinkedInMessageMeta[]): string | null {
  const tally = new Map<string, number>();
  for (const m of messages) {
    if (m.sender_url) {
      const k = normalizeLinkedinUrl(m.sender_url);
      tally.set(k, (tally.get(k) ?? 0) + 1);
    }
    if (m.recipient_urls) {
      for (const r of m.recipient_urls.split(",")) {
        const trimmed = r.trim();
        if (!trimmed) continue;
        const k = normalizeLinkedinUrl(trimmed);
        tally.set(k, (tally.get(k) ?? 0) + 1);
      }
    }
  }
  let topUrl: string | null = null;
  let topCount = 0;
  for (const [url, c] of tally.entries()) {
    if (c > topCount) {
      topCount = c;
      topUrl = url;
    }
  }
  return topUrl;
}

function parseMessageDate(raw: string): Date | null {
  // Formato típico: "2026-05-19 08:43:36 UTC"
  const cleaned = raw.replace(" UTC", "Z").replace(" ", "T");
  const d = new Date(cleaned);
  return Number.isNaN(d.getTime()) ? null : d;
}
