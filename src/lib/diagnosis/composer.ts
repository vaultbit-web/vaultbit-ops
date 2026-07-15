/**
 * Composer del diagnóstico personalizado.
 *
 * Toma las 5 respuestas Q1-Q5 del lead y devuelve un DiagnosisModel
 * con los 3 bloques en el orden correcto, la portada, la hoja de ruta
 * y el modificador de tono. El PDF y el email consumen este modelo.
 *
 * Lógica pura: sin IO, sin Supabase, sin React. Testeable directamente.
 */

import type {
  DiagnosisAnswers,
  DiagnosisBlock,
  DiagnosisModel,
  BlockKey,
} from "./types";
import { CUSTODY_BY_Q2 } from "./fragments/q2-custody";
import { FISCAL_BY_Q3 } from "./fragments/q3-fiscal";
import { INHERITANCE_BY_Q4 } from "./fragments/q4-inheritance";
import { PRIORITY_BY_Q5 } from "./fragments/q5-priority";
import { TONE_BY_Q1 } from "./fragments/q1-tone";

interface ComposeInput {
  id: string;
  name: string;
  email: string;
  answers: DiagnosisAnswers;
  generatedAt?: Date;
}

export function composeDiagnosis(input: ComposeInput): DiagnosisModel {
  const { answers } = input;

  // Selección de fragmentos
  const custody = CUSTODY_BY_Q2[answers.q2];
  const fiscal = FISCAL_BY_Q3[answers.q3];
  const inheritance = INHERITANCE_BY_Q4[answers.q4];
  const priority = PRIORITY_BY_Q5[answers.q5];
  const tone = TONE_BY_Q1[answers.q1];

  // Mapa key → bloque para reordenar según priority.blockOrder
  const blockMap: Record<BlockKey, DiagnosisBlock> = {
    custody,
    fiscal,
    inheritance,
  };

  const orderedBlocks: [DiagnosisBlock, DiagnosisBlock, DiagnosisBlock] = [
    blockMap[priority.blockOrder[0]],
    blockMap[priority.blockOrder[1]],
    blockMap[priority.blockOrder[2]],
  ];

  // Si CUALQUIER fragmento usado es DRAFT, propagamos al modelo entero.
  // El server action lo usará para bloquear el envío real.
  const hasDrafts =
    custody.draft ||
    fiscal.draft ||
    inheritance.draft ||
    priority.draft ||
    tone.draft;

  return {
    lead: {
      id: input.id,
      name: input.name,
      email: input.email,
      answers,
      archetype: answers.q5,
      generatedAt: input.generatedAt ?? new Date(),
    },
    cover: {
      eyebrow: priority.eyebrow,
      headline: priority.headline,
      lede: priority.lede,
    },
    blocks: orderedBlocks,
    roadmap: {
      sequence: priority.blockOrder,
      rationale: priority.roadmapRationale,
    },
    tone,
    hasDrafts,
  };
}

// ─────────────────────────────────────────────────────────
// Helpers de presentación compartidos por PDF y email
// ─────────────────────────────────────────────────────────

const Q1_LABEL: Record<string, string> = {
  new: "menos de un año en cripto",
  medium: "entre uno y tres años",
  senior: "más de tres años, perfil técnico",
  institutional: "perfil family office o corporativo",
};

const Q2_LABEL: Record<string, string> = {
  exchange: "patrimonio principal en exchange centralizado",
  cold: "hardware wallet (cold storage)",
  mixed: "arquitectura mixta (parte caliente, parte fría)",
  unsure: "sin inventario claro",
};

const Q3_LABEL: Record<string, string> = {
  compliant: "declaras desde el inicio",
  partial: "declaración parcial",
  none: "nunca declarado",
  unknown: "estado por determinar",
};

const Q4_LABEL: Record<string, string> = {
  protocol: "protocolo de herencia documentado",
  "partial-plan": "plan de herencia incompleto",
  hidden: "familia desconoce el patrimonio cripto",
  company: "patrimonio cripto en sociedad",
};

const Q5_LABEL: Record<string, string> = {
  security: "seguridad y custodia",
  fiscal: "fiscalidad",
  inheritance: "herencia digital",
  business: "Web3 B2B",
};

/**
 * Resumen en lenguaje natural de las 5 respuestas para inyectar en el
 * cuerpo del email y mostrarle al lead que se ha leído sus respuestas.
 */
export function describeAnswers(a: DiagnosisAnswers): string {
  return `${Q1_LABEL[a.q1]}, ${Q2_LABEL[a.q2]}, ${Q3_LABEL[a.q3]}, ${Q4_LABEL[a.q4]}, preocupación principal en ${Q5_LABEL[a.q5]}`;
}

export function formatLongDateEs(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}
