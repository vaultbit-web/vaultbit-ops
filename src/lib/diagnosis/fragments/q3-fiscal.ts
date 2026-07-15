/**
 * Bloques de "punto crítico FISCAL" según Q3.
 *
 * Q3 valores:
 *   · compliant   → declara correctamente desde el inicio
 *   · partial     → ha declarado algo, no todo
 *   · none        → nunca ha declarado (perfil Fredo)
 *   · unknown     → no sabe / no responde
 */

import type { Q3Value, DiagnosisBlock } from "../types";

export const FISCAL_BY_Q3: Record<Q3Value, DiagnosisBlock> = {
  // ─────────────────────────────────────────────────────────
  // none · nunca ha declarado (perfil Fredo)
  // ─────────────────────────────────────────────────────────
  none: {
    key: "fiscal",
    title: "Compliance fiscal acumulado",
    damage:
      "Llevas años invirtiendo y nunca has declarado. DAC8 entra en vigor en 2026 y Hacienda va a cruzar datos con todos los exchanges europeos.",
    body: [
      "El Modelo 721 obliga desde 2024 a declarar saldos cripto superiores a 50.000 € en plataformas fuera de España, antes del 31 de marzo del año siguiente al cierre. Si has tenido posiciones por encima de ese umbral en cualquiera de los últimos ejercicios sin declararlas, la sanción mínima por dato omitido es 150 €, con suelo total de 1.500 € por declaración no presentada.",
      "El IRPF se aplica a cada operación que altere el patrimonio: ventas, swaps en DEX, conversiones cripto-cripto, staking, recompensas. Aunque no hayas pasado nunca a euros, una conversión BTC→ETH es ya un hecho imponible. El método de cálculo es FIFO y la AEAT lo reconstruirá si tú no lo presentas.",
      "DAC8 (Directiva UE 2023/2226) obliga desde 2026 a todos los proveedores de servicios cripto que operen en la UE a reportar a las autoridades fiscales los datos de sus usuarios residentes. Es decir: el cruce de datos pasa de ser teórico a ser sistemático, automático y retroactivo.",
      "La buena noticia técnica: la regularización guiada antes de que llegue requerimiento reduce sanciones drásticamente. La mala: una vez recibida la notificación, la ventana se cierra.",
    ],
    protocol: [
      "Reconstruye con un fiscalista colegiado los últimos 4 ejercicios (2022, 2023, 2024, 2025) usando los CSV de cada exchange por el que has pasado, incluso de los que ya no operan.",
      "Calcula la base imponible bajo método FIFO en cada conversión y cada venta a fiat, no solo las ventas finales.",
      "Si superaste 50.000 € en exchanges extranjeros a 31 de diciembre de cualquier año desde 2024, prepara el Modelo 721 retroactivo.",
      "Presenta complementarias del IRPF correspondiente antes de que llegue requerimiento. La regularización voluntaria reduce el recargo y elimina la sanción adicional.",
      "A partir de 2026, conecta los exchanges a software de tracking (CoinTracking, Koinly) vía API Read-Only desde el día uno del ejercicio.",
    ],
    redLine:
      "VaultBit construye el dossier técnico de trazabilidad y se lo entrega al fiscalista colegiado. Nunca presentamos directamente ante Hacienda con certificado a nuestro nombre.",
    emailSummary:
      "Llevas años en cripto sin declarar. DAC8 entra en 2026 y va a forzar el cruce automático con todos los exchanges. La regularización guiada antes de que llegue requerimiento reduce la sanción drásticamente. Una vez llega la notificación, la ventana se cierra.",
    draft: false,
  },

  // ─────────────────────────────────────────────────────────
  // partial · ha declarado parcialmente
  // ─────────────────────────────────────────────────────────
  partial: {
    key: "fiscal",
    title: "Cobertura fiscal parcial",
    damage:
      "Has declarado algo, no todo. Lo que está sin declarar es el detonador silencioso: la AEAT cruza datos hacia atrás cuatro años antes de notificar, no después.",
    body: [
      "La declaración parcial es la situación más extendida en perfiles que llevan tiempo en cripto. Suele venir de tres patrones: empezaste a declarar a partir de cierto ejercicio dejando los anteriores sin presentar, declaraste algunas operaciones en exchanges y omitiste otras en DEX o P2P, o presentaste el IRPF pero no el Modelo 721 cuando correspondía.",
      "El plazo general de prescripción tributaria en España es de cuatro años. La AEAT puede revisar 2022, 2023, 2024 y 2025 ahora mismo. Cuando llega DAC8 en 2026, el cruce automático con todos los exchanges europeos hace evidentes los huecos en operativa pasada que el modelo 172 (saldos) y 173 (operaciones) no capturaban con la misma granularidad.",
      "La regularización voluntaria antes de requerimiento aplica el régimen del artículo 27 LGT: recargos por declaración extemporánea sin sanción, normalmente entre 5% y 15% según el retraso. Una vez que llega notificación, el panorama cambia: sanciones del 50% al 150% sobre la cuota dejada de ingresar, además del recargo. La diferencia económica es enorme.",
      "La AEAT no notifica los expedientes en orden cronológico de actividad. Notifica donde el cruce de datos arroja mayor diferencia entre lo declarado y lo conocido. Quien lleva años con cobertura parcial está, estadísticamente, en cabeza de la lista.",
    ],
    protocol: [
      "Reconstruye con un fiscalista colegiado el archivo completo de los últimos cuatro ejercicios fiscales no prescritos.",
      "Identifica los huecos exactos: qué exchanges declaraste y cuáles no, qué tipo de operación (compra, venta, swap, staking, NFT) quedó sin reportar.",
      "Calcula la base imponible omitida bajo método FIFO documentado y reúne los CSV de cada exchange por el que pasaste, incluso de los desaparecidos.",
      "Presenta complementarias del IRPF y, si procede, Modelo 721 retroactivo. Antes del 1 de enero de 2026 si es posible, para entrar en la transición DAC8 con base limpia.",
      "Conecta los exchanges actuales a software de tracking (CoinTracking, Koinly, Accointing) vía API Read-Only. Cierra el hueco del registro contemporáneo hacia adelante.",
    ],
    redLine:
      "VaultBit construye el dossier de trazabilidad técnica histórico y lo entrega al fiscalista colegiado partner. Las complementarias y el Modelo 721 los presenta el fiscalista bajo su responsabilidad colegial, nunca VaultBit en su nombre.",
    emailSummary:
      "Has declarado parte. Lo que está sin declarar prescribe en cuatro años, pero antes de prescribir DAC8 entra en vigor en 2026 y va a hacer evidentes los huecos. La regularización voluntaria antes de requerimiento aplica recargos del 5%-15% sin sanción. Una vez llega notificación, las sanciones suben al 50%-150%. La diferencia se mide en miles de euros.",
    draft: false,
  },

  // ─────────────────────────────────────────────────────────
  // compliant · declara desde el inicio
  // ─────────────────────────────────────────────────────────
  compliant: {
    key: "fiscal",
    title: "Optimización fiscal y blindaje frente a inspección",
    damage:
      "Estás declarando bien. La pregunta ya no es cómo regularizo, sino cómo aguanto una inspección sin que cueste treinta horas reconstruir documentos viejos.",
    body: [
      "El perfil que declara desde el inicio rara vez tiene el problema de la cuota dejada de ingresar. El problema típico es otro: archivo defendible. Cuando la AEAT abre expediente, no pide la declaración (la tienen), pide los justificantes técnicos del cálculo. Sin CSVs originales, sin contracts addresses, sin registro contemporáneo, reconstruir tres años atrás es un proyecto de varias semanas.",
      "DAC8 entra en vigor el 1 de enero de 2026 y obliga a todos los CASP que operen en la UE a reportar tus posiciones a la AEAT. La consecuencia operativa es que la AEAT va a recibir una imagen de tu cartera que tú deberías poder reconciliar con tus declaraciones. Cualquier discrepancia entre lo reportado por exchange y lo declarado por ti levanta una alerta automática, aunque la discrepancia sea por error de criterio, no por mala fe.",
      "El método FIFO es el oficial en España para cripto. Pero hay decisiones de criterio que la AEAT no especifica con detalle: cómo tratar swaps en DEX cuando no hay precio fiat directo, cómo registrar staking continuo, cómo documentar airdrops o forks. Cuando declaras desde el inicio, estas decisiones deben quedar argumentadas por escrito en un memorando interno, no improvisadas año a año.",
      "El otro frente del compliant es la optimización. Compensar pérdidas con ganancias del mismo ejercicio, planificar ventanas de venta para optimizar tipos marginales, decidir entre IRPF persona física y sociedad si hay volumen suficiente, son ejercicios técnicos que un fiscalista colegiado especializado en cripto puede materializar.",
    ],
    protocol: [
      "Memorando técnico interno con los criterios de cálculo aplicados año a año (FIFO, tratamiento de swaps, staking, airdrops, forks). Documento defendible ante inspección.",
      "Archivo organizado por ejercicio fiscal: declaraciones presentadas, CSVs de cada exchange a fecha de cierre, capturas on-chain de wallets propias, evidencia de operaciones P2P si las hay.",
      "Conexión continua a software de tracking con API Read-Only. Genera el informe FIFO automáticamente y mantiene la traza al día.",
      "Revisión anual con fiscalista colegiado para ajustar criterios a normativa nueva (Sentencias TS, Consultas DGT, novedades MiCA/DAC8) y planificar el ejercicio siguiente.",
      "Simulacro de inspección cada 18 meses: reconstruir un ejercicio completo desde cero usando solo el archivo. Si no es reconstruible en menos de 4 horas, hay que reforzar el archivo.",
    ],
    redLine:
      "VaultBit construye el archivo defendible y el memorando técnico de criterios. Las decisiones de optimización fiscal (planificación, compensación, vehículo societario) las firma un fiscalista colegiado partner, no nosotros.",
    emailSummary:
      "Estás declarando bien. El siguiente nivel es archivo defendible: cuando llegue DAC8 en 2026 y la AEAT cruce datos automáticamente con todos los exchanges, cualquier discrepancia entre lo reportado y lo declarado abre expediente. La diferencia entre superar una inspección en cuatro horas o en tres semanas está en tener memorando de criterios y archivo organizado por ejercicio.",
    draft: false,
  },

  // ─────────────────────────────────────────────────────────
  // unknown · no sabe / no responde
  // ─────────────────────────────────────────────────────────
  unknown: {
    key: "fiscal",
    title: "Estado fiscal por determinar",
    damage:
      "Si no sabes si has declarado bien o no, la respuesta no es declarar más. Es auditar primero. Hacerlo al revés multiplica el coste de la regularización.",
    body: [
      "El primer error que comete la mayoría cuando se da cuenta de que su situación fiscal cripto no está clara es presentar una complementaria precipitada para 'estar tranquilo'. El problema es que sin auditoría previa no se sabe sobre qué base presentas. Si presentas mal, has alertado al sistema sobre tu actividad y has consolidado un cálculo equivocado que luego cuesta corregir.",
      "Una auditoría fiscal cripto previa cubre tres frentes: qué se ha presentado realmente (algunos contribuyentes creen que su gestor presentó cosas que no presentó), qué quedó fuera (operaciones P2P, exchanges desaparecidos, NFTs, recompensas DeFi), y qué documentación queda viva para soportar el cálculo (los exchanges purgan CSVs antiguos, las wallets pueden estar perdidas).",
      "El plazo de prescripción tributaria es cuatro años. Si llevas más de cuatro años en cripto, el ejercicio 2021 y anteriores ya están prescritos para la AEAT. Eso reduce el alcance del trabajo. Pero solo se sabe cuándo prescribió cada cosa con el archivo en la mano.",
      "DAC8 entra en vigor en 2026. Cualquier ejercicio del 2025 hacia atrás debe estar resuelto idealmente antes de fin de año, porque a partir del cruce automático la ventana para regularización voluntaria sin sanción se cierra muy rápido.",
    ],
    protocol: [
      "Auditoría documental: recopilar declaraciones IRPF y Modelo 721 presentados (si los hay) en los últimos cuatro ejercicios. La AEAT permite descargarlas desde la sede electrónica.",
      "Inventario de exchanges y wallets utilizados desde el inicio: nombres, fechas de alta y baja, volumen aproximado. Incluso los exchanges desaparecidos cuentan.",
      "Recuperación de CSVs históricos. Si un exchange ya no opera, contactar soporte; si la wallet sigue, exportar histórico on-chain con block explorer.",
      "Reconstrucción del FIFO con un fiscalista colegiado especializado. El resultado es una posición fiscal real, no estimada.",
      "Decisión informada sobre regularización: complementarias del 5%-15% antes de requerimiento, declaraciones limpias hacia adelante, o defensa argumentada si hay puntos de criterio.",
    ],
    redLine:
      "VaultBit acompaña la auditoría documental y la reconstrucción técnica del FIFO. La calificación final del estado fiscal y la decisión de presentar complementarias la firma un fiscalista colegiado partner.",
    emailSummary:
      "No sabes si has declarado bien. Antes de presentar nada nuevo, el paso correcto es auditar: qué se presentó realmente en los últimos cuatro ejercicios, qué quedó fuera, qué documentación sigue disponible. Una complementaria precipitada sin auditoría previa consolida cálculos equivocados y alerta al sistema sobre actividad que tal vez ya estaba prescrita.",
    draft: false,
  },
};
