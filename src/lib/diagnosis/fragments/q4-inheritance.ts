/**
 * Bloques de "punto crítico de HERENCIA" según Q4.
 *
 * Q4 valores:
 *   · protocol      → ya tiene protocolo de herencia documentado
 *   · partial-plan  → algo pendiente de organizar (perfil Fredo)
 *   · hidden        → familia no sabe ni que existe
 *   · company       → cripto en sociedad (gestión por socios)
 */

import type { Q4Value, DiagnosisBlock } from "../types";

export const INHERITANCE_BY_Q4: Record<Q4Value, DiagnosisBlock> = {
  // ─────────────────────────────────────────────────────────
  // partial-plan · algo pendiente de organizar (perfil Fredo)
  // ─────────────────────────────────────────────────────────
  "partial-plan": {
    key: "inheritance",
    title: "Plan de herencia incompleto",
    damage:
      "Reconoces que hay piezas pendientes. En herencia digital, lo pendiente es lo que evapora el patrimonio. La familia hereda el modelo 720, no el bitcoin.",
    body: [
      "El Impuesto sobre Sucesiones se calcula en España sobre el valor de mercado a fecha de fallecimiento, no a fecha de cobro. Si tus herederos no tienen acceso técnico inmediato a los activos, la deuda tributaria se devenga sobre una riqueza físicamente inaccesible. Han ocurrido casos en los que la familia ha tenido que liquidar otros bienes para pagar el impuesto sobre cripto que no podía mover.",
      "El Código Civil (arts. 658-663) y la LOPDGDD (art. 96) regulan en España la figura del testamento digital y el albacea digital. La arquitectura legal existe; lo que casi nadie tiene resuelto es la traducción técnica de esa figura: cómo se entregan las claves sin escribirlas en el testamento, quién custodia qué fragmento, qué pasos exactos sigue el heredero.",
      "Coincover estima que hasta el 47% del valor cripto potencialmente heredable se pierde de forma irreversible por falta de transmisión documentada. No por mala fe ni por fraude: por silencio operativo del titular.",
      "El caso de referencia es Gerald Cotten, fundador de QuadrigaCX, fallecido en 2018 sin transmitir las claves frías de la plataforma. 190 millones de dólares quedaron permanentemente bloqueados. El patrón aplica también a casos personales de menor escala.",
    ],
    protocol: [
      "Crea un inventario de direcciones públicas (sin claves privadas) para que los herederos puedan tasar a fecha de fallecimiento.",
      "Aplica esquema Shamir SLIP-39 con quórum 2-de-3 o 3-de-5 entre ubicaciones físicamente independientes.",
      "Designa albacea digital ante notario al amparo del art. 96 LOPDGDD.",
      "Redacta un Manual del Heredero técnico, paso a paso, comprensible por alguien sin conocimiento cripto previo. Probarlo con una persona ajena al setup es la única forma de validarlo.",
      "Crítico: el testamento legal hace referencia al protocolo y a las ubicaciones. NUNCA contiene la seed phrase ni contraseñas en el cuerpo del documento.",
    ],
    redLine:
      "VaultBit diseña el flujo técnico post-mortem y coordina con notarios y fiscalistas partner. No redactamos documentos jurídicos ni asumimos rol de albacea.",
    emailSummary:
      "Reconoces que hay piezas pendientes. En herencia cripto, lo pendiente es lo que evapora el patrimonio: el Impuesto de Sucesiones se devenga sobre valor de mercado, no sobre lo que la familia consiga rescatar. La pieza no escrita es el Manual del Heredero técnico, validado con una persona ajena al setup.",
    draft: false,
  },

  // ─────────────────────────────────────────────────────────
  // protocol · ya tiene protocolo documentado
  // ─────────────────────────────────────────────────────────
  protocol: {
    key: "inheritance",
    title: "Validación y refinamiento del protocolo existente",
    damage:
      "Tienes protocolo de herencia. Mi pregunta es la única que importa: ¿le has dado el manual a alguien ajeno al setup y le has pedido que recupere un satoshi siguiéndolo? Si no, el protocolo no está validado, está escrito.",
    body: [
      "El gap entre protocolo en papel y protocolo funcional es donde fallan la mayoría de planes que existen pero no funcionan. Un Shamir SLIP-39 con quórum 2-de-3 redactado en una notaría sirve técnicamente, pero si las tres ubicaciones físicas son la misma casa en habitaciones distintas, el quórum no protege contra un incendio. Si el albacea designado no sabe leer una QR de fragmento, el protocolo se convierte en una caja fuerte sin combinación.",
      "El otro fallo silencioso es la rotación de personas. Tu protocolo se firmó hace dos años con un albacea concreto, una pareja concreta, un notario concreto. ¿Siguen siendo las personas adecuadas? El divorcio, el distanciamiento familiar, el cambio de notaría o la jubilación del albacea técnico convierten un protocolo válido en uno inutilizable.",
      "Coincover estima que cerca del 47% del valor cripto potencialmente heredable se pierde de forma irreversible. Una porción significativa de esos casos NO son patrimonios sin protocolo, son protocolos que existían pero que nadie había probado. La probabilidad de que un protocolo no validado funcione el día que se necesita es asimétrica: puede que funcione o puede que no, sin posibilidad de saberlo de antemano.",
      "La buena noticia para tu perfil: no partimos de cero. La mala: la auditoría es más exigente que la creación. Buscamos los puntos donde tu protocolo asume cosas que no se han probado.",
    ],
    protocol: [
      "Lectura crítica del documento existente: identifica las asunciones implícitas (qué supone que hace el albacea, qué asume del estado del notario, qué da por hecho del ecosistema cripto que en cinco años puede haber cambiado).",
      "Verificación de la diversificación geográfica real de los fragmentos. Si los fragmentos viven en ubicaciones que comparten un mismo riesgo (incendio, robo coordinado, decisión administrativa), el quórum es aparente.",
      "Prueba en seco con persona ajena: dale el Manual del Heredero a alguien que no haya participado en su redacción y pídele que lo siga hasta recuperar 1 satoshi de prueba. Si tarda más de 2 horas o necesita preguntarte algo, el manual no está terminado.",
      "Revisión de personas designadas: ¿el albacea sigue activo, sigue siendo de confianza, sigue siendo capaz técnicamente? ¿La pareja designada como custodio sigue siéndolo legalmente?",
      "Ciclo de revisión documentado: cada 18 meses se reabre el protocolo, se actualizan las personas si cambiaron, se prueba la recuperación, y se sella la nueva versión ante notario.",
    ],
    redLine:
      "VaultBit audita el protocolo existente y el Manual del Heredero. La actualización de la escritura ante notario y los cambios registrales los firma el notario partner, no nosotros.",
    emailSummary:
      "Tienes protocolo. La pregunta única: ¿lo has probado entregándole el manual a alguien ajeno al setup? Si no, no está validado. Coincover estima que un porcentaje significativo de pérdidas heredables ocurren con protocolos que existían pero nadie había probado. El gap entre protocolo en papel y protocolo funcional es donde fallan la mayoría.",
    draft: false,
  },

  // ─────────────────────────────────────────────────────────
  // hidden · familia no sabe ni que existe
  // ─────────────────────────────────────────────────────────
  hidden: {
    key: "inheritance",
    title: "Patrimonio cripto opaco para la familia",
    damage:
      "Si tú faltaras esta noche, tu familia no sabría ni que existe. Y aun sabiéndolo, hereda la carga fiscal sobre activos que no puede mover. Asfixia financiera total con patrimonio inaccesible.",
    body: [
      "El caso de referencia internacional es Gerald Cotten, fundador de QuadrigaCX, fallecido en 2018 sin transmitir las claves frías de la plataforma. 190 millones de dólares quedaron permanentemente bloqueados. El patrón aplica también a casos personales de menor escala que no salen en prensa: el patrimonio existe en cadena, la liquidez tributaria que devenga el Impuesto sobre Sucesiones también, pero la familia no puede acceder al activo para pagar la cuota.",
      "El Impuesto sobre Sucesiones se calcula en España sobre el valor de mercado a fecha de fallecimiento, no sobre lo que la familia consiga rescatar. Si tus criptoactivos valen 200.000 euros el día que falleces y la familia no logra acceder a ellos, contraen una deuda tributaria sobre 200.000 euros que pueden tener que liquidar con otros bienes.",
      "La transparencia patrimonial total no es necesaria. Lo que sí es imprescindible es transparencia sobre la EXISTENCIA del patrimonio y el ACCESO técnico. Tu pareja o tus hijos no necesitan saber el saldo exacto, pero sí saber que existe, dónde está documentado el protocolo de acceso, y a quién contactar (albacea digital, notario) cuando llegue el momento.",
      "El Código Civil (arts. 658-663) y la LOPDGDD (art. 96) regulan en España la figura del testamento digital y el albacea digital. La arquitectura legal existe; lo que falta en tu caso es la traducción técnica de esa figura: cómo se entregan las claves sin escribirlas en el testamento, quién custodia qué fragmento, qué pasos exactos sigue el heredero técnicamente.",
    ],
    protocol: [
      "Carta de existencia: documento sellado y depositado donde tu familia (o tu albacea de confianza) descubrirá, en caso de fallecimiento, que existe un patrimonio cripto sin necesidad de revelar el saldo.",
      "Designación de albacea digital ante notario al amparo del art. 96 LOPDGDD. Persona técnica de confianza con instrucciones específicas, distinta del albacea testamentario tradicional si es necesario.",
      "Esquema Shamir SLIP-39 con quórum 2-de-3 entre ubicaciones independientes. La familia activa el quórum solo cuando se cumplen las condiciones definidas (defunción, incapacidad).",
      "Manual del Heredero técnico paso a paso, comprensible por alguien sin conocimiento cripto previo. Probarlo con una persona ajena al setup es la única forma de validar que funciona.",
      "Crítico: el testamento legal hace referencia al protocolo y a las ubicaciones de los fragmentos. NUNCA contiene la seed phrase ni contraseñas en el cuerpo del documento, eso lo convierte en un mapa al activo y abre vector de ataque inverso.",
    ],
    redLine:
      "VaultBit diseña el flujo técnico post-mortem y coordina con notarios y fiscalistas partner. No redactamos documentos jurídicos ni asumimos rol de albacea. Esa figura la asume una persona física de tu confianza o un profesional colegiado.",
    emailSummary:
      "Tu patrimonio cripto es invisible para tu familia. El día que falleces, hereda la carga fiscal sobre activos que no puede mover. El precedente Gerald Cotten / QuadrigaCX es la versión amplificada del mismo problema. La transparencia patrimonial total no es necesaria, pero sí lo es transparencia sobre la EXISTENCIA y el ACCESO técnico, formalizado vía albacea digital ante notario.",
    draft: false,
  },

  // ─────────────────────────────────────────────────────────
  // company · cripto en sociedad
  // ─────────────────────────────────────────────────────────
  company: {
    key: "inheritance",
    title: "Continuidad operativa en sociedad con cripto en balance",
    damage:
      "Si tu sociedad tiene cripto y eres administrador único con la firma técnica exclusiva, una incapacidad o fallecimiento congela operaciones y dispara el peor escenario fiscal posible para los socios o herederos.",
    body: [
      "El problema de la sociedad con cripto y administrador único es estructural, no operativo. Mientras todo va bien, una sola firma agiliza la operativa. Cuando algo se interrumpe (fallecimiento, incapacidad, ausencia prolongada), no hay continuidad técnica posible y hay que esperar al cambio de administrador en Registro Mercantil, que puede tardar meses. En ese intervalo el activo es inmovilizable, los proveedores no se pagan, el ejercicio fiscal se complica.",
      "La Dirección General de Seguridad Jurídica y Fe Pública ha emitido resoluciones recientes reconociendo cripto como aportación no dineraria al capital social y como activo del balance. Eso facilita la inscripción registral pero no resuelve el problema de la firma técnica: registralmente la sociedad puede tener bitcoin, operativamente sigue dependiendo de quien tenga la seed phrase.",
      "La arquitectura típica de una sociedad bien diseñada con cripto en balance es multifirma 2-de-3 entre administradores o entre figuras de confianza (administrador, asesor financiero, custodio profesional). Gnosis Safe es el estándar de facto en EVM; en Bitcoin, multisig nativa con coordinación entre dispositivos hardware. El quórum desbloquea operaciones y sobrevive a la baja de cualquiera de los firmantes.",
      "El otro frente del corporate es la trazabilidad fiscal: la sociedad debe contabilizar cada operación cripto en libros, declarar las posiciones en el modelo 200 (Impuesto sobre Sociedades), y, si supera umbrales, modelos informativos como el 232. La política contable (FIFO, coste medio) debe quedar fijada en memoria.",
    ],
    protocol: [
      "Diagnóstico registral: quién es administrador único o solidario, qué cláusulas del pacto de socios prevén ausencia o fallecimiento, qué documentación notarial existe sobre la propiedad del activo digital.",
      "Implementación de multifirma 2-de-3 (Gnosis Safe en EVM, multisig nativa en Bitcoin). El quórum se distribuye entre administrador, segundo administrador o socio mayoritario, y custodio profesional o albacea designado.",
      "Pacto de socios actualizado: cláusulas específicas sobre cripto, sobre transmisión inter vivos y mortis causa, sobre quién entra en el quórum si uno de los firmantes original deja la sociedad.",
      "Política contable y fiscal documentada: criterio FIFO o coste medio, tratamiento de staking, tratamiento de swaps, contabilización en libros con criterio uniforme.",
      "Manual de continuidad operativa: qué pasa si el administrador único falta, quién activa el quórum, qué documentos legales son necesarios (acta notarial, certificado de defunción), qué notario partner asume la coordinación.",
    ],
    redLine:
      "VaultBit diseña la arquitectura de multifirma corporativa y el manual de continuidad operativa. Las modificaciones del pacto de socios y las cláusulas registrales las redacta y firma un abogado mercantilista colegiado partner, no nosotros.",
    emailSummary:
      "Tu sociedad tiene cripto y dependes de una sola firma técnica. Una incapacidad o fallecimiento congela operaciones y complica el ejercicio fiscal mientras el Registro Mercantil cambia administrador. La arquitectura corporativa típica es multifirma 2-de-3 entre administrador, segundo administrador y custodio profesional. La DGS reconoce ya cripto como activo societario, pero el problema operativo de la firma persiste si no se reparte explícitamente.",
    draft: false,
  },
};
