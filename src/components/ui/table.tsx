import * as React from "react";
import { cn } from "~/lib/utils";

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full rounded-[16px] border border-anthracite-600/40">
      <div className="overflow-x-auto rounded-[16px]">
        <table
          className={cn("w-full min-w-[560px] text-left text-sm", className)}
          {...props}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-6 rounded-r-[16px] bg-gradient-to-l from-anthracite-950/50 to-transparent lg:hidden"
      />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "bg-anthracite-900 text-[11px] font-semibold uppercase tracking-wider text-anthracite-200",
        className,
      )}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn(
        "divide-y divide-anthracite-600/30 [&>tr]:bg-anthracite-800 [&>tr:hover]:bg-anthracite-700/60",
        className,
      )}
      {...props}
    />
  );
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors", className)} {...props} />;
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-4 py-3 font-semibold", className)} {...props} />;
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle text-anthracite-100", className)} {...props} />;
}

export function EmptyRow({ colSpan, message = "Sin resultados" }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-10 text-center text-sm text-anthracite-400"
      >
        {message}
      </td>
    </tr>
  );
}
