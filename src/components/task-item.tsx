"use client";

import * as React from "react";
import { Check, Trash2, X, Loader2, Calendar } from "lucide-react";
import { setTaskStatus, deleteTask } from "~/lib/actions/crm";
import type { CrmTask, TaskStatus } from "~/lib/supabase/types";
import { formatDateTime, relativeTime, cn } from "~/lib/utils";

interface TaskItemProps {
  task: CrmTask;
  /** Si es true, muestra el contexto (entidad asociada). Útil en dashboard. */
  showContext?: boolean;
  contextLabel?: string;
  contextHref?: string;
}

export function TaskItem({ task, showContext, contextLabel, contextHref }: TaskItemProps) {
  const [pending, startTransition] = React.useTransition();
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const status = task.status as TaskStatus;
  const isDone = status === "done";
  const isCancelled = status === "cancelled";

  const overdue = task.due_at && !isDone && !isCancelled
    ? new Date(task.due_at).getTime() < Date.now()
    : false;

  function onToggle() {
    const next: TaskStatus = isDone ? "pending" : "done";
    startTransition(async () => {
      await setTaskStatus(task.id, next);
    });
  }

  function onCancel() {
    const next: TaskStatus = isCancelled ? "pending" : "cancelled";
    startTransition(async () => {
      await setTaskStatus(task.id, next);
    });
  }

  function onDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    startTransition(async () => {
      await deleteTask(task.id);
    });
  }

  return (
    <li
      className={cn(
        "card-dark-sub p-3.5 flex items-start gap-3 group",
        isDone && "opacity-60",
        overdue && "border-l-2 border-error",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={pending || isCancelled}
        aria-label={isDone ? "Marcar como pendiente" : "Marcar como hecho"}
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 transition-colors flex items-center justify-center",
          isDone
            ? "bg-success border-success"
            : "border-anthracite-400 hover:border-brand-500",
          pending && "opacity-60 cursor-wait",
        )}
      >
        {isDone ? <Check className="h-3.5 w-3.5 text-fg" strokeWidth={3} /> : null}
        {pending ? <Loader2 className="h-3 w-3 animate-spin text-anthracite-200" strokeWidth={2} /> : null}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", isDone ? "line-through text-anthracite-200" : "text-fg")}>
          {task.title}
        </p>
        {task.description ? (
          <p className="text-xs text-anthracite-200 mt-0.5 whitespace-pre-wrap">
            {task.description}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
          {task.due_at ? (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                overdue ? "text-error font-medium" : "text-anthracite-400",
              )}
            >
              <Calendar className="h-3 w-3" strokeWidth={1.5} />
              <time dateTime={task.due_at} title={formatDateTime(task.due_at)}>
                {relativeTime(task.due_at)}
              </time>
            </span>
          ) : null}
          {showContext && contextLabel ? (
            contextHref ? (
              <a
                href={contextHref}
                className="text-anthracite-400 hover:text-brand-400 transition-colors"
              >
                · {contextLabel}
              </a>
            ) : (
              <span className="text-anthracite-400">· {contextLabel}</span>
            )
          ) : null}
          {isCancelled ? (
            <span className="text-anthracite-400 italic">cancelada</span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
        {!isDone ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            aria-label={isCancelled ? "Reactivar" : "Cancelar"}
            className="p-2.5 -m-1 rounded-md text-anthracite-400 hover:text-warning hover:bg-anthracite-800"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          aria-label={confirmDelete ? "Confirmar eliminación" : "Eliminar"}
          className={cn(
            "p-2.5 -m-1 rounded-md hover:bg-anthracite-800",
            confirmDelete ? "text-error" : "text-anthracite-400 hover:text-error",
          )}
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </li>
  );
}
