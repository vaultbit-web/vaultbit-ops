"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartLine,
  KanbanSquare,
  Users,
  CalendarRange,
  BookOpen,
} from "lucide-react";
import { cn } from "~/lib/utils";

const TABS = [
  { href: "/captacion-90d", label: "Dashboard", icon: ChartLine, exact: true },
  { href: "/captacion-90d/backlog", label: "Backlog", icon: KanbanSquare },
  { href: "/captacion-90d/partners-ibiza", label: "Partners · Ibiza", icon: Users },
  { href: "/captacion-90d/eventos-trackear", label: "Eventos", icon: CalendarRange },
  { href: "/captacion-90d/manual-operativo", label: "Manual", icon: BookOpen },
];

export function CaptacionTabs() {
  const pathname = usePathname();
  return (
    <nav className="card-dark p-1 inline-flex gap-1 overflow-x-auto max-w-full">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              active
                ? "bg-brand-500/15 text-brand-400"
                : "text-anthracite-200 hover:text-fg hover:bg-anthracite-700/30",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
