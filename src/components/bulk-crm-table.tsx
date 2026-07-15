"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Trash2, X, Loader2, AlertTriangle, Check } from "lucide-react";
import {
  type EntityType,
  type FunnelLead,
  type LeadMagnetSubscriber,
  type InvestorInterest,
  type PartnerApplication,
  type Archetype,
  type PartnerType,
  ARCHETYPE_LABELS,
  PARTNER_TYPE_LABELS,
  FUNNEL_LEAD_STATUS,
  INVESTOR_STATUS,
  LEAD_MAGNET_STATUS,
  PARTNER_STATUS,
  ENTITY_LABELS,
  ENTITY_ROUTE,
} from "~/lib/supabase/types";
import { Badge } from "./ui/badge";
import { StatusSelect } from "./status-select";
import { statusToneClass, STATUS_LABEL_OVERRIDES } from "./status-tones";
import { formatDateShort } from "~/lib/utils";
import { bulkUpdateStatus, bulkDelete } from "~/lib/actions/crm-bulk";
import { cn } from "~/lib/utils";

type Row = FunnelLead | LeadMagnetSubscriber | InvestorInterest | PartnerApplication;

interface BulkCrmTableProps {
  entityType: EntityType;
  rows: Row[];
  /** Mensaje cuando no hay filas (depende de si hay query activa o no). */
  emptyMessage: string;
}

const STATUSES_BY_TYPE: Record<EntityType, readonly string[]> = {
  funnel_lead: FUNNEL_LEAD_STATUS,
  lead_magnet: LEAD_MAGNET_STATUS,
  investor: INVESTOR_STATUS,
  partner: PARTNER_STATUS,
};

const COLUMN_COUNT: Record<EntityType, number> = {
  funnel_lead: 7,
  lead_magnet: 7,
  investor: 7,
  partner: 6,
};

