"use server";

import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import { type EntityType } from "~/lib/supabase/types";
import type {
  GlobalSearchGroup,
  GlobalSearchHit,
  GlobalSearchResults,
} from "~/lib/search-types";

export interface CrmSearchHit {
  entity_type: EntityType;
  entity_id: string;
  name: string;
  email: string;
  organization: string | null;
  /** Línea de subtítulo informativa (ticket, sector, partner_type…) */
  meta: string | null;
  created_at: string;
}

/**
 * Búsqueda unificada en las 4 tablas CRM.
 * Devuelve hasta `limit` resultados en total, mezclados, con la fila más
 * reciente primero dentro de cada tipo. La UI puede filtrar después por
 * tipo si interesa.
 *
 * Si la query está vacía, devuelve los más recientes de cada tipo.
 */
export async function searchCrmClients(query: string, limit = 30): Promise<CrmSearchHit[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) {
    throw new Error("No autorizado");
  }

  const q = (query ?? "").trim().replace(/[,%()]/g, "");
  const perTable = Math.max(5, Math.ceil(limit / 4));

  async function fromFunnelLeads(): Promise<CrmSearchHit[]> {
    let qb = supabase
      .from("funnel_leads")
      .select("id, name, email, archetype, created_at")
      .order("created_at", { ascending: false })
      .limit(perTable);
    if (q) qb = qb.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
    const { data } = await qb;
    return (data ?? []).map((r) => ({
      entity_type: "funnel_lead" as EntityType,
      entity_id: r.id,
      name: r.name,
      email: r.email,
      organization: null,
      meta: r.archetype ? `Arquetipo · ${r.archetype}` : null,
      created_at: r.created_at,
    }));
  }

  async function fromLeadMagnet(): Promise<CrmSearchHit[]> {
    let qb = supabase
      .from("lead_magnet_subscribers")
      .select("id, name, email, source, created_at")
      .order("created_at", { ascending: false })
      .limit(perTable);
    if (q) qb = qb.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
    const { data } = await qb;
    return (data ?? []).map((r) => ({
      entity_type: "lead_magnet" as EntityType,
      entity_id: r.id,
      name: r.name ?? r.email,
      email: r.email,
      organization: null,
      meta: r.source ? `Fuente · ${r.source}` : null,
      created_at: r.created_at,
    }));
  }

  async function fromInvestors(): Promise<CrmSearchHit[]> {
    let qb = supabase
      .from("investor_interest")
      .select("id, name, email, organization, ticket_size, vehicle_type, created_at")
      .order("created_at", { ascending: false })
      .limit(perTable);
    if (q) qb = qb.or(`name.ilike.%${q}%,email.ilike.%${q}%,organization.ilike.%${q}%`);
    const { data } = await qb;
    return (data ?? []).map((r) => ({
      entity_type: "investor" as EntityType,
      entity_id: r.id,
      name: r.name ?? r.email,
      email: r.email,
      organization: r.organization,
      meta: [r.ticket_size, r.vehicle_type].filter(Boolean).join(" · ") || null,
      created_at: r.created_at,
    }));
  }

  async function fromPartners(): Promise<CrmSearchHit[]> {
    let qb = supabase
      .from("partner_applications")
      .select("id, name, email, organization, partner_type, created_at")
      .order("created_at", { ascending: false })
      .limit(perTable);
    if (q) qb = qb.or(`name.ilike.%${q}%,email.ilike.%${q}%,organization.ilike.%${q}%`);
    const { data } = await qb;
    return (data ?? []).map((r) => ({
      entity_type: "partner" as EntityType,
      entity_id: r.id,
      name: r.name,
      email: r.email,
      organization: r.organization,
      meta: r.partner_type ? `Tipo · ${r.partner_type}` : null,
      created_at: r.created_at,
    }));
  }

  const [a, b, c, d] = await Promise.all([
    fromFunnelLeads(),
    fromLeadMagnet(),
    fromInvestors(),
    fromPartners(),
  ]);

  // Mezclar y ordenar por relevancia: si hay query, las que matchean nombre primero
  const merged = [...a, ...b, ...c, ...d].sort((x, y) =>
    x.created_at < y.created_at ? 1 : -1,
  );

  return merged.slice(0, limit);
}

