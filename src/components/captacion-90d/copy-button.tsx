"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "~/lib/utils";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = "Copiar", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback DOM
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // ignore
      }
      document.body.removeChild(ta);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all",
        copied
          ? "border-success/30 bg-success/10 text-success"
          : "border-anthracite-600/40 bg-anthracite-900 text-anthracite-100 hover:border-brand-500/40 hover:text-brand-400",
        className,
      )}
      aria-label={label}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
      ) : (
        <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
      )}
      <span>{copied ? "Copiado" : label}</span>
    </button>
  );
}
