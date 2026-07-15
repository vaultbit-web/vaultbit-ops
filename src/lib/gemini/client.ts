/**
 * Cliente Gemini para generación de contenido del fundador.
 * Genera ideas de Reels, guiones y copy para @danielbrosedemprendedor.
 *
 * Modelo principal: `gemini-2.5-pro` · Fallback: `gemini-2.5-flash`
 *
 * Auth: API key como query string (env `GEMINI_API_KEY`).
 */

export const PRIMARY_MODEL = "gemini-2.5-pro";
export const FALLBACK_MODEL = "gemini-2.5-flash";
const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY no configurada");
  return key;
}

// ─────────────────────────────────────────────────────────
// Tipos del API REST de Gemini (subset relevante)
// ─────────────────────────────────────────────────────────

interface GeminiPart {
  text?: string;
}

interface GroundingChunkWeb {
  uri?: string;
  title?: string;
}

interface GroundingChunk {
  web?: GroundingChunkWeb;
}

interface GroundingSupportSegment {
  startIndex?: number;
  endIndex?: number;
  text?: string;
}

interface GroundingSupport {
  segment?: GroundingSupportSegment;
  groundingChunkIndices?: number[];
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  groundingSupports?: GroundingSupport[];
  webSearchQueries?: string[];
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
  groundingMetadata?: GroundingMetadata;
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

// ─────────────────────────────────────────────────────────
// Llamada al API
// ─────────────────────────────────────────────────────────

export async function callGemini(
  model: string,
  systemInstruction: string,
  userPrompt: string,
): Promise<GeminiResponse> {
  const url = `${ENDPOINT(model)}?key=${getApiKey()}`;
  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 24576,
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${model} respondió ${res.status}: ${text.slice(0, 400)}`);
  }
  return (await res.json()) as GeminiResponse;
}

// ─────────────────────────────────────────────────────────
// Parsing de la respuesta
// ─────────────────────────────────────────────────────────

export function extractText(resp: GeminiResponse): string {
  const parts = resp.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? "").join("");
}

/**
 * Extrae el JSON del texto. Gemini puede devolverlo:
 *   - dentro de un bloque ```json ... ```
 *   - directo como texto
 *   - precedido por explicación (lo cual viola las instrucciones, pero pasa)
 */
export function parseJsonBlock(text: string): unknown {
  // Intento 1: bloque ```json
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence?.[1]) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      // sigue al intento 2
    }
  }
  // Intento 2: primer { ... último } balanceado
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) {
    const slice = text.slice(first, last + 1);
    try {
      return JSON.parse(slice);
    } catch {
      // sigue
    }
  }
  return null;
}

export function asString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length === 0 ? null : trimmed;
}

// ─────────────────────────────────────────────────────────
// F2.3 · Marca Personal del Fundador
// Genera ideas de Reels en lote y guiones completos siguiendo
// la metodología Víctor Eras documentada en
// `lib/prompts/founder-content-strategy.ts`.
// ─────────────────────────────────────────────────────────

import { buildFounderSystemPrompt } from "~/lib/prompts/founder-content-strategy";

export type FounderArchetype = "security" | "fiscal" | "inheritance" | "business";
export type FounderFormatLiteral =
  | "POV"
  | "blog"
  | "talking_head"
  | "interview"
  | "characters"
  | "dynamic";

export interface FounderIdeaCriteria {
  /** Cuántas ideas pedir. Default 20, máx 50 por restricciones de tokens. */
  count?: number;
  /** Si se especifica, solo ideas de este arquetipo. */
  archetype?: FounderArchetype;
  /** Contexto extra del usuario (ej: "esta semana toca herencia"). */
  extraContext?: string;
}

export interface FounderIdeaCandidate {
  theme: string;
  archetype: FounderArchetype | null;
  format: FounderFormatLiteral | null;
  idea_score: number | null;
  idea_score_breakdown: Record<string, boolean>;
  rationale: string | null;
  compliance_passes: boolean;
  compliance_flagged: string[];
}

export interface FounderIdeasResult {
  ideas: FounderIdeaCandidate[];
  modelUsed: string;
  rawText: string;
}

