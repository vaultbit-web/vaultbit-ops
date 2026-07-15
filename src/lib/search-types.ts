/**
 * Tipos y constantes compartidos para la búsqueda global (F1.4).
 * Aislados del archivo "use server" porque Next.js sólo permite exportar
 * funciones async desde server actions.
 */

export const GLOBAL_SEARCH_GROUPS = [
  "funnel_lead",
  "lead_magnet",
  "investor",
  "partner",
  "quote",
  "contract",
] as const;
export type GlobalSearchGroup = (typeof GLOBAL_SEARCH_GROUPS)[number];

export const GLOBAL_SEARCH_GROUP_LABELS: Record<GlobalSearchGroup, string> = {
  funnel_lead: "Diagnósticos",
  lead_magnet: "Lead magnet",
  investor: "Inversores",
  partner: "Partners",
  quote: "Presupuestos",
  contract: "Contratos",
};

export interface GlobalSearchHit {
  group: GlobalSearchGroup;
  id: string;
  href: string;
  title: string;
  subtitle: string | null;
  meta: string | null;
  created_at: string;
}

export interface GlobalSearchResults {
  hits: GlobalSearchHit[];
  query: string;
  total: number;
}
