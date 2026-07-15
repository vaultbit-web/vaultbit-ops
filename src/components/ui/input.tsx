import * as React from "react";
import { cn } from "~/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3.5 text-sm text-fg placeholder:text-anthracite-400 transition-colors focus-visible:border-brand-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-xs font-semibold uppercase tracking-wider text-anthracite-200", className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";
