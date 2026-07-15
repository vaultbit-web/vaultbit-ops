/**
 * Bloques de "punto crítico de CUSTODIA" según Q2.
 *
 * Q2 valores:
 *   · exchange      → patrimonio en exchange centralizado
 *   · cold          → hardware wallet (perfil Fredo)
 *   · mixed         → parte en exchange, parte en cold
 *   · unsure        → no sabe responder (= caos operativo)
 *
 * Cada fragmento es independiente del resto de Qs. La priorización
 * (orden) la decide Q5 en q5-priority.ts.
 */

import type { Q2Value, DiagnosisBlock } from "../types";

export const CUSTODY_BY_Q2: Record<Q2Value, DiagnosisBlock> = {
  // ─────────────────────────────────────────────────────────
  // cold · hardware wallet única (perfil Fredo)
  // ─────────────────────────────────────────────────────────
  cold: {
    key: "custody",
    title: "Redundancia geográfica de la seed",
    damage:
      "Tienes cold storage. Si la seed vive en un solo sitio físico, sigues a un incendio o una mudanza de perderlo todo.",
    body: [
      "Una hardware wallet resuelve el vector cibernético, no el doméstico. James Howells era profesional técnico británico y en 2013 desechó por error un disco con las claves de 8.000 BTC. En enero de 2025 el Tribunal Superior del Reino Unido cerró la puerta a recuperarlo: doce años de litigio para confirmar que el dispositivo es propiedad inalienable del ayuntamiento.",
      "Coincover estima que cerca del 47% del valor cripto potencialmente heredable se pierde por incidentes domésticos: incendios, inundaciones, mudanzas, divorcios. No por hackeos.",
      "Si tu seed de 24 palabras está transcrita en un solo papel, en un solo cajón, en una sola casa, el modelo de seguridad de tu hardware wallet es solo aparente. La pieza real es el soporte donde están las palabras.",
    ],
    protocol: [
      "Inventaria primero: ¿dónde está la seed exactamente, en qué soporte, quién más sabe que existe?",
      "Aplica un esquema Shamir SLIP-39 con quórum 2-de-3 o, si Shamir no aplica, divide la seed en fragmentos lógicos documentados.",
      "Distribuye los fragmentos en ubicaciones físicamente independientes: domicilio, caja de seguridad bancaria o notarial, residencia secundaria de confianza.",
      "Sustituye papel por placas de acero inoxidable o titanio. El papel sobrevive a la humedad y al tiempo, pero no a un incendio.",
      "Documenta el sistema y prueba la recuperación al menos una vez al año en un dispositivo limpio.",
    ],
    redLine:
      "VaultBit diseña la matriz de dispersión geográfica y supervisa la inicialización Shamir. El titular es el único custodio físico de los fragmentos.",
    emailSummary:
      "Tu cold storage protege contra el ataque cibernético, no contra el incidente doméstico. Si la seed vive en una sola ubicación física, una mudanza o un incendio te cuestan el patrimonio entero. La solución es Shamir SLIP-39 o equivalente, distribución geográfica, soporte ignífugo.",
    draft: false,
  },

  // ─────────────────────────────────────────────────────────
  // exchange · patrimonio principal en exchange centralizado
  // ─────────────────────────────────────────────────────────
  exchange: {
    key: "custody",
    title: "Patrimonio en custodia de un tercero",
    damage:
      "Mantener el grueso en un exchange te convierte en acreedor de la plataforma, no propietario del activo. Si la plataforma cae, congela retiradas o sufre un compromiso, tu posición desaparece sin recurso.",
    body: [
      "Entre 2009 y 2024 desaparecieron 8.494 millones de dólares en hackeos a exchanges. En febrero de 2025, un único compromiso a Bybit sustrajo 1.500 millones en una sola noche. Solo en 2025 el ecosistema cripto sufrió robos por más de 3.400 millones, y la velocidad se aceleró: lo que en 2022 tardó 214 días en superarse, en 2025 se alcanzó en 142.",
      "El precedente más doloroso para el inversor español sigue siendo QuadrigaCX. La plataforma quebró en 2018 con 190 millones de dólares en custodia y los usuarios nunca recuperaron el activo porque el fundador, que era custodio único de las claves frías, falleció sin transmitirlas. Es el ejemplo más claro de que custodia centralizada y custodia técnica no son lo mismo.",
      "El Reglamento UE 2023/1114 (MiCA), en su Recital 83, obliga a los proveedores de custodia centralizada a responder por pérdidas derivadas de incidentes técnicos. Pero el propio texto reconoce expresamente la superioridad de las wallets no custodiales: aquellas donde el usuario mantiene el control exclusivo de las claves privadas. La regulación no protege como propietario, te indemniza como acreedor.",
    ],
    protocol: [
      "Usa el exchange exclusivamente como punto de paso para operar, jamás como bóveda a largo plazo.",
      "Una vez ejecutada la compra, transfiere a hardware wallet bajo tu control en menos de 24 horas. La fricción operativa es el coste de la propiedad real.",
      "Si necesitas operar con frecuencia, separa por capas: una billetera caliente con cantidad mínima para operativa diaria, el patrimonio core en cold storage offline.",
      "Distribuye exchanges si el volumen lo justifica. Concentrar todo en una sola plataforma duplica el riesgo de concentración aunque sea regulada.",
    ],
    redLine:
      "VaultBit diseña la arquitectura para que tengas el control absoluto. La propiedad del activo recae siempre en quien posee la clave privada, y la clave privada nunca pasa por nuestras manos.",
    emailSummary:
      "Tu patrimonio principal está en custodia de un tercero. Eso te convierte legalmente en acreedor de la plataforma, no propietario del activo. La regulación europea MiCA reconoce explícitamente la superioridad de las wallets no custodiales. La solución arranca por mover el grueso a hardware wallet en menos de 24h tras compra.",
    draft: false,
  },

  // ─────────────────────────────────────────────────────────
  // mixed · parte en exchange, parte en cold
  // ─────────────────────────────────────────────────────────
  mixed: {
    key: "custody",
    title: "Arquitectura mixta sin separación operativa clara",
    damage:
      "Tener parte en exchange y parte en cold sin un criterio claro mezcla riesgos. El exchange no protege la parte que está en cold, y la cold no compensa la del exchange si esa cae. Dos vectores activos.",
    body: [
      "La arquitectura mixta es la situación intermedia más común y, paradójicamente, la peor entendida. Cuando el porcentaje en exchange es alto, el blindaje del cold se anula proporcionalmente. Si el 60% sigue en exchange, has hecho el esfuerzo técnico de configurar un cold wallet pero solo proteges el 40% real.",
      "La arquitectura típica de un family office bien diseñado opera con tres capas: 5% caliente para operativa frecuente, 25% en cold storage de acceso semanal, 70% en custodia profunda multifirma con quórum y separación geográfica. El criterio no es opcional, es lo que distingue arquitectura de improvisación.",
      "El otro síntoma de mixto sin criterio es el desconocimiento del % real en cada capa a fecha de hoy. La autoevaluación rápida es: ¿podrías decirme ahora mismo qué % de tu patrimonio cripto está en cada plataforma sin abrirla? Si no, no es arquitectura, es histórico.",
    ],
    protocol: [
      "Auditoría del estado actual: snapshot de cada plataforma, % por capa, fecha de la última transferencia entre capas.",
      "Definición de política por capas con umbrales explícitos. Ejemplo conservador: caliente máximo 5%, semilíquida 25%, cold profunda 70%.",
      "Automatización del barrido a cold cuando la caliente supera el umbral. Reduce el riesgo de inacción por inercia.",
      "Doble registro técnico de cada operación de transferencia entre capas (CSV exchange + nota interna con hash). Sirve para trazabilidad fiscal y auditoría.",
      "Revisión trimestral del porcentaje real frente al objetivo. Sin revisión periódica, la deriva al exchange es la dirección por defecto del comportamiento humano.",
    ],
    redLine:
      "VaultBit diseña la política de capas y los umbrales según tu perfil de riesgo. La ejecución de los movimientos entre capas la realiza el titular, nosotros nunca movemos fondos.",
    emailSummary:
      "Tu arquitectura mixta no tiene umbrales documentados. Cuando el porcentaje en exchange es alto, el blindaje del cold se anula proporcionalmente. La arquitectura típica de family office opera con tres capas con porcentajes explícitos: 5% caliente, 25% semilíquida, 70% cold profunda. Sin política escrita y revisión trimestral, la deriva al exchange es la dirección por defecto.",
    draft: false,
  },

  // ─────────────────────────────────────────────────────────
  // unsure · no sabe / no responde
  // ─────────────────────────────────────────────────────────
  unsure: {
    key: "custody",
    title: "Inventario de custodia inexistente",
    damage:
      "Si no puedes responder dónde está exactamente cada satoshi tuyo, la fase 1 no es protocolo, es inventario. Sin saber qué tienes y dónde, no se diseña arquitectura, se improvisa.",
    body: [
      "Solo en 2025 se documentaron 158.000 incidentes de billeteras individuales comprometidas, afectando a 80.000 víctimas únicas. Una porción significativa empieza por algo más prosaico que un hackeo: el titular no recordaba que tenía saldos en una plataforma vieja, en una testnet, en una wallet de un proyecto de gaming, o en una NFT que nunca movió.",
      "El inventario es el paso que casi nadie hace y que define todo lo demás. Sin saber qué tienes en cada plataforma a día de hoy, qué seed phrase corresponde a qué wallet, y qué direcciones públicas son tuyas en cada cadena, cualquier conversación sobre 'arquitectura' o 'protocolo' es prematura.",
      "En España, el INCIBE gestionó más de 122.223 incidentes de ciberseguridad en 2024, un 26% más que el año anterior. Los datos disponibles sugieren que el inventario incompleto es el factor común en una mayoría de incidentes domésticos. No por un fallo técnico sofisticado, sino por desconocimiento del propio titular del estado de su patrimonio digital.",
    ],
    protocol: [
      "Snapshot de direcciones públicas en cada cadena que has tocado (BTC, ETH, BSC, Solana, etc.). Solo direcciones, sin claves privadas.",
      "Verificación de saldos on-chain con block explorer público. Confirma qué hay realmente en cada dirección a fecha de hoy.",
      "Identificación de setups olvidados: testnet, wallets de proyectos de gaming, hot wallets de DEX, NFTs en plataformas que ya no operas.",
      "Mapeo seed phrase → wallet → plataforma. Si tienes seeds anotadas pero no recuerdas a qué wallet pertenecen, es la primera tarea a resolver.",
      "Documento maestro confidencial con el inventario completo. Es la base sobre la que se diseña cualquier arquitectura posterior.",
    ],
    redLine:
      "VaultBit acompaña el proceso de inventario con metodología sin tocar nunca tus claves. El listado completo lo construye y custodia el titular en privado.",
    emailSummary:
      "Sin inventario claro, cualquier conversación sobre arquitectura es prematura. La fase 1 es identificar qué tienes en cada plataforma, qué seeds corresponden a qué wallets, y qué direcciones públicas son tuyas en cada cadena. El inventario incompleto es el factor común en una mayoría de incidentes domésticos, por encima de hackeos sofisticados.",
    draft: false,
  },
};
