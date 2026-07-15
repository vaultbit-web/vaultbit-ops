import {
  CalendarRange,
  Webhook,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { getCalConnectionStatus, listEventTypes } from "~/lib/cal/client";
import { CopyButton } from "~/components/copy-button";

export async function CalSettingsCard() {
  const status = await getCalConnectionStatus();
  const eventTypes = status.connected ? await listEventTypes() : [];
  const webhookSecretSet = Boolean(process.env.CAL_COM_WEBHOOK_SECRET);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.vaultbit.es";
  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/webhooks/cal`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
            <CardTitle>Cal.com</CardTitle>
          </div>
          <Badge tone={status.connected ? "success" : status.configured ? "error" : "neutral"}>
            {status.connected ? "Conectado" : status.configured ? "Error" : "No configurado"}
          </Badge>
        </div>
        <CardDescription>
          Sincroniza las reuniones que te crean los leads y reutiliza tus
          event types directamente desde la app.
        </CardDescription>
      </CardHeader>

      {!status.configured ? (
        <div className="rounded-[10px] border border-anthracite-600/40 bg-anthracite-900/40 px-3 py-2 text-xs text-anthracite-200">
          Añade <code className="text-fg">CAL_COM_API_KEY</code> en las
          variables de entorno de Dokploy y haz redeploy. La API key se obtiene
          desde Cal.com → Settings → Developer → API Keys.
        </div>
      ) : status.error ? (
        <div className="flex items-start gap-2 rounded-[10px] bg-error/10 border border-error/30 px-3 py-2 text-xs text-error">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2} />
          <span>{status.error}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-[96px_1fr] sm:grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-anthracite-400">Cuenta</dt>
            <dd className="text-fg font-medium break-all">
              {status.email ?? "—"}
            </dd>
            <dt className="text-anthracite-400">Usuario</dt>
            <dd className="text-anthracite-100 break-all">
              {status.publicUrl ? (
                <a
                  href={status.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-brand-400"
                >
                  {status.publicUrl.replace(/^https?:\/\//, "")}
                  <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                </a>
              ) : (
                "—"
              )}
            </dd>
          </dl>

          {/* Webhook setup */}
          <div className="rounded-[10px] border border-anthracite-600/40 bg-anthracite-900/40 p-3 text-xs">
            <div className="flex items-center gap-2 mb-2">
              <Webhook className="h-3.5 w-3.5 text-brand-400" strokeWidth={1.5} />
              <span className="font-semibold text-fg">Webhook</span>
              <Badge tone={webhookSecretSet ? "success" : "warning"} className="text-[9px]">
                {webhookSecretSet ? "Secret configurado" : "Sin secret HMAC"}
              </Badge>
            </div>
            <p className="text-anthracite-300 mb-2">
              Pega esta URL en Cal.com → Settings → Developer → Webhooks (eventos
              <code className="mx-1 text-fg">BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED</code>):
            </p>
            <div className="flex items-center gap-2 rounded-[8px] border border-anthracite-600/60 bg-anthracite-950 px-2.5 py-1.5">
              <code className="flex-1 text-[11px] text-fg break-all">{webhookUrl}</code>
              <CopyButton value={webhookUrl} />
            </div>
            {!webhookSecretSet ? (
              <p className="text-[11px] text-warning mt-2">
                Después de crear el webhook, copia su <em>signing secret</em> y añádelo
                como <code className="text-fg">CAL_COM_WEBHOOK_SECRET</code> en
                Dokploy. Sin esto el endpoint acepta cualquier POST y no es seguro
                en producción.
              </p>
            ) : null}
          </div>

          {/* Event types */}
          {eventTypes.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-400 mb-2">
                Tus event types ({eventTypes.length})
              </p>
              <ul className="flex flex-col gap-1.5">
                {eventTypes.slice(0, 6).map((et) => (
                  <li
                    key={et.id}
                    className="flex items-center justify-between gap-2 rounded-[8px] border border-anthracite-600/40 bg-anthracite-900/40 px-2.5 py-1.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-fg truncate">
                        {et.title}{" "}
                        <span className="text-anthracite-400 font-normal">
                          · {et.lengthInMinutes}min
                        </span>
                      </p>
                      <p className="text-[10px] text-anthracite-400 truncate font-mono">
                        {et.publicUrl}
                      </p>
                    </div>
                    <CopyButton value={et.publicUrl} />
                  </li>
                ))}
              </ul>
              {eventTypes.length > 6 ? (
                <p className="text-[10px] text-anthracite-400 mt-1.5">
                  + {eventTypes.length - 6} más en cal.com
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-anthracite-400 inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={2} />
              Conexión OK. Añade event types en Cal.com para verlos aquí.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
