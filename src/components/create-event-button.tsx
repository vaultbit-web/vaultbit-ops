"use client";

import * as React from "react";
import {
  CalendarPlus,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { createCalendarEvent } from "~/lib/actions/calendar";
import { cn } from "~/lib/utils";

interface CreateEventButtonProps {
  revalidatePath: string;
  defaultTitle: string;
  attendeeEmail: string | null;
}

function defaultStartISO(): string {
  // Mañana a las 10:00 hora local — luego se transforma a ISO
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return toLocalInputValue(d);
}

function defaultEndISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(11, 0, 0, 0);
  return toLocalInputValue(d);
}

/** Convierte Date a "YYYY-MM-DDTHH:MM" en hora local — formato del input datetime-local. */
function toLocalInputValue(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

/** Toma el value de un datetime-local y devuelve un ISO string ajustado a la TZ del navegador. */
function localInputToISO(value: string): string {
  return new Date(value).toISOString();
}

export function CreateEventButton({
  revalidatePath,
  defaultTitle,
  attendeeEmail,
}: CreateEventButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [feedback, setFeedback] = React.useState<
    | { kind: "ok"; htmlLink: string }
    | { kind: "error"; msg: string }
    | null
  >(null);

  const [title, setTitle] = React.useState(defaultTitle);
  const [start, setStart] = React.useState(defaultStartISO());
  const [end, setEnd] = React.useState(defaultEndISO());
  const [description, setDescription] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [includeAttendee, setIncludeAttendee] = React.useState(Boolean(attendeeEmail));

  // Si cambian los defaults (ej. al cambiar de página) los actualizamos.
  React.useEffect(() => {
    if (!open) {
      setTitle(defaultTitle);
      setIncludeAttendee(Boolean(attendeeEmail));
    }
  }, [defaultTitle, attendeeEmail, open]);

  function reset() {
    setOpen(false);
    setFeedback(null);
    setTitle(defaultTitle);
    setStart(defaultStartISO());
    setEnd(defaultEndISO());
    setDescription("");
    setLocation("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await createCalendarEvent({
        summary: title,
        description: description || undefined,
        location: location || undefined,
        startISO: localInputToISO(start),
        endISO: localInputToISO(end),
        attendeeEmail: includeAttendee && attendeeEmail ? attendeeEmail : undefined,
        revalidate: revalidatePath,
      });
      if (res.ok) {
        setFeedback({ kind: "ok", htmlLink: res.htmlLink });
      } else {
        setFeedback({ kind: "error", msg: res.error });
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-(--radius-md) border border-anthracite-400/60 px-3 py-2 text-xs font-semibold text-fg hover:border-brand-500/50 hover:text-brand-400 transition-colors"
      >
        <CalendarPlus className="h-4 w-4" strokeWidth={1.5} />
        Agendar reunión
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-8">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={reset}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-lg card-dark p-0 max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-anthracite-600/30 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-fg">Agendar reunión</h3>
                <p className="text-[11px] text-anthracite-400">
                  Se creará en tu Google Calendar (zona horaria Europe/Madrid).
                </p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="text-anthracite-400 hover:text-fg"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-anthracite-200">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 text-sm text-fg placeholder:text-anthracite-400 focus-visible:border-brand-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-anthracite-200">
                    Inicio
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="h-10 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 text-sm text-fg focus-visible:border-brand-500/60"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-anthracite-200">
                    Fin
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="h-10 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 text-sm text-fg focus-visible:border-brand-500/60"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-anthracite-200">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Sala, Google Meet, dirección…"
                  className="h-10 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 text-sm text-fg placeholder:text-anthracite-400 focus-visible:border-brand-500/60"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-anthracite-200">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 py-2 text-sm text-fg placeholder:text-anthracite-400 focus-visible:border-brand-500/60 resize-none"
                />
              </div>

              {attendeeEmail ? (
                <label className="flex items-center gap-2 text-xs text-anthracite-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAttendee}
                    onChange={(e) => setIncludeAttendee(e.target.checked)}
                    className="vb-checkbox"
                  />
                  <span>
                    Invitar a <span className="text-fg font-medium">{attendeeEmail}</span>
                  </span>
                </label>
              ) : null}

              {feedback?.kind === "ok" ? (
                <div className="rounded-[10px] bg-success/10 border border-success/30 px-3 py-2 text-xs text-success flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                  Evento creado.
                  <a
                    href={feedback.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline"
                  >
                    Abrir en Google Calendar
                    <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                  </a>
                </div>
              ) : null}
              {feedback?.kind === "error" ? (
                <div className="rounded-[10px] bg-error/10 border border-error/30 px-3 py-2 text-xs text-error flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                  <span>{feedback.msg}</span>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-anthracite-600/30 -mx-5 px-5 mt-2">
                <button
                  type="button"
                  onClick={reset}
                  className="px-3 py-2 text-xs font-medium text-anthracite-200 hover:text-fg"
                >
                  {feedback?.kind === "ok" ? "Cerrar" : "Cancelar"}
                </button>
                <button
                  type="submit"
                  disabled={pending || feedback?.kind === "ok"}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-(--radius-md) bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-400 transition-colors",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                  )}
                >
                  {pending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                  ) : (
                    <CalendarPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  )}
                  {pending ? "Creando…" : "Crear evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
