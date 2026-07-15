import Link from "next/link";
import { Calendar, ExternalLink, MapPin, RefreshCw } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  getCalendarWidgetData,
} from "~/lib/queries/calendar";
import type { CalendarEvent } from "~/lib/google/calendar-client";
import { madridDayKey, madridDayLabel, madridTime } from "~/lib/utils";

function timeLabel(event: CalendarEvent): string {
  if (event.allDay) return "Todo el día";
  return `${madridTime(event.start)} – ${madridTime(event.end)}`;
}

export async function CalendarWidget() {
  const { connected, email, events, error } = await getCalendarWidgetData();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
            <CardTitle>Calendario</CardTitle>
          </div>
          {connected && email ? (
            <Badge tone="success" className="text-[9px]">
              {email}
            </Badge>
          ) : null}
        </div>
        <CardDescription>
          {connected
            ? "Próximos 7 días en tu Google Calendar."
            : "Conecta tu Google Calendar para ver eventos y crear desde leads."}
        </CardDescription>
      </CardHeader>

      {!connected ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Calendar className="h-8 w-8 text-anthracite-400" strokeWidth={1.25} />
          <p className="text-sm text-anthracite-300 max-w-xs">
            Aún no has conectado tu Google Calendar. Conéctalo desde Ajustes.
          </p>
          <Link
            href="/ajustes"
            className="inline-flex items-center gap-2 rounded-(--radius-md) bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-400 transition-colors"
          >
            Ir a Ajustes
          </Link>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-error max-w-xs">
            Error de conexión con Google Calendar. El token puede haber expirado.
          </p>
          <Link
            href="/ajustes"
            className="inline-flex items-center gap-2 rounded-(--radius-md) bg-error/20 border border-error/40 px-4 py-2 text-xs font-semibold text-error hover:bg-error/30 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
            Reconectar Google Calendar
          </Link>
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-anthracite-400 py-6 text-center">
          No tienes eventos en los próximos 7 días.
        </p>
      ) : (
        <ul className="flex flex-col">
          {groupByDay(events).map((group) => (
            <li key={group.dayKey} className="border-b border-anthracite-600/20 last:border-0 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-anthracite-400 px-1 mb-1.5">
                {group.label}
              </p>
              <ul className="flex flex-col gap-1">
                {group.items.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-start gap-3 px-1 py-1.5 rounded-[8px] hover:bg-anthracite-800/40 transition-colors"
                  >
                    <span className="font-mono text-[11px] text-anthracite-300 min-w-[80px] shrink-0 pt-0.5 tabular-nums">
                      {timeLabel(ev)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <a
                        href={ev.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-fg truncate hover:text-brand-400 transition-colors"
                      >
                        {ev.summary}
                        <ExternalLink
                          className="inline-block ml-1 h-3 w-3 -mt-0.5 opacity-40"
                          strokeWidth={1.5}
                        />
                      </a>
                      {ev.location ? (
                        <p className="text-[11px] text-anthracite-400 truncate flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                          {ev.location}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function groupByDay(events: CalendarEvent[]): { dayKey: string; label: string; items: CalendarEvent[] }[] {
  const groups = new Map<string, CalendarEvent[]>();
  events.forEach((ev) => {
    const key = madridDayKey(ev.start);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ev);
  });
  return Array.from(groups, ([dayKey, items]) => ({
    dayKey,
    label: madridDayLabel(items[0].start),
    items,
  }));
}
