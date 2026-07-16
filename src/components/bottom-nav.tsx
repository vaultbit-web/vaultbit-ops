"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, Radar, Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { cn } from "~/lib/utils";

const ITEMS = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { label: "Prospección", href: "/prospectos", icon: Radar },
  { label: "Ventas", href: "/crm/ventas", icon: Users },
  { label: "Empleo", href: "/empleo", icon: Briefcase },
] as const;

/**
 * Barra de navegación inferior para móvil/tablet (oculta en lg).
 * Los 4 destinos de uso diario + "Más" que abre el menú completo.
 */
export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);

  // Cerrar el panel "Más" al navegar
  React.useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Bloquear scroll del body mientras el panel "Más" está abierto
  React.useEffect(() => {
    if (!moreOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-anthracite-600/30 bg-anthracite-950/90 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors active:bg-anthracite-800/60",
                  active ? "text-brand-400" : "text-anthracite-200",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            className="flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium text-anthracite-200 active:bg-anthracite-800/60"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
            Más
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[280px] max-w-[80vw] shadow-2xl">
            <Sidebar onNavigate={() => setMoreOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
