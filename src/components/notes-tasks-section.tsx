import { StickyNote, ListChecks } from "lucide-react";
import { getNotes, getTasks } from "~/lib/queries/detail";
import type { EntityType } from "~/lib/supabase/types";
import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { NoteForm } from "./note-form";
import { NoteItem } from "./note-item";
import { TaskForm } from "./task-form";
import { TaskItem } from "./task-item";

interface NotesAndTasksProps {
  entityType: EntityType;
  entityId: string;
}

/**
 * Sección reutilizable que renderiza las notas y tareas asociadas a un
 * registro CRM. Se usa al final de cada página de detalle.
 *
 * Hace fetch en server-side. Los Forms y items son client components
 * que disparan Server Actions y revalidan el path.
 */
export async function NotesAndTasksSection({ entityType, entityId }: NotesAndTasksProps) {
  const [notes, tasks] = await Promise.all([
    getNotes(entityType, entityId),
    getTasks(entityType, entityId),
  ]);

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const otherTasks = tasks.filter((t) => t.status !== "pending");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
            <CardTitle>Tareas</CardTitle>
          </div>
          <CardDescription>
            {pendingTasks.length} pendientes · {otherTasks.length} cerradas
          </CardDescription>
        </CardHeader>

        <div className="mb-4">
          <TaskForm entityType={entityType} entityId={entityId} />
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-anthracite-400 text-center py-4">
            Sin tareas. Crea la primera arriba.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingTasks.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {pendingTasks.map((t) => (
                  <TaskItem key={t.id} task={t} />
                ))}
              </ul>
            ) : null}
            {otherTasks.length > 0 ? (
              <details className="group">
                <summary className="cursor-pointer text-[11px] text-anthracite-400 hover:text-anthracite-100 select-none">
                  Mostrar {otherTasks.length} tarea{otherTasks.length === 1 ? "" : "s"} cerrada{otherTasks.length === 1 ? "" : "s"}
                </summary>
                <ul className="flex flex-col gap-2 mt-2">
                  {otherTasks.map((t) => (
                    <TaskItem key={t.id} task={t} />
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
            <CardTitle>Notas</CardTitle>
          </div>
          <CardDescription>
            {notes.length} nota{notes.length === 1 ? "" : "s"} en total
          </CardDescription>
        </CardHeader>

        <div className="mb-4">
          <NoteForm entityType={entityType} entityId={entityId} />
        </div>

        {notes.length === 0 ? (
          <p className="text-sm text-anthracite-400 text-center py-4">
            Aún no hay notas. La primera arriba.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {notes.map((n) => (
              <NoteItem key={n.id} note={n} entityType={entityType} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
