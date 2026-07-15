/**
 * Estilos PDF · Diagnóstico personalizado VaultBit.
 *
 * Estética alineada con scripts/generate-lead-magnet-pdf.cjs
 * (PDF de "7 errores"): paleta antracita + naranja, alternancia
 * página oscura / página clara, eyebrows con tracking, hero #NN
 * gigante, strip "EL DAÑO" naranja claro, protocolo numerado,
 * "LÍNEA ROJA" en card oscura con barra lateral roja.
 *
 * Footer SIN razón social. SOLO métodos de contacto.
 * (Regla crítica · ver feedback_pdf_diagnostico_design.md)
 */

import { StyleSheet } from "@react-pdf/renderer";

export const colors = {
  bg: "#0D0F11",
  bgAlt: "#13171A",
  card: "#1C2126",
  border: "#2E3740",
  textMuted: "#8A95A0",
  textLight: "#C5CBD1",
  textDark: "#0D0F11",
  textBody: "#374151",
  textBodySoft: "#4A5562",
  surface: "#F8F9FA",
  white: "#FFFFFF",
  brand: "#F2761A",
  brandLight: "#F5883A",
  brandBg: "#FFF7ED",
  brandBorder: "#FED7AA",
  brandSoftBg: "#1F1812",
  success: "#16A34A",
  error: "#DC2626",
  errorDim: "#7F1D1D",
  divider: "#E5E7EB",
};

const PAGE = {
  marginTop: 78,
  marginBottom: 70,
  marginLeft: 60,
  marginRight: 60,
};

