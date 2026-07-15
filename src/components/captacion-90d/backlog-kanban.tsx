"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CalendarClock, Link2, Trash2 } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn, formatDateShort } from "~/lib/utils";
import {
  CAPTACION_TASK_BUCKETS,
  CAPTACION_TASK_BUCKET_LABELS,
  CAPTACION_TASK_PRIORITIES,
  CAPTACION_TASK_STATUS_LABELS,
  type CaptacionTask,
  type CaptacionTaskBucket,
  type CaptacionTaskPriority,
  type CaptacionTaskStatus,
  type Partner,
  type CaptacionEvent,
} from "~/lib/captacion/types";
import { deleteTask, updateTaskStatus } from "~/lib/actions/captacion";
import { TaskCreateDialog } from "./task-create-dialog";

const COLUMN_ORDER: CaptacionTaskStatus[] = ["todo", "doing", "done", "blocked"];

interface BacklogKanbanProps {
  initialTasks: CaptacionTask[];
  partners: Partner[];
  events: CaptacionEvent[];
}

export function BacklogKanban({
  initialTasks,
  partners,
  events,
}: BacklogKanbanProps) {
  const [tasks, setTasks] = useState<CaptacionTask[]>(initialTasks);
  const [, startTransition] = useTransition();
  const [filterPriority, setFilterPriority] =
    useState<CaptacionTaskPriority | "all">("all");
  const [filterBucket, setFilterBucket] =
    useState<CaptacionTaskBucket | "all">("all");
  const [filterWeek, setFilterWeek] = useState<string>("");

  const partnerLookup = useMemo(() => {
    return new Map(partners.map((p) => [p.id, p]));
  }, [partners]);
  const eventLookup = useMemo(() => {
    return new Map(events.map((e) => [e.id, e]));
  }, [events]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterBucket !== "all" && t.bucket !== filterBucket) return false;
      if (filterWeek) {
        const w = Number(filterWeek);
        if (!Number.isNaN(w) && t.week !== w) return false;
      }
      return true;
    });
  }, [tasks, filterPriority, filterBucket, filterWeek]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<CaptacionTaskStatus, CaptacionTask[]> = {
      todo: [],
      doing: [],
      done: [],
      blocked: [],
    };
    for (const t of filteredTasks) grouped[t.status].push(t);
    // Ordenar por prioridad dentro de cada columna
    for (const k of COLUMN_ORDER) {
      grouped[k].sort((a, b) => {
        if (a.priority !== b.priority) {
          return CAPTACION_TASK_PRIORITIES.indexOf(a.priority) -
            CAPTACION_TASK_PRIORITIES.indexOf(b.priority);
        }
        const wa = a.week ?? 99;
        const wb = b.week ?? 99;
        return wa - wb;
      });
    }
    return grouped;
  }, [filteredTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    const activeId = String(active.id);

    // over.id puede ser una columna (status) o una tarjeta (id de tarea)
    const isColumn = (COLUMN_ORDER as string[]).includes(overId);
    const targetStatus = (isColumn
      ? overId
      : tasks.find((t) => t.id === overId)?.status) as
      | CaptacionTaskStatus
      | undefined;
    if (!targetStatus) return;

    const moving = tasks.find((t) => t.id === activeId);
    if (!moving || moving.status === targetStatus) return;

    // Optimista
    setTasks((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, status: targetStatus } : t)),
    );
    startTransition(async () => {
      const res = await updateTaskStatus(activeId, targetStatus);
      if (!res.ok) {
        // Revertir si falla
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeId ? { ...t, status: moving.status } : t,
          ),
        );
      }
    });
  }

  function handleDeleteTask(taskId: string) {
    if (!confirm("¿Eliminar esta tarea?")) return;
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    startTransition(async () => {
      const res = await deleteTask(taskId);
      if (!res.ok) {
        setTasks(previous);
        alert(`No se pudo eliminar: ${res.error}`);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterPriority}
            onChange={(e) =>
              setFilterPriority(
                e.target.value as CaptacionTaskPriority | "all",
              )
            }
            className={filterClass}
          >
            <option value="all">Todas las prioridades</option>
            {CAPTACION_TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={filterBucket}
            onChange={(e) =>
              setFilterBucket(e.target.value as CaptacionTaskBucket | "all")
            }
            className={filterClass}
          >
            <option value="all">Todos los buckets</option>
            {CAPTACION_TASK_BUCKETS.map((b) => (
              <option key={b} value={b}>
                {CAPTACION_TASK_BUCKET_LABELS[b]}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={13}
            placeholder="Semana"
            value={filterWeek}
            onChange={(e) => setFilterWeek(e.target.value)}
            className={`${filterClass} w-24`}
          />
          {(filterPriority !== "all" ||
            filterBucket !== "all" ||
            filterWeek) && (
            <button
              type="button"
              onClick={() => {
                setFilterPriority("all");
                setFilterBucket("all");
                setFilterWeek("");
              }}
              className="text-[11px] text-anthracite-200 hover:text-brand-400"
            >
              Limpiar
            </button>
          )}
        </div>

        <TaskCreateDialog partners={partners} events={events} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMN_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              partnerLookup={partnerLookup}
              eventLookup={eventLookup}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

const filterClass =
  "rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-1.5 text-xs text-fg focus:border-brand-500/50 focus:outline-none";

function KanbanColumn({
  status,
  tasks,
  partnerLookup,
  eventLookup,
  onDelete,
}: {
  status: CaptacionTaskStatus;
  tasks: CaptacionTask[];
  partnerLookup: Map<string, Partner>;
  eventLookup: Map<string, CaptacionEvent>;
  onDelete: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const headerTone = STATUS_TONES[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "card-dark p-4 flex flex-col gap-3 min-h-[320px]",
        isOver ? "ring-2 ring-brand-500/40" : null,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", headerTone)} />
          <p className="text-[11px] uppercase tracking-[0.1em] font-semibold text-fg">
            {CAPTACION_TASK_STATUS_LABELS[status]}
          </p>
        </div>
        <Badge tone="neutral" className="text-[10px]">
          {tasks.length}
        </Badge>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-2">
          {tasks.length === 0 ? (
            <div className="text-[11px] text-anthracite-400 italic px-2 py-6 text-center">
              Soltar tareas aquí
            </div>
          ) : (
            tasks.map((t) => (
              <KanbanCard
                key={t.id}
                task={t}
                partner={t.partner_id ? partnerLookup.get(t.partner_id) : undefined}
                event={t.event_id ? eventLookup.get(t.event_id) : undefined}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

const STATUS_TONES: Record<CaptacionTaskStatus, string> = {
  todo: "bg-anthracite-200",
  doing: "bg-brand-500",
  done: "bg-success",
  blocked: "bg-error",
};

const PRIORITY_TONES: Record<CaptacionTaskPriority, string> = {
  P0: "bg-error/15 text-error border-error/30",
  P1: "bg-brand-500/15 text-brand-400 border-brand-500/30",
  P2: "bg-anthracite-700 text-anthracite-100 border-anthracite-600/40",
};

function KanbanCard({
  task,
  partner,
  event,
  onDelete,
}: {
  task: CaptacionTask;
  partner?: Partner;
  event?: CaptacionEvent;
  onDelete: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "card-dark-sub p-3 group relative",
        isDragging ? "opacity-50" : null,
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Arrastrar"
          className="mt-0.5 cursor-grab active:cursor-grabbing text-anthracite-400 hover:text-brand-400 touch-none"
        >
          <GripVertical className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold border",
                PRIORITY_TONES[task.priority],
              )}
            >
              {task.priority}
            </span>
            <Badge tone="neutral" className="text-[10px]">
              {task.bucket}
            </Badge>
            {task.week ? (
              <Badge tone="info" className="text-[10px]">
                S{task.week}
              </Badge>
            ) : null}
          </div>
          <p className="text-[13px] text-fg leading-snug">{task.title}</p>
          {(partner || event || task.due_date) ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-anthracite-400">
              {task.due_date ? (
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" strokeWidth={1.5} />
                  {formatDateShort(task.due_date)}
                </span>
              ) : null}
              {partner ? (
                <span className="inline-flex items-center gap-1">
                  <Link2 className="h-3 w-3" strokeWidth={1.5} />
                  {partner.full_name}
                </span>
              ) : null}
              {event ? (
                <span className="inline-flex items-center gap-1">
                  <Link2 className="h-3 w-3" strokeWidth={1.5} />
                  {event.name}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label="Eliminar tarea"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-anthracite-400 hover:text-error"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
