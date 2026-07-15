"use client";

import { useMemo, useState } from "react";
import { ChevronRight, ShieldCheck, ShieldAlert } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn, formatDateShort } from "~/lib/utils";
import {
  COMPETITION_RISK_LABELS,
  PIPELINE_STAGE_LABELS,
  VERIFICATION_LEVEL_LABELS,
  type Partner,
  type PartnerSource,
} from "~/lib/captacion/types";
import { PartnerDrawer } from "./partner-drawer";

interface PartnersIbizaTableProps {
  partners: Partner[];
  sourcesByPartnerId: Record<string, PartnerSource[]>;
}

export function PartnersIbizaTable({
  partners,
  sourcesByPartnerId,
}: PartnersIbizaTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedPartner = useMemo(
    () => partners.find((p) => p.id === selectedId) ?? null,
    [partners, selectedId],
  );
  const selectedSources = useMemo(
    () => (selectedId ? sourcesByPartnerId[selectedId] ?? [] : []),
    [sourcesByPartnerId, selectedId],
  );

  function openDrawer(id: string) {
    setSelectedId(id);
    setDrawerOpen(true);
  }

  return (
    <>
      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-anthracite-600/30 bg-anthracite-900/60 text-[10px] uppercase tracking-[0.1em] text-anthracite-200">
                <th className="text-left font-semibold px-4 py-3">Nombre</th>
                <th className="text-left font-semibold px-4 py-3">Empresa</th>
                <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Ciudad</th>
                <th className="text-left font-semibold px-4 py-3">Verificación</th>
                <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Competencia</th>
                <th className="text-left font-semibold px-4 py-3">Etapa</th>
                <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Próx. acción</th>
                <th className="px-3" />
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-anthracite-400"
                  >
                    Sin partners cargados. Ejecuta el seed:{" "}
                    <code className="text-brand-400">npx tsx scripts/seed-captacion-90d.ts</code>
                  </td>
                </tr>
              ) : (
                partners.map((p) => {
                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        "border-b border-anthracite-600/20 last:border-b-0 hover:bg-anthracite-700/20 transition-colors cursor-pointer group",
                      )}
                      onClick={() => openDrawer(p.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-fg truncate">
                            {p.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-anthracite-100">
                        <span className="line-clamp-1">{p.company ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-anthracite-200 hidden md:table-cell">
                        {p.city ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={verifTone(p.verification_level)}>
                          {p.verification_level === "high" ? (
                            <ShieldCheck className="h-3 w-3" strokeWidth={1.5} />
                          ) : (
                            <ShieldAlert className="h-3 w-3" strokeWidth={1.5} />
                          )}
                          {VERIFICATION_LEVEL_LABELS[p.verification_level]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Badge tone={riskTone(p.competition_risk)}>
                          {COMPETITION_RISK_LABELS[p.competition_risk]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={p.pipeline_stage === "partner_activo" ? "success" : "brand"}>
                          {PIPELINE_STAGE_LABELS[p.pipeline_stage]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-anthracite-200 hidden md:table-cell">
                        <span className="text-[11px] text-brand-400">
                          {formatDateShort(p.next_action_date)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <ChevronRight
                          className="h-4 w-4 text-anthracite-400 group-hover:text-brand-400 inline-block"
                          strokeWidth={1.5}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PartnerDrawer
        partner={selectedPartner}
        sources={selectedSources}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}

function verifTone(
  level: Partner["verification_level"],
): "success" | "warning" | "error" | "neutral" {
  switch (level) {
    case "high":
      return "success";
    case "medium":
      return "warning";
    case "low":
      return "error";
    default:
      return "neutral";
  }
}

function riskTone(
  risk: Partner["competition_risk"],
): "success" | "info" | "warning" | "error" | "neutral" {
  switch (risk) {
    case "none":
    case "low":
      return "success";
    case "medium":
      return "info";
    case "high":
      return "warning";
    case "very_high":
      return "error";
    default:
      return "neutral";
  }
}
