"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  X,
  Briefcase,
  FileText,
  Users,
  Mail,
  TrendingUp,
  Handshake,
  ArrowRight,
} from "lucide-react";
import { globalSearch } from "~/lib/actions/search";
import {
  GLOBAL_SEARCH_GROUPS,
  GLOBAL_SEARCH_GROUP_LABELS,
  type GlobalSearchHit,
  type GlobalSearchGroup,
} from "~/lib/search-types";
import { cn } from "~/lib/utils";

const GROUP_ICON: Record<GlobalSearchGroup, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  funnel_lead: Users,
  lead_magnet: Mail,
  investor: TrendingUp,
  partner: Handshake,
  quote: Briefcase,
  contract: FileText,
};

const GROUP_TONE: Record<GlobalSearchGroup, string> = {
  funnel_lead: "text-brand-400",
  lead_magnet: "text-anthracite-200",
  investor: "text-warning",
  partner: "text-success",
  quote: "text-brand-400",
  contract: "text-anthracite-200",
};

interface GlobalSearchProps {
  /** Si se controla externamente (por ejemplo desde un atajo del header). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [hits, setHits] = React.useState<GlobalSearchHit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Reset al cerrar
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIdx(0);
    }
  }, [open]);

  // Bloquear scroll del body
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Búsqueda con debounce
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(() => {
      setLoading(true);
      setError(null);
      globalSearch(query, 5)
        .then((res) => {
          if (cancelled) return;
          setHits(res.hits);
          setActiveIdx(0);
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : "Error de búsqueda");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, query]);

  // Scroll del activo a la vista
  React.useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx, hits]);

  // Agrupar manteniendo orden estable (GLOBAL_SEARCH_GROUPS)
  const grouped = React.useMemo(() => {
    const map = new Map<GlobalSearchGroup, GlobalSearchHit[]>();
    GLOBAL_SEARCH_GROUPS.forEach((g) => map.set(g, []));
    hits.forEach((h) => {
      map.get(h.group)?.push(h);
    });
    return GLOBAL_SEARCH_GROUPS.map((g) => ({
      group: g,
      label: GLOBAL_SEARCH_GROUP_LABELS[g],
      items: map.get(g) ?? [],
    })).filter((s) => s.items.length > 0);
  }, [hits]);

  // Lista plana ordenada igual que el render → para navegación con teclado
  const flat = React.useMemo(() => grouped.flatMap((s) => s.items), [grouped]);

  function handleSelect(hit: GlobalSearchHit) {
    onOpenChange(false);
    router.push(hit.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (flat.length === 0 ? 0 : (i + 1) % flat.length));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (flat.length === 0 ? 0 : (i - 1 + flat.length) % flat.length));
      return;
    }
    if (e.key === "Enter") {
      const target = flat[activeIdx];
      if (target) {
        e.preventDefault();
        handleSelect(target);
      }
    }
  }

  if (!open) return null;

  let runningIdx = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda global"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-[12vh]"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        aria-label="Cerrar búsqueda"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-xl card-dark p-0 max-h-[80vh] flex flex-col">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-anthracite-600/30 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-anthracite-400" strokeWidth={1.5} />
          <input
            ref={inputRef}
            autoFocus
            type="search"
            placeholder="Buscar leads, presupuestos, contratos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-base sm:text-sm text-fg placeholder:text-anthracite-400 focus:outline-none"
          />
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-anthracite-400" strokeWidth={2} />
          ) : null}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-2 -m-2 text-anthracite-400 hover:text-fg"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Resultados */}
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {error ? (
            <div className="px-5 py-12 text-center text-sm text-error">{error}</div>
          ) : grouped.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-anthracite-400">
              {loading ? "Buscando…" : query ? "Sin coincidencias." : "Empieza a escribir para buscar."}
            </div>
          ) : (
            <div className="py-2">
              {grouped.map((section) => {
                const Icon = GROUP_ICON[section.group];
                const tone = GROUP_TONE[section.group];
                return (
                  <div key={section.group} className="px-2 py-1">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-anthracite-400">
                      {section.label}
                    </p>
                    <ul className="flex flex-col">
                      {section.items.map((hit) => {
                        const idx = runningIdx++;
                        const isActive = idx === activeIdx;
                        return (
                          <li key={`${hit.group}-${hit.id}`}>
                            <button
                              type="button"
                              data-idx={idx}
                              onMouseEnter={() => setActiveIdx(idx)}
                              onClick={() => handleSelect(hit)}
                              className={cn(
                                "w-full flex items-center gap-3 rounded-[8px] px-3 py-2 text-left transition-colors",
                                isActive
                                  ? "bg-brand-500/15 border border-brand-500/30"
                                  : "border border-transparent hover:bg-anthracite-800/60",
                              )}
                            >
                              <Icon
                                className={cn("h-4 w-4 shrink-0", tone)}
                                strokeWidth={1.5}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-fg truncate">
                                  {hit.title}
                                </div>
                                {hit.subtitle ? (
                                  <div className="text-xs text-anthracite-300 truncate">
                                    {hit.subtitle}
                                  </div>
                                ) : null}
                                {hit.meta ? (
                                  <div className="text-[11px] text-anthracite-400 truncate">
                                    {hit.meta}
                                  </div>
                                ) : null}
                              </div>
                              <ArrowRight
                                className={cn(
                                  "h-4 w-4 shrink-0 transition-opacity",
                                  isActive
                                    ? "opacity-100 text-brand-400"
                                    : "opacity-0",
                                )}
                                strokeWidth={1.5}
                              />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer atajos */}
        <div className="border-t border-anthracite-600/30 px-4 py-2 flex items-center justify-between text-[10px] text-anthracite-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-anthracite-600/60 bg-anthracite-900 px-1.5 py-0.5 text-[10px] font-mono">
                ↑↓
              </kbd>
              navegar
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-anthracite-600/60 bg-anthracite-900 px-1.5 py-0.5 text-[10px] font-mono">
                ↵
              </kbd>
              abrir
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-anthracite-600/60 bg-anthracite-900 px-1.5 py-0.5 text-[10px] font-mono">
                esc
              </kbd>
              cerrar
            </span>
          </div>
          <span className="hidden sm:inline">Búsqueda global · 6 colecciones</span>
        </div>
      </div>
    </div>
  );
}
