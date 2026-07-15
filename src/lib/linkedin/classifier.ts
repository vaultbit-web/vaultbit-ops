/**
 * Clasificador heurístico (gratis, sin LLM) para decidir si un contacto
 * de LinkedIn es relevante para VaultBit Advisory.
 *
 * Reglas en orden:
 *   1. Match negativo fuerte → irrelevant
 *   2. Match positivo cripto/Web3 → relevant + crypto_signal=true
 *   3. Match positivo wealth / banca privada → relevant
 *   4. Match positivo legal/sucesorio/fiscal → relevant
 *   5. Empresario sin señal cripto → review (lo decide Gemini después)
 *   6. Match dudoso → review
 *   7. Sin match → irrelevant ("sin keywords detectadas")
 *
 * Función pura — no toca red ni DB.
 */

import type { LinkedInConnection } from "./parser";

export type RelevanceStatus = "relevant" | "irrelevant" | "review";

export interface ClassificationResult {
  relevance_status: RelevanceStatus;
  relevance_reason: string;
  sector_tags: string[];
  crypto_signal: boolean;
}

// Match negativo: descartar de plano (no encajan ni con refinamiento Gemini)
const NEGATIVE_PATTERNS: RegExp[] = [
  /\b(student|estudiante|becari[oa]|intern\b|practicas?)\b/i,
  /\b(frontend|back[\s-]?end|fullstack|full[\s-]?stack)\s+(developer|dev|engineer|ingenier)/i,
  /\b(qa|tester|qa\s+engineer)\b/i,
  /\b(marketing\s+assistant|community\s+manager)\b/i,
  /\b(journalist|periodist[ao]|reporter)\b/i,
  /\b(designer|dise[ñn]ador[a]?)\b/i,
  /\b(personal\s+trainer|nutricionista|coach\s+deportiv)/i,
];

// Match positivo cripto/Web3
const CRYPTO_PATTERNS: RegExp[] = [
  /\b(crypto|cripto)/i,
  /\b(bitcoin|btc)\b/i,
  /\b(ethereum|eth)\b/i,
  /\bblockchain\b/i,
  /\bweb3\b/i,
  /\b(token(iz|isaci)|tokenis)/i,
  /\bdefi\b/i,
  /\bdao\b/i,
  /\b(custod(y|ia)\s+(of\s+)?(crypto|digital|cripto))/i,
  /\b(binance|bit2me|coinbase|kraken|bitfinex|bitpanda|bitget|ledger|trezor|coldcard|fireblocks|anchorage)\b/i,
];

// Match positivo wealth management
const WEALTH_PATTERNS: RegExp[] = [
  /\bwealth\s+management/i,
  /\bfamily\s+office/i,
  /\bprivate\s+bank/i,
  /\bbanca\s+privada/i,
  /\bpatrimoni/i,
  /\bgestor[a]?\s+de\s+patrimonio/i,
  /\bgesti[oó]n\s+patrimonial/i,
  /\b(asset|investment)\s+manag/i,
  /\b(lombard\s+odier|pictet|julius\s+baer|edmond\s+rothschild|abante|atl\s+capital)\b/i,
  /\binversiones\s+(privadas|patrimoniales)/i,
];

// Match positivo legal sucesorio / fiscal
const LEGAL_PATTERNS: RegExp[] = [
  /\babogad[oa]\b/i,
  /\bnotari/i,
  /\bfiscalist/i,
  /\btributari/i,
  /\bherenc/i,
  /\bsucesi[oó]n/i,
  /\b(estate|wealth\s+tax)\s+plan/i,
  /\b(despacho|bufete)\b/i,
  /\b(legal\s+counsel|legal\s+advisor|asesor[ ]+(fiscal|legal))/i,
];

// Empresario/directivo (necesita verificación cripto vía Gemini)
const ENTREPRENEUR_PATTERNS: RegExp[] = [
  /\b(ceo|chief\s+executive)/i,
  /\b(cfo|chief\s+financial)/i,
  /\b(coo|chief\s+operating)/i,
  /\b(founder|fundador[a]?|co[\s-]?founder|cofundador)/i,
  /\b(presidente|president\b)/i,
  /\b(socio\s+(director|fundador|gestor))\b/i,
  /\b(managing\s+partner|managing\s+director)\b/i,
  /\b(director[a]?\s+(general|financiero|comercial|de\s+inversiones))/i,
  /\bowner\b/i,
];

export function classifyContact(c: LinkedInConnection): ClassificationResult {
  const title = (c.position ?? "").trim();
  const company = (c.company ?? "").trim();
  const haystack = `${title} | ${company}`;

  if (!title && !company) {
    return {
      relevance_status: "irrelevant",
      relevance_reason: "Sin position ni company — datos insuficientes",
      sector_tags: [],
      crypto_signal: false,
    };
  }

  // 1. Negativo fuerte
  for (const pat of NEGATIVE_PATTERNS) {
    if (pat.test(haystack)) {
      return {
        relevance_status: "irrelevant",
        relevance_reason: `Perfil descartado por keyword negativa: "${pat.source}"`,
        sector_tags: [],
        crypto_signal: false,
      };
    }
  }

  const tags: string[] = [];
  let cryptoSignal = false;

  const hasCrypto = CRYPTO_PATTERNS.some((p) => p.test(haystack));
  const hasWealth = WEALTH_PATTERNS.some((p) => p.test(haystack));
  const hasLegal = LEGAL_PATTERNS.some((p) => p.test(haystack));
  const hasEntrepreneur = ENTREPRENEUR_PATTERNS.some((p) => p.test(haystack));

  if (hasCrypto) {
    tags.push("crypto");
    cryptoSignal = true;
  }
  if (hasWealth) tags.push("wealth_mgmt");
  if (hasLegal) tags.push("legal_succession");

  // 2-4. Match positivo directo en sectores afines a VaultBit
  if (hasCrypto || hasWealth || hasLegal) {
    const sectorNames = [
      hasCrypto && "cripto/Web3",
      hasWealth && "wealth/banca privada",
      hasLegal && "legal/sucesorio",
    ]
      .filter(Boolean)
      .join(" + ");
    return {
      relevance_status: "relevant",
      relevance_reason: `Match heurístico positivo: ${sectorNames}`,
      sector_tags: tags,
      crypto_signal: cryptoSignal,
    };
  }

  // 5. Empresario sin señal cripto → review (Gemini decide)
  if (hasEntrepreneur) {
    return {
      relevance_status: "review",
      relevance_reason:
        "Empresario sénior sin señal cripto detectada en title/company — clasificar con Gemini",
      sector_tags: ["entrepreneur_unverified"],
      crypto_signal: false,
    };
  }

  // 6. Sin match positivo ni empresarial
  return {
    relevance_status: "irrelevant",
    relevance_reason: "Sin keywords del sector detectadas en title/company",
    sector_tags: [],
    crypto_signal: false,
  };
}
