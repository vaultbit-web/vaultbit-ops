import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn, formatNumber } from "~/lib/utils";

interface KpiCardProps {
  label: string;
  value: number | string;
  unit?: string;
  hint?: string;
  delta?: { value: number; positive: boolean | null }; // positive=null → neutral
  icon?: LucideIcon;
  highlight?: boolean;
  className?: string;
}

export function KpiCard({
  label,
  value,
  unit,
  hint,
  delta,
  icon: Icon,
  highlight,
  className,
}: KpiCardProps) {
  const numericValue = typeof value === "number" ? formatNumber(value) : value;

  return (
    <div
      className={cn(
        "card-dark p-4 sm:p-5 flex flex-col gap-2.5 sm:gap-3 relative min-w-0",
        highlight && "border-glow-orange",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider leading-snug text-anthracite-200">
          {label}
        </p>
        {Icon ? (
          <div className="rounded-[8px] bg-brand-500/10 p-1.5 text-brand-400 shrink-0">
            <Icon className="h-4 w-4" strokeWidth={1.5} />
          </div>
        ) : null}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-semibold text-fg tracking-tight tabular-nums">
          {numericValue}
        </span>
        {unit ? (
          <span className="text-sm text-anthracite-200">{unit}</span>
        ) : null}
      </div>

      <div className="flex items-center gap-2 min-h-[18px]">
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium",
              delta.positive === true && "text-success",
              delta.positive === false && "text-error",
              delta.positive === null && "text-anthracite-200",
            )}
          >
            {delta.positive === true ? (
              <TrendingUp className="h-3 w-3" strokeWidth={2} />
            ) : delta.positive === false ? (
              <TrendingDown className="h-3 w-3" strokeWidth={2} />
            ) : (
              <Minus className="h-3 w-3" strokeWidth={2} />
            )}
            <span>
              {delta.value > 0 ? "+" : ""}
              {delta.value}%
            </span>
          </span>
        ) : null}
        {hint ? <p className="text-[11px] text-anthracite-400">{hint}</p> : null}
      </div>
    </div>
  );
}
