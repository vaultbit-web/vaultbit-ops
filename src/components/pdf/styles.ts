import { StyleSheet } from "@react-pdf/renderer";

/**
 * Sistema de estilos PDF VaultBit · v2 · diseño "banca privada".
 *
 * Cambios clave vs v1:
 *   - Márgenes mucho más generosos (sensación de aire)
 *   - Tipografía con tamaños mejor balanceados (jerarquía clara)
 *   - Banda vertical naranja izquierda como elemento de marca (sutil)
 *   - Líneas divisorias más finas y discretas
 *   - Espaciado entre bloques aumentado (lineHeight 1.6)
 *   - Caja de totales con whitespace generoso
 *   - Footer minimalista
 *
 * Fuentes: Helvetica family built-in (fiabilidad sin red).
 */

export const colors = {
  ink: "#0D0F11",
  text: "#1F2528",
  muted: "#5A6470",
  hint: "#8A95A0",
  rule: "#E5E8EB",
  ruleStrong: "#C5CBD1",
  surface: "#FAFBFC",
  white: "#FFFFFF",
  brand: "#F2761A",
  brandSoft: "#FEF0E6",
};

// Constantes de página A4: 595 × 842 puntos
export const page = {
  width: 595,
  height: 842,
  marginTop: 80,
  marginBottom: 70,
  marginLeft: 70,
  marginRight: 70,
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: colors.text,
    paddingTop: page.marginTop,
    paddingBottom: page.marginBottom,
    paddingLeft: page.marginLeft,
    paddingRight: page.marginRight,
    lineHeight: 1.6,
    letterSpacing: 0.1,
  },

  // Banda vertical naranja como elemento de marca (sólo página 1)
  brandStripe: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: colors.brand,
  },

  // Header
  header: {
    position: "absolute",
    top: 36,
    left: page.marginLeft,
    right: page.marginRight,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandBlock: {},
  brandName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.ink,
    letterSpacing: 0.8,
  },
  brandTagline: {
    fontSize: 7.5,
    color: colors.hint,
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  headerRight: {
    fontSize: 8,
    color: colors.muted,
    textAlign: "right",
    letterSpacing: 0.2,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: page.marginLeft,
    right: page.marginRight,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 0.4,
    borderTopColor: colors.rule,
  },
  footerLeft: {
    fontSize: 7,
    color: colors.hint,
    letterSpacing: 0.3,
  },
  footerRight: {
    fontSize: 7,
    color: colors.hint,
    letterSpacing: 0.3,
  },

  // Eyebrow / kicker
  eyebrow: {
    fontSize: 8,
    color: colors.brand,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },

  // Headings
  h1: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.ink,
    marginBottom: 6,
    lineHeight: 1.2,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.ink,
    marginTop: 26,
    marginBottom: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  h3: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  p: {
    fontSize: 9.5,
    color: colors.text,
    marginBottom: 6,
    lineHeight: 1.65,
    textAlign: "justify",
  },
  small: {
    fontSize: 8,
    color: colors.muted,
    letterSpacing: 0.2,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  ruleSoft: {
    marginTop: 10,
    marginBottom: 10,
    borderBottomWidth: 0.4,
    borderBottomColor: colors.rule,
  },

  // Listas
  list: {
    marginLeft: 4,
    marginBottom: 6,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 5,
    paddingRight: 8,
  },
  listBullet: {
    width: 14,
    fontSize: 9.5,
    color: colors.brand,
  },
  listText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.65,
    textAlign: "justify",
  },

  // Tabla "etiqueta : valor" usada para datos de cliente / servicio
  fieldRow: {
    flexDirection: "row",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.4,
    borderBottomColor: colors.rule,
  },
  fieldLabel: {
    width: 130,
    fontSize: 8,
    color: colors.hint,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    paddingTop: 1,
  },
  fieldValue: {
    flex: 1,
    fontSize: 10,
    color: colors.text,
    fontFamily: "Helvetica",
  },

  // Caja de totales
  totalsBox: {
    marginTop: 28,
    paddingTop: 18,
    paddingBottom: 22,
    paddingLeft: 22,
    paddingRight: 22,
    backgroundColor: colors.surface,
    borderLeftWidth: 2,
    borderLeftColor: colors.brand,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  totalsLabel: {
    fontSize: 9,
    color: colors.muted,
    letterSpacing: 0.3,
  },
  totalsValue: {
    fontSize: 10,
    color: colors.text,
  },
  totalsDivider: {
    marginTop: 10,
    marginBottom: 10,
    borderBottomWidth: 0.4,
    borderBottomColor: colors.ruleStrong,
  },
  totalsGrandLabel: {
    fontSize: 10,
    color: colors.ink,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  totalsGrandValue: {
    fontSize: 22,
    color: colors.ink,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.3,
  },

  // Box de aviso (compliance) — minimal, sin bordes pesados
  noticeBox: {
    marginTop: 32,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: colors.surface,
    borderRadius: 2,
  },
  noticeText: {
    fontSize: 7.5,
    color: colors.muted,
    lineHeight: 1.7,
    letterSpacing: 0.15,
  },

  // Espaciador genérico
  gap: {
    height: 12,
  },
  gapLg: {
    height: 24,
  },

  // Bloque de firmas
  signaturesBlock: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 30,
  },
  signatureCol: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 0.6,
    borderBottomColor: colors.ruleStrong,
    marginBottom: 8,
    marginTop: 24,
  },
  signatureName: {
    fontSize: 9,
    color: colors.text,
    fontFamily: "Helvetica-Bold",
  },
  signatureRole: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 1,
  },
});