export interface FounderScriptInput {
  /** Tema central del guion (puede venir de una idea promovida o tema libre). */
  theme: string;
  archetype?: FounderArchetype;
  /** Formato sugerido. Si se pasa, el modelo intenta respetarlo. */
  format?: FounderFormatLiteral;
  /** Contexto opcional con datos del prospecto/cliente para personalizar. */
  extraContext?: string;
}

export interface FounderScriptCandidate {
  theme: string;
  archetype: FounderArchetype | null;
  format: FounderFormatLiteral | null;
  estimated_duration_s: number | null;
  hook_options: string[];
  script: {
    hook: string | null;
    context: string | null;
    moral: string | null;
    cta: string | null;
  };
  keyword: string | null;
  idea_score: number | null;
  idea_score_breakdown: Record<string, boolean>;
  rationale: string | null;
  compliance_passes: boolean;
  compliance_flagged: string[];
  suggested_hashtags: string[];
}

export interface FounderScriptResult {
  script: FounderScriptCandidate;
  modelUsed: string;
  rawText: string;
}

function buildFounderIdeasUserPrompt(criteria: FounderIdeaCriteria): string {
  const count = Math.min(criteria.count ?? 20, 50);
  const lines = [
    `Genera ${count} ideas de Reels para la cuenta personal de Daniel Brosed`,
    `(@danielbrosedemprendedor). Cada idea debe pasar el filtro 5/8 mínimo`,
    `según la "Checklist de Idea Ganadora" de la metodología.`,
    ``,
  ];
  if (criteria.archetype) {
    lines.push(`Arquetipo objetivo: ${criteria.archetype}`);
  } else {
    lines.push(`Variedad de arquetipos (security/fiscal/inheritance/business).`);
  }
  if (criteria.extraContext) {
    lines.push(`Contexto adicional del usuario: ${criteria.extraContext}`);
  }

  lines.push(
    ``,
    `IMPORTANTE: en esta llamada NO devuelvas guiones completos, solo el`,
    `concepto de cada idea con su evaluación. Es la fase de "boca ancha"`,
    `del embudo 100→10→20.`,
    ``,
    `Devuelve un único bloque JSON con esta forma exacta:`,
    "```json",
    `{`,
    `  "ideas": [`,
    `    {`,
    `      "theme": "string · 5-12 palabras describiendo la idea",`,
    `      "archetype": "security|fiscal|inheritance|business",`,
    `      "format": "POV|blog|talking_head|interview|characters|dynamic",`,
    `      "idea_score": "integer 0-8",`,
    `      "idea_score_breakdown": {`,
    `        "contracurrent": true|false,`,
    `        "filter_5_50": true|false,`,
    `        "unique": true|false,`,
    `        "common_applicable": true|false,`,
    `        "polemical": true|false,`,
    `        "format_fit": true|false,`,
    `        "brand_congruent": true|false,`,
    `        "viral_reference": true|false`,
    `      },`,
    `      "rationale": "string · 1-2 frases concretas explicando por qué encaja",`,
    `      "compliance_passes": true|false,`,
    `      "compliance_flagged": ["string"]`,
    `    }`,
    `  ]`,
    `}`,
    "```",
    ``,
    `Sin texto antes ni después. Solo el JSON.`,
  );
  return lines.join("\n");
}

function buildFounderScriptUserPrompt(input: FounderScriptInput): string {
  const lines = [
    `Genera el guion COMPLETO de un Reel siguiendo la estructura 60s en`,
    `4 bloques (gancho · contexto · moraleja · CTA con palabra clave).`,
    ``,
    `Tema central: ${input.theme}`,
  ];
  if (input.archetype) lines.push(`Arquetipo: ${input.archetype}`);
  if (input.format) lines.push(`Formato sugerido: ${input.format}`);
  if (input.extraContext) lines.push(`Contexto extra: ${input.extraContext}`);

  lines.push(
    ``,
    `Devuelve el JSON estructurado completo según el schema definido en el`,
    `system prompt (FOUNDER_SCRIPT_OUTPUT_SCHEMA): theme, archetype, format,`,
    `estimated_duration_s, hook_options (3 alternativas), script (hook,`,
    `context, moral, cta), keyword, idea_score, rationale, compliance_check,`,
    `suggested_hashtags. Hook elegido = primera entrada de hook_options.`,
    ``,
    `Sin texto antes ni después. Solo el JSON.`,
  );
  return lines.join("\n");
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((x) => (typeof x === "string" ? [x] : []));
}

