"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Globe, Mail, Phone, Search } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn, formatDateShort } from "~/lib/utils";
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABELS,
  PROFESSIONAL_TYPES,
  PROFESSIONAL_TYPE_LABELS,
  type Partner,
  type PartnerSource,
  type PipelineStage,
  type ProfessionalType,
} from "~/lib/captacion/types";
import { PartnerDrawer } from "./partner-drawer";

interface PosiblesPartnersTableProps {
  partners: Partner[];
  sourcesByPartnerId: Record<string, PartnerSource[]>;
}

export function PosiblesPartnersTable({
  partners,
  sourcesByPartnerId,
}: PosiblesPartnersTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("all");
  const [type, setType] = useState("all");
  const [stage, setStage] = useState("all");

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const p of partners) {
      if (p.city) set.add(p.city);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [partners]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return partners.filter((p) => {
      if (city !== "all" && p.city !== city) return false;
      if (type !== "all" && (p.professional_type ?? "") !== type) return false;
      if (stage !== "all" && p.pipeline_stage !== stage) return false;
      if (needle) {
        const haystack = [p.full_name, p.company, p.city]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [partners, q, city, type, stage]);

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

  const selectClass =
    "rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2 sm:py-1.5 text-base sm:text-xs text-fg focus:border-brand-500/50 focus:outline-none";

  return (
    <>
      {/* Filtros: buscador a ancho completo en móvil + selects en fila scrolleable */}
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-anthracite-400"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nombre u organización…"
            className="w-full md:w-56 rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 pl-8 pr-3 py-2 sm:py-1.5 text-base sm:text-xs text-fg focus:border-brand-500/50 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-1 md:mx-0 md:flex-1 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={cn(selectClass, "shrink-0")}
            aria-label="Filtrar por ciudad"
          >
            <option value="all">Todas las ciudades</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={cn(selectClass, "shrink-0")}
            aria-label="Filtrar por tipo"
          >
            <option value="all">Todos los tipos</option>
            {PROFESSIONAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {PROFESSIONAL_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className={cn(selectClass, "shrink-0")}
            aria-label="Filtrar por etapa"
          >
            <option value="all">Todas las etapas</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>
                {PIPELINE_STAGE_LABELS[s]}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-anthracite-400 ml-auto shrink-0 pl-2">
            {filtered.length} de {partners.length}
          </span>
        </div>
      </div>

      {/* Vista tarjeta (móvil) */}
      <ul className="flex flex-col gap-2.5 md:hidden">
        {filtered.length === 0 ? (
          <li className="card-dark px-4 py-12 text-center text-sm text-anthracite-400">
            {partners.length === 0
              ? "Sin posibles partners todavía. Añade el primero con el botón de arriba."
              : "Ningún resultado con estos filtros."}
          </li>
        ) : (
          filtered.map((p) => (
            <li
              key={p.id}
              className="card-dark p-4 transition-colors active:bg-anthracite-700/30"
            >
              <button
                type="button"
                onClick={() => openDrawer(p.id)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-fg leading-snug">
                    {p.full_name}
                  </p>
                  <Badge
                    tone={
                      p.pipeline_stage === "partner_activo" ? "success" : "brand"
                    }
                  >
                    {PIPELINE_STAGE_LABELS[p.pipeline_stage]}
                  </Badge>
                </div>
                {p.company ? (
                  <p className="mt-0.5 text-xs text-anthracite-200 line-clamp-1">
                    {p.company}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-anthracite-400">
                  {p.professional_type ? (
                    <Badge tone={typeTone(p.professional_type)}>
                      {PROFESSIONAL_TYPE_LABELS[p.professional_type]}
                    </Badge>
                  ) : null}
                  {p.city ? <span>{p.city}</span> : null}
                  {p.next_action_date ? (
                    <span className="ml-auto text-brand-400">
                      {formatDateShort(p.next_action_date)}
                    </span>
                  ) : null}
                </div>
              </button>
              {p.phone || p.email || p.company_website ? (
                <div className="mt-2.5 flex gap-1 border-t border-anthracite-600/20 pt-2">
                  {p.phone ? (
                    <a
                      href={`tel:${p.phone.replace(/\s+/g, "")}`}
                      aria-label={`Llamar a ${p.full_name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-[10px] text-anthracite-200 active:bg-anthracite-700/40"
                    >
                      <Phone className="h-4 w-4" strokeWidth={1.5} />
                    </a>
                  ) : null}
                  {p.email ? (
                    <a
                      href={`mailto:${p.email}`}
                      aria-label={`Escribir a ${p.full_name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-[10px] text-anthracite-200 active:bg-anthracite-700/40"
                    >
                      <Mail className="h-4 w-4" strokeWidth={1.5} />
                    </a>
                  ) : null}
                  {p.company_website ? (
                    <a
                      href={p.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir web de ${p.full_name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-[10px] text-anthracite-200 active:bg-anthracite-700/40"
                    >
                      <Globe className="h-4 w-4" strokeWidth={1.5} />
                    </a>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>

      {/* Vista tabla (md+) */}
      <div className="card-dark relative hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-anthracite-600/30 bg-anthracite-900/60 text-[10px] uppercase tracking-[0.1em] text-anthracite-200">
                <th className="text-left font-semibold px-4 py-3">Nombre</th>
                <th className="text-left font-semibold px-4 py-3">Organización</th>
                <th className="text-left font-semibold px-4 py-3">Tipo</th>
                <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Ciudad</th>
                <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Contacto</th>
                <th className="text-left font-semibold px-4 py-3">Etapa</th>
                <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Próx. acción</th>
                <th className="px-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-anthracite-400"
                  >
                    {partners.length === 0
                      ? "Sin posibles partners todavía. Añade el primero con el botón de arriba."
                      : "Ningún resultado con estos filtros."}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className={cn(
                      "border-b border-anthracite-600/20 last:border-b-0 hover:bg-anthracite-700/20 transition-colors cursor-pointer group",
                    )}
                    onClick={() => openDrawer(p.id)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-fg">
                        {p.full_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-anthracite-100">
                      <span className="line-clamp-1">{p.company ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {p.professional_type ? (
                        <Badge tone={typeTone(p.professional_type)}>
                          {PROFESSIONAL_TYPE_LABELS[p.professional_type]}
                        </Badge>
                      ) : (
                        <span className="text-anthracite-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-anthracite-200 hidden md:table-cell">
                      {p.city ?? "—"}
                    </td>
                    <td
                      className="px-4 py-3 hidden lg:table-cell"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2.5">
                        {p.phone ? (
                          <a
                            href={`tel:${p.phone.replace(/\s+/g, "")}`}
                            className="text-anthracite-300 hover:text-brand-400"
                            title={p.phone}
                            aria-label={`Llamar a ${p.full_name}`}
                          >
                            <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </a>
                        ) : null}
                        {p.email ? (
                          <a
                            href={`mailto:${p.email}`}
                            className="text-anthracite-300 hover:text-brand-400"
                            title={p.email}
                            aria-label={`Escribir a ${p.full_name}`}
                          >
                            <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </a>
                        ) : null}
                        {p.company_website ? (
                          <a
                            href={p.company_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-anthracite-300 hover:text-brand-400"
                            title={p.company_website}
                            aria-label={`Abrir web de ${p.full_name}`}
                          >
                            <Globe className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </a>
                        ) : null}
                        {!p.phone && !p.email && !p.company_website ? (
                          <span className="text-anthracite-400 text-xs">—</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          p.pipeline_stage === "partner_activo"
                            ? "success"
                            : "brand"
                        }
                      >
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
                ))
              )}
            </tbody>
          </table>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-anthracite-950/50 to-transparent lg:hidden"
        />
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

function typeTone(
  type: ProfessionalType,
): "success" | "info" | "warning" | "brand" | "neutral" {
  switch (type) {
    case "notaria":
      return "brand";
    case "abogado_sucesiones":
      return "info";
    case "fiscalista":
      return "warning";
    case "gestor_patrimonio":
    case "family_office":
      return "success";
    default:
      return "neutral";
  }
}

export type { PipelineStage };
