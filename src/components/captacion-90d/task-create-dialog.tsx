"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog";
import {
  CAPTACION_TASK_BUCKETS,
  CAPTACION_TASK_BUCKET_LABELS,
  CAPTACION_TASK_PRIORITIES,
  type CaptacionTaskBucket,
  type CaptacionTaskPriority,
  type Partner,
  type CaptacionEvent,
} from "~/lib/captacion/types";
import { createTask } from "~/lib/actions/captacion";

interface TaskCreateDialogProps {
  partners: Partner[];
  events: CaptacionEvent[];
}

export function TaskCreateDialog({ partners, events }: TaskCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    const title = String(formData.get("title") ?? "");
    const priority = String(
      formData.get("priority") ?? "P1",
    ) as CaptacionTaskPriority;
    const bucket = String(formData.get("bucket") ?? "admin") as CaptacionTaskBucket;
    const weekRaw = formData.get("week");
    const week = weekRaw ? Number(weekRaw) : null;
    const due_date = (formData.get("due_date") as string) || null;
    const partner_id = (formData.get("partner_id") as string) || null;
    const event_id = (formData.get("event_id") as string) || null;
    const description = (formData.get("description") as string) || null;

    startTransition(async () => {
      const res = await createTask({
        title,
        description,
        priority,
        bucket,
        week,
        due_date,
        partner_id,
        event_id,
      });
      if (res.ok) {
        setOpen(false);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="primary" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Nueva tarea
        </Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Nueva tarea · Captación 90 días</DialogTitle>
          <DialogDescription>
            Las tareas creadas aquí se etiquetan como manuales y aparecen en el
            backlog ordenadas por prioridad y semana.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <FormRow label="Título" required>
            <input
              name="title"
              type="text"
              required
              maxLength={280}
              placeholder="Ej. Confirmar fecha del Café VIP con José Luis"
              className={inputClass}
            />
          </FormRow>

          <div className="grid sm:grid-cols-3 gap-3">
            <FormRow label="Prioridad">
              <select name="priority" defaultValue="P1" className={inputClass}>
                {CAPTACION_TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Bucket">
              <select name="bucket" defaultValue="admin" className={inputClass}>
                {CAPTACION_TASK_BUCKETS.map((b) => (
                  <option key={b} value={b}>
                    {CAPTACION_TASK_BUCKET_LABELS[b]}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Semana (1-13)">
              <input
                name="week"
                type="number"
                min={1}
                max={13}
                className={inputClass}
                placeholder="—"
              />
            </FormRow>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <FormRow label="Vencimiento">
              <input
                name="due_date"
                type="date"
                className={inputClass}
              />
            </FormRow>
            <FormRow label="Partner relacionado">
              <select name="partner_id" defaultValue="" className={inputClass}>
                <option value="">— ninguno —</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </FormRow>
          </div>

          <FormRow label="Evento relacionado">
            <select name="event_id" defaultValue="" className={inputClass}>
              <option value="">— ninguno —</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow label="Descripción (opcional)">
            <textarea
              name="description"
              rows={3}
              maxLength={2000}
              className={`${inputClass} resize-y`}
            />
          </FormRow>

          {error ? (
            <p className="text-sm text-error">{error}</p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" loading={pending}>
              Crear tarea
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const inputClass =
  "w-full rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2 text-sm text-fg placeholder-anthracite-400 focus:border-brand-500/50 focus:outline-none";

function FormRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-anthracite-200 font-semibold">
        {label} {required ? <span className="text-error">*</span> : null}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
