"use client";

import * as React from "react";
import {
  CheckCircle2,
  Loader2,
  Star,
  Trash2,
  X,
  Wand2,
  AlertTriangle,
} from "lucide-react";
import {
  deleteIdea,
  promoteIdeaToScript,
  updateIdeaStatus,
} from "~/lib/actions/founder";
import {
  FOUNDER_IDEA_STATUS_LABELS,
  FOUNDER_FORMAT_LABELS,
  type FounderIdea,
  type FounderFormat,
  type FounderIdeaScoreBreakdown,
  type FounderIdeaStatus,
} from "~/lib/supabase/types";
import { Badge } from "./ui/badge";
import { cn, relativeTime } from "~/lib/utils";

interface FounderIdeaCardProps {
  idea: FounderIdea;
}

const SCORE_LABELS: Record<keyof FounderIdeaScoreBreakdown, string> = {
  contracurrent: "Contracorriente",
  filter_5_50: "Filtro 5/50",
  unique: "Único",
  common_applicable: "Aplicable",
  polemical: "Polémico",
  format_fit: "Formato OK",
  brand_congruent: "Marca congruente",
  viral_reference: "Referencia viral",
};

function statusTone(status: FounderIdeaStatus) {
  switch (status) {
    case "diamond":
      return "brand" as const;
    case "promoted":
      return "success" as const;
    case "discarded":
      return "neutral" as const;
    default:
      return "info" as const;
  }
}

function scoreTone(score: number | null) {
  if (score === null) return "neutral" as const;
  if (score >= 6) return "success" as const;
  if (score >= 4) return "warning" as const;
  return "neutral" as const;
}

function parseBreakdown(raw: unknown): FounderIdeaScoreBreakdown {
  if (!raw || typeof raw !== "object") return {};
  const out: FounderIdeaScoreBreakdown = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "boolean" && k in SCORE_LABELS) {
      (out as Record<string, boolean>)[k] = v;
    }
  }
  return out;
}

function parseFlagged(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((x) => (typeof x === "string" ? [x] : []));
}

