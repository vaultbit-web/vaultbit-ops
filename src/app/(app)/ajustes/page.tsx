import {
  ShieldCheck,
  KeyRound,
  Database,
  Webhook,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Plug,
  Palette,
} from "lucide-react";
import { ThemeToggle } from "~/components/theme-toggle";
import { CalSettingsCard } from "~/components/cal-settings-card";
import { MetaSettingsCard } from "~/components/meta-settings-card";
import Link from "next/link";
import { createClient } from "~/lib/supabase/server";
import { getConnectionStatus } from "~/lib/oauth/google";
import { getConnectionStatus as getMetaStatus } from "~/lib/oauth/meta";
import { PageHeader } from "~/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export const metadata = { title: "Ajustes" };
export const dynamic = "force-dynamic";

function maskValue(value: string | undefined | null, visible = 4): string {
  if (!value) return "—";
  if (value.length <= visible * 2) return "•".repeat(value.length);
  return `${value.slice(0, visible)}${"•".repeat(Math.max(8, value.length - visible * 2))}${value.slice(-visible)}`;
}

const GOOGLE_FLASH: Record<string, { tone: "success" | "error"; message: string }> = {
  connected: { tone: "success", message: "Google Calendar conectado correctamente." },
  disconnected: { tone: "success", message: "Google Calendar desconectado." },
  error: { tone: "error", message: "No se pudo completar el flujo OAuth con Google." },
};

const META_FLASH: Record<string, { tone: "success" | "error"; message: string }> = {
  connected: { tone: "success", message: "Meta · Instagram conectado correctamente." },
  disconnected: { tone: "success", message: "Meta · Instagram desconectado." },
  error: { tone: "error", message: "No se pudo completar el flujo OAuth con Meta." },
};