function asBoolean(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function asArchetype(v: unknown): FounderArchetype | null {
  const s = asString(v);
  if (!s) return null;
  const lower = s.toLowerCase();
  if (
    lower === "security" ||
    lower === "fiscal" ||
    lower === "inheritance" ||
    lower === "business"
  ) {
    return lower;
  }
  return null;
}

function asFounderFormat(v: unknown): FounderFormatLiteral | null {
  const s = asString(v);
  if (!s) return null;
  const valid: FounderFormatLiteral[] = [
    "POV",
    "blog",
    "talking_head",
    "interview",
    "characters",
    "dynamic",
  ];
  return (valid as string[]).includes(s) ? (s as FounderFormatLiteral) : null;
}

function asScoreBreakdown(v: unknown): Record<string, boolean> {
  if (!v || typeof v !== "object") return {};
  const out: Record<string, boolean> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "boolean") out[k] = val;
  }
  return out;
}

function asIdeaScore(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const n = Math.round(v);
  if (n < 0 || n > 8) return null;
  return n;
}

function normalizeFounderIdea(raw: unknown): FounderIdeaCandidate | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const theme = asString(obj.theme);
  if (!theme) return null;
  const compliance =
    obj.compliance_check && typeof obj.compliance_check === "object"
      ? (obj.compliance_check as Record<string, unknown>)
      : {};
  return {
    theme,
    archetype: asArchetype(obj.archetype),
    format: asFounderFormat(obj.format),
    idea_score: asIdeaScore(obj.idea_score),
    idea_score_breakdown: asScoreBreakdown(obj.idea_score_breakdown),
    rationale: asString(obj.rationale),
    compliance_passes:
      asBoolean(obj.compliance_passes, true) &&
      asBoolean(compliance.passes, true),
    compliance_flagged: asStringArray(
      obj.compliance_flagged ?? compliance.flagged,
    ),
  };
}

function normalizeFounderScript(raw: unknown): FounderScriptCandidate | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const theme = asString(obj.theme);
  if (!theme) return null;
  const scriptObj =
    obj.script && typeof obj.script === "object"
      ? (obj.script as Record<string, unknown>)
      : {};
  const compliance =
    obj.compliance_check && typeof obj.compliance_check === "object"
      ? (obj.compliance_check as Record<string, unknown>)
      : {};
  const ideaScoreObj =
    obj.idea_score && typeof obj.idea_score === "object"
      ? (obj.idea_score as Record<string, unknown>)
      : null;
  const totalFromObject = ideaScoreObj
    ? asIdeaScore(ideaScoreObj.total)
    : null;
  const breakdown = ideaScoreObj
    ? asScoreBreakdown(ideaScoreObj)
    : asScoreBreakdown(obj.idea_score_breakdown);
  return {
    theme,
    archetype: asArchetype(obj.archetype),
    format: asFounderFormat(obj.format),
    estimated_duration_s:
      typeof obj.estimated_duration_s === "number"
        ? Math.round(obj.estimated_duration_s)
        : null,
    hook_options: asStringArray(obj.hook_options).slice(0, 3),
    script: {
      hook: asString(scriptObj.hook),
      context: asString(scriptObj.context),
      moral: asString(scriptObj.moral),
      cta: asString(scriptObj.cta),
    },
    keyword: asString(obj.keyword)?.toUpperCase() ?? null,
    idea_score: totalFromObject ?? asIdeaScore(obj.idea_score),
    idea_score_breakdown: breakdown,
    rationale: asString(obj.rationale),
    compliance_passes: asBoolean(compliance.passes, true),
    compliance_flagged: asStringArray(compliance.flagged),
    suggested_hashtags: asStringArray(obj.suggested_hashtags).slice(0, 8),
  };
}

