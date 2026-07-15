"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { deleteAllFunnelSessions } from "~/lib/actions/sessions";

interface SessionBulkCleanProps {
  total: number;
}

/**
 * Botón "Borrar todas las sesiones". Doble confirmación porque la
 * acción es destructiva y total. Visible solo si hay sesiones.
 */
export function SessionBulkClean({ total }: SessionBulkCleanProps) {
  const [pending, startTransition] = React.useTransition();
  const [armed, setArmed] = React.useState(false);
  const [feedback, setFeedback] = React.useState<
    | null
    | { tone: "success"; affected: number }
    | { tone: "error"; message: string }
  >(null);

  if (total === 0 && !feedback) return null;

  function onClickArm() {
    setArmed(true);
    setFeedback(null);
    // Auto-desarmar tras 5s para evitar borrados accidentales
    setTimeout(() => setArmed(false), 5000);
  }

  function onConfirm() {
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteAllFunnelSessions();
      if (res.ok) {
        setFeedback({ tone: "success", affected: res.affected });
      } else {
        setFeedback({ tone: "error", message: res.error });
      }
      setArmed(false);
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!armed ? (
        <button
          type="button"
          onClick={onClickArm}
          disabled={pending || total === 0}
          className="inline-flex items-center gap-1.5 rounded-(--radius-md) border border-error/40 bg-error/10 px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/20 disabled:opacity-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          Borrar todas las sesiones ({total})
        </button>
      ) : (
        <>
          <span className="inline-flex items-center gap-1.5 text-xs text-error">
            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
            ¿Seguro? Esto borra {total} sesiones. Irreversible.
          </span>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-(--radius-md) bg-error px-3 py-1.5 text-xs font-semibold text-white hover:bg-error/90 disabled:opacity-50 transition-colors"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
            Sí, borrar todas
          </button>
          <button
            type="button"
            onClick={() => setArmed(false)}
            disabled={pending}
            className="inline-flex items-center rounded-(--radius-md) border border-anthracite-600/60 px-3 py-1.5 text-xs font-semibold text-anthracite-200 hover:border-anthracite-500 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
        </>
      )}
      {feedback?.tone === "success" ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-success">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
          {feedback.affected} sesiones borradas
        </span>
      ) : null}
      {feedback?.tone === "error" ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-error">
          <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
          {feedback.message}
        </span>
      ) : null}
    </div>
  );
}
