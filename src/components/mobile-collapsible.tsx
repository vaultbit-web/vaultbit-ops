"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "~/lib/utils";

/**
 * Sección colapsable solo en móvil/tablet: en lg el contenido siempre es
 * visible y el botón desaparece. Los children siguen siendo RSC
 * (patrón children-as-props).
 */
export function MobileCollapsible({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-[44px] w-full items-center justify-between px-1 text-sm font-medium text-anthracite-100 lg:hidden"
      >
        {title}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          strokeWidth={1.5}
        />
      </button>
      <div className={cn(open ? "block" : "hidden", "lg:block")}>{children}</div>
    </section>
  );
}
