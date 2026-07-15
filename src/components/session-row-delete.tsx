"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteFunnelSession } from "~/lib/actions/sessions";

interface SessionRowDeleteProps {
  id: string;
  label: string;
}

/**
 * Botón papelera para borrar una sesión concreta del embudo.
 * Confirmación nativa via window.confirm — suficiente para una acción
 * que el usuario hará puntualmente.
 */
export function SessionRowDelete({ id, label }: SessionRowDeleteProps) {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function onClick() {
    if (!confirm(`¿Borrar la sesión ${label}? Esto es irreversible.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteFunnelSession(id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        title="Borrar sesión"
        className="inline-flex items-center gap-1 rounded-(--radius-md) border border-error/30 bg-error/5 px-1.5 py-1 text-[11px] font-semibold text-error/90 hover:bg-error/15 disabled:opacity-50 transition-colors"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
        ) : (
          <Trash2 className="h-3 w-3" strokeWidth={1.5} />
        )}
      </button>
      {error ? (
        <span className="text-[10px] text-error">{error}</span>
      ) : null}
    </div>
  );
}
