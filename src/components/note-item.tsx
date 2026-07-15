"use client";

import * as React from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteNote } from "~/lib/actions/crm";
import type { EntityType, CrmNote } from "~/lib/supabase/types";
import { formatDateTime } from "~/lib/utils";

interface NoteItemProps {
  note: CrmNote;
  entityType: EntityType;
}

export function NoteItem({ note, entityType }: NoteItemProps) {
  const [pending, startTransition] = React.useTransition();
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  function onDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    startTransition(async () => {
      await deleteNote(note.id, entityType, note.entity_id);
    });
  }

  return (
    <li className="card-dark-sub p-4 flex flex-col gap-2 group">
      <p className="text-sm text-anthracite-100 whitespace-pre-wrap">{note.body}</p>
      <div className="flex items-center justify-between gap-3 text-[11px] text-anthracite-400">
        <span>{formatDateTime(note.created_at)}</span>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-error disabled:opacity-60 inline-flex items-center gap-1"
          aria-label={confirmDelete ? "Confirmar eliminación" : "Eliminar nota"}
        >
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
          ) : (
            <Trash2 className="h-3 w-3" strokeWidth={1.5} />
          )}
          <span>{confirmDelete ? "Confirmar" : "Eliminar"}</span>
        </button>
      </div>
    </li>
  );
}
