"use client";

import * as React from "react";
import { Copy, Save, X, Send, Loader2, Sparkles, Check } from "lucide-react";
import {
  generateContactLinkedInMessage,
  saveLinkedInMessageDraft,
} from "~/lib/actions/linkedin";
import { Button } from "./ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  initialMessage: string | null;
  onMessageUpdated: (msg: string | null) => void;
  onSent: () => void;
}

export function LinkedInMessageModal({
  open,
  onClose,
  contactId,
  contactName,
  initialMessage,
  onMessageUpdated,
  onSent,
}: Props) {
  const [message, setMessage] = React.useState(initialMessage ?? "");
  const [pending, setPending] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setMessage(initialMessage ?? "");
      setCopied(false);
      setFeedback(null);
      setError(null);
    }
  }, [open, initialMessage]);

  if (!open) return null;

  async function onRegenerate() {
    setError(null);
    setFeedback(null);
    setPending(true);
    try {
      const res = await generateContactLinkedInMessage(contactId);
      if (!res.ok) {
        setError(res.error);
      } else {
        setMessage(res.message);
        onMessageUpdated(res.message);
        setFeedback("Mensaje regenerado.");
      }
    } finally {
      setPending(false);
    }
  }

  async function onSave() {
    setError(null);
    setFeedback(null);
    setPending(true);
    try {
      const res = await saveLinkedInMessageDraft(contactId, message);
      if (!res.ok) {
        setError(res.error);
      } else {
        onMessageUpdated(message);
        setFeedback("Borrador guardado.");
      }
    } finally {
      setPending(false);
    }
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar al portapapeles");
    }
  }

  async function onCopyAndMarkSent() {
    await onCopy();
    onSent();
    setFeedback("Copiado al portapapeles · marcado como enviado.");
  }

  const wordCount = message.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-dark w-full max-w-2xl flex flex-col gap-4 p-4 sm:p-6 max-h-[85dvh] overflow-y-auto overscroll-contain"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-brand-400 font-semibold">
              Primer mensaje LinkedIn
            </p>
            <h2 className="text-base font-semibold text-fg tracking-tight">
              {contactName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-anthracite-400 hover:text-fg transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <p className="text-xs text-anthracite-300 leading-relaxed">
          Mensaje pasivo, sin venta, sin agenda. Edítalo libremente antes de
          enviarlo. Copia al portapapeles y pégalo manualmente en LinkedIn.
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={10}
          maxLength={2500}
          disabled={pending}
          className="w-full rounded-[10px] border border-anthracite-700/60 bg-anthracite-900 px-3 py-2.5 text-sm text-fg placeholder:text-anthracite-500 focus-visible:border-brand-500/60 focus-visible:outline-none transition-colors disabled:opacity-60 resize-y font-mono"
          placeholder="(El mensaje aparecerá aquí tras generarlo)"
        />

        <div className="flex items-center justify-between text-[11px] text-anthracite-400">
          <span>{wordCount} palabras (objetivo 60-110)</span>
          <span>{message.length} caracteres</span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Button
            type="button"
            onClick={onRegenerate}
            disabled={pending}
            variant="ghost"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <Sparkles className="h-4 w-4" strokeWidth={1.5} />
            )}
            Regenerar
          </Button>

          <Button
            type="button"
            onClick={onSave}
            disabled={pending || message.trim().length === 0}
            variant="ghost"
          >
            <Save className="h-4 w-4" strokeWidth={1.5} />
            Guardar borrador
          </Button>

          <div className="flex-1" />

          <Button
            type="button"
            onClick={onCopy}
            disabled={pending || message.trim().length === 0}
            variant="ghost"
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" strokeWidth={2} />
            ) : (
              <Copy className="h-4 w-4" strokeWidth={1.5} />
            )}
            {copied ? "Copiado" : "Copiar"}
          </Button>

          <Button
            type="button"
            onClick={onCopyAndMarkSent}
            disabled={pending || message.trim().length === 0}
          >
            <Send className="h-4 w-4" strokeWidth={1.5} />
            Copiar y marcar enviado
          </Button>
        </div>

        {feedback && (
          <p className="text-xs text-success border-l-2 border-success/40 pl-2">
            {feedback}
          </p>
        )}
        {error && (
          <p className="text-xs text-error border-l-2 border-error/40 pl-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
