/**
 * Mapping centralizado de status → clases tailwind para el StatusSelect.
 * Mantiene consistencia visual con los <Badge> de las páginas listado.
 */

const STATUS_TONE_CLASS: Record<string, string> = {
  // estados "frescos"
  nuevo: "bg-brand-500/10 text-brand-400 border-brand-500/20",
  // intermedios neutros
  contactado: "bg-anthracite-700 text-anthracite-100 border-anthracite-600/40",
  entregado: "bg-anthracite-700 text-anthracite-100 border-anthracite-600/40",
  // intermedios atención
  en_seguimiento: "bg-warning/15 text-warning border-warning/30",
  engaged: "bg-warning/15 text-warning border-warning/30",
  calificado: "bg-warning/15 text-warning border-warning/30",
  // éxitos
  convertido: "bg-success/15 text-success border-success/30",
  firmado: "bg-success/15 text-success border-success/30",
  // descartes
  descartado: "bg-error/15 text-error border-error/30",
};

export function statusToneClass(status: string): string {
  return STATUS_TONE_CLASS[status] ?? "bg-anthracite-900 text-anthracite-100 border-anthracite-600/40";
}

export const STATUS_LABEL_OVERRIDES: Record<string, string> = {
  en_seguimiento: "en seguimiento",
};
