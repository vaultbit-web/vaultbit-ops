/**
 * Generador de PRIMER mensaje personal en LinkedIn — CERO VENTA.
 *
 * Dos variantes según historial:
 *   • Con historial (has_message_history = true, hace >= ~6 meses):
 *     "perdona que llevo tiempo sin escribirte, qué tal andas"
 *   • Sin historial (conectados pero nunca hablado):
 *     "te tengo desde {connected_on} y nunca te escribí, perdona"
 *
 * Tono: humilde, win-win, sin agenda comercial, sin pitch de VaultBit,
 * sin CTA con franja horaria. Pasivo. Conversacional. Tutea siempre que
 * haya first_name.
 */

import {
  PRIMARY_MODEL,
  FALLBACK_MODEL,
  callGemini,
  extractText,
  parseJsonBlock,
  asString,
} from "~/lib/gemini/client";

export interface LinkedInMessageInput {
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  position: string | null;
  connected_on: string | null; // ISO date
  has_message_history: boolean;
  last_message_at: string | null; // ISO date
  sector_tags: string[];
  crypto_signal: boolean;
}

export interface LinkedInMessageResult {
  message: string;
  modelUsed: string;
}

interface MessageJson {
  message?: unknown;
}

const SYSTEM_INSTRUCTION = `Eres Daniel Brosed, fundador de VaultBit.
Vas a escribir un PRIMER MENSAJE en LinkedIn a un contacto tuyo. NO ES
UNA PROPUESTA COMERCIAL. Es un mensaje sincero para retomar / iniciar
contacto. Pasivo. Humilde. Sin agenda.

══════════════════════════════════════════════════════════════
DOS VARIANTES SEGÚN HISTORIAL
══════════════════════════════════════════════════════════════
A) CON HISTORIAL (ya habéis hablado antes pero hace tiempo):
   Tono: "perdona que llevo X tiempo sin escribirte, entre proyecto y
   proyecto se me ha pasado. ¿Qué tal andas?"
   Reconoce que la culpa del silencio es tuya. Cero excusas elaboradas.

B) SIN HISTORIAL (conectados pero nunca habéis cruzado mensajes):
   Tono: "te tengo en LinkedIn desde {fecha} y nunca te escribí —
   perdona la torpeza. Vi tu perfil y me llamó la atención lo de
   {detalle concreto}. ¿Cómo te va con eso?"
   Reconoce que es raro escribir tarde. Sin disculpas largas.

══════════════════════════════════════════════════════════════
LONGITUD Y FORMATO
══════════════════════════════════════════════════════════════
  • 60-110 palabras MAX (LinkedIn es más corto que email).
  • Texto plano. SIN markdown. SIN asteriscos. SIN bullets.
  • Saltos de línea naturales entre párrafos cortos.
  • Sin firma comercial. Cierra solo con "— Daniel" (sin "VaultBit").

══════════════════════════════════════════════════════════════
PROHIBIDO — lista negra
══════════════════════════════════════════════════════════════
  ✗ "Espero que te encuentres bien" / "I hope this finds you well".
  ✗ "Te escribo para presentarme" / "Soy Daniel, fundador de…".
  ✗ Mencionar VaultBit, sus servicios, Heritage Protocol, custodia,
    fiscalidad, etc. Cero pitch.
  ✗ CTAs con franja horaria ("¿quedamos esta o la próxima semana?").
  ✗ "Me encantaría conocerte" / "Sería un placer". Excesivamente formal.
  ✗ Superlativos ("genial", "increíble", "fantástico").
  ✗ Emojis. Exclamaciones.
  ✗ Mencionar que tienes una empresa que ofrece algo.

══════════════════════════════════════════════════════════════
PERMITIDO Y RECOMENDABLE
══════════════════════════════════════════════════════════════
  ✓ Tutear (siempre que haya first_name).
  ✓ Mencionar su position + company de forma natural ("vi que estás
    en {company}").
  ✓ Si crypto_signal=true puedes mencionar el sector de pasada, NUNCA
    como excusa para vender: "vi que andas con cosas de cripto, me suena
    interesante".
  ✓ Pregunta abierta al final tipo "¿cómo te va con eso?" / "¿qué tal
    andas?" — invita a responder sin obligar.
  ✓ Cierre tipo: "Por aquí estoy si en algún momento quieres saludar.
    Sin prisa." o "Sin agenda, solo retomar contacto."

══════════════════════════════════════════════════════════════
TONO Y VOZ
══════════════════════════════════════════════════════════════
Como hablaría un señor de 35-45 años, español, ex-enfermero UCI,
empresario que respeta el tiempo del otro. No solemne, no efusivo.
Directo, cercano, humano. La frase clave que mejor representa el tono:
"Sin prisa y sin agenda."

══════════════════════════════════════════════════════════════
FORMATO DE SALIDA
══════════════════════════════════════════════════════════════
Devuelve un único bloque JSON, sin texto antes ni después:

\`\`\`json
{
  "message": "Cuerpo del mensaje completo. Saltos de línea como \\n. Cierra con — Daniel"
}
\`\`\`
`;

