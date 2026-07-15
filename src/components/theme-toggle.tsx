"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "~/lib/utils";

type Theme = "light" | "dark";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("vb-theme", next);
  } catch {
    /* almacenamiento no disponible — la cookie basta */
  }
  document.cookie = `vb-theme=${next}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

/**
 * Toggle claro/oscuro. El tema real lo fija el SSR vía cookie en
 * <html data-theme> (sin parpadeo); aquí solo lo alternamos en cliente.
 * El estado arranca en "dark" para coincidir en la hidratación y se
 * sincroniza con el atributo real tras montar.
 */
export function ThemeToggle({
  withLabel = false,
  className,
}: {
  withLabel?: boolean;
  className?: string;
}) {
  const [theme, setTheme] = React.useState<Theme>("dark");

  React.useEffect(() => {
    const current =
      document.documentElement.dataset.theme === "light" ? "light" : "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  }

  const isLight = theme === "light";
  const label = isLight ? "Modo oscuro" : "Modo claro";
  const Icon = isLight ? Moon : Sun;

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={`Cambiar a ${label.toLowerCase()}`}
        className={cn(
          "inline-flex items-center gap-2 rounded-(--radius-md) border border-anthracite-600/60 bg-anthracite-900/60 px-3 h-9 text-sm text-anthracite-200 transition-colors hover:border-brand-500/40 hover:text-fg",
          className,
        )}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Cambiar a ${label.toLowerCase()}`}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-anthracite-600/60 bg-anthracite-900/60 text-anthracite-200 transition-colors hover:border-brand-500/40 hover:text-fg",
        className,
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.5} />
    </button>
  );
}
