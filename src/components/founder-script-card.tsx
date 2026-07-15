"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy as CopyIcon,
  Eye,
  ExternalLink,
  Heart,
  Loader2,
  PlayCircle,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import {
  deleteScript,
  generateScriptCopy,
  setScriptCopy,
  setScriptHookChosen,
  setScriptInstagramUrl,
  setScriptNote,
  updateScriptStatus,
} from "~/lib/actions/founder";
import {
  FOUNDER_FORMAT_LABELS,
  FOUNDER_SCRIPT_STATUS,
  FOUNDER_SCRIPT_STATUS_LABELS,
  type FounderFormat,
  type FounderMetric,
  type FounderScript,
  type FounderScriptStatus,
} from "~/lib/supabase/types";
import { Badge } from "./ui/badge";
import { cn, formatNumber, relativeTime } from "~/lib/utils";

interface FounderScriptCardProps {
  script: FounderScript;
  /** Último snapshot Meta (F2.3 sesión 2). null si aún no hay sync. */
  latestMetric?: FounderMetric | null;
}

function statusTone(status: FounderScriptStatus) {
  switch (status) {
    case "script":
      return "info" as const;
    case "recorded":
      return "warning" as const;
    case "edited":
      return "warning" as const;
    case "scheduled":
      return "brand" as const;
    case "published":
      return "success" as const;
  }
}

function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((x) => (typeof x === "string" ? [x] : []));
}

