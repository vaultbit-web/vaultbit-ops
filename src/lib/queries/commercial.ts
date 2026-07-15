import { createClient } from "~/lib/supabase/server";
import type {
  Contract,
  ContractTemplate,
  Quote,
  ServicePricing,
  PricingTier,
  PricingModifier,
} from "~/lib/supabase/types";
import type { PricingRules } from "~/lib/quotes/pricing-engine";

/**
 * Tarifas activas indexadas por (service_slug, tier, modality).
 * Cargadas en server-side para usarlas en el form de calculadora.
 */
export async function getActivePricing(): Promise<ServicePricing[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("service_pricing")
      .select("*")
      .eq("active", true)
      .order("service_slug", { ascending: true })
      .order("tier", { ascending: true });
    if (error) {
      console.error("[getActivePricing]", error.message);
      return [];
    }
    return (data ?? []) as ServicePricing[];
  } catch {
    return [];
  }
}

export async function getPricingMap(): Promise<Map<string, ServicePricing>> {
  const list = await getActivePricing();
  const map = new Map<string, ServicePricing>();
  list.forEach((p) => {
    map.set(`${p.service_slug}:${p.tier}:${p.modality}`, p);
  });
  return map;
}

/**
 * Reglas ACTIVAS del motor de precios (tiers + modifiers) para la
 * calculadora. Se inyectan en el motor puro computeServicePrice().
 */
export async function getPricingRules(): Promise<PricingRules> {
  try {
    const supabase = await createClient();
    const [tiersRes, modsRes] = await Promise.all([
      supabase
        .from("pricing_tiers")
        .select("*")
        .eq("active", true)
        .order("service_slug", { ascending: true })
        .order("sort_order", { ascending: true }),
      supabase
        .from("pricing_modifiers")
        .select("*")
        .eq("active", true)
        .order("service_slug", { ascending: true })
        .order("sort_order", { ascending: true }),
    ]);
    if (tiersRes.error) console.error("[getPricingRules tiers]", tiersRes.error.message);
    if (modsRes.error) console.error("[getPricingRules modifiers]", modsRes.error.message);
    return {
      tiers: (tiersRes.data ?? []) as PricingTier[],
      modifiers: (modsRes.data ?? []) as PricingModifier[],
    };
  } catch {
    return { tiers: [], modifiers: [] };
  }
}

/** Todos los tiers (incluye inactivos) para el admin de tarifas. */
export async function getAllPricingTiers(): Promise<PricingTier[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pricing_tiers")
      .select("*")
      .order("service_slug", { ascending: true })
      .order("modality", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("[getAllPricingTiers]", error.message);
      return [];
    }
    return (data ?? []) as PricingTier[];
  } catch {
    return [];
  }
}

/** Todos los modifiers (incluye inactivos) para el admin de tarifas. */
export async function getAllPricingModifiers(): Promise<PricingModifier[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pricing_modifiers")
      .select("*")
      .order("service_slug", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("[getAllPricingModifiers]", error.message);
      return [];
    }
    return (data ?? []) as PricingModifier[];
  } catch {
    return [];
  }
}

export async function listQuotes(params: {
  q?: string;
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<{ rows: Quote[]; total: number; pages: number; page: number; pageSize: number }> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 50;
  try {
    const supabase = await createClient();
    let query = supabase
      .from("quotes")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (params.q && params.q.trim()) {
      const q = params.q.trim().replace(/[,%()]/g, "");
      query = query.or(
        `client_name.ilike.%${q}%,client_email.ilike.%${q}%,quote_number.ilike.%${q}%`,
      );
    }
    if (params.status) {
      query = query.eq("status", params.status);
    }

    const { data, count, error } = await query;
    if (error) {
      console.error("[listQuotes]", error.message);
      return { rows: [], total: 0, pages: 0, page, pageSize };
    }
    const total = count ?? 0;
    return {
      rows: (data ?? []) as Quote[],
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch {
    return { rows: [], total: 0, pages: 0, page, pageSize };
  }
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as Quote | null;
  } catch {
    return null;
  }
}

export async function getActiveTemplates(): Promise<ContractTemplate[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    if (error) {
      console.error("[getActiveTemplates]", error.message);
      return [];
    }
    return (data ?? []) as ContractTemplate[];
  } catch {
    return [];
  }
}

export async function getTemplateBySlug(slug: string): Promise<ContractTemplate | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as ContractTemplate | null;
  } catch {
    return null;
  }
}

export async function listContracts(params: {
  q?: string;
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<{ rows: Contract[]; total: number; pages: number; page: number; pageSize: number }> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 50;
  try {
    const supabase = await createClient();
    let query = supabase
      .from("contracts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (params.q && params.q.trim()) {
      const q = params.q.trim().replace(/[,%()]/g, "");
      query = query.or(
        `client_name.ilike.%${q}%,client_email.ilike.%${q}%,contract_number.ilike.%${q}%`,
      );
    }
    if (params.status) {
      query = query.eq("status", params.status);
    }

    const { data, count, error } = await query;
    if (error) {
      console.error("[listContracts]", error.message);
      return { rows: [], total: 0, pages: 0, page, pageSize };
    }
    const total = count ?? 0;
    return {
      rows: (data ?? []) as Contract[],
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch {
    return { rows: [], total: 0, pages: 0, page, pageSize };
  }
}

export async function getContractById(id: string): Promise<Contract | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as Contract | null;
  } catch {
    return null;
  }
}
