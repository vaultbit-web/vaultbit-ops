import Link from "next/link";
import { RANGE_PRESETS } from "~/lib/queries/analytics";
import { cn } from "~/lib/utils";

interface RangePickerProps {
  current: number;
  basePath: string;
}

export function RangePicker({ current, basePath }: RangePickerProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-anthracite-600/40 bg-anthracite-900 p-1">
      {RANGE_PRESETS.map((p) => {
        const isActive = current === p.days;
        return (
          <Link
            key={p.days}
            href={`${basePath}?days=${p.days}`}
            scroll={false}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              isActive
                ? "bg-brand-500 text-white"
                : "text-anthracite-200 hover:text-fg",
            )}
          >
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}
