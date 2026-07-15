"use client";

import * as React from "react";
import {
  CalendarRange,
  X,
  Copy,
  Check,
  ExternalLink,
  Clock,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Send,
} from "lucide-react";
import type { CalEventType } from "~/lib/cal/client";
import { createCalBookingAction } from "~/lib/actions/cal";
import { cn } from "~/lib/utils";

interface CalLinkButtonProps {
  eventTypes: CalEventType[];
  attendeeEmail: string | null;
  attendeeName: string | null;
  /** Path a revalidar después de crear booking (página detalle del lead). */
  revalidatePath?: string;
}

/** Construye URL pública con prefill `?name=&email=` para el flujo "copiar link". */
function buildPersonalizedUrl(
  base: string,
  name: string | null,
  email: string | null,
): string {
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (email) params.set("email", email);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** "YYYY-MM-DDTHH:MM" del input datetime-local en hora local. */
function defaultStartLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T10:00`;
}

type Mode =
  | { kind: "list" }
  | { kind: "schedule"; et: CalEventType }
  | {
      kind: "success";
      et: CalEventType;
      bookingUrl: string;
      meetingUrl: string | null;
    };

export function CalLinkButton({
  eventTypes,
  attendeeEmail,
  attendeeName,
  revalidatePath,
}: CalLinkButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>({ kind: "list" });
  const [copiedId, setCopiedId] = React.useState<number | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState(attendeeName ?? "");
  const [email, setEmail] = React.useState(attendeeEmail ?? "");
  const [start, setStart] = React.useState(defaultStartLocal());
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setMode({ kind: "list" });
      setCopiedId(null);
      setError(null);
      setName(attendeeName ?? "");
      setEmail(attendeeEmail ?? "");
      setStart(defaultStartLocal());
      setNotes("");
    }
  }, [open, attendeeName, attendeeEmail]);

  function close() {
    setOpen(false);
  }

  async function copy(et: CalEventType) {
    const url = buildPersonalizedUrl(
      et.publicUrl,
      attendeeName ?? null,
      attendeeEmail ?? null,
    );
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(et.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  }

  function handleSchedule() {
    if (mode.kind !== "schedule") return;
    setError(null);
    startTransition(async () => {
      const res = await createCalBookingAction({
        eventTypeId: mode.et.id,
        lengthMinutes: mode.et.lengthInMinutes,
        startISO: new Date(start).toISOString(),
        attendeeName: name,
        attendeeEmail: email,
        notes: notes || undefined,
        revalidate: revalidatePath,
      });
      if (res.ok) {
        setMode({
          kind: "success",
          et: mode.et,
          bookingUrl: res.bookingUrl,
          meetingUrl: res.meetingUrl,
        });
      } else {
        setError(res.error);
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
        <CalendarRange className="h-4 w-4" strokeWidth={1.5} />
        Cal.com
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-8">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={close}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-lg card-dark p-0 max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-anthracite-600/30 px-5 py-4">
              <div className="flex items-center gap-2 min-w-0">
                {mode.kind !== "list" ? (
                  <button
                    type="button"
                    onClick={() => setMode({ kind: "list" })}
                    className="text-anthracite-400 hover:text-fg shrink-0"
                    aria-label="Volver"
                  >
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                ) : null}
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-fg truncate">
                    {mode.kind === "list"
                      ? "Cal.com"
                      : mode.kind === "schedule"
                        ? `Agendar · ${mode.et.title}`
                        : "Reunión creada"}
                  </h3>
                  <p className="text-[11px] text-anthracite-400 truncate">
                    {mode.kind === "list"
                      ? "Crea la reunión directamente o copia un link de booking público."
                      : mode.kind === "schedule"
                        ? `${mode.et.lengthInMinutes} minutos. Cal.com enviará el email al cliente.`
                        : "Cal.com ya envió el email de confirmación al cliente."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="text-anthracite-400 hover:text-fg shrink-0"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Content */}
            {mode.kind === "list" ? (
              <ul className="flex-1 overflow-y-auto p-3">
                {eventTypes.map((et) => {
                  const isCopied = copiedId === et.id;
                  return (
                    <li
                      key={et.id}
                      className="flex items-center gap-2 rounded-[10px] px-3 py-2.5 hover:bg-anthracite-800/40 transition-colors border border-transparent hover:border-anthracite-600/40"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-fg truncate">
                            {et.title}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] text-anthracite-400 shrink-0">
                            <Clock className="h-3 w-3" strokeWidth={1.5} />
                            {et.lengthInMinutes}min
                          </span>
                        </div>
                        <p className="text-[10px] text-anthracite-400 truncate font-mono">
                          {et.publicUrl}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copy(et)}
                        title="Copiar link"
                        className={cn(
                          "inline-flex items-center justify-center rounded-[6px] border w-7 h-7 transition-colors shrink-0",
                          isCopied
                            ? "bg-success/15 border-success/30 text-success"
                            : "border-anthracite-600/60 text-anthracite-200 hover:border-brand-500/40 hover:text-fg",
                        )}
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={2} />
                        ) : (
                          <Copy className="h-3 w-3" strokeWidth={1.5} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode({ kind: "schedule", et })}
                        className="inline-flex items-center gap-1 rounded-[6px] bg-brand-500 px-2.5 h-7 text-[11px] font-semibold text-white hover:bg-brand-400 transition-colors shrink-0"
                      >
                        <Send className="h-3 w-3" strokeWidth={2} />
                        Agendar
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : mode.kind === "schedule" ? (
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-anthracite-200">
                      Nombre
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 text-sm text-fg"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-anthracite-200">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 text-sm text-fg"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-anthracite-200">
                    Fecha y hora de inicio
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="h-10 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 text-sm text-fg"
                  />
                  <p className="text-[10px] text-anthracite-400">
                    Termina automáticamente en {mode.et.lengthInMinutes} min.
                    Zona horaria Europe/Madrid.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-anthracite-200">
                    Notas (opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contexto adicional para el cliente o para ti…"
                    className="rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 py-2 text-sm text-fg resize-none placeholder:text-anthracite-400"
                  />
                </div>

                {error ? (
                  <div className="rounded-[10px] bg-error/10 border border-error/30 px-3 py-2 text-xs text-error flex items-start gap-2">
                    <AlertTriangle
                      className="h-3.5 w-3.5 shrink-0 mt-0.5"
                      strokeWidth={2}
                    />
                    <span>{error}</span>
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-anthracite-600/30 -mx-5 px-5 mt-2">
                  <button
                    type="button"
                    onClick={() => setMode({ kind: "list" })}
                    className="px-3 py-2 text-xs font-medium text-anthracite-200 hover:text-fg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={handleSchedule}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-(--radius-md) bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-400 transition-colors",
                      "disabled:opacity-60 disabled:cursor-not-allowed",
                    )}
                  >
                    {pending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                    ) : (
                      <Send className="h-3.5 w-3.5" strokeWidth={2} />
                    )}
                    {pending ? "Creando…" : "Crear booking"}
                  </button>
                </div>
              </div>
            ) : (
              // success
              <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4 items-center text-center">
                <CheckCircle2 className="h-10 w-10 text-success" strokeWidth={1.5} />
                <div>
                  <h4 className="text-sm font-semibold text-fg">
                    Booking creado en Cal.com
                  </h4>
                  <p className="text-xs text-anthracite-300 mt-1">
                    El cliente recibirá un email de confirmación con los detalles.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  {mode.meetingUrl ? (
                    <a
                      href={mode.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-(--radius-md) bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-400 transition-colors"
                    >
                      Abrir videoconferencia
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </a>
                  ) : null}
                  <a
                    href={mode.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-(--radius-md) border border-anthracite-600/60 px-4 py-2 text-xs font-semibold text-anthracite-100 hover:border-brand-500/40 hover:text-fg transition-colors"
                  >
                    Ver en Cal.com
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </a>
                  <button
                    type="button"
                    onClick={close}
                    className="px-3 py-2 text-xs font-medium text-anthracite-300 hover:text-fg"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
