/**
 * Refinamiento con Gemini 2.5 Pro + Search Grounding para los contactos
 * que la heurística marcó como `review` (típicamente empresarios séniors
 * sin señal cripto evidente en su title/company).
 *
 * Regla dura del usuario: los empresarios SOLO son relevantes si hay
 * señal pública cripto / tokenización detectable. Gemini busca en Google
 * y decide.
 */

import {
  PRIMARY_MODEL,
  FALLBACK_MODEL,
  callGemini,
  extractText,
  parseJsonBlock,
  asString,
} from "~/lib/gemini/client";
import type { ClassificationResult } from "./classifier";

export interface GeminiClassificationInput {
  /** ID interno (uuid de Supabase) para devolver el resultado mapeado. */
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  position: string | null;
  linkedin_url: string;
}

export interface GeminiClassificationOutput {
  id: string;
  result: ClassificationResult;
}

const SYSTEM_INSTRUCTION = `Eres un analista de prospección para VaultBit
Advisory, asesoría boutique en España especializada en:
  • Custodia de criptoactivos (cold storage, multi-sig, Shamir)
  • Fiscalidad cripto (modelos 720, 721)
  • Heritage Protocol (herencia digital)
  • Web3 B2B (tesorería corp BTC, MiCA, tokenización)

ICP REAL:
  • Holders cripto long-term 35-65 años con BTC/ETH antiguo
  • Family offices, banca privada, wealth management con exposición cripto
  • Abogados sucesorios, notarios, fiscalistas que tratan clientes cripto
  • Empresarios séniors con SEÑAL PÚBLICA cripto/tokenización documentada

══════════════════════════════════════════════════════════════
TU TAREA
══════════════════════════════════════════════════════════════
Recibes una lista de contactos (nombre, empresa, cargo, URL LinkedIn).
Son empresarios séniors o perfiles dudosos que la heurística no pudo
clasificar. Para cada uno, USA Google Search para verificar si tienen
SEÑAL PÚBLICA cripto/Web3/tokenización: posts, intervenciones, ponencias,
artículos, menciones en prensa, participación en eventos cripto.

══════════════════════════════════════════════════════════════
ANTI-ALUCINACIÓN
══════════════════════════════════════════════════════════════
1. NUNCA inventes señales. Si no encuentras nada concreto → 'irrelevant'.
2. Cita la fuente concreta en relevance_reason (URL si la tienes).
3. "Trabaja en empresa innovadora" NO es señal. Necesitas mención
   explícita a cripto / blockchain / tokenización / Bitcoin / Ethereum.
4. Si la persona habla solo de "innovación", "transformación digital",
   "futuro" sin mencionar cripto → 'irrelevant'.

══════════════════════════════════════════════════════════════
EXCLUSIONES DURAS
══════════════════════════════════════════════════════════════
Aunque encuentres mención cripto, descarta si predomina:
  -Airdrop -Memecoin -Shitcoin -100x -Trading -Apalancamiento
  -Señales -Daytrading -Telegram grupos especulación

══════════════════════════════════════════════════════════════
FORMATO DE SALIDA
══════════════════════════════════════════════════════════════
Devuelve un único bloque JSON, sin texto antes ni después:

\`\`\`json
{
  "results": [
    {
      "id": "string (el id que te pasaron)",
      "relevance_status": "relevant|irrelevant",
      "relevance_reason": "string (concreto, con fuente si la hay)",
      "sector_tags": ["crypto", "wealth_mgmt", "legal_succession", "entrepreneur_crypto_signal"],
      "crypto_signal": true|false
    }
  ]
}
\`\`\`

Idioma: español. Solo JSON.
`;

interface GeminiClassifyJson {
  results?: unknown;
}

interface GeminiClassifyRow {
  id?: unknown;
  relevance_status?: unknown;
  relevance_reason?: unknown;
  sector_tags?: unknown;
  crypto_signal?: unknown;
}

export async function classifyWithGemini(
  contacts: GeminiClassificationInput[],
): Promise<GeminiClassificationOutput[]> {
  if (contacts.length === 0) return [];

  const userPrompt = buildUserPrompt(contacts);

  let resp;
  try {
    resp = await callGemini(PRIMARY_MODEL, SYSTEM_INSTRUCTION, userPrompt);
  } catch (err) {
    console.warn(
      `[linkedin classify] ${PRIMARY_MODEL} falló, probando ${FALLBACK_MODEL}:`,
      err instanceof Error ? err.message : err,
    );
    resp = await callGemini(FALLBACK_MODEL, SYSTEM_INSTRUCTION, userPrompt);
  }

  if (resp.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini bloqueó la clasificación: ${resp.promptFeedback.blockReason}`,
    );
  }

  const rawText = extractText(resp);
  if (!rawText.trim()) throw new Error("Gemini devolvió respuesta vacía");

  const parsed = parseJsonBlock(rawText) as GeminiClassifyJson | null;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Gemini devolvió un formato inesperado al clasificar");
  }

  const arr = parsed.results;
  if (!Array.isArray(arr)) {
    throw new Error("Gemini no devolvió el array `results` esperado");
  }

  return arr
    .map((row) => normalizeResult(row as GeminiClassifyRow))
    .filter((r): r is GeminiClassificationOutput => r !== null);
}

function buildUserPrompt(contacts: GeminiClassificationInput[]): string {
  const lines = [
    `Clasifica los siguientes ${contacts.length} contactos:`,
    "",
  ];
  for (const c of contacts) {
    const name =
      [c.first_name, c.last_name].filter(Boolean).join(" ").trim() ||
      "(sin nombre)";
    lines.push(`• id: ${c.id}`);
    lines.push(`  nombre: ${name}`);
    if (c.position) lines.push(`  cargo: ${c.position}`);
    if (c.company) lines.push(`  empresa: ${c.company}`);
    lines.push(`  linkedin: ${c.linkedin_url}`);
    lines.push("");
  }
  lines.push(
    "Devuelve solo el JSON con la forma indicada en el system prompt.",
  );
  return lines.join("\n");
}

function normalizeResult(
  row: GeminiClassifyRow,
): GeminiClassificationOutput | null {
  const id = asString(row.id);
  if (!id) return null;
  const status = asString(row.relevance_status);
  if (status !== "relevant" && status !== "irrelevant") return null;
  const reason = asString(row.relevance_reason) ?? "Sin razón especificada";
  const tags = Array.isArray(row.sector_tags)
    ? row.sector_tags.filter((t): t is string => typeof t === "string")
    : [];
  const cryptoSignal = typeof row.crypto_signal === "boolean" ? row.crypto_signal : false;
  return {
    id,
    result: {
      relevance_status: status,
      relevance_reason: reason,
      sector_tags: tags,
      crypto_signal: cryptoSignal,
    },
  };
}
