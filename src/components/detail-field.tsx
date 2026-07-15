import { cn } from "~/lib/utils";

interface DetailFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  /** Si es true, ocupa toda la fila */
  wide?: boolean;
  mono?: boolean;
}

export function DetailField({ label, value, className, wide, mono }: DetailFieldProps) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className={cn("flex flex-col gap-1", wide && "sm:col-span-2", className)}>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-400">
        {label}
      </dt>
      <dd
        className={cn(
          "text-sm text-anthracite-100 break-words",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
