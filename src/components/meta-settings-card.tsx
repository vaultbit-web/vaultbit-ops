"use client";

import * as React from "react";
import Link from "next/link";
import {
  Instagram,
  Plug,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { triggerMetaSync } from "~/lib/actions/meta";
import type { MetaConnectionStatus } from "~/lib/oauth/meta";
import { relativeTime } from "~/lib/utils";

interface MetaSettingsCardProps {
  status: MetaConnectionStatus;
  configured: boolean;
}

interface SyncSummary {
  scanned: number;
  synced: number;
  skipped: number;
  errorsCount: number;
}

export function MetaSettingsCard({ status, configured }: MetaSettingsCardProps) {
  const [pending, startTransition] = React.useTransition();
  const [summary, setSummary] = React.useState<SyncSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function onSync() {
    setError(null);
    setSummary(null);
    startTransition(async () => {
      const res = await triggerMetaSync();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSummary({
        scanned: res.result.scanned,
        synced: res.result.synced,
        skipped: res.result.skipped,
        errorsCount: res.result.errors.length,
      });
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Instagram className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
            <CardTitle>Meta · Instagram</CardTitle>
          </div>
          <Badge
            tone={
              status.connected
                ? "success"
                : configured
                  ? "neutral"
                  : "warning"
            }
          >
            {status.connected
              ? "Conectado"
              : configured
                ? "No conectado"
                : "App pendiente"}
          </Badge>
        </div>
        <CardDescription>
          Sincroniza métricas Meta Insights de los Reels publicados desde
          @danielbrosedemprendedor para alimentar el feedback editorial.
        </CardDescription>
      </CardHeader>

      {!configured ? (
        <div className="rounded-[10px] border border-anthracite-600/40 bg-anthracite-900/40 px-3 py-2 text-xs text-anthracite-200 leading-relaxed">
          Faltan variables de entorno en Dokploy. Crea una app en{" "}
          <a
            href="https://developers.facebook.com/apps/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 hover:underline"
          >
            Facebook Developers
          </a>{" "}
          (tipo Business) y configura{" "}
          <code className="text-fg">META_APP_ID</code>,{" "}
          <code className="text-fg">META_APP_SECRET</code>,{" "}
          <code className="text-fg">META_REDIRECT_URI</code> (= la URL del
          callback que verás abajo cuando conectes) y{" "}
          <code className="text-fg">META_SYNC_SECRET</code> (cualquier string
          random largo, para autenticar el cron de n8n). Luego haz redeploy.
        </div>
      ) : status.connected ? (
        <div className="flex flex-col gap-3">
          <dl className="grid grid-cols-[96px_1fr] sm:grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-anthracite-400">Instagram</dt>
            <dd className="text-fg font-medium break-all">
              {status.instagram_username
                ? `@${status.instagram_username}`
                : "—"}
            </dd>
            <dt className="text-anthracite-400">Página FB</dt>
            <dd className="text-anthracite-100 break-all">
              {status.facebook_page_name ?? "—"}
            </dd>
            <dt className="text-anthracite-400">Token</dt>
            <dd className="text-anthracite-100 text-xs">
              {status.expires_at
                ? `Expira ${relativeTime(status.expires_at)}`
                : "—"}
            </dd>
          </dl>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onSync}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-(--radius-md) border border-brand-500/40 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-300 hover:bg-brand-500/20 disabled:opacity-60 transition-colors"
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
              Sincronizar métricas ahora
            </button>
            <form action="/api/auth/meta/disconnect" method="POST">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-(--radius-md) border border-error/40 bg-error/10 px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/20 transition-colors"
              >
                Desconectar
              </button>
            </form>
          </div>

          {summary ? (
            <div className="flex items-start gap-2 rounded-[10px] bg-success/10 border border-success/30 px-3 py-2 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2} />
              <span>
                Escaneados {summary.scanned} · sincronizados {summary.synced}
                {summary.skipped > 0 ? ` · saltados ${summary.skipped}` : ""}
                {summary.errorsCount > 0
                  ? ` · errores ${summary.errorsCount}`
                  : ""}
              </span>
            </div>
          ) : null}
          {error ? (
            <div className="flex items-start gap-2 rounded-[10px] bg-error/10 border border-error/30 px-3 py-2 text-xs text-error">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2} />
              <span>{error}</span>
            </div>
          ) : null}

          <p className="text-[11px] text-anthracite-400 leading-relaxed">
            La sincronización lee los Reels marcados como{" "}
            <em>Publicado</em> en la cola editorial con su URL de Instagram.
            Para automatización diaria, monta un cron en n8n que llame a{" "}
            <code className="text-fg">POST /api/meta/sync</code> con la
            cabecera{" "}
            <code className="text-fg">Authorization: Bearer &lt;META_SYNC_SECRET&gt;</code>.
          </p>
        </div>
      ) : (
        <Link
          href="/api/auth/meta/start"
          className="inline-flex items-center gap-2 rounded-(--radius-md) bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400 transition-colors w-fit"
        >
          <Plug className="h-4 w-4" strokeWidth={1.5} />
          Conectar Meta
        </Link>
      )}
    </Card>
  );
}
