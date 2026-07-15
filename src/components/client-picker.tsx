"use client";

import * as React from "react";
import { Search, Users, Loader2, X, Link2 } from "lucide-react";
import { searchCrmClients, type CrmSearchHit } from "~/lib/actions/search";
import {
  ENTITY_LABELS,
  ENTITY_TYPES,
  type EntityType,
} from "~/lib/supabase/types";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";

interface ClientPickerProps {
  /** Datos seleccionados actuales (para badge) */
  selected: { entity_type: EntityType; entity_id: string; name: string } | null;
  onSelect: (hit: CrmSearchHit) => void;
  onClear: () => void;
  /** Texto del botón cuando no hay seleccionado */
  triggerLabel?: string;
}

const ENTITY_TONE: Record<EntityType, string> = {
  funnel_lead: "bg-brand-500/10 text-brand-400 border-brand-500/20",
  lead_magnet: "bg-anthracite-700 text-anthracite-100 border-anthracite-600/40",
  investor: "bg-warning/15 text-warning border-warning/30",
  partner: "bg-success/15 text-success border-success/30",
};

export function ClientPicker({ selected, onSelect, onClear, triggerLabel }: ClientPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<EntityType | "all">("all");
  const [hits, setHits] = React.useState<CrmSearchHit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Cargar resultados al abrir y cuando cambia la query
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchCrmClients(query, 40)
      .then((rows) => {
        if (!cancelled) setHits(rows);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, query]);

  // Cerrar con Escape
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Bloquear scroll del body
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const filteredHits = React.useMemo(() => {
    if (filter === "all") return hits;
    return hits.filter((h) => h.entity_type === filter);
  }, [hits, filter]);

  function handleSelect(hit: CrmSearchHit) {
    onSelect(hit);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="flex items-center gap-2">
      {selected ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1.5">
          <Link2 className="h-3.5 w-3.5 text-brand-400" strokeWidth={1.5} />
          <span className="text-xs font-medium text-brand-400">
            CRM · {selected.name}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-brand-400 hover:text-fg"
            aria-label="Desvincular"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      ) : null}

      <Button
        type="button"
        variant={selected ? "ghost" : "secondary"}
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Users className="h-4 w-4" strokeWidth={1.5} />
        {selected ? "Cambiar cliente" : triggerLabel ?? "Seleccionar del CRM"}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-8">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-2xl card-dark p-0 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-anthracite-600/30 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-fg">Cliente del CRM</h3>
                <p className="text-[11px] text-anthracite-400">
                  Selecciona un lead, suscriptor, inversor o partner para autorrellenar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-anthracite-400 hover:text-fg"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="px-5 pt-4 pb-3 flex flex-col gap-3 border-b border-anthracite-600/30">
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-anthracite-400 pointer-events-none"
                  strokeWidth={1.5}
                />
                <input
                  autoFocus
                  type="search"
                  placeholder="Buscar por nombre, email u organización…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-10 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 pl-10 pr-3 text-sm text-fg placeholder:text-anthracite-400 focus-visible:border-brand-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-medium border transition-colors",
                    filter === "all"
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-anthracite-900 text-anthracite-200 border-anthracite-600/40 hover:text-fg",
                  )}
                >
                  Todos
                </button>
                {ENTITY_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilter(t)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[11px] font-medium border transition-colors",
                      filter === t
                        ? "bg-brand-500 text-white border-brand-500"
                        : "bg-anthracite-900 text-anthracite-200 border-anthracite-600/40 hover:text-fg",
                    )}
                  >
                    {ENTITY_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-anthracite-400">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Buscando…
                </div>
              ) : error ? (
                <div className="px-5 py-12 text-center text-sm text-error">{error}</div>
              ) : filteredHits.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-anthracite-400">
                  {query ? "Sin coincidencias." : "Sin clientes en el CRM aún."}
                </div>
              ) : (
                <ul className="divide-y divide-anthracite-600/20">
                  {filteredHits.map((hit) => (
                    <li key={`${hit.entity_type}-${hit.entity_id}`}>
                      <button
                        type="button"
                        onClick={() => handleSelect(hit)}
                        className="w-full px-5 py-3 hover:bg-anthracite-800/60 transition-colors text-left flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-fg truncate">
                              {hit.name}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
                                ENTITY_TONE[hit.entity_type],
                              )}
                            >
                              {ENTITY_LABELS[hit.entity_type]}
                            </span>
                          </div>
                          <div className="text-xs text-anthracite-300 truncate">
                            {hit.email}
                            {hit.organization ? ` · ${hit.organization}` : ""}
                          </div>
                          {hit.meta ? (
                            <div className="text-[11px] text-anthracite-400 truncate mt-0.5">
                              {hit.meta}
                            </div>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-anthracite-600/30 px-5 py-3">
              <p className="text-[10px] text-anthracite-400 text-center">
                Si tu cliente aún no está en el CRM, cierra este diálogo y rellena los campos manualmente.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
