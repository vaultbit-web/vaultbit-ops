import type { LucideIcon } from "lucide-react";
import { cn } from "~/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
  emphasis?: boolean;
}

export function KpiCard({ label, value, icon: Icon, hint, emphasis }: KpiCardProps) {
  return (
    <div
      className={cn(
        "card-dark p-4 sm:p-5 flex flex-col gap-2 min-w-0",
        emphasis ? "border-glow-orange" : null,
      )}
    >
      <div className="flex items-center gap-2 text-anthracite-200 min-w-0">
        {Icon ? <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} /> : null}
        <p className="text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.1em] font-semibold truncate">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "text-2xl sm:text-3xl font-light leading-none tabular-nums break-words",
          emphasis ? "text-brand-500" : "text-fg",
        )}
        title={hint ?? undefined}
      >
        {value}
      </p>
      {hint ? (
        <p className="text-[11px] text-anthracite-400 leading-relaxed line-clamp-2">{hint}</p>
      ) : null}
    </div>
  );
}