export async function generateFounderIdeas(
  criteria: FounderIdeaCriteria,
): Promise<FounderIdeasResult> {
  const systemInstruction = buildFounderSystemPrompt();
  const userPrompt = buildFounderIdeasUserPrompt(criteria);

  let resp: GeminiResponse;
  let modelUsed = PRIMARY_MODEL;
  try {
    resp = await callGemini(PRIMARY_MODEL, systemInstruction, userPrompt);
  } catch (err) {
    console.warn(
      `[gemini founder ideas] modelo primario falló, probando ${FALLBACK_MODEL}:`,
      err instanceof Error ? err.message : err,
    );
    resp = await callGemini(FALLBACK_MODEL, systemInstruction, userPrompt);
    modelUsed = FALLBACK_MODEL;
  }

  if (resp.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini bloqueó la respuesta: ${resp.promptFeedback.blockReason}`,
    );
  }

  const rawText = extractText(resp);
  if (!rawText.trim()) throw new Error("Gemini devolvió respuesta vacía");

  const finishReason = resp.candidates?.[0]?.finishReason;
  const truncated = finishReason === "MAX_TOKENS";
  const parsed = parseJsonBlock(rawText);
  if (!parsed || typeof parsed !== "object") {
    console.error(
      "[gemini founder ideas] No se pudo parsear el JSON. finishReason=%s longitud=%d. Texto:\n%s",
      finishReason,
      rawText.length,
      rawText,
    );
    if (truncated) {
      throw new Error(
        "Gemini se quedó sin tokens. Reduce el número de ideas pedidas o reintenta.",
      );
    }
    throw new Error(
      "Formato inesperado de Gemini. Texto inicial: " + rawText.slice(0, 200),
    );
  }

  const arr = (parsed as Record<string, unknown>).ideas;
  if (!Array.isArray(arr)) {
    throw new Error("Gemini no devolvió el array `ideas`");
  }

  const ideas = arr
    .map((c) => normalizeFounderIdea(c))
    .filter((c): c is FounderIdeaCandidate => c !== null);

  return { ideas, modelUsed, rawText };
}

export async function generateFounderScript(
  input: FounderScriptInput,
): Promise<FounderScriptResult> {
  const systemInstruction = buildFounderSystemPrompt();
  const userPrompt = buildFounderScriptUserPrompt(input);

  let resp: GeminiResponse;
  let modelUsed = PRIMARY_MODEL;
  try {
    resp = await callGemini(PRIMARY_MODEL, systemInstruction, userPrompt);
  } catch (err) {
    console.warn(
      `[gemini founder script] modelo primario falló, probando ${FALLBACK_MODEL}:`,
      err instanceof Error ? err.message : err,
    );
    resp = await callGemini(FALLBACK_MODEL, systemInstruction, userPrompt);
    modelUsed = FALLBACK_MODEL;
  }

  if (resp.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini bloqueó la respuesta: ${resp.promptFeedback.blockReason}`,
    );
  }

  const rawText = extractText(resp);
  if (!rawText.trim()) throw new Error("Gemini devolvió respuesta vacía");

  const finishReason = resp.candidates?.[0]?.finishReason;
  const truncated = finishReason === "MAX_TOKENS";
  const parsed = parseJsonBlock(rawText);

  if (!parsed) {
    console.error(
      "[gemini founder script] No se pudo parsear. finishReason=%s longitud=%d. Texto:\n%s",
      finishReason,
      rawText.length,
      rawText,
    );
    if (truncated) {
      throw new Error("Gemini se quedó sin tokens redactando el guion. Reintenta.");
    }
    throw new Error(
      "Formato inesperado de Gemini. Texto: " + rawText.slice(0, 200),
    );
  }

  const script = normalizeFounderScript(parsed);
  if (!script) {
    throw new Error("Gemini no devolvió un guion válido");
  }

  return { script, modelUsed, rawText };
}

// ─────────────────────────────────────────────────────────
// Generador de copy/caption del Reel (refinamiento F2.3 sesión 2)
//
// Paso aparte del guion: cuando un guion ya está validado, Daniel pulsa
// "Generar copy" para obtener el caption optimizado para Instagram que
// acompaña al Reel al publicarlo. Razones para separarlo del generador
// de guion:
//
//   • El system prompt del guion ya es muy denso (estrategia + checklist
//     + compliance + auto-puntuación). Añadirle copywriting diluye la
//     calidad del guion (validado en la primera tanda real con Daniel).
//   • Daniel puede regenerar SOLO el copy sin tocar un guion que ya le
//     gusta — útil cuando el guion es bueno pero el caption se queda
//     corto o suena raro.
//   • El caption de Reel es un género distinto: optimizado para el
//     primer "...más" de Instagram (~125-200 chars), hashtags al final
//     y CTA relacional (reservar reunión via bio).
// ─────────────────────────────────────────────────────────

