import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, colors } from "./diagnosis-styles";
import { formatLongDateEs } from "~/lib/diagnosis/composer";
import type { DiagnosisModel, DiagnosisBlock, BlockKey } from "~/lib/diagnosis/types";

const ARCHETYPE_LABEL: Record<string, string> = {
  security: "Seguridad y custodia",
  fiscal: "Fiscalidad",
  inheritance: "Herencia digital",
  business: "Web3 B2B",
};

const BLOCK_STEP_LABEL: Record<BlockKey, string> = {
  fiscal: "Compliance fiscal",
  inheritance: "Plan de herencia digital",
  custody: "Auditoría de custodia",
};

interface Props {
  model: DiagnosisModel;
}

// ─────────────────────────────────────────────────────────
// Header / Footer compartidos
// ─────────────────────────────────────────────────────────

function HeaderDark({ kicker }: { kicker: string }) {
  return (
    <>
      <View style={styles.header} fixed>
        <Text style={styles.wordmarkDark}>VAULTBIT</Text>
        <Text style={styles.headerKickerDark}>{kicker.toUpperCase()}</Text>
      </View>
      <View style={[styles.headerRule, styles.headerRuleDark]} fixed />
    </>
  );
}

function HeaderLight({ kicker }: { kicker: string }) {
  return (
    <>
      <View style={styles.header} fixed>
        <Text style={styles.wordmarkLight}>VAULTBIT</Text>
        <Text style={styles.headerKickerLight}>{kicker.toUpperCase()}</Text>
      </View>
      <View style={[styles.headerRule, styles.headerRuleLight]} fixed />
    </>
  );
}

function FooterDark() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerTextDark}>
        danielbrosed@vaultbit.es · cal.com/infovaultbit/30min · vaultbit.es
      </Text>
      <Text
        style={styles.footerTextDark}
        render={({ pageNumber, totalPages }) =>
          `${String(pageNumber).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`
        }
      />
    </View>
  );
}

function FooterLight() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerTextLight}>
        danielbrosed@vaultbit.es · cal.com/infovaultbit/30min · vaultbit.es
      </Text>
      <Text
        style={styles.footerTextLight}
        render={({ pageNumber, totalPages }) =>
          `${String(pageNumber).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`
        }
      />
    </View>
  );
}

function DraftWatermark({ show }: { show: boolean }) {
  if (!show) return null;
  return <Text style={styles.draftWatermark} fixed>BORRADOR</Text>;
}

// ─────────────────────────────────────────────────────────
// Componente bloque (cuerpo del punto crítico)
// ─────────────────────────────────────────────────────────

