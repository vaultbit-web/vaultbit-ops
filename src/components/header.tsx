"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, LogOut, ExternalLink, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Sidebar } from "./sidebar";
import { GlobalSearch } from "./global-search";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  userEmail: string | null;
}

export function Header({ userEmail }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [isMac, setIsMac] = React.useState(false);

  // Cerrar drawer cuando se cambia de tamaño de ventana a desktop
  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Bloquear scroll del body cuando el drawer está abierto
  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Detectar Mac para mostrar atajo correcto
  React.useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent));
  }, []);

  // Atajo Cmd/Ctrl+K para abrir búsqueda
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const modKey = isMac ? "⌘" : "Ctrl";

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-anthracite-600/30 bg-anthracite-950/85 backdrop-blur-md"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 0px)",
          paddingLeft: "max(env(safe-area-inset-left), 1rem)",
          paddingRight: "max(env(safe-area-inset-right), 1rem)",
          minHeight: "calc(3.5rem + env(safe-area-inset-top))",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Abrir navegación"
            className="lg:hidden flex h-11 w-11 -ml-1.5 items-center justify-center rounded-[8px] text-anthracite-200 hover:bg-anthracite-800 hover:text-fg"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <Link
            href="https://vaultbit.es"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-anthracite-400 hover:text-brand-400 transition-colors"
          >
            <span>vaultbit.es</span>
            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="flex flex-1 justify-center px-2 sm:px-4">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
            className="group inline-flex items-center gap-2 w-full max-w-md h-9 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900/60 px-3 text-left text-sm text-anthracite-400 transition-colors hover:border-brand-500/40 hover:text-fg"
          >
            <Search className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span className="flex-1 truncate hidden sm:inline">Buscar leads, presupuestos, contratos…</span>
            <span className="flex-1 truncate sm:hidden">Buscar…</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-anthracite-600/60 bg-anthracite-900 px-1.5 py-0.5 text-[10px] font-mono text-anthracite-300">
              {modKey} K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {userEmail ? (
            <span className="hidden md:inline text-xs text-anthracite-200 truncate max-w-[200px]">
              {userEmail}
            </span>
          ) : null}
          <ThemeToggle />
          <form action="/auth/sign-out" method="POST">
            <Button type="submit" variant="ghost" size="sm" aria-label="Cerrar sesión">
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </form>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar navegación"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[280px] max-w-[80vw] shadow-2xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