export default async function AjustesPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string; meta?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] ?? "—";

  const googleStatus = user
    ? await getConnectionStatus(user.id)
    : { connected: false, email: null, scope: null };
  const metaStatus = user
    ? await getMetaStatus(user.id)
    : { connected: false, instagram_username: null, facebook_page_name: null, expires_at: null };
  const metaConfigured = Boolean(
    process.env.META_APP_ID && process.env.META_APP_SECRET,
  );
  const googleFlash = params.google ? GOOGLE_FLASH[params.google] : null;
  const metaFlash = params.meta ? META_FLASH[params.meta] : null;
  const flash = googleFlash ?? metaFlash;

  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title="Ajustes"
        description="Vista de solo-lectura del estado de la plataforma. Las claves se gestionan en Dokploy."
      />

      {flash ? (
        <div
          className={`mb-6 flex items-center gap-2 rounded-[12px] px-4 py-3 text-sm border ${
            flash.tone === "success"
              ? "bg-success/10 text-success border-success/30"
              : "bg-error/10 text-error border-error/30"
          }`}
        >
          {flash.tone === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          )}
          <span>
            {flash.message}
            {params.reason ? <span className="opacity-70"> ({params.reason})</span> : null}
          </span>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
              <CardTitle>Identidad</CardTitle>
            </div>
            <CardDescription>Tu sesión actual y allowlist.</CardDescription>
          </CardHeader>
          <dl className="grid grid-cols-[96px_1fr] sm:grid-cols-[120px_1fr] gap-x-3 gap-y-3 text-sm">
            <dt className="text-anthracite-400">Email</dt>
            <dd className="text-fg font-medium break-all">{user?.email ?? "—"}</dd>
            <dt className="text-anthracite-400">User ID</dt>
            <dd className="text-anthracite-100 font-mono text-xs break-all">
              {user?.id ?? "—"}
            </dd>
            <dt className="text-anthracite-400">Allowlist</dt>
            <dd>
              <Badge tone="success" dot>
                Activa
              </Badge>
            </dd>
          </dl>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
              <CardTitle>Apariencia</CardTitle>
            </div>
            <CardDescription>
              Tema de la interfaz. Tu elección se recuerda en este navegador.
            </CardDescription>
          </CardHeader>
          <div className="flex items-center gap-3">
            <ThemeToggle withLabel />
            <span className="text-xs text-anthracite-400">
              Alterna entre claro y oscuro.
            </span>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
                <CardTitle>Google Calendar</CardTitle>
              </div>
              <Badge tone={googleStatus.connected ? "success" : "neutral"}>
                {googleStatus.connected ? "Conectado" : "No conectado"}
              </Badge>
            </div>
            <CardDescription>
              Conecta tu cuenta para ver eventos en el dashboard y crear citas
              desde la página detalle de cualquier lead.
            </CardDescription>
          </CardHeader>

          {googleStatus.connected ? (
            <div className="flex flex-col gap-3">
              <dl className="grid grid-cols-[96px_1fr] sm:grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
                <dt className="text-anthracite-400">Cuenta</dt>
                <dd className="text-fg font-medium break-all">
                  {googleStatus.email ?? "—"}
                </dd>
                <dt className="text-anthracite-400">Permisos</dt>
                <dd className="text-anthracite-100 text-xs break-all">
                  Calendar events · Email
                </dd>
              </dl>
              <form action="/api/auth/google/disconnect" method="POST">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-(--radius-md) border border-error/40 bg-error/10 px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/20 transition-colors"
                >
                  Desconectar
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/api/auth/google/start"
              className="inline-flex items-center gap-2 rounded-(--radius-md) bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400 transition-colors w-fit"
            >
              <Plug className="h-4 w-4" strokeWidth={1.5} />
              Conectar Google Calendar
            </Link>
          )}
        </Card>

        <CalSettingsCard />

        <MetaSettingsCard status={metaStatus} configured={metaConfigured} />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
              <CardTitle>Supabase</CardTitle>
            </div>
            <CardDescription>Proyecto único, compartido con la landing.</CardDescription>
          </CardHeader>
          <dl className="grid grid-cols-[96px_1fr] sm:grid-cols-[120px_1fr] gap-x-3 gap-y-3 text-sm">
            <dt className="text-anthracite-400">Project ID</dt>
            <dd className="text-fg font-mono text-xs">{projectId}</dd>
            <dt className="text-anthracite-400">URL</dt>
            <dd className="text-anthracite-100 break-all text-xs">{supabaseUrl}</dd>
            <dt className="text-anthracite-400">Tablas CRM</dt>
            <dd className="text-anthracite-100">
              <code className="text-[11px]">funnel_leads · lead_magnet_subscribers · investor_interest · partner_applications · funnel_sessions</code>
            </dd>
          </dl>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
              <CardTitle>n8n</CardTitle>
            </div>
            <CardDescription>Worker de automatizaciones (Notion sync, futuro email).</CardDescription>
          </CardHeader>
          <dl className="grid grid-cols-[96px_1fr] sm:grid-cols-[120px_1fr] gap-x-3 gap-y-3 text-sm">
            <dt className="text-anthracite-400">Base URL</dt>
            <dd className="text-anthracite-100 break-all">
              {process.env.N8N_BASE_URL ?? "—"}
            </dd>
            <dt className="text-anthracite-400">API key</dt>
            <dd className="text-anthracite-100 font-mono text-xs">
              {maskValue(process.env.N8N_API_KEY)}
            </dd>
            <dt className="text-anthracite-400">Notion sync</dt>
            <dd>
              <Badge tone="info">Respaldo activo · 60 días</Badge>
            </dd>
          </dl>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
              <CardTitle>Integraciones diferidas</CardTitle>
            </div>
            <CardDescription>Configurables en Dokploy cuando llegue su fase.</CardDescription>
          </CardHeader>
          <ul className="flex flex-col gap-2 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span className="text-anthracite-100">Gemini API</span>
              <Badge tone={process.env.GEMINI_API_KEY ? "success" : "neutral"}>
                {process.env.GEMINI_API_KEY ? "Configurada" : "Pendiente · F2"}
              </Badge>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-anthracite-100">SMTP Hostinger</span>
              <Badge tone={process.env.SMTP_HOST ? "success" : "neutral"}>
                {process.env.SMTP_HOST ? "Configurado" : "Pendiente · F3"}
              </Badge>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-anthracite-100">Holded</span>
              <Badge tone="neutral">Diferido · F5</Badge>
            </li>
          </ul>
        </Card>
      </div>
    </>
  );
}