/**
 * Devuelve datos detallados de un cliente concreto del CRM (para autocompletar
 * al seleccionarlo en el ClientPicker).
 */
export interface CrmClientDetails {
  entity_type: EntityType;
  entity_id: string;
  name: string;
  email: string;
  nif: string | null;
  organization: string | null;
  address: string | null;
  sector: string | null;
  linkedin: string | null;
}

export async function getCrmClientDetails(
  entityType: EntityType,
  entityId: string,
): Promise<CrmClientDetails | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) return null;

  if (entityType === "funnel_lead") {
    const { data } = await supabase
      .from("funnel_leads")
      .select("id, name, email")
      .eq("id", entityId)
      .maybeSingle();
    if (!data) return null;
    return {
      entity_type: "funnel_lead",
      entity_id: data.id,
      name: data.name,
      email: data.email,
      nif: null,
      organization: null,
      address: null,
      sector: null,
      linkedin: null,
    };
  }

  if (entityType === "lead_magnet") {
    const { data } = await supabase
      .from("lead_magnet_subscribers")
      .select("id, name, email")
      .eq("id", entityId)
      .maybeSingle();
    if (!data) return null;
    return {
      entity_type: "lead_magnet",
      entity_id: data.id,
      name: data.name ?? data.email,
      email: data.email,
      nif: null,
      organization: null,
      address: null,
      sector: null,
      linkedin: null,
    };
  }

  if (entityType === "investor") {
    const { data } = await supabase
      .from("investor_interest")
      .select("id, name, email, organization, linkedin")
      .eq("id", entityId)
      .maybeSingle();
    if (!data) return null;
    return {
      entity_type: "investor",
      entity_id: data.id,
      name: data.name ?? data.email,
      email: data.email,
      nif: null,
      organization: data.organization,
      address: null,
      sector: null,
      linkedin: data.linkedin,
    };
  }

  if (entityType === "partner") {
    const { data } = await supabase
      .from("partner_applications")
      .select("id, name, email, organization, linkedin")
      .eq("id", entityId)
      .maybeSingle();
    if (!data) return null;
    return {
      entity_type: "partner",
      entity_id: data.id,
      name: data.name,
      email: data.email,
      nif: null,
      organization: data.organization,
      address: null,
      sector: null,
      linkedin: data.linkedin,
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────
// Búsqueda global (Cmd+K) — F1.4
// ─────────────────────────────────────────────────────────

/**
 * Búsqueda global multi-tabla para Cmd+K.
 * Paraleliza queries a las 4 tablas CRM + quotes + contracts.
 * Devuelve hits con `href` ya resuelto a la página detalle.
 */
export async function globalSearch(
  query: string,
  perGroup = 5,
): Promise<GlobalSearchResults> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) {
    throw new Error("No autorizado");
  }

  const q = (query ?? "").trim().replace(/[,%()]/g, "");

  async function fromFunnelLeads(): Promise<GlobalSearchHit[]> {
    let qb = supabase
      .from("funnel_leads")
      .select("id, name, email, archetype, status, created_at")
      .order("created_at", { ascending: false })
      .limit(perGroup);
    if (q) qb = qb.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
    const { data } = await qb;
    return (data ?? []).map((r) => ({
      group: "funnel_lead" as GlobalSearchGroup,
      id: r.id,
      href: `/crm/ventas/${r.id}`,
      title: r.name,
      subtitle: r.email,
      meta: [r.archetype, r.status].filter(Boolean).join(" · ") || null,
      created_at: r.created_at,
    }));
  }

  async function fromLeadMagnet(): Promise<GlobalSearchHit[]> {
    let qb = supabase
      .from("lead_magnet_subscribers")
      .select("id, name, email, source, status, created_at")
      .order("created_at", { ascending: false })
      .limit(perGroup);
    if (q) qb = qb.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
    const { data } = await qb;
    return (data ?? []).map((r) => ({
      group: "lead_magnet" as GlobalSearchGroup,
      id: r.id,
      href: `/crm/lead-magnet/${r.id}`,
      title: r.name ?? r.email,
      subtitle: r.email,
      meta: [r.source, r.status].filter(Boolean).join(" · ") || null,
      created_at: r.created_at,
    }));
  }

  async function fromInvestors(): Promise<GlobalSearchHit[]> {
    let qb = supabase
      .from("investor_interest")
      .select("id, name, email, organization, ticket_size, status, created_at")
      .order("created_at", { ascending: false })
      .limit(perGroup);
    if (q) qb = qb.or(`name.ilike.%${q}%,email.ilike.%${q}%,organization.ilike.%${q}%`);
    const { data } = await qb;
    return (data ?? []).map((r) => ({
      group: "investor" as GlobalSearchGroup,
      id: r.id,
      href: `/crm/inversores/${r.id}`,
      title: r.name ?? r.email,
      subtitle: r.organization ? `${r.email} · ${r.organization}` : r.email,
      meta: [r.ticket_size, r.status].filter(Boolean).join(" · ") || null,
      created_at: r.created_at,
    }));
  }

  async function fromPartners(): Promise<GlobalSearchHit[]> {
    let qb = supabase
      .from("partner_applications")
      .select("id, name, email, organization, partner_type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(perGroup);
    if (q) qb = qb.or(`name.ilike.%${q}%,email.ilike.%${q}%,organization.ilike.%${q}%`);
    const { data } = await qb;
    return (data ?? []).map((r) => ({
      group: "partner" as GlobalSearchGroup,
      id: r.id,
      href: `/crm/partners/${r.id}`,
      title: r.name,
      subtitle: r.organization ? `${r.email} · ${r.organization}` : r.email,
      meta: [r.partner_type, r.status].filter(Boolean).join(" · ") || null,
      created_at: r.created_at,
    }));
  }

  async function fromQuotes(): Promise<GlobalSearchHit[]> {
    let qb = supabase
      .from("quotes")
      .select("id, quote_number, client_name, client_email, status, total_eur, currency, created_at")
      .order("created_at", { ascending: false })
      .limit(perGroup);
    if (q) {
      qb = qb.or(
        `client_name.ilike.%${q}%,client_email.ilike.%${q}%,quote_number.ilike.%${q}%`,
      );
    }
    const { data } = await qb;
    return (data ?? []).map((r) => ({
      group: "quote" as GlobalSearchGroup,
      id: r.id,
      href: `/comercial/calculadora/${r.id}`,
      title: `${r.quote_number} · ${r.client_name}`,
      subtitle: r.client_email,
      meta:
        [
          r.status,
          r.total_eur != null
            ? `${Number(r.total_eur).toFixed(2)} ${r.currency ?? "EUR"}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ") || null,
      created_at: r.created_at,
    }));
  }

  async function fromContracts(): Promise<GlobalSearchHit[]> {
    let qb = supabase
      .from("contracts")
      .select("id, contract_number, client_name, client_email, status, category, created_at")
      .order("created_at", { ascending: false })
      .limit(perGroup);
    if (q) {
      qb = qb.or(
        `client_name.ilike.%${q}%,client_email.ilike.%${q}%,contract_number.ilike.%${q}%`,
      );
    }
    const { data } = await qb;
    return (data ?? []).map((r) => ({
      group: "contract" as GlobalSearchGroup,
      id: r.id,
      href: `/comercial/legal/contratos/${r.id}`,
      title: `${r.contract_number} · ${r.client_name}`,
      subtitle: r.client_email,
      meta: [r.category, r.status].filter(Boolean).join(" · ") || null,
      created_at: r.created_at,
    }));
  }

  const [a, b, c, d, e, f] = await Promise.all([
    fromFunnelLeads(),
    fromLeadMagnet(),
    fromInvestors(),
    fromPartners(),
    fromQuotes(),
    fromContracts(),
  ]);

  const hits = [...a, ...b, ...c, ...d, ...e, ...f];

  return { hits, query: q, total: hits.length };
}
