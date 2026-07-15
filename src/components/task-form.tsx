"use client";

import * as React from "react";
import { Plus, Loader2 } from "lucide-react";
import { addTask } from "~/lib/actions/crm";
import type { EntityType } from "~/lib/supabase/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface TaskFormProps {
  entityType: EntityType;
  entityId: string;
}

export function TaskForm({ entityType, entityId }: TaskFormProps) {
  const [title, setTitle] = React.useState("");
  const [dueAt, setDueAt] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [description, setDescription] = React.useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    const payload = {
      title,
      description: description || undefined,
      dueAt: dueAt || null,
    };
    startTransition(async () => {
      const res = await addTask(
        entityType,
        entityId,
        payload.title,
        payload.description,
        payload.dueAt,
      );
      if (!res.ok) {
        setError(res.error);
      } else {
        setTitle("");
        setDueAt("");
        setDescription("");
        setExpanded(false);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nueva tarea — ej: llamar al cliente"
          maxLength={500}
          disabled={pending}
          className="flex-1"
        />
        <Input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          disabled={pending}
          className="sm:w-56"
        />
        <Button type="submit" size="md" disabled={pending || !title.trim()}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Plus className="h-4 w-4" strokeWidth={1.5} />
          )}
          Añadir
        </Button>
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-[11px] text-anthracite-400 hover:text-brand-400 self-start"
      >
        {expanded ? "− Ocultar descripción" : "+ Añadir descripción"}
      </button>
      {expanded ? (
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción opcional"
          rows={3}
          maxLength={2000}
          disabled={pending}
          className="w-full rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 py-2.5 text-sm text-fg placeholder:text-anthracite-400 transition-colors focus-visible:border-brand-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40 disabled:opacity-60 resize-y"
        />
      ) : null}
      {error ? <p className="text-[11px] text-error">{error}</p> : null}
    </form>
  );
}
