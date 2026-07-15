"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Coins, ListPlus, MapPin, Target } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { formatDateShort, formatEuro } from "~/lib/utils";
import {
  EVENT_TRACKING_STATUSES,
  EVENT_TRACKING_STATUS_LABELS,
  type CaptacionEvent,
  type EventTrackingStatus,
  type Partner,
} from "~/lib/captacion/types";
import { convertEventToTask } from "~/lib/actions/captacion";

interface EventosTrackearListProps {
  events: CaptacionEvent[];
  partners: Partner[];
}

export function EventosTrackearList({ events, partners }: EventosTrackearListProps) {
  const partnerMap = useMemo(
    () => new Map(partners.map((p) => [p.id, p.full_name])),
    [partners],
  );

  const grouped = useMemo(() => {
    const m: Record<EventTrackingStatus, CaptacionEvent[]> = {
      attend: [],
      speak: [],
      sponsor: [],
      monitor: [],
      skip: [],
    };
    for (const e of events) m[e.tracking_status].push(e);
    return m;
  }, [events]);

  const STATUS_ORDER: EventTrackingStatus[] = [
    "speak",
    "attend",
    "sponsor",
    "monitor",
    "skip",
  ];

  return (
    <div className="space-y-6">
      {STATUS_ORDER.map((status) => {
        const items = grouped[status];
        if (items.length === 0) return null;
        return (
          <section key={status}>
            <div className="flex items-center gap-2 mb-2">
              <Badge tone={statusTone(status)} className="text-[10px]">
                {EVENT_TRACKING_STATUS_LABELS[status]}
              </Badge>
              <p className="text-[11px] text-anthracite-400">
                {items.length} {items.length === 1 ? "evento" : "eventos"}
              </p>
            </div>
            <ul className="space-y-3">
              {items.map((e) => (
                <EventoCard
                  key={e.id}
                  event={e}
                  partnerName={
                    e.related_partner_id
                      ? partnerMap.get(e.related_partner_id)
                      : undefined
                  }
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function EventoCard({
  event,
  partnerName,
}: {
  event: CaptacionEvent;
  partnerName?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  function handleConvert() {
    setMessage(null);
    startTransition(async () => {
      const res = await convertEventToTask(event.id);
      if (res.ok) {
        setMessage({ tone: "ok", text: "Tarea creada en el backlog." });
      } else {
        setMessage({ tone: "err", text: res.error });
      }
    });
  }

  const dateRange =
    event.date_start && event.date_end && event.date_start !== event.date_end
      ? `${formatDateShort(event.date_start)} – ${formatDateShort(event.date_end)}`
      : event.date_start
        ? formatDateShort(event.date_start)
        : "Fecha por confirmar";

  return (
    <li className="card-dark p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-fg">{event.name}</h3>
          {event.organizer ? (
            <p className="text-xs text-anthracite-200 mt-0.5">
              Organiza: {event.organizer}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-anthracite-200">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-anthracite-400" strokeWidth={1.5} />
              {dateRange}
            </span>
            {event.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-anthracite-400" strokeWidth={1.5} />
                {event.location}
              </span>
            ) : null}
            {event.budget_estimate != null ? (
              <span className="inline-flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-anthracite-400" strokeWidth={1.5} />
                {formatEuro(event.budget_estimate)}
              </span>
            ) : null}
            {event.roi_estimate ? (
              <span className="inline-flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-anthracite-400" strokeWidth={1.5} />
                <span className="max-w-xs truncate" title={event.roi_estimate}>
                  ROI: {event.roi_estimate}
                </span>
              </span>
            ) : null}
            {partnerName ? (
              <span className="text-anthracite-400">· Partner relacionado: {partnerName}</span>
            ) : null}
          </div>

          {event.notes ? (
            <p className="mt-3 text-sm text-anthracite-100 leading-relaxed">
              {event.notes}
            </p>
          ) : null}

          {event.sponsors.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-anthracite-400">
                Sponsors:
              </span>
              {event.sponsors.map((s) => (
                <Badge key={s} tone="info" className="text-[10px]">
                  {s}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleConvert}
            loading={pending}
            className="gap-1.5"
          >
            <ListPlus className="h-3.5 w-3.5" strokeWidth={1.8} />
            Convertir a tarea
          </Button>
          {message ? (
            <p
              className={
                message.tone === "ok" ? "text-[11px] text-success" : "text-[11px] text-error"
              }
            >
              {message.text}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function statusTone(
  status: EventTrackingStatus,
): "brand" | "warning" | "success" | "info" | "neutral" {
  switch (status) {
    case "speak":
      return "brand";
    case "sponsor":
      return "warning";
    case "attend":
      return "success";
    case "monitor":
      return "info";
    default:
      return "neutral";
  }
}

// Helper para que las constantes no se eliminen por tree-shaking en dev
void EVENT_TRACKING_STATUSES;
