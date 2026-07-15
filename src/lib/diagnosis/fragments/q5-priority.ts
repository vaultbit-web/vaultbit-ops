/**
 * Reglas de priorización + framing de portada según Q5.
 *
 * Q5 (preocupación principal del lead) determina:
 *   · El ORDEN en que se renderizan los 3 bloques en el PDF
 *   · La PORTADA (eyebrow, headline, lede)
 *   · La justificación de la HOJA DE RUTA en la página 3
 *
 * Heurística de orden: arrancar por el bloque que el lead identifica como
 * dolor principal NO siempre es lo correcto. Para inheritance, por ejemplo,
 * si Q3=none entonces el fiscal aprieta MÁS que la herencia en sí (porque
 * sin regularización la herencia es inútil). El composer puede sobrescribir
 * el orden si una regla específica del eje Q3/Q4 lo demanda.
 */

import type { Q5Value, PriorityRule } from "../types";

export const PRIORITY_BY_Q5: Record<Q5Value, PriorityRule> = {
  // ─────────────────────────────────────────────────────────
  // inheritance · perfil Fredo
  // ─────────────────────────────────────────────────────────
  inheritance: {
    concern: "inheritance",
    blockOrder: ["fiscal", "inheritance", "custody"],
    eyebrow: "DIAGNÓSTICO TÉCNICO PERSONALIZADO · HERENCIA DIGITAL",
    headline: "Lo que pasa con tu cripto si tú faltas mañana.",
    lede: "Has marcado herencia como tu preocupación principal. Antes de hablar de protocolos de transmisión, hay que asegurar que lo que se transmite sea técnica y fiscalmente recibible. Ese es el orden de este informe.",
    roadmapRationale:
      "Tu preocupación principal es la herencia. Pero el orden de ejecución no es \"empezar por la herencia\": la regularización fiscal va primero, porque sin ella tus herederos heredan una deuda con Hacienda sobre activos que pueden no llegar a rescatar. Una vez cerrado el frente fiscal, el plan de herencia se construye sobre base limpia, y la auditoría de custodia cierra el ciclo.",
    draft: false,
  },

  // ─────────────────────────────────────────────────────────
  // security · preocupación en custodia
  // ─────────────────────────────────────────────────────────
  security: {
    concern: "security",
    blockOrder: ["custody", "fiscal", "inheritance"],
    eyebrow: "DIAGNÓSTICO TÉCNICO PERSONALIZADO · CUSTODIA",
    headline: "Hasta dónde aguanta tu setup contra el peor escenario.",
    lede: "Has marcado la seguridad y la custodia como tu preocupación principal. El orden del informe es lógico para tu caso: primero auditamos la arquitectura física de tus claves, después la trazabilidad fiscal que el Estado va a empezar a exigir desde 2026, y al final la transmisión a herederos. Sin las dos primeras capas, la tercera no se construye.",
    roadmapRationale:
      "Tu prioridad declarada es la custodia, y por ahí empieza el plan. Una arquitectura con redundancia geográfica y soporte ignífugo es la base sobre la que cualquier otra capa funciona. Una vez asegurado que el activo es operacionalmente recuperable, se cierra el frente fiscal porque DAC8 entra en vigor en 2026 y va a obligar a reconstruir cartera FIFO de forma defendible. Y por último el plan de herencia, que carece de sentido si las dos primeras capas fallan.",
    draft: false,
  },

  // ─────────────────────────────────────────────────────────
  // fiscal · preocupación en fiscalidad
  // ─────────────────────────────────────────────────────────
  fiscal: {
    concern: "fiscal",
    blockOrder: ["fiscal", "custody", "inheritance"],
    eyebrow: "DIAGNÓSTICO TÉCNICO PERSONALIZADO · FISCALIDAD",
    headline: "Lo que Hacienda va a poder ver de ti a partir de 2026.",
    lede: "Has marcado la fiscalidad como tu preocupación principal y la razón es válida. DAC8 (Directiva UE 2023/2226) entra en vigor el 1 de enero de 2026 y obliga a todos los proveedores de servicios cripto que operen en la UE a reportar las posiciones de sus usuarios residentes a la autoridad fiscal del país. El cruce de datos pasa de teórico a sistemático y retroactivo. El orden del informe refleja eso.",
    roadmapRationale:
      "Tu prioridad declarada es fiscal y el orden del plan parte de ahí. Antes del cruce DAC8 conviene cerrar el frente con la AEAT, idealmente con regularización guiada que reduce el recargo y elimina la sanción. Una vez asegurada la base imponible, auditamos custodia para que la cartera FIFO sea reconstruible y trazable hacia el futuro, no solo el pasado. Y por último el plan de herencia, que se construye sobre una situación fiscal limpia y transmisible.",
    draft: false,
  },

  // ─────────────────────────────────────────────────────────
  // business · preocupación en cripto corporativa / B2B
  // ─────────────────────────────────────────────────────────
  business: {
    concern: "business",
    blockOrder: ["custody", "inheritance", "fiscal"],
    eyebrow: "DIAGNÓSTICO TÉCNICO PERSONALIZADO · WEB3 B2B",
    headline: "Cómo se mete cripto en tesorería corporativa sin romper el balance ni el órgano de administración.",
    lede: "Has marcado Web3 B2B como tu preocupación principal. En entorno societario, la custodia y la continuidad operativa van por delante de la fiscalidad porque la fiscalidad corporativa de cripto es exigente pero más tabular y más reglamentada que la del particular. Lo que descontrola un balance corporativo es perder firma técnica o tener un administrador único con acceso exclusivo, no el cálculo del IS sobre la posición.",
    roadmapRationale:
      "En entorno corporativo el cuello de botella suele ser la firma. Una multifirma 2-de-3 entre administradores, con reparto documentado de quién custodia qué y un protocolo de incorporación o salida ante notario, resuelve la mayor parte de los riesgos operativos y de continuidad. El plan de herencia societario va en segundo lugar porque la sociedad sobrevive al socio, pero solo si la firma sobrevive. La trazabilidad fiscal corporativa va al final porque, comparada con la del particular, es más previsible: contabilizada en libros, criterio FIFO o coste medio según política, y conciliable con los modelos 232 / 200.",
    draft: false,
  },
};
