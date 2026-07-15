"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "~/lib/utils";

interface TocEntry {
  num: string;
  href: string;
  title: string;
}

interface ManualTocProps {
  entries: TocEntry[];
  iframeId: string;
}

/**
 * TOC sticky lateral del Manual Operativo.
 *
 * El manual vive en un iframe same-origin. Para navegar a una sección,
 * actualizamos el hash del iframe (browser native scroll dentro del iframe).
 * El scroll-spy se hace escuchando 'scroll' en el documento del iframe.
 */
export function ManualToc({ entries, iframeId }: ManualTocProps) {
  const [activeHref, setActiveHref] = useState<string | null>(
    entries[0]?.href ?? null,
  );

  const handleClick = useCallback(
    (href: string) => {
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
      if (!iframe || !iframe.contentWindow) return;
      try {
        iframe.contentWindow.location.hash = href;
        setActiveHref(href);
      } catch {
        // cross-origin → ignorar
      }
    },
    [iframeId],
  );

  useEffect(() => {
    const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
    if (!iframe) return;

    function attachScrollSpy() {
      try {
        const doc = iframe?.contentDocument;
        const win = iframe?.contentWindow;
        if (!doc || !win) return;
        const sections = entries
          .map((e) => doc.querySelector(e.href))
          .filter((el): el is Element => el != null);
        if (sections.length === 0) return;

        const handler = () => {
          let current: string | null = entries[0]?.href ?? null;
          for (let i = 0; i < sections.length; i++) {
            const el = sections[i] as HTMLElement;
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            if (rect.top - 120 <= 0) {
              current = `#${el.id}`;
            } else {
              break;
            }
          }
          setActiveHref(current);
        };

        handler();
        win.addEventListener("scroll", handler, { passive: true });
        return () => win.removeEventListener("scroll", handler);
      } catch {
        return;
      }
    }

    if (iframe.contentDocument?.readyState === "complete") {
      return attachScrollSpy();
    }
    iframe.addEventListener("load", attachScrollSpy);
    return () => iframe.removeEventListener("load", attachScrollSpy);
  }, [entries, iframeId]);

  return (
    <nav className="card-dark p-4 sticky top-4">
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-400 mb-3">
        Navegación del manual
      </p>
      <ul className="space-y-1">
        {entries.map((entry) => (
          <li key={entry.href}>
            <button
              type="button"
              onClick={() => handleClick(entry.href)}
              className={cn(
                "w-full text-left flex items-start gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                activeHref === entry.href
                  ? "bg-brand-500/10 text-brand-400"
                  : "text-anthracite-200 hover:bg-anthracite-700/30 hover:text-fg",
              )}
            >
              <span className="text-[10px] font-bold text-brand-500 tabular-nums shrink-0 w-6">
                {entry.num}
              </span>
              <span className="leading-snug">{entry.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
