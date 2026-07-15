import { cn } from "~/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8", className)}>
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl sm:text-3xl font-light text-fg tracking-tight leading-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-anthracite-200 max-w-2xl">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