export function FounderIdeaCard({ idea }: FounderIdeaCardProps) {
  const [statusPending, startStatusTransition] = React.useTransition();
  const [promotePending, startPromoteTransition] = React.useTransition();
  const [deletePending, startDeleteTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const status = idea.status as FounderIdeaStatus;
  const breakdown = parseBreakdown(idea.idea_score_breakdown);
  const flagged = parseFlagged(idea.compliance_flagged);
  const formatLabel = idea.format
    ? FOUNDER_FORMAT_LABELS[idea.format as FounderFormat]
    : null;

  function changeStatus(next: FounderIdeaStatus) {
    setError(null);
    startStatusTransition(async () => {
      const res = await updateIdeaStatus(idea.id, next);
      if (!res.ok) setError(res.error);
    });
  }

  function promote() {
    setError(null);
    if (status === "promoted") {
      const ok = confirm(
        `Esta idea ya tiene un guion en cola. ¿Regenerar uno nuevo? El guion anterior se sustituirá.`,
      );
      if (!ok) return;
    }
    startPromoteTransition(async () => {
      const res = await promoteIdeaToScript(idea.id);
      if (!res.ok) setError(res.error);
    });
  }

  function onDelete() {
    if (!confirm(`¿Borrar la idea "${idea.theme}"?`)) return;
    setError(null);
    startDeleteTransition(async () => {
      const res = await deleteIdea(idea.id);
      if (!res.ok) setError(res.error);
    });
  }

  const isBusy = statusPending || promotePending || deletePending;

  return (
    <div
      className={cn(
        "card-dark p-4 sm:p-5 flex flex-col gap-3 transition-opacity",
        deletePending && "opacity-40 pointer-events-none",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge tone={scoreTone(idea.idea_score)}>
              {idea.idea_score !== null ? `Score ${idea.idea_score}/8` : "Sin score"}
            </Badge>
            <Badge tone={statusTone(status)}>
              {FOUNDER_IDEA_STATUS_LABELS[status]}
            </Badge>
            {idea.compliance_passes === false ? (
              <Badge tone="error">
                <AlertTriangle className="h-3 w-3" strokeWidth={2} />
                Compliance
              </Badge>
            ) : null}
          </div>
          <h3 className="text-sm font-semibold text-fg leading-snug">
            {idea.theme}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-anthracite-400">
            {idea.archetype ? <span>{idea.archetype}</span> : null}
            {formatLabel ? (
              <>
                <span>·</span>
                <span>{formatLabel}</span>
              </>
            ) : null}
            <span>·</span>
            <span>{relativeTime(idea.created_at)}</span>
          </div>
        </div>
      </div>

      {idea.rationale ? (
        <p className="text-xs text-anthracite-100 leading-relaxed">
          {idea.rationale}
        </p>
      ) : null}

      {Object.keys(breakdown).length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {Object.entries(SCORE_LABELS).map(([key, label]) => {
            const passed = breakdown[key as keyof FounderIdeaScoreBreakdown];
            if (passed === undefined) return null;
            return (
              <span
                key={key}
                className={cn(
                  "text-[10px] rounded-full px-2 py-0.5 border",
                  passed
                    ? "bg-success/10 border-success/30 text-success"
                    : "bg-anthracite-800 border-anthracite-700/60 text-anthracite-400 line-through",
                )}
              >
                {label}
              </span>
            );
          })}
        </div>
      ) : null}

      {flagged.length > 0 ? (
        <div className="rounded-[8px] border border-error/25 bg-error/5 px-2.5 py-1.5">
          <p className="text-[10px] font-semibold uppercase text-error tracking-wider mb-0.5">
            Compliance flagged
          </p>
          <ul className="text-[11px] text-anthracite-100 list-disc list-inside">
            {flagged.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-anthracite-700/40">
        {error ? (
          <span className="text-[11px] text-error">{error}</span>
        ) : (
          <span className="text-[11px] text-anthracite-400">
            {status === "promoted"
              ? "Guion en cola editorial · puedes regenerarlo"
              : "¿Pasa el filtro 5/8?"}
          </span>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          {status !== "promoted" && status !== "discarded" ? (
            <button
              type="button"
              onClick={() => changeStatus("diamond")}
              disabled={isBusy || status === "diamond"}
              className="inline-flex items-center gap-1 rounded-(--radius-md) border border-brand-500/40 bg-brand-500/10 px-2 py-1 text-[11px] font-semibold text-brand-400 hover:bg-brand-500/20 disabled:opacity-50 transition-colors"
            >
              {statusPending ? (
                <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
              ) : (
                <Star className="h-3 w-3" strokeWidth={1.5} />
              )}
              Ganadora
            </button>
          ) : null}
          {status !== "discarded" && status !== "promoted" ? (
            <button
              type="button"
              onClick={() => changeStatus("discarded")}
              disabled={isBusy}
              className="inline-flex items-center gap-1 rounded-(--radius-md) border border-anthracite-600/60 px-2 py-1 text-[11px] font-semibold text-anthracite-200 hover:border-anthracite-400 hover:text-fg disabled:opacity-50 transition-colors"
            >
              <X className="h-3 w-3" strokeWidth={1.5} />
              Descartar
            </button>
          ) : null}
          {status === "discarded" ? (
            <button
              type="button"
              onClick={() => changeStatus("raw")}
              disabled={isBusy}
              className="inline-flex items-center gap-1 rounded-(--radius-md) border border-anthracite-600/60 px-2 py-1 text-[11px] font-semibold text-anthracite-200 hover:border-anthracite-400 hover:text-fg disabled:opacity-50 transition-colors"
            >
              Restaurar
            </button>
          ) : null}
          {status === "promoted" ? (
            <Badge tone="success">
              <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
              En cola
            </Badge>
          ) : null}
          <button
            type="button"
            onClick={promote}
            disabled={isBusy}
            title={
              status === "promoted"
                ? "Regenerar guion (sustituye al anterior)"
                : "Generar guion completo con Gemini"
            }
            className={cn(
              "inline-flex items-center gap-1 rounded-(--radius-md) px-2.5 py-1 text-[11px] font-semibold text-fg disabled:opacity-50 transition-colors",
              status === "promoted"
                ? "border border-brand-500/40 bg-brand-500/15 hover:bg-brand-500/25"
                : "bg-brand-500 hover:bg-brand-400",
            )}
          >
            {promotePending ? (
              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
            ) : (
              <Wand2 className="h-3 w-3" strokeWidth={1.5} />
            )}
            {promotePending
              ? "Generando guion…"
              : status === "promoted"
                ? "Regenerar guion"
                : "Generar guion"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isBusy}
            title="Borrar idea"
            className="inline-flex items-center gap-1 rounded-(--radius-md) border border-error/30 bg-error/5 px-1.5 py-1 text-[11px] font-semibold text-error/90 hover:bg-error/15 disabled:opacity-50 transition-colors"
          >
            {deletePending ? (
              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
            ) : (
              <Trash2 className="h-3 w-3" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