export async function generateLinkedInMessage(
  input: LinkedInMessageInput,
): Promise<LinkedInMessageResult> {
  const userPrompt = buildUserPrompt(input);

  let resp;
  let modelUsed = PRIMARY_MODEL;
  try {
    resp = await callGemini(PRIMARY_MODEL, SYSTEM_INSTRUCTION, userPrompt);
  } catch (err) {
    console.warn(
      `[linkedin msg] ${PRIMARY_MODEL} falló, probando ${FALLBACK_MODEL}:`,
      err instanceof Error ? err.message : err,
    );
    resp = await callGemini(FALLBACK_MODEL, SYSTEM_INSTRUCTION, userPrompt);
    modelUsed = FALLBACK_MODEL;
  }

  if (resp.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini bloqueó la generación: ${resp.promptFeedback.blockReason}`,
    );
  }

  const rawText = extractText(resp);
  if (!rawText.trim()) throw new Error("Gemini devolvió respuesta vacía");

  const parsed = parseJsonBlock(rawText) as MessageJson | null;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Gemini devolvió un formato inesperado al generar mensaje");
  }

  const raw = asString(parsed.message);
  if (!raw) throw new Error("El mensaje generado está vacío");

  // Defensivo: limpiar asteriscos markdown que se cuelen.
  const message = raw.replace(/\*\*?/g, "");

  return { message, modelUsed };
}

function buildUserPrompt(input: LinkedInMessageInput): string {
  const name =
    [input.first_name, input.last_name].filter(Boolean).join(" ").trim() ||
    "(nombre desconocido)";

  const lines: string[] = [
    `Contacto: ${name}`,
  ];
  if (input.position) lines.push(`Cargo: ${input.position}`);
  if (input.company) lines.push(`Empresa: ${input.company}`);
  if (input.connected_on) lines.push(`Conectado en LinkedIn: ${input.connected_on}`);

  if (input.sector_tags.length > 0) {
    lines.push(`Sectores detectados: ${input.sector_tags.join(", ")}`);
  }
  if (input.crypto_signal) {
    lines.push(
      `SEÑAL CRIPTO: sí (puedes mencionar de pasada, NUNCA como excusa para vender).`,
    );
  }

  lines.push("");

  if (input.has_message_history) {
    const since = input.last_message_at
      ? humanizeTimeSince(input.last_message_at)
      : "bastante tiempo";
    lines.push(
      `VARIANTE A — Habéis intercambiado mensajes antes. Último: hace ${since}.`,
      `Usa el tono de "perdona que llevo tiempo sin escribirte" reconociendo`,
      `que la culpa del silencio es tuya, sin excusas largas.`,
    );
  } else {
    const since = input.connected_on
      ? humanizeTimeSince(input.connected_on)
      : "tiempo";
    lines.push(
      `VARIANTE B — Estáis conectados en LinkedIn (desde hace ${since}) pero`,
      `NUNCA habéis cruzado mensajes. Usa el tono "te tengo desde hace`,
      `tiempo y nunca te escribí — perdona la torpeza".`,
    );
  }

  lines.push("", "Genera el mensaje. Solo JSON.");
  return lines.join("\n");
}

function humanizeTimeSince(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "bastante tiempo";
  const monthsDiff =
    (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (monthsDiff < 1) return "menos de un mes";
  if (monthsDiff < 12) {
    const m = Math.round(monthsDiff);
    return m === 1 ? "un mes" : `${m} meses`;
  }
  const years = Math.round(monthsDiff / 12);
  return years === 1 ? "un año" : `${years} años`;
}