export function FounderScriptCard({
  script,
  latestMetric,
}: FounderScriptCardProps) {
  const [statusPending, startStatusTransition] = React.useTransition();
  const [hookPending, startHookTransition] = React.useTransition();
  const [urlPending, startUrlTransition] = React.useTransition();
  const [notePending, startNoteTransition] = React.useTransition();
  const [deletePending, startDeleteTransition] = React.useTransition();
  const [copyGenPending, startCopyGenTransition] = React.useTransition();
  const [copySavePending, startCopySaveTransition] = React.useTransition();

  const [optimisticStatus, setOptimisticStatus] =
    React.useState<FounderScriptStatus | null>(null);
  const [hookChosen, setHookChosen] = React.useState(
    script.hook_chosen ?? script.script_hook ?? "",
  );
  const [instagramUrl, setInstagramUrl] = React.useState(script.instagram_url ?? "");
  const [note, setNote] = React.useState(script.notes ?? "");
  const [copy, setCopy] = React.useState(script.script_copy ?? "");
  const [copyClipboardOk, setCopyClipboardOk] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const status = (optimisticStatus ?? (script.status as FounderScriptStatus)) as FounderScriptStatus;
  const hookOptions = asStringArray(script.hook_options);
  const hashtags = asStringArray(script.suggested_hashtags);
  const flagged = asStringArray(script.compliance_flagged);
  const formatLabel = script.format
    ? FOUNDER_FORMAT_LABELS[script.format as FounderFormat]
    : null;

  const hookDirty = hookChosen.trim() !== (script.hook_chosen ?? script.script_hook ?? "").trim();
  const urlDirty = instagramUrl.trim() !== (script.instagram_url ?? "").trim();
  const noteDirty = note.trim() !== (script.notes ?? "").trim();
  const copyDirty = copy.trim() !== (script.script_copy ?? "").trim();
  const copyCharCount = copy.length;
  const copyHasContent = copy.trim().length > 0;

  function onStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as FounderScriptStatus;
    setError(null);
    setOptimisticStatus(next);
    startStatusTransition(async () => {
      const res = await updateScriptStatus(script.id, next);
      if (!res.ok) {
        setOptimisticStatus(null);
        setError(res.error);
      }
    });
  }

  function saveHook() {
    setError(null);
    startHookTransition(async () => {
      const res = await setScriptHookChosen(script.id, hookChosen);
      if (!res.ok) setError(res.error);
    });
  }

  function saveUrl() {
    setError(null);
    startUrlTransition(async () => {
      const res = await setScriptInstagramUrl(script.id, instagramUrl);
      if (!res.ok) setError(res.error);
    });
  }

  function saveNote() {
    setError(null);
    startNoteTransition(async () => {
      const res = await setScriptNote(script.id, note);
      if (!res.ok) setError(res.error);
    });
  }

  function onDelete() {
    if (!confirm(`¿Borrar el guion "${script.theme}"?`)) return;
    setError(null);
    startDeleteTransition(async () => {
      const res = await deleteScript(script.id);
      if (!res.ok) setError(res.error);
    });
  }

  function onGenerateCopy() {
    if (
      copyHasContent &&
      !confirm(
        "Ya hay un copy generado. ¿Sustituirlo por uno nuevo?",
      )
    ) {
      return;
    }
    setError(null);
    startCopyGenTransition(async () => {
      const res = await generateScriptCopy(script.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setCopy(res.copy);
    });
  }

  function onSaveCopy() {
    setError(null);
    startCopySaveTransition(async () => {
      const res = await setScriptCopy(script.id, copy);
      if (!res.ok) setError(res.error);
    });
  }

  async function onCopyToClipboard() {
    try {
      await navigator.clipboard.writeText(copy);
      setCopyClipboardOk(true);
      setTimeout(() => setCopyClipboardOk(false), 1800);
    } catch {
      setError("No se pudo copiar al portapapeles");
    }
  }

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
            <Badge tone={statusTone(status)}>
              {FOUNDER_SCRIPT_STATUS_LABELS[status]}
            </Badge>
            {script.idea_score !== null ? (
              <Badge tone="neutral">Score {script.idea_score}/8</Badge>
            ) : null}
            {script.compliance_passes === false ? (
              <Badge tone="error">
                <AlertTriangle className="h-3 w-3" strokeWidth={2} />
                Compliance
              </Badge>
            ) : null}
          </div>
          <h3 className="text-sm font-semibold text-fg leading-snug">
            {script.theme}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-anthracite-400 flex-wrap">
            {script.archetype ? <span>{script.archetype}</span> : null}
            {formatLabel ? (
              <>
                <span>·</span>
                <span>{formatLabel}</span>
              </>
            ) : null}
            {script.estimated_duration_s ? (
              <>
                <span>·</span>
                <span>{script.estimated_duration_s}s</span>
              </>
            ) : null}
            {script.keyword ? (
              <>
                <span>·</span>
                <span className="font-mono text-brand-400">
                  {script.keyword}
                </span>
              </>
            ) : null}
            <span>·</span>
            <span>{relativeTime(script.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={status}
            onChange={onStatusChange}
            disabled={statusPending || deletePending}
            className="appearance-none rounded-full px-3 py-1 text-[11px] font-medium border bg-anthracite-900 text-anthracite-100 border-anthracite-600/40 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40 disabled:opacity-60"
          >
            {FOUNDER_SCRIPT_STATUS.map((s) => (
              <option key={s} value={s} className="bg-anthracite-900 text-fg">
                {FOUNDER_SCRIPT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          {statusPending ? (
            <Loader2 className="h-3 w-3 text-anthracite-400 animate-spin" strokeWidth={2} />
          ) : null}
        </div>
      </div>

      {/* Hook elegido (siempre visible) */}
      <div className="rounded-[10px] bg-brand-500/5 border border-brand-500/20 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-400 mb-1.5">
          Gancho elegido (4-7s)
        </p>
        <textarea
          value={hookChosen}
          onChange={(e) => setHookChosen(e.target.value)}
          rows={2}
          disabled={hookPending}
          placeholder="Hook del Reel…"
          className="w-full rounded-[8px] border border-anthracite-700/60 bg-anthracite-900 px-2.5 py-1.5 text-sm text-fg placeholder:text-anthracite-500 focus-visible:border-brand-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40 disabled:opacity-60 resize-y"
        />
        <div className="flex items-center justify-end mt-1.5">
          <button
            type="button"
            onClick={saveHook}
            disabled={hookPending || !hookDirty || !hookChosen.trim()}
            className="inline-flex items-center gap-1 rounded-(--radius-md) border border-anthracite-600/60 px-2 py-0.5 text-[10px] font-semibold text-anthracite-100 hover:border-brand-500/50 hover:text-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {hookPending ? (
              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
            ) : (
              <Save className="h-3 w-3" strokeWidth={1.5} />
            )}
            Guardar gancho
          </button>
        </div>
      </div>

      {/* Toggle expansion */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-[11px] font-semibold uppercase tracking-wider text-anthracite-300 hover:text-brand-400 inline-flex items-center gap-1.5 self-start"
      >
        {expanded ? (
          <ChevronUp className="h-3 w-3" strokeWidth={2} />
        ) : (
          <ChevronDown className="h-3 w-3" strokeWidth={2} />
        )}
        {expanded ? "Ocultar guion completo" : "Ver guion completo"}
      </button>

      {expanded ? (
        <div className="flex flex-col gap-3 rounded-[10px] bg-anthracite-900/60 border border-anthracite-700/60 p-3">
          {/* Alternativas de hook */}
          {hookOptions.length > 1 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-300 mb-1.5">
                3 alternativas de gancho
              </p>
              <ul className="space-y-1">
                {hookOptions.map((h, i) => (
                  <li
                    key={i}
                    className={cn(
                      "text-xs text-anthracite-100 leading-relaxed pl-4 relative",
                      i === 0 && "before:content-['★'] before:absolute before:left-0 before:text-brand-400",
                      i !== 0 && "before:content-['•'] before:absolute before:left-0 before:text-anthracite-400",
                    )}
                  >
                    {h}
                    {i !== 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setHookChosen(h);
                        }}
                        className="ml-2 text-[10px] text-brand-400 hover:underline"
                      >
                        usar este
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Bloques del guion */}
          {script.script_context ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-300 mb-1">
                Contexto / agitación (7-25s)
              </p>
              <p className="text-xs text-anthracite-100 leading-relaxed">
                {script.script_context}
              </p>
            </div>
          ) : null}
          {script.script_moral ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-300 mb-1">
                Moraleja / enseñanza (25-50s)
              </p>
              <p className="text-xs text-anthracite-100 leading-relaxed">
                {script.script_moral}
              </p>
            </div>
          ) : null}
          {script.script_cta ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-300 mb-1">
                CTA con palabra clave (50-60s)
              </p>
              <p className="text-xs text-anthracite-100 leading-relaxed">
                {script.script_cta}
              </p>
            </div>
          ) : null}

          {script.rationale ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-300 mb-1">
                Por qué debería funcionar
              </p>
              <p className="text-xs text-anthracite-100 leading-relaxed">
                {script.rationale}
              </p>
            </div>
          ) : null}

          {hashtags.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-300 mb-1">
                Hashtags sugeridos
              </p>
              <p className="text-xs text-anthracite-200 font-mono">
                {hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
              </p>
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
        </div>
      ) : null}

      {/* Copy / caption del Reel · paso aparte (refinamiento F2.3 s2) */}
      <div className="rounded-[10px] bg-anthracite-900/60 border border-anthracite-700/60 p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-300 inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-brand-400" strokeWidth={1.5} />
            Copy del Reel
          </p>
          <span className="text-[10px] text-anthracite-400">
            {script.copy_generated_at
              ? `Generado ${relativeTime(script.copy_generated_at)}`
              : "Sin generar"}
          </span>
        </div>

        {copyHasContent ? (
          <>
            <textarea
              value={copy}
              onChange={(e) => setCopy(e.target.value)}
              rows={6}
              maxLength={5000}
              disabled={copyGenPending || copySavePending}
              placeholder="Caption del Reel para Instagram…"
              className="w-full rounded-[8px] border border-anthracite-700/60 bg-anthracite-950 px-2.5 py-1.5 text-xs text-fg placeholder:text-anthracite-500 focus-visible:border-brand-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40 disabled:opacity-60 resize-y leading-relaxed whitespace-pre-wrap"
            />
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10px] text-anthracite-400">
                {copyCharCount} caracteres
                {copyCharCount > 0 && copyCharCount < 125 ? (
                  <span className="text-warning"> · gancho corto</span>
                ) : null}
                {copyCharCount > 2200 ? (
                  <span className="text-error">
                    {" "}
                    · supera límite Instagram (2200)
                  </span>
                ) : null}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onCopyToClipboard}
                  className="inline-flex items-center gap-1 rounded-(--radius-md) border border-anthracite-600/60 px-2 py-1 text-[11px] font-semibold text-anthracite-100 hover:border-brand-500/50 hover:text-brand-400 transition-colors"
                >
                  {copyClipboardOk ? (
                    <CheckCircle2
                      className="h-3 w-3 text-success"
                      strokeWidth={2}
                    />
                  ) : (
                    <CopyIcon className="h-3 w-3" strokeWidth={1.5} />
                  )}
                  {copyClipboardOk ? "Copiado" : "Copiar"}
                </button>
                {copyDirty ? (
                  <button
                    type="button"
                    onClick={onSaveCopy}
                    disabled={copySavePending}
                    className="inline-flex items-center gap-1 rounded-(--radius-md) border border-brand-500/40 bg-brand-500/10 px-2 py-1 text-[11px] font-semibold text-brand-300 hover:bg-brand-500/20 disabled:opacity-50 transition-colors"
                  >
                    {copySavePending ? (
                      <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                    ) : (
                      <Save className="h-3 w-3" strokeWidth={1.5} />
                    )}
                    Guardar
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onGenerateCopy}
                  disabled={copyGenPending}
                  title="Regenerar el copy con Gemini"
                  className="inline-flex items-center gap-1 rounded-(--radius-md) border border-anthracite-600/60 px-2 py-1 text-[11px] font-semibold text-anthracite-100 hover:border-brand-500/50 hover:text-brand-400 disabled:opacity-50 transition-colors"
                >
                  {copyGenPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                  ) : (
                    <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
                  )}
                  Regenerar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] text-anthracite-300 leading-snug">
              Genera el caption optimizado para Instagram (gancho + cuerpo + CTA + hashtags) usando el guion como contexto.
            </span>
            <button
              type="button"
              onClick={onGenerateCopy}
              disabled={copyGenPending}
              className="inline-flex items-center gap-1.5 rounded-(--radius-md) bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-400 disabled:opacity-50 transition-colors shrink-0"
            >
              {copyGenPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
              Generar copy
            </button>
          </div>
        )}
      </div>

      {/* Métricas Meta · solo si hay snapshot sincronizado */}
      {status === "published" && latestMetric ? (
        <MetaMetricsChips metric={latestMetric} />
      ) : null}

      {/* URL Instagram (visible si está publicado o programado) */}
      {(status === "scheduled" || status === "published") ? (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-300">
            URL del Reel publicado
          </label>
          <div className="flex gap-1.5">
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              disabled={urlPending}
              className="flex-1 rounded-[8px] border border-anthracite-700/60 bg-anthracite-900 px-2.5 py-1.5 text-xs text-fg placeholder:text-anthracite-500 focus-visible:border-brand-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={saveUrl}
              disabled={urlPending || !urlDirty}
              className="inline-flex items-center gap-1 rounded-(--radius-md) border border-anthracite-600/60 px-2 py-1 text-[11px] font-semibold text-anthracite-100 hover:border-brand-500/50 hover:text-brand-400 disabled:opacity-50 transition-colors"
            >
              {urlPending ? (
                <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
              ) : (
                <Save className="h-3 w-3" strokeWidth={1.5} />
              )}
              Guardar
            </button>
            {script.instagram_url ? (
              <a
                href={script.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir en Instagram"
                className="inline-flex items-center justify-center rounded-(--radius-md) border border-anthracite-600/60 px-2 py-1 text-anthracite-100 hover:text-brand-400 hover:border-brand-500/50 transition-colors"
              >
                <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Notas */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-300">
          Notas internas
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={5000}
          disabled={notePending}
          placeholder="Notas tras grabación, ajustes pendientes, métricas a recordar…"
          className="w-full rounded-[8px] border border-anthracite-700/60 bg-anthracite-900 px-2.5 py-1.5 text-xs text-fg placeholder:text-anthracite-500 focus-visible:border-brand-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40 disabled:opacity-60 resize-y"
        />
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-anthracite-700/40">
        {error ? (
          <span className="text-[11px] text-error">{error}</span>
        ) : (
          <span className="text-[11px] text-anthracite-400">
            {script.published_at
              ? `Publicado ${relativeTime(script.published_at)}`
              : script.recorded_at
                ? `Grabado ${relativeTime(script.recorded_at)}`
                : "Pendiente de grabar"}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          {noteDirty ? (
            <button
              type="button"
              onClick={saveNote}
              disabled={notePending}
              className="inline-flex items-center gap-1 rounded-(--radius-md) border border-anthracite-600/60 px-2 py-1 text-[11px] font-semibold text-anthracite-100 hover:border-brand-500/50 hover:text-brand-400 disabled:opacity-50 transition-colors"
            >
              {notePending ? (
                <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
              ) : (
                <Save className="h-3 w-3" strokeWidth={1.5} />
              )}
              Guardar nota
            </button>
          ) : (
            <span className="text-[11px] text-anthracite-500 inline-flex items-center gap-1">
              {script.compliance_passes ? (
                <CheckCircle2 className="h-3 w-3 text-success" strokeWidth={2} />
              ) : null}
            </span>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={deletePending}
            title="Borrar guion"
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

function MetaMetricsChips({ metric }: { metric: FounderMetric }) {
  const completion =
    metric.completion_rate !== null && metric.completion_rate !== undefined
      ? Math.round(Number(metric.completion_rate) * 100)
      : null;
  const watchTimeS =
    metric.avg_watch_time_ms !== null && metric.avg_watch_time_ms !== undefined
      ? Math.round(metric.avg_watch_time_ms / 1000)
      : null;
  const interactionsFromBreakdown =
    [metric.likes, metric.comments, metric.shares, metric.saved]
      .filter((n): n is number => typeof n === "number")
      .reduce((a, b) => a + b, 0) || null;
  const interactions = metric.total_interactions ?? interactionsFromBreakdown;

  const chips: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (metric.plays !== null && metric.plays !== undefined) {
    chips.push({
      icon: <PlayCircle className="h-3 w-3" strokeWidth={2} />,
      label: "Plays",
      value: formatNumber(metric.plays),
    });
  }
  if (metric.reach !== null && metric.reach !== undefined) {
    chips.push({
      icon: <Users className="h-3 w-3" strokeWidth={2} />,
      label: "Alcance",
      value: formatNumber(metric.reach),
    });
  }
  if (completion !== null) {
    chips.push({
      icon: <Eye className="h-3 w-3" strokeWidth={2} />,
      label: "Completion",
      value: `${completion}%${watchTimeS !== null ? ` · ${watchTimeS}s` : ""}`,
    });
  }
  if (interactions !== null) {
    chips.push({
      icon: <Heart className="h-3 w-3" strokeWidth={2} />,
      label: "Interacciones",
      value: formatNumber(interactions),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="rounded-[10px] bg-anthracite-900/60 border border-anthracite-700/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-300">
          Métricas Meta
        </p>
        <span className="text-[10px] text-anthracite-400">
          {relativeTime(metric.snapshot_date)}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={c.label}
            title={c.label}
            className="inline-flex items-center gap-1 rounded-full border border-anthracite-600/40 bg-anthracite-950 px-2 py-0.5 text-[11px] text-anthracite-100"
          >
            <span className="text-brand-400">{c.icon}</span>
            <span className="text-fg font-medium">{c.value}</span>
            <span className="text-anthracite-400">{c.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