import { FOUNDER_BRAND_IDENTITY } from "~/lib/prompts/founder-content-strategy";

export interface FounderCopyInput {
  /** Tema central del guion. */
  theme: string;
  /** Hook elegido (primeros 4-7s). Lo reutilizamos como ancla del caption. */
  hook: string | null;
  /** Bloques del guion para que Gemini tenga contexto. */
  context: string | null;
  moral: string | null;
  cta: string | null;
  /** Arquetipo (si está): security / fiscal / inheritance / business. */
  archetype: string | null;
  /** Hashtags ya sugeridos al guion (los reutilizamos si encajan). */
  suggested_hashtags: string[];
}

export interface FounderCopyResult {
  copy: string;
  modelUsed: string;
}

interface FounderCopyJson {
  caption?: unknown;
}

function buildFounderCopySystemInstruction(): string {
  return [
    "Eres copywriter especialista en captions de Instagram para Reels en español de España.",
    "Trabajas para Daniel Brosed, fundador de VaultBit Advisory. Sigues estrictamente la identidad de marca y las líneas rojas de compliance que te paso abajo.",
    "",
    FOUNDER_BRAND_IDENTITY,
    "",
    "══════════════════════════════════════════════════════════════",
    "TU TAREA",
    "══════════════════════════════════════════════════════════════",
    "Dado un guion ya validado, escribe el CAPTION (descripción del Reel)",
    "que acompañará a la publicación en Instagram. El caption es texto",
    "complementario al vídeo, no una transcripción. Su trabajo es:",
    "  1. Reforzar el gancho con texto fuerte ANTES de los ~125 caracteres",
    "     (lo que se ve antes del \"…más\").",
    "  2. Aportar matiz/dato adicional que el vídeo no tiene.",
    "  3. Cerrar con CTA relacional: invitar a reservar una reunión directa via bio.",
    "  4. Listar 3-6 hashtags relevantes al final, separados por espacios.",
    "",
    "══════════════════════════════════════════════════════════════",
    "ESTRUCTURA OBLIGATORIA DEL CAPTION",
    "══════════════════════════════════════════════════════════════",
    "Bloque 1 · Gancho (1-2 frases, ~120-200 caracteres):",
    "  Frase corta, impactante, que reaproveche el ángulo del hook del",
    "  vídeo SIN repetirlo literal. Tiene que parar el scroll de quien",
    "  está leyendo el caption.",
    "",
    "Bloque 2 · Salto de línea doble + cuerpo (3-6 frases):",
    "  Aporta el matiz, el dato, el caso anonimizado o la conclusión que",
    "  refuerza lo que el Reel cuenta. Frases cortas, una idea por frase.",
    "  NO transcribas el guion: el espectador acaba de verlo. Aporta",
    "  algo nuevo o profundiza un ángulo concreto.",
    "",
    "Bloque 3 · Salto doble + CTA relacional:",
    "  Una sola frase invitando a reservar una reunión directa. Por",
    "  defecto: \"Si quieres revisarlo juntos, el enlace está en mi bio.\"",
    "  o variantes cortas. Tono cercano, sin urgencia. NUNCA URLs",
    "  literales — el caption no permite enlaces y el lector va a la bio.",
    "",
    "Bloque 4 · Salto doble + hashtags:",
    "  3 a 6 hashtags relevantes al tema del Reel y al sector",
    "  (custodia, fiscalidad, herencia digital, cripto España, banca",
    "  privada). Mezcla tags amplios y otros más nichos. Separados por",
    "  espacios. Si los hashtags sugeridos al guion encajan, reutilízalos.",
    "",
    "══════════════════════════════════════════════════════════════",
    "REGLAS DE TONO Y FORMATO",
    "══════════════════════════════════════════════════════════════",
    "  ✓ Frases cortas. Una idea por frase. Saltos de línea simples (\\n)",
    "    dentro de cada bloque, dobles (\\n\\n) entre bloques.",
    "  ✓ Tutear al lector. Cercano pero serio.",
    "  ✓ Tecnicismos solo si están bien usados (multisig, BIP39, Shamir).",
    "  ✗ NUNCA emojis.",
    "  ✗ NUNCA exclamaciones.",
    "  ✗ NUNCA jerga cripto-bro (wagmi, ape, moon, diamond hands).",
    "  ✗ NUNCA \"esto te va a interesar\" / \"sigue leyendo\" / clickbait.",
    "  ✗ NUNCA promesas de rentabilidad ni recomendaciones de inversión.",
    "  ✗ NUNCA URLs en el caption — Instagram no las hace clicables.",
    "",
    "══════════════════════════════════════════════════════════════",
    "LONGITUD",
    "══════════════════════════════════════════════════════════════",
    "Caption total entre 350 y 800 caracteres (incluyendo hashtags).",
    "Lo crítico es que los primeros 125 caracteres atrapen — Instagram",
    "corta ahí con \"...más\". Si el lector no abre, perdemos la opción",
    "de que vaya a la bio.",
    "",
    "══════════════════════════════════════════════════════════════",
    "FORMATO DE SALIDA — OBLIGATORIO",
    "══════════════════════════════════════════════════════════════",
    "Devuelve UN ÚNICO bloque JSON, sin texto antes ni después:",
    "",
    "```json",
    "{",
    '  "caption": "string — el caption completo con saltos de línea (\\\\n entre frases internas, \\\\n\\\\n entre bloques). Termina con la línea de hashtags."',
    "}",
    "```",
    "",
    "Sin comentarios. Sin markdown adicional. Solo el JSON.",
  ].join("\n");
}

