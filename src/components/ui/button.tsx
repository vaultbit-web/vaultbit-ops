import * as React from "react";
import { cn } from "~/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-sm",
};

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white shadow-[0_10px_15px_-3px_rgba(242,118,26,0.2),0_4px_6px_-4px_rgba(242,118,26,0.2)] hover:bg-brand-400 active:bg-brand-600 disabled:bg-brand-600/50",
  secondary:
    "bg-transparent text-fg border border-anthracite-400/60 hover:border-brand-500/50 hover:text-brand-400",
  ghost:
    "bg-transparent text-anthracite-200 hover:text-brand-400 hover:bg-anthracite-800/60",
  danger:
    "bg-error/90 text-white hover:bg-error",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-(--radius-md) font-semibold tracking-wide transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/50 disabled:cursor-not-allowed disabled:opacity-60",
          sizeStyles[size],
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
