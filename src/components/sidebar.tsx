"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "./nav-data";
import { cn } from "~/lib/utils";
import { Badge } from "./ui/badge";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-full w-full flex-col bg-anthracite-900 border-r border-anthracite-600/30"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-anthracite-600/30">
        <div className="rounded-[10px] border border-brand-500/40 bg-brand-500/10 p-2">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-brand-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-light text-fg">
            VaultBit <span className="font-bold">Ops</span>
          </p>
          <p className="text-[10px] text-anthracite-400 uppercase tracking-wider">
            Centro interno
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-anthracite-400">
                {group.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");

                  if (item.disabled) {
                    return (
                      <li key={item.href}>
                        <span
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-[10px] px-2.5 py-2 text-sm cursor-not-allowed",
                            "text-anthracite-400/70",
                          )}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                            <span className="truncate">{item.label}</span>
                          </span>
                          {item.badge ? (
                            <Badge tone="neutral" className="text-[9px] px-1.5 py-0.5">
                              {item.badge}
                            </Badge>
                          ) : null}
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-[10px] px-2.5 py-2 text-sm transition-colors",
                          active
                            ? "bg-brand-500/15 text-brand-400 border border-brand-500/20"
                            : "text-anthracite-100 hover:bg-anthracite-800 hover:text-fg border border-transparent",
                        )}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.badge ? (
                          <Badge tone="brand" className="text-[9px] px-1.5 py-0.5">
                            {item.badge}
                          </Badge>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-anthracite-600/30 px-5 py-3">
        <p className="text-[10px] text-anthracite-400">
          v0.9 · F1.8 Cal.com
        </p>
      </div>
    </aside>
  );
}
