"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "~/lib/utils";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

/**
 * Botón discreto que copia un string al portapapeles. Tras copiar muestra
 * "Copiado" durante 1.2s.
 */
export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Fallback: textarea hidden + execCommand
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[6px] border border-anthracite-600/60 px-2 py-1 text-[10px] font-semibold transition-colors shrink-0",
        copied
          ? "bg-success/15 border-success/30 text-success"
          : "text-anthracite-100 hover:border-brand-500/40 hover:text-fg",
        className,
      )}
      aria-label={copied ? "Copiado" : "Copiar"}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" strokeWidth={2} />
          {label ? "Copiado" : null}
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" strokeWidth={1.5} />
          {label ?? null}
        </>
      )}
    </button>
  );
}