export function BulkCrmTable({ entityType, rows, emptyMessage }: BulkCrmTableProps) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [pending, startTransition] = React.useTransition();
  const [feedback, setFeedback] = React.useState<
    | { kind: "ok"; msg: string }
    | { kind: "error"; msg: string }
    | null
  >(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  // Si las filas cambian (paginación/búsqueda), purgo IDs que ya no estén visibles.
  React.useEffect(() => {
    setSelected((prev) => {
      const visible = new Set(rows.map((r) => r.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visible.has(id)) next.add(id);
      });
      return next;
    });
  }, [rows]);

  // Mensaje de éxito autodescarta.
  React.useEffect(() => {
    if (feedback?.kind === "ok") {
      const t = setTimeout(() => setFeedback(null), 2500);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.id)));
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
    setConfirmDelete(false);
  }

  function handleBulkStatus(newStatus: string) {
    if (!newStatus) return;
    const ids = Array.from(selected);
    setFeedback(null);
    startTransition(async () => {
      const res = await bulkUpdateStatus(entityType, ids, newStatus);
      if (res.ok) {
        setFeedback({ kind: "ok", msg: `${res.affected} actualizados a "${newStatus}"` });
        setSelected(new Set());
      } else {
        setFeedback({ kind: "error", msg: res.error });
      }
    });
  }

  function handleBulkDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const ids = Array.from(selected);
    setFeedback(null);
    startTransition(async () => {
      const res = await bulkDelete(entityType, ids);
      if (res.ok) {
        setFeedback({ kind: "ok", msg: `${res.affected} eliminados` });
        setSelected(new Set());
      } else {
        setFeedback({ kind: "error", msg: res.error });
      }
      setConfirmDelete(false);
    });
  }

  function exportSelectedHref(): string {
    const ids = Array.from(selected).join(",");
    return `/api/export/${entityType}${ids ? `?ids=${ids}` : ""}`;
  }

  function exportAllHref(): string {
    return `/api/export/${entityType}`;
  }

  const statuses = STATUSES_BY_TYPE[entityType];
  const headerCells = renderHeaderCells(entityType);
  const colCount = COLUMN_COUNT[entityType] + 1; // +1 por el checkbox

  return (
    <>
      {/* Vista tabla (md+) */}
      <div className="relative hidden w-full rounded-[16px] border border-anthracite-600/40 md:block">
        <div className="overflow-x-auto rounded-[16px]">
          <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-anthracite-900 text-[11px] font-semibold uppercase tracking-wider text-anthracite-200">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todos"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  className="vb-checkbox"
                />
              </th>
              {headerCells}
            </tr>
          </thead>
          <tbody className="divide-y divide-anthracite-600/30 [&>tr]:bg-anthracite-800 [&>tr:hover]:bg-anthracite-700/60">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-10 text-center text-sm text-anthracite-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="transition-colors">
                  <td className="px-4 py-3 align-middle">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar fila`}
                      checked={selected.has(row.id)}
                      onChange={() => toggle(row.id)}
                      className="vb-checkbox"
                    />
                  </td>
                  {renderRowCells(entityType, row)}
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-6 rounded-r-[16px] bg-gradient-to-l from-anthracite-950/50 to-transparent lg:hidden"
        />
      </div>

      {/* Vista tarjeta (móvil) */}
      <CrmCardList
        entityType={entityType}
        rows={rows}
        selected={selected}
        onToggle={toggle}
        emptyMessage={emptyMessage}
      />

      {/* Toolbar siempre visible: export todo. */}
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-anthracite-300">
        <span>{rows.length} en esta página</span>
        <Link
          href={exportAllHref()}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-anthracite-600/60 px-2.5 py-1.5 text-anthracite-100 hover:border-brand-500/40 hover:text-fg transition-colors"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
          Exportar todo a CSV
        </Link>
      </div>

      {/* Bar de acciones flotante */}
      {selected.size > 0 ? (
        <div className="fixed left-1/2 z-50 -translate-x-1/2 max-w-[calc(100vw-1rem)] bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-4">
          <div className="card-dark flex flex-wrap items-center gap-2 px-3 py-2 shadow-2xl">
            <span className="inline-flex items-center gap-2 px-2 text-sm font-medium text-fg">
              <span className="rounded-full bg-brand-500/15 text-brand-400 px-2 py-0.5 text-xs border border-brand-500/30">
                {selected.size}
              </span>
              {ENTITY_LABELS[entityType]} seleccionados
            </span>

            <div className="hidden sm:block w-px h-6 bg-anthracite-600/40" />

            <select
              defaultValue=""
              disabled={pending}
              onChange={(e) => {
                const v = e.target.value;
                if (v) handleBulkStatus(v);
                e.currentTarget.value = "";
              }}
              className="rounded-[8px] border border-anthracite-600/60 bg-anthracite-900 px-2 py-1.5 text-xs text-fg disabled:opacity-50"
              aria-label="Cambiar estado"
            >
              <option value="" disabled>
                Cambiar estado…
              </option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL_OVERRIDES[s] ?? s}
                </option>
              ))}
            </select>

            <Link
              href={exportSelectedHref()}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-anthracite-600/60 px-2.5 py-1.5 text-xs text-anthracite-100 hover:border-brand-500/40 hover:text-fg transition-colors"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
              CSV
            </Link>

            <button
              type="button"
              disabled={pending}
              onClick={handleBulkDelete}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50",
                confirmDelete
                  ? "border-error/60 bg-error/15 text-error hover:bg-error/25"
                  : "border-anthracite-600/60 text-anthracite-100 hover:border-error/40 hover:text-error",
              )}
              aria-label={confirmDelete ? "Confirmar eliminación" : "Eliminar selección"}
            >
              {confirmDelete ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Confirmar
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Eliminar
                </>
              )}
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex items-center gap-1 rounded-[8px] px-2 py-1.5 text-xs text-anthracite-300 hover:text-fg transition-colors"
              aria-label="Limpiar selección"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Limpiar</span>
            </button>

            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin text-anthracite-400" strokeWidth={2} />
            ) : null}
          </div>

          {feedback ? (
            <div
              className={cn(
                "mt-2 rounded-[10px] px-3 py-2 text-xs flex items-center gap-2 shadow-lg",
                feedback.kind === "ok"
                  ? "bg-success/15 text-success border border-success/30"
                  : "bg-error/15 text-error border border-error/30",
              )}
            >
              {feedback.kind === "ok" ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              {feedback.msg}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Render por tipo de entidad
// ─────────────────────────────────────────────────────────

function renderHeaderCells(entityType: EntityType): React.ReactNode {
  const TH = (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className={cn("px-4 py-3 font-semibold", props.className)} {...props} />
  );

  switch (entityType) {
    case "funnel_lead":
      return (
        <>
          <TH>Nombre</TH>
          <TH>Email</TH>
          <TH className="hidden md:table-cell">Arquetipo</TH>
          <TH className="hidden lg:table-cell">Canal</TH>
          <TH className="hidden lg:table-cell">UTM source</TH>
          <TH>Estado</TH>
          <TH className="hidden sm:table-cell">Fecha</TH>
        </>
      );
    case "lead_magnet":
      return (
        <>
          <TH>Nombre</TH>
          <TH>Email</TH>
          <TH className="hidden md:table-cell">Fuente</TH>
          <TH className="hidden lg:table-cell">PDF</TH>
          <TH className="hidden lg:table-cell">Follow-up</TH>
          <TH>Estado</TH>
          <TH className="hidden sm:table-cell">Fecha</TH>
        </>
      );
    case "investor":
      return (
        <>
          <TH>Nombre</TH>
          <TH>Email</TH>
          <TH className="hidden md:table-cell">Organización</TH>
          <TH className="hidden lg:table-cell">Vehículo</TH>
          <TH>Ticket</TH>
          <TH>Estado</TH>
          <TH className="hidden sm:table-cell">Fecha</TH>
        </>
      );
    case "partner":
      return (
        <>
          <TH>Nombre</TH>
          <TH>Email</TH>
          <TH className="hidden md:table-cell">Organización</TH>
          <TH>Tipo</TH>
          <TH>Estado</TH>
          <TH className="hidden sm:table-cell">Fecha</TH>
        </>
      );
  }
}

/** Lista de tarjetas para móvil (la tabla se oculta < md). */
function CrmCardList({
  entityType,
  rows,
  selected,
  onToggle,
  emptyMessage,
}: {
  entityType: EntityType;
  rows: Row[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="card-dark px-4 py-10 text-center text-sm text-anthracite-400 md:hidden">
        {emptyMessage}
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2.5 md:hidden">
      {rows.map((row) => {
        const card = cardContent(entityType, row);
        return (
          <li key={row.id} className="card-dark p-4 flex gap-3">
            <label className="flex h-11 w-8 -my-1 items-center justify-center shrink-0">
              <input
                type="checkbox"
                aria-label="Seleccionar"
                checked={selected.has(row.id)}
                onChange={() => onToggle(row.id)}
                className="vb-checkbox"
              />
            </label>
            <div className="min-w-0 flex-1">
              <Link
                href={`${ENTITY_ROUTE[entityType]}/${row.id}`}
                className="block active:opacity-70"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-medium text-fg">{card.primary}</p>
                  <span className="shrink-0 text-[11px] text-anthracite-400">
                    {formatDateShort(row.created_at)}
                  </span>
                </div>
                {card.secondary ? (
                  <p className="truncate text-xs text-anthracite-200">
                    {card.secondary}
                  </p>
                ) : null}
              </Link>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">{card.meta}</div>
                <StatusSelect
                  entityType={entityType}
                  entityId={row.id}
                  currentStatus={row.status}
                  statuses={STATUSES_BY_TYPE[entityType]}
                  labels={
                    entityType === "funnel_lead" ? STATUS_LABEL_OVERRIDES : undefined
                  }
                  toneClassName={statusToneClass(row.status)}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function cardContent(
  entityType: EntityType,
  row: Row,
): { primary: string; secondary: string | null; meta: React.ReactNode } {
  switch (entityType) {
    case "funnel_lead": {
      const r = row as FunnelLead;
      const archetypeLabel = ARCHETYPE_LABELS[r.archetype as Archetype] ?? r.archetype;
      return {
        primary: r.name,
        secondary: r.email,
        meta: <Badge tone="neutral">{archetypeLabel}</Badge>,
      };
    }
    case "lead_magnet": {
      const r = row as LeadMagnetSubscriber;
      return {
        primary: r.name ?? "—",
        secondary: r.email,
        meta: (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">{r.source}</Badge>
            {r.delivered ? <Badge tone="success">entregado</Badge> : null}
          </div>
        ),
      };
    }
    case "investor": {
      const r = row as InvestorInterest;
      return {
        primary: r.name ?? "—",
        secondary: r.organization ?? r.email,
        meta: r.ticket_size ? (
          <Badge tone="warning">{r.ticket_size}</Badge>
        ) : (
          <span className="text-xs text-anthracite-400">—</span>
        ),
      };
    }
    case "partner": {
      const r = row as PartnerApplication;
      const typeLabel = PARTNER_TYPE_LABELS[r.partner_type as PartnerType] ?? r.partner_type;
      return {
        primary: r.name,
        secondary: r.organization ?? r.email,
        meta: <Badge tone="success">{typeLabel}</Badge>,
      };
    }
  }
}

function renderRowCells(entityType: EntityType, row: Row): React.ReactNode {
  const td = "px-4 py-3 align-middle text-anthracite-100 whitespace-nowrap";

  switch (entityType) {
    case "funnel_lead": {
      const r = row as FunnelLead;
      const archetypeLabel = ARCHETYPE_LABELS[r.archetype as Archetype] ?? r.archetype;
      return (
        <>
          <td className={cn(td, "font-medium")}>
            <Link
              href={`/crm/ventas/${r.id}`}
              className="text-fg hover:text-brand-400 transition-colors"
            >
              {r.name}
            </Link>
          </td>
          <td className={td}>{r.email}</td>
          <td className={cn(td, "hidden md:table-cell")}>{archetypeLabel}</td>
          <td className={cn(td, "hidden lg:table-cell capitalize")}>{r.channel}</td>
          <td className={cn(td, "hidden lg:table-cell")}>{r.utm_source ?? "—"}</td>
          <td className={td}>
            <StatusSelect
              entityType="funnel_lead"
              entityId={r.id}
              currentStatus={r.status}
              statuses={FUNNEL_LEAD_STATUS}
              labels={STATUS_LABEL_OVERRIDES}
              toneClassName={statusToneClass(r.status)}
              compact
            />
          </td>
          <td className={cn(td, "hidden sm:table-cell text-anthracite-200")}>
            {formatDateShort(r.created_at)}
          </td>
        </>
      );
    }
    case "lead_magnet": {
      const r = row as LeadMagnetSubscriber;
      return (
        <>
          <td className={cn(td, "font-medium")}>
            <Link
              href={`/crm/lead-magnet/${r.id}`}
              className="text-fg hover:text-brand-400 transition-colors"
            >
              {r.name ?? "—"}
            </Link>
          </td>
          <td className={td}>{r.email}</td>
          <td className={cn(td, "hidden md:table-cell")}>{r.source}</td>
          <td className={cn(td, "hidden lg:table-cell")}>
            {r.delivered ? (
              <Badge tone="success">entregado</Badge>
            ) : (
              <Badge tone="neutral">pendiente</Badge>
            )}
          </td>
          <td className={cn(td, "hidden lg:table-cell")}>
            {r.follow_up_sent ? (
              <Badge tone="info">enviado</Badge>
            ) : (
              <Badge tone="neutral">—</Badge>
            )}
          </td>
          <td className={td}>
            <StatusSelect
              entityType="lead_magnet"
              entityId={r.id}
              currentStatus={r.status}
              statuses={LEAD_MAGNET_STATUS}
              toneClassName={statusToneClass(r.status)}
              compact
            />
          </td>
          <td className={cn(td, "hidden sm:table-cell text-anthracite-200")}>
            {formatDateShort(r.created_at)}
          </td>
        </>
      );
    }
    case "investor": {
      const r = row as InvestorInterest;
      return (
        <>
          <td className={cn(td, "font-medium")}>
            <Link
              href={`/crm/inversores/${r.id}`}
              className="text-fg hover:text-brand-400 transition-colors"
            >
              {r.name ?? "—"}
            </Link>
          </td>
          <td className={td}>{r.email}</td>
          <td className={cn(td, "hidden md:table-cell")}>{r.organization ?? "—"}</td>
          <td className={cn(td, "hidden lg:table-cell")}>{r.vehicle_type ?? "—"}</td>
          <td className={td}>
            {r.ticket_size ? <Badge tone="warning">{r.ticket_size}</Badge> : "—"}
          </td>
          <td className={td}>
            <StatusSelect
              entityType="investor"
              entityId={r.id}
              currentStatus={r.status}
              statuses={INVESTOR_STATUS}
              toneClassName={statusToneClass(r.status)}
              compact
            />
          </td>
          <td className={cn(td, "hidden sm:table-cell text-anthracite-200")}>
            {formatDateShort(r.created_at)}
          </td>
        </>
      );
    }
    case "partner": {
      const r = row as PartnerApplication;
      const typeLabel = PARTNER_TYPE_LABELS[r.partner_type as PartnerType] ?? r.partner_type;
      return (
        <>
          <td className={cn(td, "font-medium")}>
            <Link
              href={`/crm/partners/${r.id}`}
              className="text-fg hover:text-brand-400 transition-colors"
            >
              {r.name}
            </Link>
          </td>
          <td className={td}>{r.email}</td>
          <td className={cn(td, "hidden md:table-cell")}>{r.organization ?? "—"}</td>
          <td className={td}>
            <Badge tone="success">{typeLabel}</Badge>
          </td>
          <td className={td}>
            <StatusSelect
              entityType="partner"
              entityId={r.id}
              currentStatus={r.status}
              statuses={PARTNER_STATUS}
              toneClassName={statusToneClass(r.status)}
              compact
            />
          </td>
          <td className={cn(td, "hidden sm:table-cell text-anthracite-200")}>
            {formatDateShort(r.created_at)}
          </td>
        </>
      );
    }
  }
}