function buildFounderCopyUserPrompt(input: FounderCopyInput): string {
  const lines = [
    `Tema del Reel: ${input.theme}`,
    input.archetype ? `Arquetipo: ${input.archetype}` : null,
    input.hook ? `\nGancho del vídeo (4-7s):\n  ${input.hook}` : null,
    input.context ? `\nContexto / agitación (7-25s):\n  ${input.context}` : null,
    input.moral
      ? `\nMoraleja / enseñanza (25-50s):\n  ${input.moral}`
      : null,
    input.cta ? `\nCTA hablado (50-60s):\n  ${input.cta}` : null,
    input.suggested_hashtags.length > 0
      ? `\nHashtags sugeridos al guion (reutiliza si encajan): ${input.suggested_hashtags
          .map((h) => (h.startsWith("#") ? h : `#${h}`))
          .join(" ")}`
      : null,
    "",
    "Escribe el caption del Reel siguiendo la estructura y reglas del system prompt.",
    "Devuelve solo el JSON con la propiedad `caption`.",
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

export async function generateFounderCopy(
  input: FounderCopyInput,
): Promise<FounderCopyResult> {
  const systemInstruction = buildFounderCopySystemInstruction();
  const userPrompt = buildFounderCopyUserPrompt(input);

  let resp: GeminiResponse;
  let modelUsed = PRIMARY_MODEL;
  try {
    resp = await callGemini(PRIMARY_MODEL, systemInstruction, userPrompt);
  } catch (err) {
    console.warn(
      `[gemini founder copy] modelo primario falló, probando ${FALLBACK_MODEL}:`,
      err instanceof Error ? err.message : err,
    );
    resp = await callGemini(FALLBACK_MODEL, systemInstruction, userPrompt);
    modelUsed = FALLBACK_MODEL;
  }

  if (resp.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini bloqueó la respuesta: ${resp.promptFeedback.blockReason}`,
    );
  }

  const rawText = extractText(resp);
  if (!rawText.trim()) throw new Error("Gemini devolvió respuesta vacía");

  const finishReason = resp.candidates?.[0]?.finishReason;
  const truncated = finishReason === "MAX_TOKENS";
  const parsed = parseJsonBlock(rawText) as FounderCopyJson | null;

  if (!parsed || typeof parsed !== "object") {
    console.error(
      "[gemini founder copy] No se pudo parsear. finishReason=%s longitud=%d. Texto:\n%s",
      finishReason,
      rawText.length,
      rawText,
    );
    if (truncated) {
      throw new Error("Gemini se quedó sin tokens redactando el copy. Reintenta.");
    }
    throw new Error(
      "Formato inesperado de Gemini. Texto: " + rawText.slice(0, 200),
    );
  }

  const copy = asString(parsed.caption);
  if (!copy) {
    throw new Error("Gemini no devolvió la propiedad `caption`.");
  }

  return { copy, modelUsed };
}