export const styles = StyleSheet.create({
  // ─── PAGES ──────────────────────────────────────────────
  pageDark: {
    fontFamily: "Helvetica",
    backgroundColor: colors.bg,
    color: colors.textLight,
    paddingTop: PAGE.marginTop,
    paddingBottom: PAGE.marginBottom,
    paddingLeft: PAGE.marginLeft,
    paddingRight: PAGE.marginRight,
    fontSize: 10,
    lineHeight: 1.55,
  },
  pageLight: {
    fontFamily: "Helvetica",
    backgroundColor: colors.surface,
    color: colors.textBody,
    paddingTop: PAGE.marginTop,
    paddingBottom: PAGE.marginBottom,
    paddingLeft: PAGE.marginLeft,
    paddingRight: PAGE.marginRight,
    fontSize: 10,
    lineHeight: 1.55,
  },

  // ─── BRAND HEADER (en cada página, fixed) ──────────────
  header: {
    position: "absolute",
    top: 28,
    left: PAGE.marginLeft,
    right: PAGE.marginRight,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordmarkDark: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: colors.white,
    letterSpacing: 2.4,
  },
  wordmarkLight: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: colors.textDark,
    letterSpacing: 2.4,
  },
  headerKickerDark: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: colors.brand,
    letterSpacing: 1.4,
  },
  headerKickerLight: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: colors.brand,
    letterSpacing: 1.4,
  },
  headerRule: {
    position: "absolute",
    top: 56,
    left: PAGE.marginLeft,
    right: PAGE.marginRight,
    borderBottomWidth: 0.5,
  },
  headerRuleDark: { borderBottomColor: colors.border },
  headerRuleLight: { borderBottomColor: colors.divider },

  // ─── COVER (P1) ─────────────────────────────────────────
  // Banda vertical naranja en lateral izquierdo
  brandStripe: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: colors.brand,
  },

  coverPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(242,118,26,0.12)",
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 40,
  },
  coverPillDot: {
    width: 6,
    height: 6,
    backgroundColor: colors.success,
    borderRadius: 3,
    marginRight: 8,
  },
  coverPillText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: colors.brand,
    letterSpacing: 1.4,
  },

  coverEyebrow: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: colors.brand,
    letterSpacing: 1.5,
    marginTop: 36,
    marginBottom: 10,
  },
  coverHeadline: {
    fontFamily: "Helvetica-Bold",
    fontSize: 32,
    color: colors.white,
    lineHeight: 1.2,
    letterSpacing: -0.4,
    marginBottom: 22,
  },
  coverLede: {
    fontFamily: "Helvetica",
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 1.6,
    marginBottom: 28,
  },

  coverDivider: {
    width: 60,
    borderBottomWidth: 2,
    borderBottomColor: colors.brand,
    marginBottom: 18,
    marginTop: 8,
  },

  coverLeadCard: {
    marginTop: 26,
    paddingTop: 18,
    paddingBottom: 18,
    paddingLeft: 18,
    paddingRight: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderLeftWidth: 2,
    borderLeftColor: colors.brand,
  },
  coverLeadLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: colors.brand,
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  coverLeadName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    color: colors.white,
    marginBottom: 6,
  },
  coverLeadMeta: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 1.5,
  },

  // ─── PAGE HEADINGS (h1 que va bajo cada eyebrow) ─────
  pageH1Light: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    color: colors.textDark,
    letterSpacing: -0.3,
    lineHeight: 1.2,
    marginBottom: 22,
  },
  pageH1Dark: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    color: colors.white,
    letterSpacing: -0.3,
    lineHeight: 1.2,
    marginBottom: 22,
  },

  // ─── BLOCK PAGES (puntos críticos) ──────────────────────
  blockEyebrow: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: colors.brand,
    letterSpacing: 1.4,
    marginTop: 24,
    marginBottom: 6,
  },
  blockNumber: {
    fontFamily: "Helvetica-Bold",
    fontSize: 38,
    color: colors.brand,
    letterSpacing: -1.2,
    lineHeight: 1,
    marginBottom: 10,
  },
  blockTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 17,
    color: colors.textDark,
    lineHeight: 1.25,
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  blockTitleDark: {
    fontFamily: "Helvetica-Bold",
    fontSize: 17,
    color: colors.white,
    lineHeight: 1.25,
    letterSpacing: -0.2,
    marginBottom: 14,
  },

  // Strip "EL DAÑO" (naranja claro)
  damageStrip: {
    backgroundColor: colors.brandBg,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    borderRadius: 8,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  damageStripLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: colors.brand,
    letterSpacing: 1.3,
    marginBottom: 5,
  },
  damageStripText: {
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: colors.textDark,
    lineHeight: 1.5,
  },

  blockBody: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: colors.textBody,
    lineHeight: 1.7,
    marginBottom: 7,
    textAlign: "left",
  },
  blockBodyDark: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: colors.textLight,
    lineHeight: 1.7,
    marginBottom: 7,
    textAlign: "left",
  },

  // Protocolo (lista numerada con badge)
  protocolHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: colors.brand,
    letterSpacing: 1.4,
    marginTop: 14,
    marginBottom: 9,
  },
  protocolHeadingDark: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: colors.brand,
    letterSpacing: 1.4,
    marginTop: 14,
    marginBottom: 9,
  },
  protocolItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  protocolBadge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "rgba(242,118,26,0.15)",
    borderWidth: 0.6,
    borderColor: "rgba(242,118,26,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    marginTop: 1,
  },
  protocolBadgeText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: colors.brand,
  },
  protocolText: {
    flex: 1,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: colors.textBody,
    lineHeight: 1.6,
  },
  protocolTextDark: {
    flex: 1,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: colors.textLight,
    lineHeight: 1.6,
  },

  // "LÍNEA ROJA" card
  redLineCard: {
    marginTop: 14,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: "rgba(220,38,38,0.06)",
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    borderRadius: 4,
  },
  redLineCardDark: {
    marginTop: 14,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: colors.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    borderRadius: 4,
  },
  redLineLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: colors.error,
    letterSpacing: 1.3,
    marginBottom: 5,
  },
  redLineText: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 9,
    color: colors.textBody,
    lineHeight: 1.55,
  },
  redLineTextDark: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 9,
    color: colors.textLight,
    lineHeight: 1.55,
  },

  // ─── ROADMAP (P3) ───────────────────────────────────────
  roadmapStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  roadmapStepNumber: {
    fontFamily: "Helvetica-Bold",
    fontSize: 26,
    color: colors.brand,
    width: 44,
    letterSpacing: -0.6,
    lineHeight: 1,
  },
  roadmapStepBody: {
    flex: 1,
    paddingTop: 2,
    paddingRight: 8,
  },
  roadmapStepTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: colors.white,
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  roadmapStepDesc: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: colors.textLight,
    lineHeight: 1.6,
  },
  roadmapRationale: {
    marginTop: 24,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 18,
    paddingRight: 18,
    backgroundColor: colors.card,
    borderLeftWidth: 2,
    borderLeftColor: colors.brand,
    borderRadius: 4,
  },
  roadmapRationaleLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: colors.brand,
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  roadmapRationaleText: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.textLight,
    lineHeight: 1.6,
  },

  // ─── NEXT STEPS (P4) ────────────────────────────────────
  ctaCard: {
    marginTop: 20,
    paddingTop: 22,
    paddingBottom: 22,
    paddingLeft: 22,
    paddingRight: 22,
    backgroundColor: colors.brand,
    borderRadius: 12,
  },
  ctaCardLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  ctaCardLink: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: colors.white,
    marginBottom: 4,
  },
  ctaCardSub: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 1.5,
  },

  // Recursos externos verificables
  resourceItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  resourceLabel: {
    width: 130,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: colors.textMuted,
  },
  resourceValue: {
    flex: 1,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.textLight,
  },

  // ─── FOOTER · SOLO contacto, SIN razón social ──────────
  footer: {
    position: "absolute",
    bottom: 28,
    left: PAGE.marginLeft,
    right: PAGE.marginRight,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerTextDark: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  footerTextLight: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: "#9CA3AF",
    letterSpacing: 0.3,
  },

  // Contact box (página final)
  contactBox: {
    marginTop: 28,
    paddingTop: 18,
    paddingBottom: 18,
    paddingLeft: 18,
    paddingRight: 18,
    borderTopWidth: 0.6,
    borderTopColor: colors.border,
    borderBottomWidth: 0.6,
    borderBottomColor: colors.border,
  },
  contactBoxLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: colors.brand,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  contactKey: {
    width: 130,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: colors.textMuted,
  },
  contactValue: {
    flex: 1,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.textLight,
  },

  // Watermark DRAFT
  draftWatermark: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    fontFamily: "Helvetica-Bold",
    fontSize: 96,
    color: "rgba(220,38,38,0.18)",
    textAlign: "center",
    letterSpacing: 8,
  },
});
