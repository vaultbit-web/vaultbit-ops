/**
 * Modificadores de tono según Q1 (experiencia del lead).
 *
 * No tocan los 3 bloques técnicos (datos verificables son universales).
 * Modifican: saludo del email, glosario inyectado cuando aplica, cierre.
 *
 * Regla anti-IA aplicable a TODOS los strings:
 *   · Cero em-dashes (—)
 *   · Cero "no es solo X sino Y"
 *   · Primera persona, frases de longitud variable
 */

import type { Q1Value, ToneModifier } from "../types";

export const TONE_BY_Q1: Record<Q1Value, ToneModifier> = {
  // ─────────────────────────────────────────────────────────
  // institutional · perfil family office / corporativo
  // ─────────────────────────────────────────────────────────
  institutional: {
    level: "institutional",
    audienceLabel: "tesorería corporativa",
    antiAiClosing:
      "Este correo lo escribo yo, no es un sistema automatizado. Si la propuesta encaja con el órgano que toma la decisión en tu estructura, agendamos. Si no encaja por compliance interno, también es información útil.",
    glossaryHint: null,
    draft: false,
  },

  // ─────────────────────────────────────────────────────────
  // senior · 3+ años, técnico, autocustodia (perfil Fredo)
  // ─────────────────────────────────────────────────────────
  senior: {
    level: "senior",
    audienceLabel: "inversor con autocustodia consolidada",
    antiAiClosing:
      "Este correo lo escribo yo, no un sistema automatizado. Si lo que te cuento aquí no encaja con tu situación real, dímelo y se acabó la conversación.",
    glossaryHint: null,
    draft: false,
  },

  // ─────────────────────────────────────────────────────────
  // medium · 1-3 años, conoce términos básicos
  // ─────────────────────────────────────────────────────────
  medium: {
    level: "medium",
    audienceLabel: "inversor con experiencia operativa",
    antiAiClosing:
      "Este correo lo escribo yo, no un sistema automatizado. Si algo de lo de arriba te suena distinto a tu caso real, dímelo y lo ajustamos antes de la llamada.",
    glossaryHint: null,
    draft: false,
  },

  // ─────────────────────────────────────────────────────────
  // new · primer año, vocabulario básico
  // ─────────────────────────────────────────────────────────
  new: {
    level: "new",
    audienceLabel: "inversor en su primera fase",
    antiAiClosing:
      "Este correo lo escribo yo, no un sistema automatizado. Si hay términos del análisis que no te quedan claros, respóndeme y los traduzco al lenguaje de tu día a día. Mejor preguntar dos veces que asumir una.",
    glossaryHint:
      "Algunos términos que verás en el informe traducidos por si te ayudan. Seed phrase: las 12 o 24 palabras que recuperan tu wallet si pierdes el dispositivo, son la auténtica clave de todo. Cold storage: dispositivo offline tipo Ledger o Trezor que firma transacciones sin estar conectado a internet. Modelo 721: la declaración a Hacienda de saldos cripto en plataformas fuera de España. DAC8: la directiva europea que obliga a los exchanges a reportar tus posiciones a la AEAT desde 2026.",
    draft: false,
  },
};
