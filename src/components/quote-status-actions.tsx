"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { updateQuoteStatus, deleteQuote } from "~/lib/actions/quotes";
import { QUOTE_STATUS, type QuoteStatus } from "~/lib/supabase/types";
import { Button } from "./ui/button";

interface Props {
  quoteId: string;
  currentStatus: string;
}

export function QuoteStatusActions({ quoteId, currentStatus }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function onChangeStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as QuoteStatus;
    setError(null);
    startTransition(async () => {
      const res = await updateQuoteStatus(quoteId, next);
      if (!res.ok) setError(res.error);
    });
  }

  function onDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    startTransition(async () => {
      const res = await deleteQuote(quoteId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/comercial/calculadora");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentStatus}
        onChange={onChangeStatus}
        disabled={pending}
        className="h-9 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 text-xs text-fg"
      >
        {QUOTE_STATUS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDelete}
        disabled={pending}
        aria-label={confirmDelete ? "Confirmar borrado" : "Borrar"}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : (
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        )}
        {confirmDelete ? "Confirmar" : "Borrar"}
      </Button>
      {error ? <span className="text-[11px] text-error">{error}</span> : null}
    </div>
  );
}
