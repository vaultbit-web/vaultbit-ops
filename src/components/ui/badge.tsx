import * as React from "react";
import { cn } from "~/lib/utils";

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "error" | "info";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-anthracite-900 text-anthracite-100 border border-anthracite-600/40",
  brand: "bg-brand-500/10 text-brand-400 border border-brand-500/20",
  success: "bg-success/15 text-success border border-success/30",
  warning: "bg-warning/15 text-warning border border-warning/30",
  error: "bg-error/15 text-error border border-error/30",
  info: "bg-anthracite-700 text-anthracite-100 border border-anthracite-600/40",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

export function Badge({ className, tone = "neutral", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none whitespace-nowrap",
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current pulse-dot" /> : null}
      {children}
    </span>
  );
}