function BlockSection({
  block,
  index,
  variant,
}: {
  block: DiagnosisBlock;
  index: number;
  variant: "light" | "dark";
}) {
  const isDark = variant === "dark";
  // El View padre permite wrap (default true) para que el contenido fluya
  // entre paginas de forma natural. Los elementos visualmente "atomicos"
  // (cabecera del bloque, damage strip, redLineCard) llevan wrap={false}
  // individualmente para que NO se rompan a la mitad.
  return (
    <View style={{ marginBottom: 36 }}>
      <View wrap={false}>
        <Text style={styles.blockNumber}>{String(index + 1).padStart(2, "0")} ·</Text>
        <Text style={isDark ? styles.blockTitleDark : styles.blockTitle}>
          {block.title}
        </Text>

        <View style={styles.damageStrip}>
          <Text style={styles.damageStripLabel}>EL DAÑO</Text>
          <Text style={styles.damageStripText}>{block.damage}</Text>
        </View>
      </View>

      {block.body.map((p, i) => (
        <Text key={i} style={isDark ? styles.blockBodyDark : styles.blockBody}>
          {p}
        </Text>
      ))}

      <Text style={isDark ? styles.protocolHeadingDark : styles.protocolHeading}>
        PROTOCOLO
      </Text>
      {block.protocol.map((step, i) => (
        <View key={i} wrap={false} style={styles.protocolItem}>
          <View style={styles.protocolBadge}>
            <Text style={styles.protocolBadgeText}>
              {String(i + 1).padStart(2, "0")}
            </Text>
          </View>
          <Text style={isDark ? styles.protocolTextDark : styles.protocolText}>
            {step}
          </Text>
        </View>
      ))}

      <View wrap={false} style={isDark ? styles.redLineCardDark : styles.redLineCard}>
        <Text style={styles.redLineLabel}>LÍNEA ROJA · VAULTBIT ADVISORY</Text>
        <Text style={isDark ? styles.redLineTextDark : styles.redLineText}>
          {block.redLine}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Documento completo
// ─────────────────────────────────────────────────────────

export function DiagnosisPdfDocument({ model }: Props) {
  const { lead, cover, blocks, roadmap, hasDrafts } = model;
  const archetypeLabel = ARCHETYPE_LABEL[lead.archetype] ?? lead.archetype;

  return (
    <Document
      title={`Diagnóstico técnico personalizado · ${lead.name}`}
      author="Daniel Brosed Giral"
      subject={`Diagnóstico patrimonial cripto · ${archetypeLabel}`}
    >
      {/* ─── P1 · Portada (oscura) ────────────────────── */}
      <Page size="A4" style={styles.pageDark}>
        <View style={styles.brandStripe} fixed />
        <HeaderDark kicker="Diagnóstico personalizado" />
        <DraftWatermark show={hasDrafts} />

        <View style={styles.coverPill}>
          <View style={styles.coverPillDot} />
          <Text style={styles.coverPillText}>INFORME TÉCNICO · CONFIDENCIAL</Text>
        </View>

        <Text style={styles.coverHeadline}>{cover.headline}</Text>

        <View style={styles.coverDivider} />

        <Text style={styles.coverLede}>{cover.lede}</Text>

        <View style={styles.coverLeadCard}>
          <Text style={styles.coverLeadLabel}>PARA</Text>
          <Text style={styles.coverLeadName}>{lead.name}</Text>
          <Text style={styles.coverLeadMeta}>
            Perfil identificado: {archetypeLabel}
          </Text>
          <Text style={styles.coverLeadMeta}>
            Análisis preparado el {formatLongDateEs(lead.generatedAt)}
          </Text>
          <Text style={styles.coverLeadMeta}>
            Por Daniel Brosed Giral · Fundador de VaultBit Advisory
          </Text>
        </View>

        <FooterDark />
      </Page>

      {/* ─── P2 · Los 3 puntos críticos (clara) ────────── */}
      <Page size="A4" style={styles.pageLight} wrap>
        <HeaderLight kicker="Los 3 puntos críticos" />
        <DraftWatermark show={hasDrafts} />

        <Text style={styles.pageH1Light}>Lo que veo crítico en tu caso.</Text>

        {blocks.map((b, i) => (
          <BlockSection key={`${b.key}-${i}`} block={b} index={i} variant="light" />
        ))}

        <FooterLight />
      </Page>

      {/* ─── P3 · Hoja de ruta priorizada (oscura) ────── */}
      <Page size="A4" style={styles.pageDark}>
        <HeaderDark kicker="Hoja de ruta" />
        <DraftWatermark show={hasDrafts} />

        <Text style={[styles.coverEyebrow, { marginTop: 28 }]}>
          HOJA DE RUTA PRIORIZADA
        </Text>
        <Text style={styles.pageH1Dark}>El orden que tendría sentido para ti.</Text>

        {roadmap.sequence.map((key, i) => {
          const blk = blocks.find((b) => b.key === key);
          return (
            <View key={`${key}-${i}`} wrap={false} style={styles.roadmapStep}>
              <Text style={styles.roadmapStepNumber}>
                {String(i + 1).padStart(2, "0")}
              </Text>
              <View style={styles.roadmapStepBody}>
                <Text style={styles.roadmapStepTitle}>{BLOCK_STEP_LABEL[key]}</Text>
                <Text style={styles.roadmapStepDesc}>{blk?.damage ?? ""}</Text>
              </View>
            </View>
          );
        })}

        <View style={styles.roadmapRationale}>
          <Text style={styles.roadmapRationaleLabel}>POR QUÉ ESTE ORDEN</Text>
          <Text style={styles.roadmapRationaleText}>{roadmap.rationale}</Text>
        </View>

        <FooterDark />
      </Page>

      {/* ─── P4 · Próximos pasos + recursos (clara) ──── */}
      <Page size="A4" style={styles.pageLight}>
        <HeaderLight kicker="Próximos pasos" />
        <DraftWatermark show={hasDrafts} />

        <Text style={styles.pageH1Light}>Una conversación, no una venta.</Text>
        <Text
          style={{
            fontFamily: "Helvetica",
            fontSize: 11,
            color: colors.textBody,
            lineHeight: 1.6,
            marginBottom: 8,
          }}
        >
          Si lo que has leído aquí encaja con tu situación, hablamos. 30 minutos,
          sin presentación, sin agenda comercial. Te escucho y vemos juntos si
          tiene sentido seguir. Si no encaja, no seguimos y listo.
        </Text>

        <View style={styles.ctaCard}>
          <Text style={styles.ctaCardLabel}>RESERVAR DIRECTAMENTE</Text>
          <Text style={styles.ctaCardLink}>cal.com/infovaultbit/30min</Text>
          <Text style={styles.ctaCardSub}>
            30 minutos · vídeo o llamada de voz · confidencial
          </Text>
        </View>

        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 9,
            color: colors.brand,
            letterSpacing: 1.4,
            marginTop: 28,
            marginBottom: 10,
          }}
        >
          RECURSOS EXTERNOS VERIFICABLES
        </Text>

        <View style={styles.resourceItem}>
          <Text style={styles.resourceLabel}>Modelo 721 (AEAT)</Text>
          <Text style={[styles.resourceValue, { color: colors.textBody }]}>
            sede.agenciatributaria.gob.es
          </Text>
        </View>
        <View style={styles.resourceItem}>
          <Text style={styles.resourceLabel}>Albacea digital</Text>
          <Text style={[styles.resourceValue, { color: colors.textBody }]}>
            notariado.org · LOPDGDD art. 96
          </Text>
        </View>
        <View style={styles.resourceItem}>
          <Text style={styles.resourceLabel}>Estudio herencia cripto</Text>
          <Text style={[styles.resourceValue, { color: colors.textBody }]}>
            coincover.com · 47% pérdida heredable
          </Text>
        </View>
        <View style={styles.resourceItem}>
          <Text style={styles.resourceLabel}>Caso Howells</Text>
          <Text style={[styles.resourceValue, { color: colors.textBody }]}>
            High Court UK · enero 2025
          </Text>
        </View>

        {/* Contacto · SIN razón social */}
        <View style={styles.contactBox}>
          <Text style={styles.contactBoxLabel}>CONTACTO DIRECTO</Text>
          <View style={styles.contactRow}>
            <Text style={styles.contactKey}>Email del fundador</Text>
            <Text style={[styles.contactValue, { color: colors.textBody }]}>
              danielbrosed@vaultbit.es
            </Text>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactKey}>WhatsApp</Text>
            <Text style={[styles.contactValue, { color: colors.textBody }]}>
              +34 933 236 049
            </Text>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactKey}>Reservar reunión</Text>
            <Text style={[styles.contactValue, { color: colors.textBody }]}>
              cal.com/infovaultbit/30min
            </Text>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactKey}>Web</Text>
            <Text style={[styles.contactValue, { color: colors.textBody }]}>
              vaultbit.es
            </Text>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactKey}>LinkedIn</Text>
            <Text style={[styles.contactValue, { color: colors.textBody }]}>
              linkedin.com/in/danielbrosed
            </Text>
          </View>
        </View>

        <Text
          style={{
            marginTop: 18,
            fontFamily: "Helvetica",
            fontSize: 7.5,
            color: colors.textBodySoft,
            lineHeight: 1.55,
          }}
        >
          Este informe tiene carácter exclusivamente orientativo y técnico. La
          información publicada no constituye asesoramiento financiero, legal ni
          fiscal personalizado. Consulta con profesionales colegiados antes de
          tomar decisiones patrimoniales. Documento personalizado emitido el{" "}
          {formatLongDateEs(lead.generatedAt)}.
        </Text>

        <FooterLight />
      </Page>
    </Document>
  );
}
