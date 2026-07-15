import { promises as fs } from "node:fs";
import path from "node:path";
import { ExternalLink } from "lucide-react";
import { ManualReadButton } from "~/components/captacion-90d/manual-read-button";
import { ManualToc } from "~/components/captacion-90d/manual-toc";
import { getCaptacionProgress } from "~/lib/queries/captacion";

export const dynamic = "force-dynamic";

const MANUAL_URL = "/manual/captacion-90d-v1.html";
const MANUAL_FS_PATH = path.join(
  process.cwd(),
  "public",
  "manual",
  "captacion-90d-v1.html",
);

const IFRAME_ID = "manual-iframe";

interface TocEntry {
  num: string;
  href: string;
  title: string;
}

/**
 * Parsea el TOC del HTML del manual sin DOM externo.
 *
 * Busca el bloque `<nav class="toc">…</nav>` y dentro extrae cada
 * `<a href="#xxx" class="toc-item">…<span class="toc-num">NN</span>Título</a>`.
 */
function parseToc(html: string): TocEntry[] {
  const navMatch = html.match(/<nav class="toc">([\s\S]*?)<\/nav>/);
  if (!navMatch) return [];
  const navBlock = navMatch[1];
  const linkRegex =
    /<a[^>]*href="(#[^"]+)"[^>]*class="toc-item"[^>]*>\s*<span class="toc-num">([^<]+)<\/span>\s*([^<]+)\s*<\/a>/g;
  const out: TocEntry[] = [];
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(navBlock)) !== null) {
    out.push({
      href: m[1],
      num: m[2].trim(),
      title: m[3].trim(),
    });
  }
  return out;
}

export default async function ManualOperativoPage() {
  let toc: TocEntry[] = [];
  try {
    const html = await fs.readFile(MANUAL_FS_PATH, "utf8");
    toc = parseToc(html);
  } catch (err) {
    console.error("[manual-operativo] no se pudo leer el manual", err);
  }

  const progress = await getCaptacionProgress();
  const readAt = (progress as { manual_read_at?: string | null } | null)
    ?.manual_read_at ?? null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-light text-fg tracking-tight">
            Manual <span className="font-bold">operativo</span>
          </h1>
          <p className="text-sm text-anthracite-200 mt-1">
            Plan de captación 90 días · fuente única de verdad para esta sección.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={MANUAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-500"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
            Abrir en pestaña aparte
          </a>
          <ManualReadButton initialReadAt={readAt} />
        </div>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-5">
        <aside className="hidden lg:block">
          {toc.length > 0 ? (
            <ManualToc entries={toc} iframeId={IFRAME_ID} />
          ) : (
            <div className="card-dark p-4 text-xs text-anthracite-400">
              No se pudo cargar la tabla de contenidos.
            </div>
          )}
        </aside>

        <div className="card-dark p-1.5">
          <iframe
            id={IFRAME_ID}
            src={MANUAL_URL}
            title="Manual operativo Captación 90 días"
            className="block w-full rounded-(--radius-lg) bg-anthracite-950"
            style={{ height: "calc(100dvh - 240px)", minHeight: "640px" }}
          />
        </div>
      </div>
    </div>
  );
}
