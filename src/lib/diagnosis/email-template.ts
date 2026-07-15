/**
 * Composer del email de diagnóstico.
 *
 * Enfoque relacional primero: el primer contacto no es un análisis,
 * es una propuesta de conversación. El PDF adjunto contiene el análisis.
 */

import type { DiagnosisModel } from "./types";

const CAL_URL = "https://cal.com/infovaultbit/30min";
const WHATSAPP_URL = "https://wa.me/34933236049";
const FOUNDER_EMAIL = "danielbrosed@vaultbit.es";
const FOUNDER_PHONE = "+34 933 236 049";

function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "Hola";
  const first = trimmed.split(/\s+/)[0];
  return first || "Hola";
}

export interface ComposedEmail {
  subject: string;
  body: string;
}

export function composeDiagnosisEmail(model: DiagnosisModel): ComposedEmail {
  const name = firstName(model.lead.name);

  const subject = `${name}, quería escribirte antes de que leyeras el informe`;

  const body = `${name},

Soy Daniel, fundador de VaultBit.

Antes de que abras el PDF quería presentarme en persona, porque lo que hacemos no encaja en un formulario de cinco preguntas.

He visto lo que marcaste y tengo una idea de por dónde va tu situación, pero prefiero escuchártelo a ti directamente que asumir nada.

¿Podemos hablar 20 o 30 minutos? Sin agenda de ventas, sin presentación. Una conversación para que yo entienda bien tu caso y tú veas si lo que hacemos tiene sentido para ti.

Si te viene bien esta semana:
${CAL_URL}

O si prefieres algo más directo, puedes escribirme por WhatsApp:
${WHATSAPP_URL}

El informe técnico va adjunto. Léelo cuando puedas, sin prisa. No te va a pedir nada ni te va a redirigir a ningún sitio.

Un saludo,
Daniel Brosed Giral
Fundador · VaultBit Advisory
${FOUNDER_EMAIL} · ${FOUNDER_PHONE}`;

  return { subject, body };
}
