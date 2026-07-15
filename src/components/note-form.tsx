"use client";

import * as React from "react";
import { Send, Loader2 } from "lucide-react";
import { addNote } from "~/lib/actions/crm";
import type { EntityType } from "~/lib/supabase/types";
import { Button } from "./ui/button";

interface NoteFormProps {
  entityType: EntityType;
  entityId: string;
}

export function NoteForm({ entityType, entityId }: NoteFormProps) {
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    const trimmed = body;
    startTransition(async () => {
      const res = await addNote(entityType, entityId, trimmed);
      if (!res.ok) {
        setError(res.error);
      } else {
        setBody("");
        textareaRef.current?.focus();
      }
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      onSubmit(e);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Escribe una nota… (Ctrl+Enter para enviar)"
        rows={3}
        maxLength={5000}
        disabled={pending}
        className="w-full rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 py-2.5 text-sm text-fg placeholder:text-anthracite-400 transition-colors focus-visible:border-brand-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40 disabled:opacity-60 resize-y"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-anthracite-400">
          {body.length} / 5000
        </span>
        <div className="flex items-center gap-2">
          {error ? <span className="text-[11px] text-error">{error}</span> : null}
          <Button type="submit" size="sm" disabled={pending || !body.trim()}>
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
            Guardar nota
          </Button>
        </div>
      </div>
    </form>
  );
}
