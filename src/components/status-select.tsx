"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { updateLeadStatus } from "~/lib/actions/crm";
import { cn } from "~/lib/utils";
import type { EntityType } from "~/lib/supabase/types";

interface StatusSelectProps {
  entityType: EntityType;
  entityId: string;
  currentStatus: string;
  statuses: readonly string[];
  labels?: Record<string, string>;
  /** Tono base usado para el badge del estado actual */
  toneClassName?: string;
  /** Si es true, el control queda más compacto para usar en tablas */
  compact?: boolean;
}

export function StatusSelect({
  entityType,
  entityId,
  currentStatus,
  statuses,
  labels,
  toneClassName,
  compact = false,
}: StatusSelectProps) {
  const [pending, startTransition] = React.useTransition();
  const [optimistic, setOptimistic] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showSaved, setShowSaved] = React.useState(false);

  const value = optimistic ?? currentStatus;

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setError(null);
    setOptimistic(next);
    startTransition(async () => {
      const res = await updateLeadStatus(entityType, entityId, next);
      if (!res.ok) {
        setError(res.error);
        setOptimistic(null);
      } else {
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 1200);
      }
    });
  }

  return (
    <div className="inline-flex items-center gap-1.5 relative">
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={pending}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "appearance-none rounded-full px-3 pr-7 font-medium leading-none whitespace-nowrap border cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40 disabled:opacity-60 disabled:cursor-wait",
            compact ? "py-1.5 sm:py-1 text-[11px]" : "py-1.5 text-xs",
            toneClassName ?? "bg-anthracite-900 text-anthracite-100 border-anthracite-600/40",
          )}
        >
          {statuses.map((s) => (
            <option key={s} value={s} className="bg-anthracite-900 text-fg">
              {labels?.[s] ?? s}
            </option>
          ))}
        </select>
        <span
          className={cn(
            "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-60",
            compact ? "text-[8px]" : "text-[9px]",
          )}
        >
          ▼
        </span>
      </div>
      {pending ? (
        <Loader2 className="h-3 w-3 text-anthracite-400 animate-spin" strokeWidth={2} />
      ) : showSaved ? (
        <Check className="h-3 w-3 text-success" strokeWidth={2} />
      ) : null}
      {error ? (
        <span className="absolute top-full left-0 mt-1 text-[10px] text-error whitespace-nowrap">
          {error}
        </span>
      ) : null}
    </div>
  );
}
