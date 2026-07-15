import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import {
  ENTITY_TABLE,
  type EntityType,
  ENTITY_TYPES,
} from "~/lib/supabase/types";

export const dynamic = "force-dynamic";

/**
 * Columnas exportadas por entidad. Subconjunto curado para que el CSV
 * sea legible en Excel/Numbers sin tener que esconder columnas técnicas.
 */
const COLUMNS: Record<EntityType, string[]> = {
  funnel_lead: [
    "created_at",
    "name",
    "email",
    "archetype",
    "channel",
    "status",
    "q1",
    "q2",
    "q3",
    "q4",
    "q5",
    "notes",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "contacted_at",
    "converted_at",
  ],
  lead_magnet: [
    "created_at",
    "name",
    "email",
    "source",
    "status",
    "delivered",
    "delivered_at",
    "follow_up_sent",
    "utm_source",
    "utm_medium",
    "utm_campaign",
  ],
  investor: [
    "created_at",
    "name",
    "email",
    "organization",
    "vehicle_type",
    "ticket_size",
    "status",
    "linkedin",
    "message",
    "notes",
    "source",
    "utm_source",
  ],
  partner: [
    "created_at",
    "name",
    "email",
    "organization",
    "partner_type",
    "status",
    "linkedin",
    "message",
    "source",
    "utm_source",
  ],
};

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { entity } = await params;
  if (!ENTITY_TYPES.includes(entity as EntityType)) {
    return NextResponse.json({ error: "Tipo de entidad inválido" }, { status: 400 });
  }
  const entityType = entity as EntityType;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  const ids = idsParam
    ? idsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  const cols = COLUMNS[entityType];
  let query = supabase
    .from(ENTITY_TABLE[entityType])
    .select(cols.join(","))
    .order("created_at", { ascending: false });
  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[export]", entityType, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = cols.join(",");
  const rows = ((data ?? []) as unknown as Record<string, unknown>[]).map(
    (row) => cols.map((c) => escapeCsv(row[c])).join(","),
  );

  // BOM al inicio para que Excel detecte UTF-8 correctamente con tildes.
  const csv = "﻿" + [header, ...rows].join("\r\n");

  const today = new Date().toISOString().slice(0, 10);
  const filename = `vaultbit-${entityType}-${today}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
