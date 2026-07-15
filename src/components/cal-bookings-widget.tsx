import Link from "next/link";
import { Calendar, ExternalLink, AlertTriangle, Mail, Wifi, WifiOff } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { getCalDashboardData, type CalBookingRow } from "~/lib/queries/cal";
import { getCalConnectionStatus } from "~/lib/cal/client";
import { madridDayKey, madridDayLabel, madridTime } from "~/lib/utils";

function timeRange(b: CalBookingRow): string {
  return `${madridTime(b.start_time)} – ${madridTime(b.end_time)}`;
}

function groupByDay(items: CalBookingRow[]) {
  const groups = new Map<string, CalBookingRow[]>();
  items.forEach((b) => {
    const key = madridDayKey(b.start_time);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  });
  return Array.from(groups, ([key, items]) => ({
    key,
    label: madridDayLabel(items[0].start_time),
    items,
  }));
}

export async function CalBookingsWidget() {
  const status = await getCalConnectionStatus();
  const data = await getCalDashboardData();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
            <CardTitle>Reuniones Cal.com</CardTitle>
          </div>
          {status.connected ? (
            <Badge tone="success" className="text-[9px]">
              {status.username ? `cal.com/${status.username}` : status.email}
            </Badge>
          ) : status.configured ? (
            <Badge tone="error" className="text-[9px]">
              Error de conexión
            </Badge>
          ) : (
            <Badge tone="neutral" className="text-[9px]">
              No configurado
            </Badge>
          )}
        </div>
        <CardDescription>
          {data.upcoming.length > 0
            ? `${data.thisWeekCount} próximas en 7 días${data.todayCount > 0 ? ` · ${data.todayCount} hoy` : ""}.`
            : status.connected
              ? "Sin reuniones próximas. Configura el webhook en Cal.com para ver los bookings que te creen."
              : "Conecta Cal.com desde Ajustes para sincronizar las reuniones que te creen."}
        </CardDescription>
      </CardHeader>

      {!status.configured ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <Calendar className="h-7 w-7 text-anthracite-400" strokeWidth={1.25} />
          <Link
            href="/ajustes"
            className="inline-flex items-center gap-2 rounded-(--radius-md) bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-400 transition-colors"
          >
            Conectar Cal.com
          </Link>
        </div>
      ) : status.error ? (
        <div className="flex items-start gap-2 rounded-[10px] bg-error/10 border border-error/30 px-3 py-2 text-xs text-error">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2} />
          <span>{status.error}. Revisa la API key en Ajustes.</span>
        </div>
      ) : data.upcoming.length === 0 ? (
        <div className="py-4 text-center flex flex-col items-center gap-2">
          <p className="text-sm text-anthracite-400">
            Sin reuniones en los próximos 7 días.
          </p>
          {data.lastReceivedAt ? (
            <p className="flex items-center gap-1.5 text-[10px] text-anthracite-500">
              <Wifi className="h-3 w-3 text-success" strokeWidth={1.5} />
              Webhook activo · último booking{" "}
              {new Date(data.lastReceivedAt).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-[10px] text-amber-400">
              <WifiOff className="h-3 w-3" strokeWidth={1.5} />
              Sin datos. Configura el webhook en{" "}
              <Link href="/ajustes" className="underline hover:text-amber-300">
                Ajustes
              </Link>
            </p>
          )}
        </div>
      ) : (
        <ul className="flex flex-col">
          {groupByDay(data.upcoming).map((group) => (
            <li key={group.key} className="border-b border-anthracite-600/20 last:border-0 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-anthracite-400 px-1 mb-1.5">
                {group.label}
              </p>
              <ul className="flex flex-col gap-1">
                {group.items.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-start gap-3 px-1 py-1.5 rounded-[8px] hover:bg-anthracite-800/40 transition-colors"
                  >
                    <span className="font-mono text-[11px] text-anthracite-300 min-w-[80px] shrink-0 pt-0.5 tabular-nums">
                      {timeRange(b)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-fg truncate">
                          {b.title}
                        </span>
                        {b.meeting_url ? (
                          <a
                            href={b.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-brand-400 hover:text-brand-300 inline-flex items-center gap-0.5"
                          >
                            unirse
                            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                          </a>
                        ) : null}
                      </div>
                      {b.attendee_name || b.attendee_email ? (
                        <p className="text-[11px] text-anthracite-400 truncate flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                          {b.attendee_name
                            ? `${b.attendee_name}${b.attendee_email ? ` · ${b.attendee_email}` : ""}`
                            : b.attendee_email}
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
