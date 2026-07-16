"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Search,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn, formatDateShort } from "~/lib/utils";
import { updateAuditLeadStatus } from "~/lib/actions/prospectos";
import {
  AUDIT_LEAD_STATUSES,
  AUDIT_LEAD_STATUS_LABELS,
  CONTACT_CHANNEL_LABELS,
  LEAD_BUILDERS,
  LEAD_TYPES,
  LEAD_TYPE_LABELS,
  LEAD_ZONAS,
  PIPELINE_ACTIVE_STATUSES,
  SCORE_LEVELS,
  SCORE_LEVEL_LABELS,
  isStale,
  leadScore,
  scoreLevel,
  type AuditLead,
  type AuditLeadStatus,
  type ContactChannel,
} from "~/lib/leads/types";

interface LeadsTableProps {
  leads: AuditLead[];
}

const ZONA_LABELS: Record<string, string> = {
  es: "España",
  eu: "Europa",
  global: "Global",
};

export function LeadsTable({ leads }: LeadsTableProps) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");
  const [builder, setBuilder] = useState("all");
  const [zona, setZona] = useState("all");
  const [tipo, setTipo] = useState("all");
  const [status, setStatus] = useState("all");
  const [showStale, setShowStale] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Triaje optimista: cambios locales mientras la server action revalida.
  const [localStatus, setLocalStatus] = useState<Record<string, AuditLeadStatus>>({});
  const [, startTransition] = useTransition();

  const statusOf = (l: AuditLead): AuditLeadStatus => localStatus[l.id] ?? l.status;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads.filter((l) => {
      const st = statusOf(l);
      // Caducados ocultos por defecto, salvo pipeline activo.
      if (!showStale && isStale(l) && !PIPELINE_ACTIVE_STATUSES.includes(st)) {
        return false;
      }
      // Archivados/descartados solo se ven pidiéndolos: n8n refresca last_seen_at
      // en cada pasada y los "des-caducaría", reapareciendo aunque ya se triaron.
      if ((st === "archivado" || st === "descartado") && status !== st) {
        return false;
      }
      if (level !== "all" && scoreLevel(leadScore(l)) !== level) return false;
      if (builder !== "all" && (l.builder ?? "desconocido") !== builder) return false;
      if (zona !== "all" && l.zona !== zona) return false;
      if (tipo !== "all" && l.lead_type !== tipo) return false;
      if (status !== "all" && st !== status) return false;
      if (needle) {
        const haystack = [l.product_name, l.founder, l.source]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, q, level, builder, zona, tipo, status, showStale, localStatus]);

  function clearLocal(id: string) {
    setLocalStatus((prev) => {
      if (!(id in prev)) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  function changeStatus(lead: AuditLead, next: AuditLeadStatus) {
    setLocalStatus((prev) => ({ ...prev, [lead.id]: next }));
    startTransition(async () => {
      const res = await updateAuditLeadStatus(lead.id, next);
      clearLocal(lead.id);
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
            placeholder="Buscar producto o fundador…"
            className="w-full md:w-56 rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 pl-8 pr-3 py-2 sm:py-1.5 text-base sm:text-xs text-fg focus:border-brand-500/50 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-1 md:mx-0 md:flex-1 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className={cn(selectClass, "shrink-0")}
            aria-label="Filtrar por auditabilidad"
          >
            <option value="all">Toda auditabilidad</option>
            {SCORE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {SCORE_LEVEL_LABELS[l]}
              </option>
            ))}
          </select>
          <select
            value={builder}
            onChange={(e) => setBuilder(e.target.value)}
            className={cn(selectClass, "shrink-0")}
            aria-label="Filtrar por builder"
          >
            <option value="all">Todos los builders</option>
            {LEAD_BUILDERS.map((b) => (
              <option key={b} value={b}>
                {b === "desconocido" ? "Sin builder" : b}
              </option>
            ))}
          </select>
          <select
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            className={cn(selectClass, "shrink-0")}
            aria-label="Filtrar por zona"
          >
            <option value="all">Todas las zonas</option>
            {LEAD_ZONAS.map((z) => (
              <option key={z} value={z}>
                {ZONA_LABELS[z]}
              </option>
            ))}
          </select>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={cn(selectClass, "shrink-0")}
            aria-label="Filtrar por tipo"
          >
            <option value="all">Todos los tipos</option>
            {LEAD_TYPES.map((t) => (
              <option key={t} value={t}>
                {LEAD_TYPE_LABELS[t]}
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
            {AUDIT_LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {AUDIT_LEAD_STATUS_LABELS[s]}
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
            Ver caducados
          </label>
          <span className="text-[11px] text-anthracite-400 ml-auto shrink-0 pl-2">
            {filtered.length} de {leads.length}
          </span>
        </div>
      </div>

      {/* Vista tarjeta (móvil) */}
      <ul className="flex flex-col gap-2.5 md:hidden">
        {filtered.length === 0 ? (
          <li className="card-dark px-4 py-12 text-center text-sm text-anthracite-400">
            {leads.length === 0
              ? "Sin leads todavía. Client Scout los traerá a las 8:00 y a las 15:00."
              : "Ningún resultado con estos filtros."}
          </li>
        ) : (
          filtered.map((l) => {
            const st = statusOf(l);
            const stale = isStale(l);
            const expanded = expandedId === l.id;
            return (
              <li
                key={l.id}
                className={cn("card-dark p-4 transition-colors", stale && "opacity-60")}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : l.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-fg leading-snug">{l.product_name}</p>
                    <ScoreBadge lead={l} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-anthracite-200">
                    {l.founder ? <span className="line-clamp-1">{l.founder}</span> : null}
                    <span className="text-anthracite-400">{l.source}</span>
                    {l.builder && l.builder !== "desconocido" ? (
                      <span className="text-brand-400">{l.builder}</span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {l.zona ? <Badge tone="info">{ZONA_LABELS[l.zona] ?? l.zona}</Badge> : null}
                    {l.lead_type === "blockchain" ? <Badge tone="info">Blockchain</Badge> : null}
                    {l.signals.length > 0 ? (
                      <Badge tone="warning">
                        {l.signals.length} {l.signals.length === 1 ? "señal" : "señales"}
                      </Badge>
                    ) : null}
                    {stale ? <Badge tone="neutral">Caducado</Badge> : null}
                  </div>
                </button>
                {expanded ? <LeadDetail lead={l} /> : null}
                <div className="mt-2.5 flex items-center gap-2 border-t border-anthracite-600/20 pt-2.5">
                  <select
                    value={st}
                    onChange={(e) => changeStatus(l, e.target.value as AuditLeadStatus)}
                    className={cn(selectClass, "flex-1")}
                    aria-label={`Estado de ${l.product_name}`}
                  >
                    {AUDIT_LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {AUDIT_LEAD_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir ${l.product_name}`}
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
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-anthracite-600/30 bg-anthracite-900/60 text-[10px] uppercase tracking-[0.1em] text-anthracite-200">
                <th className="text-left font-semibold px-4 py-3">Producto</th>
                <th className="text-left font-semibold px-4 py-3">Fundador</th>
                <th className="text-left font-semibold px-4 py-3">Auditabilidad</th>
                <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Builder</th>
                <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Fuente</th>
                <th className="text-left font-semibold px-4 py-3 hidden xl:table-cell">Visto</th>
                <th className="text-left font-semibold px-4 py-3">Estado</th>
                <th className="px-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-anthracite-400">
                    {leads.length === 0
                      ? "Sin leads todavía. Client Scout los traerá a las 8:00 y a las 15:00."
                      : "Ningún resultado con estos filtros."}
                  </td>
                </tr>
              ) : (
                filtered.map((l) => {
                  const st = statusOf(l);
                  const stale = isStale(l);
                  const expanded = expandedId === l.id;
                  return (
                    <Fragment key={l.id}>
                      <tr
                        className={cn(
                          "border-b border-anthracite-600/20 last:border-b-0 hover:bg-anthracite-700/20 transition-colors cursor-pointer group",
                          stale && "opacity-60",
                          expanded && "bg-anthracite-700/15",
                        )}
                        onClick={() => setExpandedId(expanded ? null : l.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={l.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-medium text-fg hover:text-brand-400 line-clamp-2"
                              title={l.url}
                            >
                              {l.product_name}
                            </a>
                            <ExternalLink
                              className="h-3 w-3 shrink-0 text-anthracite-400"
                              strokeWidth={1.5}
                            />
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {l.zona ? <Badge tone="info">{ZONA_LABELS[l.zona] ?? l.zona}</Badge> : null}
                            {l.lead_type === "blockchain" ? <Badge tone="info">Blockchain</Badge> : null}
                            {l.signals.length > 0 ? (
                              <Badge tone="warning">
                                {l.signals.length} {l.signals.length === 1 ? "señal" : "señales"}
                              </Badge>
                            ) : null}
                            {stale ? <Badge tone="neutral">Caducado</Badge> : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-anthracite-100">
                          <span className="line-clamp-1">{l.founder ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <ScoreBadge lead={l} />
                        </td>
                        <td className="px-4 py-3 text-anthracite-200 hidden lg:table-cell">
                          {l.builder && l.builder !== "desconocido" ? l.builder : "—"}
                        </td>
                        <td className="px-4 py-3 text-anthracite-200 hidden lg:table-cell">
                          {l.source}
                        </td>
                        <td className="px-4 py-3 text-anthracite-200 hidden xl:table-cell">
                          <span className="text-[11px]">{formatDateShort(l.last_seen_at)}</span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={st}
                            onChange={(e) => changeStatus(l, e.target.value as AuditLeadStatus)}
                            className={selectClass}
                            aria-label={`Estado de ${l.product_name}`}
                          >
                            {AUDIT_LEAD_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {AUDIT_LEAD_STATUS_LABELS[s]}
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
                            <LeadDetail lead={l} />
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
      </div>
    </>
  );
}

/** Detalle expandido: snippet, señales, contacto, razones, outreach y metadatos. */
function LeadDetail({ lead }: { lead: AuditLead }) {
  const hasOutreach =
    !!lead.outreach_dm || !!lead.outreach_email || !!lead.outreach_email_subject;
  // Enlaces de contacto (los escribe /client-scout, OSINT pasivo), en orden de
  // preferencia de canal; el preferido se destaca junto al borrador de mensaje.
  const contactLinks: { channel: ContactChannel; href: string; label: string }[] = [];
  if (lead.founder_linkedin)
    contactLinks.push({ channel: "linkedin", href: lead.founder_linkedin, label: CONTACT_CHANNEL_LABELS.linkedin });
  if (lead.founder_x)
    contactLinks.push({ channel: "x", href: lead.founder_x, label: CONTACT_CHANNEL_LABELS.x });
  if (lead.contact_email)
    contactLinks.push({ channel: "email", href: `mailto:${lead.contact_email}`, label: lead.contact_email });
  if (lead.founder_web)
    contactLinks.push({ channel: "web", href: lead.founder_web, label: CONTACT_CHANNEL_LABELS.web });
  if (lead.founder_github)
    contactLinks.push({ channel: "github", href: lead.founder_github, label: CONTACT_CHANNEL_LABELS.github });
  return (
    <div className="mt-3 space-y-3 text-xs leading-relaxed">
      {lead.snippet ? (
        <p className="text-anthracite-100 whitespace-pre-line">{lead.snippet}</p>
      ) : (
        <p className="text-anthracite-400">
          Sin descripción en la fuente. Abre el enlace para ver el producto.
        </p>
      )}

      {lead.signals.length > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-anthracite-400 font-semibold mb-1 flex items-center gap-1.5">
            <ShieldAlert className="h-3 w-3 text-warning" strokeWidth={1.8} />
            Señales del fingerprint pasivo (uso interno, nunca en el mensaje)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lead.signals.map((s) => (
              <Badge key={s} tone="warning">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {lead.qualify_reasons.length > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-anthracite-400 font-semibold mb-1">
            Por qué encaja (Claude)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lead.qualify_reasons.map((r) => (
              <Badge key={r} tone="neutral">
                {r}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {lead.stack.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {lead.stack.map((s) => (
            <Badge key={s} tone="info">
              {s}
            </Badge>
          ))}
        </div>
      ) : null}

      {lead.traccion ? (
        <p className="text-anthracite-200">
          <span className="text-[10px] uppercase tracking-[0.1em] text-anthracite-400 font-semibold mr-1.5">
            Tracción
          </span>
          {lead.traccion}
        </p>
      ) : null}

      {contactLinks.length > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-anthracite-400 font-semibold mb-1">
            Contacto
          </p>
          <div className="flex flex-wrap gap-1.5">
            {contactLinks.map((c) => {
              const preferred = lead.contact_channel === c.channel;
              return (
                <a
                  key={c.channel}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    preferred
                      ? "border-brand-500/50 bg-brand-500/10 text-brand-300 hover:text-brand-200"
                      : "border-anthracite-600/40 text-anthracite-100 hover:border-brand-500/40 hover:text-brand-300",
                  )}
                >
                  {c.label}
                  {preferred ? (
                    <span className="text-[9px] uppercase tracking-[0.08em] text-brand-400">
                      · preferido
                    </span>
                  ) : null}
                  <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                </a>
              );
            })}
          </div>
        </div>
      ) : null}

      {hasOutreach ? (
        <div className="space-y-2 rounded-(--radius-md) border border-brand-500/20 bg-brand-500/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.1em] text-brand-400 font-semibold">
            Borrador de primer mensaje (revisa antes de enviar)
          </p>
          {lead.outreach_dm ? (
            <OutreachBlock label="DM" text={lead.outreach_dm} />
          ) : null}
          {lead.outreach_email ? (
            <OutreachBlock
              label="Email"
              subject={lead.outreach_email_subject}
              text={lead.outreach_email}
            />
          ) : null}
        </div>
      ) : lead.status === "nuevo" ? (
        <p className="text-anthracite-400">
          Aún sin investigar. Lanza <code className="text-brand-400">/client-scout hoy</code> en
          Claude Code para enriquecerlo y redactar el primer mensaje.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-anthracite-400">
        {lead.language ? <span>Idioma: {lead.language}</span> : null}
        {lead.next_action ? (
          <span>
            Próxima acción: {lead.next_action}
            {lead.next_action_date ? ` (${formatDateShort(lead.next_action_date)})` : ""}
          </span>
        ) : null}
        {lead.published_at ? <span>Publicado: {formatDateShort(lead.published_at)}</span> : null}
        <span>Visto por primera vez: {formatDateShort(lead.first_seen_at)}</span>
        <span>Última vez visto: {formatDateShort(lead.last_seen_at)}</span>
        <span>Motor: {lead.match_engine}</span>
      </div>

      {lead.notes ? (
        <p className="text-anthracite-300 whitespace-pre-line border-t border-anthracite-600/20 pt-2">
          {lead.notes}
        </p>
      ) : null}

      <a
        href={lead.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 font-medium"
      >
        Abrir el producto
        <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
      </a>
    </div>
  );
}

function OutreachBlock({
  label,
  text,
  subject,
}: {
  label: string;
  text: string;
  subject?: string | null;
}) {
  const full = subject ? `Asunto: ${subject}\n\n${text}` : text;
  return (
    <div className="rounded-(--radius-md) border border-anthracite-600/30 bg-anthracite-900/60 p-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.1em] text-anthracite-400 font-semibold">
          {label}
        </span>
        <CopyButton text={full} />
      </div>
      {subject ? (
        <p className="text-anthracite-200 font-medium mb-1">Asunto: {subject}</p>
      ) : null}
      <p className="text-anthracite-100 whitespace-pre-line">{text}</p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard no disponible */
        }
      }}
      className="inline-flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" strokeWidth={2} /> Copiado
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" strokeWidth={1.8} /> Copiar
        </>
      )}
    </button>
  );
}

function ScoreBadge({ lead }: { lead: AuditLead }) {
  const score = leadScore(lead);
  const level = scoreLevel(score);
  const tone: "success" | "warning" | "neutral" | "info" =
    level === "alto" ? "success" : level === "medio" ? "warning" : level === "bajo" ? "neutral" : "info";
  return (
    <Badge tone={tone}>
      {score == null ? "Sin puntuar" : `${score} / 100`}
      {lead.match_engine === "claude" ? " · IA" : ""}
    </Badge>
  );
}
