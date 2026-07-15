"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { refineReviewContactsWithGemini } from "~/lib/actions/linkedin";
import { Button } from "./ui/button";

interface Props {
  reviewCount: number;
}

export function LinkedInBatchActions({ reviewCount }: Props) {
  const [pending, startTransition] = React.useTransition();
  const [feedback, setFeedback] = React.useState<
    | { tone: "success"; message: string }
    | { tone: "error"; message: string }
    | null
  >(null);

  function onClick() {
    setFeedback(null);
    startTransition(async () => {
      const res = await refineReviewContactsWithGemini();
      if (!res.ok) {
        setFeedback({ tone: "error", message: res.error });
        return;
      }
      setFeedback({
        tone: "success",
        message: `Refinados ${res.refined} contactos${res.errors > 0 ? ` (${res.errors} errores)` : ""}.`,
      });
    });
  }

  return (
    <div className="card-dark px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 mt-0.5 text-brand-400 shrink-0" strokeWidth={1.5} />
        <div>
          <p className="text-sm text-fg font-medium">
            {reviewCount} contactos pendientes de refinar con Gemini
          </p>
          <p className="text-[11px] text-anthracite-300 mt-0.5">
            La heurística los marcó como dudosos (empresarios séniors sin
            señal cripto evidente). Gemini buscará señales públicas y los
            clasificará como relevantes o irrelevantes.
          </p>
        </div>
      </div>
      <Button type="button" onClick={onClick} disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : (
          <Sparkles className="h-4 w-4" strokeWidth={1.5} />
        )}
        {pending ? "Refinando…" : "Refinar con Gemini"}
      </Button>
      {feedback ? (
        <div
          role="status"
          className={`text-xs ${
            feedback.tone === "success" ? "text-success" : "text-error"
          } sm:basis-full`}
        >
          {feedback.message}
        </div>
      ) : null}
    </div>
  );
}
