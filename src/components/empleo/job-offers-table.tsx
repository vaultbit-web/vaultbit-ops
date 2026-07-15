"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Search } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn, formatDateShort } from "~/lib/utils";
import { updateJobOfferStatus } from "~/lib/actions/empleo";
import {
  JOB_OFFER_STATUSES,
  JOB_OFFER_STATUS_LABELS,
  MATCH_LEVELS,
  MATCH_LEVEL_LABELS,
  PIPELINE_ACTIVE_STATUSES,
  isStale,
  matchLevel,
  type JobOffer,
  type JobOfferStatus,
  type MatchLevel,
} from "~/lib/empleo/types";

interface JobOffersTableProps {
  offers: JobOffer[];
}

export function JobOffersTable({ offers }: JobOffersTableProps) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");
  const [source, setSource] = useState("all");
  const [where, setWhere] = useState("all");
  const [status, setStatus] = useState("all");
  const [showStale, setShowStale] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Triaje optimista: cambios locales mientras la server action revalida.
  const [localStatus, setLocalStatus] = useState<Record<string, JobOfferStatus>>({});
  const [, startTransition] = useTransition();

  const sources = useMemo(() => {
    const set = new Set<string>();
    for (const o of offers) set.add(o.source);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [offers]);

  const statusOf = (o: JobOffer): JobOfferStatus => localStatus[o.id] ?? o.status;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return offers.filter((o) => {
      const st = statusOf(o);
      // Caducadas ocultas por defecto, salvo pipeline personal activo.
      if (!showStale && isStale(o) && !PIPELINE_ACTIVE_STATUSES.includes(st)) {
        return false;
      }
      // Archivadas/descartadas solo se ven pidiéndolas en el filtro de estado:
      // el vigilante refresca last_seen_at en cada pasada y las "des-caducaba",
      // haciéndolas reaparecer en la vista por defecto aunque ya estaban triadas.
      if ((st === "archivada" || st === "descartada") && status !== st) {
        return false;
      }
      if (level !== "all" && matchLevel(o.score_match) !== level) return false;
      if (source !== "all" && o.source !== source) return false;
      if (where === "remote" && !o.is_remote) return false;
      if (where === "barcelona" && !o.is_barcelona) return false;
      if (status !== "all" && st !== status) return false;
      if (needle) {
        const haystack = [o.title, o.company, o.location]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers, q, level, source, where, status, showStale, localStatus]);

  function clearLocal(id: string) {
    setLocalStatus((prev) => {
      if (!(id in prev)) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  function changeStatus(offer: JobOffer, next: JobOfferStatus) {
    setLocalStatus((prev) => ({ ...prev, [offer.id]: next }));
    startTransition(async () => {
      const res = await updateJobOfferStatus(offer.id, next);
      // En éxito, la transition revalida /empleo y llegan props frescas con el
      // valor ya persistido: soltamos el override local para no tapar futuros
      // cambios de esa fila. En fallo, revertimos igualmente al valor del server.
      clearLocal(offer.id);
      if (!res.ok && typeof window !== "undefined") {
        window.alert("No se pudo actualizar el estado. Inténtalo de nuevo.");
      }
    });
  }

  const selectClass =
    "rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2 sm:py-1.5 text-base sm:text-xs text-fg focus:border-brand-500/50 focus:outline-none";

  return (
    <>
      {/* Filtros */}
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
            placeholder="Buscar título o empresa…"
            className="w-full md:w-56 rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 pl-8 pr-3 py-2 sm:py-1.5 text-base sm:text-xs text-fg focus:border-brand-500/50 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-1 md:mx-0 md:flex-1 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className={cn(selectClass, "shrink-0")}
            aria-label="Filtrar por nivel de match"
          >
            <option value="all">Todos los niveles</option>
            {MATCH_LEVELS.map((l) => (
              <option key={l} value={l}>
                {MATCH_LEVEL_LABELS[l]}
              </option>
            ))}
          </select>
          <select
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            className={cn(selectClass, "shrink-0")}
            aria-label="Filtrar por ubicación"
          >
            <option value="all">Remoto y Barcelona</option>
            <option value="remote">Solo remoto</option>
            <option value="barcelona">Solo Barcelona</option>
          </select>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className={cn(selectClass, "shrink-0")}
            aria-label="Filtrar por fuente"
          >
            <option value="all">Todas las fuentes</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={cn(selectClass, "shrink-0")}
            aria-label="Filtrar por estado"
          >
            <option value="all">Todos los estados</option>
            {JOB_OFFER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {JOB_OFFER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-anthracite-300 select-none">
            <input
              type="checkbox"
              checked={showStale}
              onChange={(e) => setShowStale(e.target.checked)}
              className="accent-(--color-brand-500)"
            />
            Ver caducadas
          </label>
          <span className="text-[11px] text-anthracite-400 ml-auto shrink-0 pl-2">
            {filtered.length} de {offers.length}
          </span>
        </div>
      </div>

      {/* Vista tarjeta (móvil) */}
      <ul className="flex flex-col gap-2.5 md:hidden">
        {filtered.length === 0 ? (
          <li className="card-dark px-4 py-12 text-center text-sm text-anthracite-400">
            {offers.length === 0
              ? "Sin ofertas todavía. El vigilante n8n las irá trayendo a las 9:00 y a las 18:00."
              : "Ningún resultado con estos filtros."}
          </li>
        ) : (
          filtered.map((o) => {
            const st = statusOf(o);
            const stale = isStale(o);
            const expanded = expandedId === o.id;
            return (
              <li
                key={o.id}
                className={cn(
                  "card-dark p-4 transition-colors",
                  stale && "opacity-60",
                )}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : o.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-fg leading-snug">{o.title}</p>
                    <MatchBadge score={o.score_match} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-anthracite-200">
                    {o.company ? <span className="line-clamp-1">{o.company}</span> : null}
                    <span className="text-anthracite-400">{o.source}</span>
                    {fmtSalary(o) ? (
                      <span className="text-brand-400">{fmtSalary(o)}</span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {o.is_barcelona ? <Badge tone="info">Barcelona</Badge> : null}
                    {o.is_remote ? <Badge tone="neutral">Remoto</Badge> : null}
                    {stale ? <Badge tone="warning">Caducada</Badge> : null}
                  </div>
                </button>
                {expanded ? <OfferDetail offer={o} /> : null}
                <div className="mt-2.5 flex items-center gap-2 border-t border-anthracite-600/20 pt-2.5">
                  <select
                    value={st}
                    onChange={(e) => changeStatus(o, e.target.value as JobOfferStatus)}
                    className={cn(selectClass, "flex-1")}
                    aria-label={`Estado de ${o.title}`}
                  >
                    {JOB_OFFER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {JOB_OFFER_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <a
                    href={o.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir oferta: ${o.title}`}
                    className="flex h-11 w-11 items-center justify-center rounded-[10px] text-brand-400 active:bg-anthracite-700/40"
                  >
                    <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                  </a>
                </div>
              </li>
            );
          })
        )}
      </ul>

      {/* Vista tabla (md+) */}
      <div className="card-dark relative hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-anthracite-600/30 bg-anthracite-900/60 text-[10px] uppercase tracking-[0.1em] text-anthracite-200">
                <th className="text-left font-semibold px-4 py-3">Oferta</th>
                <th className="text-left font-semibold px-4 py-3">Empresa</th>
                <th className="text-left font-semibold px-4 py-3">Match</th>
                <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Salario</th>
                <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Fuente</th>
                <th className="text-left font-semibold px-4 py-3 hidden xl:table-cell">Vista</th>
                <th className="text-left font-semibold px-4 py-3">Estado</th>
                <th className="px-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-anthracite-400">
                    {offers.length === 0
                      ? "Sin ofertas todavía. El vigilante n8n las irá trayendo a las 9:00 y a las 18:00."
                      : "Ningún resultado con estos filtros."}
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const st = statusOf(o);
                  const stale = isStale(o);
                  const expanded = expandedId === o.id;
                  return (
                    <Fragment key={o.id}>
                      <tr
                        className={cn(
                          "border-b border-anthracite-600/20 last:border-b-0 hover:bg-anthracite-700/20 transition-colors cursor-pointer group",
                          stale && "opacity-60",
                          expanded && "bg-anthracite-700/15",
                        )}
                        onClick={() => setExpandedId(expanded ? null : o.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={o.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-medium text-fg hover:text-brand-400 line-clamp-2"
                              title={o.link}
                            >
                              {o.title}
                            </a>
                            <ExternalLink
                              className="h-3 w-3 shrink-0 text-anthracite-400"
                              strokeWidth={1.5}
                            />
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {o.is_barcelona ? <Badge tone="info">Barcelona</Badge> : null}
                            {o.is_remote ? <Badge tone="neutral">Remoto</Badge> : null}
                            {stale ? <Badge tone="warning">Caducada</Badge> : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-anthracite-100">
                          <span className="line-clamp-1">{o.company ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <MatchBadge score={o.score_match} />
                        </td>
                        <td className="px-4 py-3 text-anthracite-200 hidden lg:table-cell whitespace-nowrap">
                          {fmtSalary(o) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-anthracite-200 hidden lg:table-cell">
                          {o.source}
                        </td>
                        <td className="px-4 py-3 text-anthracite-200 hidden xl:table-cell">
                          <span className="text-[11px]">{formatDateShort(o.last_seen_at)}</span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={st}
                            onChange={(e) => changeStatus(o, e.target.value as JobOfferStatus)}
                            className={selectClass}
                            aria-label={`Estado de ${o.title}`}
                          >
                            {JOB_OFFER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {JOB_OFFER_STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-right">
                          {expanded ? (
                            <ChevronDown className="h-4 w-4 text-brand-400 inline-block" strokeWidth={1.5} />
                          ) : (
                            <ChevronRight
                              className="h-4 w-4 text-anthracite-400 group-hover:text-brand-400 inline-block"
                              strokeWidth={1.5}
                            />
                          )}
                        </td>
                      </tr>
                      {expanded ? (
                        <tr className="border-b border-anthracite-600/20 bg-anthracite-900/40">
                          <td colSpan={8} className="px-4 pb-4 pt-1">
                            <OfferDetail offer={o} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-anthracite-950/50 to-transparent lg:hidden"
        />
      </div>
    </>
  );
}

/** Detalle expandido: snippet + requisitos + razones del match + metadatos. */
function OfferDetail({ offer }: { offer: JobOffer }) {
  return (
    <div className="mt-3 space-y-3 text-xs leading-relaxed">
      {offer.snippet ? (
        <p className="text-anthracite-100 whitespace-pre-line">{offer.snippet}</p>
      ) : (
        <p className="text-anthracite-400">Sin descripción en la fuente. Abre el enlace para ver la oferta completa.</p>
      )}
      {offer.requirements ? (
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-anthracite-400 font-semibold mb-1">
            Requisitos
          </p>
          <p className="text-anthracite-100">{offer.requirements}</p>
        </div>
      ) : null}
      {offer.match_reasons.length > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-anthracite-400 font-semibold mb-1">
            Por qué este match
          </p>
          <div className="flex flex-wrap gap-1.5">
            {offer.match_reasons.map((r) => (
              <Badge key={r} tone="neutral">
                {r}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-anthracite-400">
        {offer.location ? <span>Ubicación: {offer.location}</span> : null}
        {offer.published_at ? <span>Publicada: {formatDateShort(offer.published_at)}</span> : null}
        <span>Vista por primera vez: {formatDateShort(offer.first_seen_at)}</span>
        <span>Última vez vista: {formatDateShort(offer.last_seen_at)}</span>
        <span>Motor: {offer.match_engine}</span>
      </div>
      <a
        href={offer.link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 font-medium"
      >
        Abrir la oferta
        <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
      </a>
    </div>
  );
}

function MatchBadge({ score }: { score: number | null }) {
  const level = matchLevel(score);
  const tone: "success" | "warning" | "neutral" | "info" =
    level === "alto" ? "success" : level === "medio" ? "warning" : level === "bajo" ? "neutral" : "info";
  return (
    <Badge tone={tone}>{score == null ? "Sin puntuar" : `${score} / 100`}</Badge>
  );
}

function fmtSalary(o: JobOffer): string | null {
  const sym =
    o.salary_currency === "USD" ? "$" : o.salary_currency === "GBP" ? "£" : "€";
  const k = (n: number) =>
    n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
  if (o.salary_min && o.salary_max && o.salary_min !== o.salary_max) {
    return `${k(o.salary_min)}-${k(o.salary_max)} ${sym}`;
  }
  // Salario fijo (min===max, común en ofertas transparentes): cifra exacta.
  if (o.salary_min) return `${k(o.salary_min)} ${sym}`;
  if (o.salary_max) return `hasta ${k(o.salary_max)} ${sym}`;
  return null;
}
